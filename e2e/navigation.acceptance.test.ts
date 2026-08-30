import { expect, test, type Locator, type Page } from "@playwright/test";

const navigationName = "學習流程";
const breadcrumbName = "目前位置";

const viewportMatrix = [
  { name: "320px", width: 320, foldedTrigger: "更多", hiddenTrigger: "資源" },
  { name: "390px", width: 390, foldedTrigger: "更多", hiddenTrigger: "資源" },
  { name: "768px", width: 768, foldedTrigger: "資源", hiddenTrigger: "更多" },
  { name: "1280px", width: 1280, foldedTrigger: "資源", hiddenTrigger: "更多" }
] as const;

const representativeRoutes = ["/", "/grammar/n5", "/kana", "/privacy", "/terms"] as const;

const grammarN5Breadcrumb = {
  labels: ["首頁", "文型", "N5"],
  parentPaths: ["/", "/grammar"],
  current: "N5",
  currentCount: 1
} as const;

const kanaBreadcrumb = {
  labels: ["首頁", "學習", "五十音表"],
  parentPaths: ["/", "/learn"],
  current: "五十音表",
  currentCount: 1
} as const;

function appNavigation(page: Page) {
  return page.getByRole("navigation", { name: navigationName });
}

async function expectNoPageOverflow(page: Page, context: string) {
  const dimensions = await page.evaluate(() => ({
    contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    viewportWidth: window.innerWidth
  }));
  expect(
    dimensions.contentWidth,
    `${context}: page content must fit within the viewport`
  ).toBeLessThanOrEqual(dimensions.viewportWidth);
}

async function expectRepresentativeRouteReady(
  page: Page,
  route: (typeof representativeRoutes)[number]
) {
  const routeContent = {
    "/": page.getByRole("region", { name: "首頁" }),
    "/grammar/n5": page.getByRole("heading", { name: /JLPT N5/ }),
    "/kana": page.getByRole("heading", { name: "五十音表" }),
    "/privacy": page.getByRole("heading", { name: "隱私政策" }),
    "/terms": page.getByRole("heading", { name: "使用條款" })
  } satisfies Record<(typeof representativeRoutes)[number], Locator>;

  await expect(routeContent[route]).toBeVisible();
}

async function openFoldedMenu(page: Page, triggerName: string) {
  const trigger = appNavigation(page).getByRole("button", { name: triggerName });
  await trigger.focus();
  await trigger.press("ArrowDown");
  const menu = page.getByRole("menu", { name: triggerName });
  await expect(menu).toBeVisible();
  return { menu, trigger };
}

async function menuItems(menu: Locator) {
  const items = menu.locator('[role^="menuitem"]');
  await expect(items.first()).toBeFocused();
  return items;
}

async function selectKanaWithKeyboard(page: Page, triggerName: string) {
  const { menu } = await openFoldedMenu(page, triggerName);
  const items = await menuItems(menu);
  const kanaIndex = await items.evaluateAll((nodes) =>
    nodes.findIndex((node) => node.textContent?.includes("五十音表"))
  );
  expect(kanaIndex).toBeGreaterThanOrEqual(0);

  await page.keyboard.press("Home");
  for (let index = 0; index < kanaIndex; index += 1) {
    await page.keyboard.press("ArrowDown");
  }
  await expect(menu.getByRole("menuitem", { name: "五十音表" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/kana$/);
}

async function breadcrumbSnapshot(page: Page) {
  const breadcrumb = page.getByRole("navigation", { name: breadcrumbName });
  await expect(breadcrumb).toBeVisible();
  const crumbs = breadcrumb.locator('a, [aria-current="page"]');
  return {
    labels: (await crumbs.allTextContents()).map((label) => label.trim()),
    parentPaths: await breadcrumb.getByRole("link").evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLAnchorElement).href).pathname)
    ),
    current: (await breadcrumb.locator('[aria-current="page"]').textContent())?.trim() ?? "",
    currentCount: await breadcrumb.locator('[aria-current="page"]').count()
  };
}

async function expectDesktopResourceCurrent(page: Page, itemName: string) {
  const trigger = appNavigation(page).getByRole("button", {
    name: `資源（目前：${itemName}）`
  });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByRole("menuitem", { name: itemName })).toHaveAttribute(
    "aria-current",
    "page"
  );
  await page.keyboard.press("Escape");
}

for (const viewport of viewportMatrix) {
  test.describe(`navigation at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: 900 } });

    test("keeps representative routes and the open navigation menu within the viewport", async ({ page }) => {
      for (const route of representativeRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(new RegExp(`${route === "/" ? "/$" : `${route}$`}`));
        await expectRepresentativeRouteReady(page, route);
        await expectNoPageOverflow(page, `${viewport.name} ${route}`);
      }

      await page.goto("/");
      const nav = appNavigation(page);
      await expect(nav.getByRole("button", { name: viewport.foldedTrigger })).toBeVisible();
      await expect(
        nav.getByRole("button", { name: viewport.hiddenTrigger, includeHidden: true })
      ).toBeHidden();
      await openFoldedMenu(page, viewport.foldedTrigger);
      await expectNoPageOverflow(page, `${viewport.name} open ${viewport.foldedTrigger} menu`);
    });

    test("supports keyboard traversal, focus return, selection, and exact current state", async ({ page }) => {
      await page.goto("/");
      const { menu, trigger } = await openFoldedMenu(page, viewport.foldedTrigger);
      const items = await menuItems(menu);

      await page.keyboard.press("End");
      await expect(items.last()).toBeFocused();
      await page.keyboard.press("Home");
      await expect(items.first()).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(items.last()).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();

      await selectKanaWithKeyboard(page, viewport.foldedTrigger);
      await expect(appNavigation(page).getByRole("button", { name: "學習" })).toHaveAttribute(
        "aria-current",
        "page"
      );
      await expect(page.getByRole("navigation", { name: breadcrumbName })).toContainText("五十音表");

      const currentTrigger = appNavigation(page).getByRole("button", {
        name: `${viewport.foldedTrigger}（目前：五十音表）`
      });
      await currentTrigger.focus();
      await currentTrigger.press("ArrowDown");
      await expect(page.getByRole("menuitem", { name: "五十音表" })).toHaveAttribute(
        "aria-current",
        "page"
      );
    });
  });
}

test.describe("route, breadcrumb, link, and history acceptance", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("makes direct loads and in-app navigation produce the same deterministic breadcrumbs", async ({ page }) => {
    const cases = [
      {
        path: "/grammar/n5",
        expected: grammarN5Breadcrumb,
        navigate: async () => {
          await appNavigation(page).getByRole("button", { name: "文型" }).click();
          await page.getByRole("button", { name: "瀏覽 N5" }).click();
        },
        assertCurrent: async () => {
          await expect(appNavigation(page).getByRole("button", { name: "文型" })).toHaveAttribute(
            "aria-current",
            "page"
          );
        }
      },
      {
        path: "/kana",
        expected: kanaBreadcrumb,
        navigate: async () => {
          await appNavigation(page).getByRole("button", { name: "資源" }).click();
          await page.getByRole("menuitem", { name: "五十音表" }).click();
        },
        assertCurrent: async () => {
          await expect(appNavigation(page).getByRole("button", { name: "學習" })).toHaveAttribute(
            "aria-current",
            "page"
          );
          await expectDesktopResourceCurrent(page, "五十音表");
        }
      },
      {
        path: "/privacy",
        expected: {
          labels: ["首頁", "關於", "隱私政策"],
          parentPaths: ["/", "/about"],
          current: "隱私政策",
          currentCount: 1
        },
        navigate: async () => {
          await page.getByRole("link", { name: "隱私政策" }).click();
        },
        assertCurrent: async () => {
          await expectDesktopResourceCurrent(page, "關於");
        }
      },
      {
        path: "/terms",
        expected: {
          labels: ["首頁", "關於", "使用條款"],
          parentPaths: ["/", "/about"],
          current: "使用條款",
          currentCount: 1
        },
        navigate: async () => {
          await page.getByRole("link", { name: "使用條款" }).click();
        },
        assertCurrent: async () => {
          await expectDesktopResourceCurrent(page, "關於");
        }
      }
    ] as const;

    for (const acceptanceCase of cases) {
      await page.goto(acceptanceCase.path);
      const direct = await breadcrumbSnapshot(page);
      expect(direct).toEqual(acceptanceCase.expected);
      await acceptanceCase.assertCurrent();

      await page.goto("/");
      await acceptanceCase.navigate();
      await expect(page).toHaveURL(new RegExp(`${acceptanceCase.path}$`));
      expect(await breadcrumbSnapshot(page)).toEqual(direct);
      await acceptanceCase.assertCurrent();
    }
  });

  test("preserves native modified and middle-click behavior while plain click stays in the SPA", async ({ context, page }) => {
    await page.goto("/grammar/n5");
    const grammarCrumb = page.getByRole("navigation", { name: breadcrumbName }).getByRole("link", {
      name: "文型"
    });

    await page.evaluate(() => {
      (window as unknown as { browserAcceptanceMarker?: string }).browserAcceptanceMarker = "same-document";
    });
    await grammarCrumb.click();
    await expect(page).toHaveURL(/\/grammar$/);
    expect(
      await page.evaluate(
        () => (window as unknown as { browserAcceptanceMarker?: string }).browserAcceptanceMarker
      )
    ).toBe("same-document");

    const newTabModifier: "Meta" | "Control" = await page.evaluate(() =>
      navigator.platform.startsWith("Mac") ? "Meta" : "Control"
    );
    for (const click of [
      () => grammarCrumb.click({ modifiers: [newTabModifier] }),
      () => grammarCrumb.click({ button: "middle" })
    ]) {
      await page.goto("/grammar/n5");
      const [newPage] = await Promise.all([context.waitForEvent("page"), click()]);
      await newPage.waitForLoadState("domcontentloaded");
      expect(new URL(newPage.url()).pathname).toBe("/grammar");
      await expect(page).toHaveURL(/\/grammar\/n5$/);
      await newPage.close();
    }
  });

  test("restores canonical navigation and breadcrumbs through Back and Forward without stale child state", async ({ page }) => {
    await page.goto("/");
    await appNavigation(page).getByRole("button", { name: "文型" }).click();
    await page.getByRole("button", { name: "瀏覽 N5" }).click();
    await appNavigation(page).getByRole("button", { name: "資源" }).click();
    await page.getByRole("menuitem", { name: "五十音表" }).click();
    await expect(page).toHaveURL(/\/kana$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/grammar\/n5$/);
    await expect(appNavigation(page).getByRole("button", { name: "文型" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(await breadcrumbSnapshot(page)).toEqual(grammarN5Breadcrumb);
    await appNavigation(page).getByRole("button", { name: "資源" }).click();
    await expect(page.getByRole("menu").locator('[aria-current="page"]')).toHaveCount(0);
    await page.keyboard.press("Escape");

    await page.goForward();
    await expect(page).toHaveURL(/\/kana$/);
    await expect(appNavigation(page).getByRole("button", { name: "學習" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(await breadcrumbSnapshot(page)).toEqual(kanaBreadcrumb);
    const resources = appNavigation(page).getByRole("button", { name: "資源（目前：五十音表）" });
    await resources.click();
    await expect(page.getByRole("menuitem", { name: "五十音表" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });
});
