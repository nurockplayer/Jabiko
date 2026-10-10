import { expect, test, type Locator, type Page } from "@playwright/test";

const navigationName = "學習流程";
const breadcrumbName = "目前位置";

const viewportMatrix = [
  { name: "320px", width: 320 },
  { name: "390px", width: 390 },
  { name: "768px", width: 768 },
  { name: "1280px", width: 1280 }
] as const;

const representativeRoutes = ["/", "/grammar/n5", "/kana", "/privacy", "/terms"] as const;

test.describe("compact navigation text reflow", () => {
  test("keeps every destination and its label inside the compact bar as text enlarges", async ({ page }) => {
    for (const locale of ["zh-Hant", "ja", "en"] as const) {
      for (const theme of ["light", "dark"] as const) {
        for (const viewport of [
          { width: 320, rootFontPercent: 200 },
          { width: 390, rootFontPercent: 100 },
          { width: 1440, rootFontPercent: 100 }
        ]) {
          await page.setViewportSize({ width: viewport.width, height: 900 });
          await page.goto("/");
          await page.evaluate(({ storedLocale, storedTheme }) => {
            localStorage.setItem("jabiko.lang", storedLocale);
            localStorage.setItem("jabiko.theme", storedTheme);
          }, { storedLocale: locale, storedTheme: theme });
          await page.reload();
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          if (viewport.rootFontPercent !== 100) {
            await page.addStyleTag({ content: `:root { font-size: ${viewport.rootFontPercent}% !important; }` });
          }

          const nav = page.locator(".app-shell .jt1-primary-nav");
          await expect(nav).toBeVisible();
          const geometry = await nav.evaluate((element) => {
            const navRect = element.getBoundingClientRect();
            const controls = [...element.querySelectorAll<HTMLElement>("a[data-nav], .nav-resources-compact > .nav-more-trigger, .nav-resources-wide > .nav-more-trigger")]
              .filter((control) => {
                const rect = control.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && getComputedStyle(control).visibility !== "hidden";
              });
            const rows = controls.map((control) => {
              const controlRect = control.getBoundingClientRect();
              const textRects: DOMRect[] = [];
              const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
              while (walker.nextNode()) {
                const node = walker.currentNode;
                const parent = node.parentElement;
                if (!node.textContent?.trim() || parent?.closest(".jt1-visually-hidden")) continue;
                const range = document.createRange();
                range.selectNodeContents(node);
                textRects.push(...[...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0));
              }
              return {
                label: control.textContent?.trim().replace(/\s+/g, " ") ?? "",
                control: { left: controlRect.left, right: controlRect.right, top: controlRect.top, bottom: controlRect.bottom, height: controlRect.height },
                text: textRects.map(({ left, right, top, bottom }) => ({ left, right, top, bottom }))
              };
            });
            return {
              nav: { left: navRect.left, right: navRect.right, top: navRect.top, bottom: navRect.bottom, height: navRect.height },
              rows,
              viewport: { width: window.innerWidth, height: window.innerHeight },
              documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
            };
          });

          expect(geometry.rows, `${locale}/${theme}/${viewport.width}px visible navigation controls`).toHaveLength(viewport.width < 1024 ? 5 : 6);
          for (const row of geometry.rows) {
            expect(row.control.height, `${locale}/${theme}/${viewport.width}px ${row.label} target height`).toBeGreaterThanOrEqual(44);
            expect(row.text.length, `${locale}/${theme}/${viewport.width}px ${row.label} visible text ranges`).toBeGreaterThan(0);
            for (const text of row.text) {
              expect(text.left, `${locale}/${theme}/${viewport.width}px ${row.label} text left`).toBeGreaterThanOrEqual(row.control.left);
              expect(text.right, `${locale}/${theme}/${viewport.width}px ${row.label} text right`).toBeLessThanOrEqual(row.control.right);
              expect(text.top, `${locale}/${theme}/${viewport.width}px ${row.label} text top`).toBeGreaterThanOrEqual(row.control.top);
              expect(text.bottom, `${locale}/${theme}/${viewport.width}px ${row.label} text bottom`).toBeLessThanOrEqual(row.control.bottom);
              if (viewport.width < 1024) {
                expect(text.top, `${locale}/${theme}/${viewport.width}px ${row.label} text above bar`).toBeGreaterThanOrEqual(geometry.nav.top);
                expect(text.bottom, `${locale}/${theme}/${viewport.width}px ${row.label} text within bar`).toBeLessThanOrEqual(geometry.nav.bottom);
              }
            }
          }
          if (viewport.width === 390) {
            expect(geometry.nav.height, `${locale}/${theme}/390px compact bar keeps the token minimum`).toBeGreaterThanOrEqual(56);
          }
          expect(geometry.documentWidth, `${locale}/${theme}/${viewport.width}px document width`).toBeLessThanOrEqual(viewport.width);
        }
      }
    }
  });

  test("tracks measured clearance through Resources, resize, locale change, and session return", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("jabiko.lang", "en");
      localStorage.setItem("jabiko.theme", "light");
    });
    await page.reload();

    const nav = page.locator(".app-shell .jt1-primary-nav");
    const shell = page.locator(".app-shell");
    const clearance = async () => nav.evaluate((element) => {
      const shellElement = element.closest<HTMLElement>(".app-shell")!;
      return {
        height: element.getBoundingClientRect().height,
        occupied: Number.parseFloat(shellElement.style.getPropertyValue("--jt-compact-nav-occupied")),
        padding: Number.parseFloat(getComputedStyle(shellElement).paddingBottom)
      };
    });
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(async () => (await clearance()).occupied).toBeGreaterThanOrEqual(56);
    const normalBaseline = await clearance();
    expect(Math.abs(normalBaseline.occupied - normalBaseline.height)).toBeLessThan(0.1);
    expect(Math.abs(normalBaseline.padding - normalBaseline.occupied)).toBeLessThan(0.1);

    await page.setViewportSize({ width: 320, height: 900 });
    await page.addStyleTag({ content: ":root { font-size: 200% !important; }" });
    await expect.poll(async () => (await clearance()).occupied).toBeGreaterThan(normalBaseline.height);
    let measured = await clearance();
    expect(Math.abs(measured.occupied - measured.height)).toBeLessThan(0.1);
    expect(Math.abs(measured.padding - measured.occupied)).toBeLessThan(0.1);

    const trigger = nav.locator(".nav-resources-compact > .nav-more-trigger");
    await trigger.click();
    const panel = page.getByRole("menu", { name: "Resources" });
    await expect(panel).toBeVisible();
    const popup = await panel.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const navRect = element.closest(".jt1-primary-nav")!.getBoundingClientRect();
      return { bottom: rect.bottom, navTop: navRect.top, maxHeight: getComputedStyle(element).maxHeight };
    });
    expect(popup.bottom).toBeLessThanOrEqual(popup.navTop - 7);
    expect(popup.maxHeight).not.toBe("none");
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.evaluate(() => {
      [...document.querySelectorAll("style")]
        .find((style) => style.textContent?.includes("font-size: 200%"))
        ?.remove();
    });
    await page.setViewportSize({ width: 390, height: 900 });
    await expect.poll(async () => Math.abs((await clearance()).occupied - normalBaseline.occupied)).toBeLessThan(0.1);
    measured = await clearance();
    expect(Math.abs(measured.height - normalBaseline.height)).toBeLessThan(0.1);
    expect(Math.abs(measured.padding - measured.occupied)).toBeLessThan(0.1);

    const headerMenuTrigger = page.locator(".jt1-header-menu > .nav-more-trigger");
    await headerMenuTrigger.click();
    const headerMenu = page.getByRole("menu", { name: "More" });
    await headerMenu.getByRole("menuitem", { name: "Change language" }).click();
    const languageDialog = page.getByRole("dialog", { name: "Choose your language / 選擇語言 / 言語を選択" });
    await languageDialog.getByRole("button", { name: "日本語" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect.poll(async () => {
      const afterLocaleChange = await clearance();
      return Math.abs(afterLocaleChange.occupied - afterLocaleChange.height) < 0.1 && afterLocaleChange.height >= 56;
    }).toBe(true);
    measured = await clearance();
    expect(Math.abs(measured.occupied - measured.height)).toBeLessThan(0.1);

    await page.goto("/challenge");
    await expect(nav).toBeHidden();
    await expect.poll(() => shell.evaluate((element) => element.style.getPropertyValue("--jt-compact-nav-occupied"))).toBe("");
    await expect(shell).toHaveCSS("padding-bottom", "24px");

    await page.goto("/");
    await expect(nav).toBeVisible();
    await expect.poll(async () => {
      const returned = await clearance();
      return Math.abs(returned.occupied - returned.height) < 0.1 && returned.height >= 56;
    }).toBe(true);
  });
});

test.describe("World home entry reflow", () => {
  test("keeps the existing World CTA and home text within responsive viewport bounds", async ({ page }) => {
    for (const locale of ["zh-Hant", "ja", "en"] as const) {
      for (const theme of ["light", "dark"] as const) {
        for (const viewport of [
          { width: 320, rootFontPercent: 200 },
          { width: 390, rootFontPercent: 100 },
          { width: 1440, rootFontPercent: 100 }
        ]) {
          await page.setViewportSize({ width: viewport.width, height: 900 });
          await page.goto("/");
          await page.evaluate(({ storedLocale, storedTheme }) => {
            localStorage.setItem("jabiko.lang", storedLocale);
            localStorage.setItem("jabiko.theme", storedTheme);
            localStorage.removeItem("jabiko:targetLevel");
          }, { storedLocale: locale, storedTheme: theme });
          await page.reload();
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          if (viewport.rootFontPercent !== 100) {
            await page.addStyleTag({ content: `:root { font-size: ${viewport.rootFontPercent}% !important; }` });
          }

          const options = page.locator(".home-level-card-options .home-level-option");
          await expect(options).toHaveCount(5);
          const optionLabels = await options.evaluateAll((elements) => elements.map((element) => {
            const label = element.querySelector("strong")!;
            const control = element.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(label);
            const text = range.getBoundingClientRect();
            return {
              text: label.textContent?.trim() ?? "",
              control: { left: control.left, right: control.right, top: control.top, bottom: control.bottom },
              label: { left: text.left, right: text.right, top: text.top, bottom: text.bottom }
            };
          }));
          for (const [index, option] of optionLabels.entries()) {
            expect(option.label.left, `${locale} ${theme} ${viewport.width}px ${option.text} label left: ${JSON.stringify(option)}`).toBeGreaterThanOrEqual(option.control.left);
            expect(option.label.right, `${locale} ${theme} ${viewport.width}px ${option.text} label right`).toBeLessThanOrEqual(option.control.right);
            expect(option.label.top, `${locale} ${theme} ${viewport.width}px ${option.text} label top`).toBeGreaterThanOrEqual(option.control.top);
            expect(option.label.bottom, `${locale} ${theme} ${viewport.width}px ${option.text} label bottom`).toBeLessThanOrEqual(option.control.bottom);
            for (const other of optionLabels.slice(index + 1)) {
              const overlaps = option.label.left < other.label.right && option.label.right > other.label.left && option.label.top < other.label.bottom && option.label.bottom > other.label.top;
              expect(overlaps, `${locale} ${theme} ${viewport.width}px level labels ${option.text} and ${other.text} do not overlap`).toBe(false);
            }
          }

          const entry = page.locator(".home-game-preview-entry");
          await expect(entry).toHaveAttribute("href", "/game");
          await expect(entry).toBeVisible();
          const label = entry.locator(".home-game-preview-label");
          const hint = entry.locator(".home-game-preview-copy");
          const arrow = entry.locator("svg");
          await expect(label).toBeVisible();
          await expect(hint).toBeVisible();
          await expect(arrow).toBeVisible();
          const geometry = await entry.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            const labelElement = element.querySelector<HTMLElement>(".home-game-preview-label")!;
            const hintElement = element.querySelector<HTMLElement>(".home-game-preview-copy")!;
            const arrowElement = element.querySelector<SVGElement>("svg")!;
            const box = (target: Element) => {
              const { left, right, top, bottom } = target.getBoundingClientRect();
              return { left, right, top, bottom };
            };
            const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
            const overflowDiagnostics = documentWidth > window.innerWidth ? (() => {
              const pathFor = (element: Element) => {
                const parts: string[] = [];
                let current: Element | null = element;
                while (current && current !== document.body && parts.length < 6) {
                  const classes = typeof (current as HTMLElement).className === "string"
                    ? (current as HTMLElement).className.trim().split(/\s+/).filter(Boolean).slice(0, 3)
                    : [];
                  parts.unshift(`${current.tagName.toLowerCase()}${classes.map((name) => `.${name}`).join("")}`);
                  current = current.parentElement;
                }
                return parts.join(" > ");
              };
              const elementOutliers = [...document.body.querySelectorAll<HTMLElement>("*")]
                .map((node) => {
                  const bounds = node.getBoundingClientRect();
                  const style = getComputedStyle(node);
                  const text = node.textContent?.trim().replace(/\s+/g, " ") ?? "";
                  return {
                    path: pathFor(node),
                    className: typeof node.className === "string" ? node.className : "",
                    text: text.slice(0, 100),
                    font: style.font,
                    left: bounds.left,
                    right: bounds.right,
                    scrollWidth: node.scrollWidth,
                    clientWidth: node.clientWidth,
                    overflowBy: Math.max(bounds.right - window.innerWidth, -bounds.left, node.scrollWidth - node.clientWidth, 0)
                  };
                })
                .filter((node) => node.overflowBy > 0.5)
                .sort((left, right) => right.overflowBy - left.overflowBy)
                .slice(0, 10);
              const textRangeOutliers: Array<Record<string, unknown>> = [];
              const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
              while (walker.nextNode() && textRangeOutliers.length < 20) {
                const textNode = walker.currentNode as Text;
                const text = textNode.textContent ?? "";
                if (!text.trim()) continue;
                const range = document.createRange();
                range.setStart(textNode, 0);
                range.setEnd(textNode, text.length);
                const rects = [...range.getClientRects()]
                  .filter((item) => item.left < -0.5 || item.right > window.innerWidth + 0.5)
                  .map((item) => ({ left: item.left, right: item.right, top: item.top, bottom: item.bottom }));
                if (!rects.length) continue;
                const parent = textNode.parentElement;
                const parentStyle = parent ? getComputedStyle(parent) : null;
                textRangeOutliers.push({
                  path: parent ? pathFor(parent) : "",
                  className: parent && typeof (parent as HTMLElement).className === "string" ? (parent as HTMLElement).className : "",
                  text: text.trim().replace(/\s+/g, " ").slice(0, 120),
                  font: parentStyle?.font ?? "",
                  scrollWidth: parent instanceof HTMLElement ? parent.scrollWidth : null,
                  clientWidth: parent instanceof HTMLElement ? parent.clientWidth : null,
                  rects
                });
              }
              return { documentElement: document.documentElement.scrollWidth, body: document.body.scrollWidth, elementOutliers, textRangeOutliers };
            })() : null;
            return {
              entry: { left: rect.left, right: rect.right, height: rect.height },
              label: box(labelElement),
              hint: box(hintElement),
              arrow: box(arrowElement),
              viewport: window.innerWidth,
              document: documentWidth,
              overflowDiagnostics
            };
          });
          expect(geometry.entry.left, `${locale} ${theme} ${viewport.width}px entry left`).toBeGreaterThanOrEqual(0);
          expect(geometry.entry.right, `${locale} ${theme} ${viewport.width}px entry right`).toBeLessThanOrEqual(viewport.width);
          expect(geometry.entry.height, `${locale} ${theme} ${viewport.width}px entry target height`).toBeGreaterThanOrEqual(44);
          expect(geometry.label.left).toBeGreaterThanOrEqual(geometry.entry.left);
          expect(geometry.label.right).toBeLessThanOrEqual(geometry.entry.right);
          expect(geometry.hint.left).toBeGreaterThanOrEqual(geometry.entry.left);
          expect(geometry.hint.right).toBeLessThanOrEqual(geometry.entry.right);
          expect(geometry.arrow.left).toBeGreaterThanOrEqual(geometry.entry.left);
          expect(geometry.arrow.right).toBeLessThanOrEqual(geometry.entry.right);

          // #866: a brand-new visitor starts from the level choices (checked
          // above); the daily CTA appears once a level is set.
          await expect(page.locator(".home-banner-daily")).toHaveCount(0);
          await page.evaluate(() => localStorage.setItem("jabiko:targetLevel", "n3n4"));
          await page.reload();
          if (viewport.rootFontPercent !== 100) {
            await page.addStyleTag({ content: `:root { font-size: ${viewport.rootFontPercent}% !important; }` });
          }

          const daily = page.locator(".home-banner-daily");
          const dailyTitle = daily.locator(".home-banner-text strong");
          const dailyBounds = await daily.evaluate((element) => {
            const button = element.getBoundingClientRect();
            const title = element.querySelector<HTMLElement>(".home-banner-text strong")!;
            const range = document.createRange();
            range.selectNodeContents(title);
            const text = range.getBoundingClientRect();
            return {
              button: { left: button.left, right: button.right, top: button.top, bottom: button.bottom },
              title: { left: text.left, right: text.right, top: text.top, bottom: text.bottom }
            };
          });
          await expect(daily).toBeVisible();
          await expect(dailyTitle).toBeVisible();
          expect(dailyBounds.title.left, `${locale} ${theme} ${viewport.width}px daily title left: ${JSON.stringify(dailyBounds)}`).toBeGreaterThanOrEqual(dailyBounds.button.left);
          expect(dailyBounds.title.right, `${locale} ${theme} ${viewport.width}px daily title right: ${JSON.stringify(dailyBounds)}`).toBeLessThanOrEqual(dailyBounds.button.right);
          const conjugationLaunch = page.locator(".home-conjugation-launch");
          const conjugationBounds = await conjugationLaunch.evaluate((element) => {
            const button = element.getBoundingClientRect();
            const title = element.querySelector<HTMLElement>("span strong")!;
            const support = element.querySelector<HTMLElement>("span small")!;
            const rangeBounds = (target: Element) => {
              const range = document.createRange();
              range.selectNodeContents(target);
              const rect = range.getBoundingClientRect();
              return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
            };
            const icons = [...element.querySelectorAll<SVGElement>("svg")].map((icon) => {
              const rect = icon.getBoundingClientRect();
              return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
            });
            return {
              button: { left: button.left, right: button.right, top: button.top, bottom: button.bottom },
              title: rangeBounds(title),
              support: rangeBounds(support),
              icons
            };
          });
          expect(conjugationBounds.title.left, `${locale} ${theme} ${viewport.width}px conjugation title left: ${JSON.stringify(conjugationBounds)}`).toBeGreaterThanOrEqual(conjugationBounds.button.left);
          expect(conjugationBounds.title.right, `${locale} ${theme} ${viewport.width}px conjugation title right: ${JSON.stringify(conjugationBounds)}`).toBeLessThanOrEqual(conjugationBounds.button.right);
          expect(conjugationBounds.support.left).toBeGreaterThanOrEqual(conjugationBounds.button.left);
          expect(conjugationBounds.support.right, `${locale} ${theme} ${viewport.width}px conjugation support right: ${JSON.stringify(conjugationBounds)}`).toBeLessThanOrEqual(conjugationBounds.button.right);
          const textRows = [conjugationBounds.title, conjugationBounds.support];
          for (const text of textRows) {
            for (const icon of conjugationBounds.icons) {
              const overlaps = text.left < icon.right && text.right > icon.left && text.top < icon.bottom && text.bottom > icon.top;
              expect(overlaps, `${locale} ${theme} ${viewport.width}px conjugation text and icon do not overlap`).toBe(false);
            }
          }
          const titleSupportOverlap = conjugationBounds.title.left < conjugationBounds.support.right && conjugationBounds.title.right > conjugationBounds.support.left && conjugationBounds.title.top < conjugationBounds.support.bottom && conjugationBounds.title.bottom > conjugationBounds.support.top;
          expect(titleSupportOverlap, `${locale} ${theme} ${viewport.width}px conjugation title and support do not overlap`).toBe(false);

          const documentFailure = `${locale} ${theme} ${viewport.width}px document ${geometry.document}px > ${geometry.viewport}px; overflow=${JSON.stringify(geometry.overflowDiagnostics)}`;
          if (geometry.document > geometry.viewport) console.error(`[World home entry reflow] ${documentFailure}`);
          expect(geometry.document, documentFailure).toBeLessThanOrEqual(geometry.viewport);
        }
      }
    }
  });
});

test("keeps first-run level option text readable in both themes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ["light", "dark"] as const) {
    await page.goto("/");
    await page.evaluate((storedTheme) => {
      localStorage.setItem("jabiko.lang", "en");
      localStorage.setItem("jabiko.theme", storedTheme);
    }, theme);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.waitForTimeout(500);
    const options = page.locator(".home-level-card-options .home-level-option");
    await expect(options).toHaveCount(5);
    const colors = await options.evaluateAll((elements) => elements.map((option) => ({
      name: option.querySelector("strong")?.textContent?.trim() ?? "",
      background: getComputedStyle(option).backgroundColor,
      title: getComputedStyle(option.querySelector("strong")!).color,
      hint: getComputedStyle(option.querySelector("small")!).color
    })));
    for (const measured of colors) {
      const titleRatio = contrastRatio(measured.title, measured.background);
      const hintRatio = contrastRatio(measured.hint, measured.background);
      const result = { ...measured, titleRatio, hintRatio };
      expect(titleRatio, `${theme} ${measured.name} title contrast: ${JSON.stringify(result)}`).toBeGreaterThanOrEqual(4.5);
      expect(hintRatio, `${theme} ${measured.name} hint contrast: ${JSON.stringify(result)}`).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test.describe("Home share row reflow", () => {
  test("keeps all four share actions visible, in-bounds, and non-overlapping across scales and themes", async ({ page }) => {
    for (const theme of ["light", "dark"] as const) {
      for (const viewport of [
        { width: 320, rootFontPercent: 200 },
        { width: 390, rootFontPercent: 100 },
        { width: 1440, rootFontPercent: 100 }
      ]) {
        await page.setViewportSize({ width: viewport.width, height: 900 });
        await page.goto("/");
        await page.evaluate((storedTheme) => localStorage.setItem("jabiko.theme", storedTheme), theme);
        await page.reload();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        if (viewport.rootFontPercent !== 100) {
          await page.addStyleTag({ content: `:root { font-size: ${viewport.rootFontPercent}% !important; }` });
        }

        const actions = page.locator(".home-footer-share .share-btn");
        await expect(actions).toHaveCount(4);
        await expect(actions.first()).toBeVisible();
        const measurements = await actions.evaluateAll((elements) => elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
        }));
        expect(measurements).toHaveLength(4);
        for (const [index, rect] of measurements.entries()) {
          expect(rect.left, `${theme} ${viewport.width}px share action ${index} left`).toBeGreaterThanOrEqual(0);
          expect(rect.right, `${theme} ${viewport.width}px share action ${index} right`).toBeLessThanOrEqual(viewport.width);
          expect(rect.height, `${theme} ${viewport.width}px share action ${index} target height`).toBeGreaterThanOrEqual(40);
          for (const other of measurements.slice(index + 1)) {
            const overlaps = rect.left < other.right && rect.right > other.left && rect.top < other.bottom && rect.bottom > other.top;
            expect(overlaps, `${theme} ${viewport.width}px share controls must not overlap`).toBe(false);
          }
        }
        await expectNoPageOverflow(page, `${theme} ${viewport.width}px home share row at ${viewport.rootFontPercent}% root text`);
      }
    }
  });
});

// #872 Astra review round 7: ジャビ子's おつかれさま！ bubble on the completion
// screen kept its one-line pill and pushed the page to 354px.
test("keeps the Small Talk completion within 320px at 200% root text", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/conversation");
  await page.addStyleTag({ content: ":root { font-size: 200% !important; }" });
  const productionScene = page.getByRole("button", { name: /早上通勤時/ });
  await productionScene.focus();
  await productionScene.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "開始這個情境" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("今朝は気持ちのいい天気ですね。通勤中も少し楽です。")).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByText("選一個回應", { exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "回饋" })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "繼續", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "完成", exact: true })).toBeFocused();
  await expectNoPageOverflow(page, "conversation completion at 320px / 200% text");
});

for (const width of [390, 1280]) {
  test.describe(`conversation keyboard flow at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test("keeps feedback, retry and completion reachable without restarting the tab order", async ({ page }) => {
      await page.goto("/conversation");
      const productionScene = page.getByRole("button", { name: /早上通勤時/ });
      await productionScene.focus();
      await productionScene.press("Enter");
      await expectNoPageOverflow(page, "conversation brief");
      const startScene = page.getByRole("button", { name: "開始這個情境" });
      await page.keyboard.press("Tab");
      await expect(startScene).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByText("今朝は気持ちのいい天気ですね。通勤中も少し楽です。")).toBeFocused();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await expect(page.getByText("選一個回應", { exact: true })).toBeFocused();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("heading", { name: "回饋" })).toBeFocused();
      await expectNoPageOverflow(page, "conversation feedback");
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "換個說法再試一次" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByText("選一個回應", { exact: true })).toBeFocused();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("heading", { name: "回饋" })).toBeFocused();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "繼續", exact: true })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByText("普段は桜町駅からこの路線に乗っています。この時間は車内も落ち着いていて、通勤しやすいですね。")).toBeFocused();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("heading", { name: "完成", exact: true })).toBeFocused();
      await expectNoPageOverflow(page, "conversation completion");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "換情境", exact: true }).first()).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("heading", { name: "日常會話練習室" })).toBeFocused();
      for (let tabCount = 0; tabCount < 64; tabCount += 1) {
        if (await productionScene.evaluate((element) => element === document.activeElement)) break;
        await page.keyboard.press("Tab");
      }
      await expect(productionScene).toBeFocused();
    });

    test("launches a timely seasonal card into the focused brief at a deterministic date", async ({ page }) => {
      await page.clock.install({ time: new Date("2026-12-31T14:30:00.000Z") });
      await page.addInitScript(() => localStorage.setItem("jabiko.lang", "zh-Hant"));
      await page.goto("/conversation");

      const seasonalCard = page.getByRole("button", { name: /大晦日與年末回顧/ });
      await expect(seasonalCard).toBeVisible();
      await expectNoPageOverflow(page, "seasonal conversation choices");
      await seasonalCard.focus();
      await page.keyboard.press("Enter");
      const start = page.getByRole("button", { name: "開始這個情境" });
      await expect(start).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(start).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByText("今日はこのあと、家で静かに過ごすつもりです。")).toBeVisible();
      await expectNoPageOverflow(page, "seasonal conversation brief and first turn");
    });
  });
}

test.describe("Rainy Monday World shell (#835)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps the World separate, operable, localized, and connected to Training", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("jabiko.lang", "zh-Hant"));
    await page.goto("/");
    const entry = page.getByRole("link", { name: "日常 故事" });
    await expect(entry).toHaveAttribute("href", "/game");
    await entry.click();

    await expect(page).toHaveURL(/\/game$/);
    await expect(page.getByRole("heading", { level: 1, name: "青葉站" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: navigationName })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /日常會話/ })).toHaveAttribute("href", "/conversation");
    const furigana = page.getByRole("button", { name: "顯示註音" });
    const [furiganaBox, returnBox] = await Promise.all([
      furigana.boundingBox(),
      page.getByRole("link", { name: "回到練習" }).first().boundingBox()
    ]);
    expect(furiganaBox?.height).toBeGreaterThanOrEqual(44);
    expect(returnBox?.height).toBeGreaterThanOrEqual(44);
    await furigana.click();
    await expect(page.getByRole("button", { name: "隱藏註音" })).toHaveAttribute("aria-pressed", "true");

    const menuTrigger = page.getByRole("button", { name: "更多" });
    await menuTrigger.focus();
    await menuTrigger.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    await expectNoPageOverflow(page, "Rainy Monday World shell");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(menuTrigger).toHaveAttribute("aria-expanded", "false");

    await page.getByRole("link", { name: "回到練習" }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: /今天想練什麼/ })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/game$/);
    await expect(page.getByRole("heading", { level: 1, name: "青葉站" })).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: /今天想練什麼/ })).toBeVisible();
  });

  test("keeps the More menu within compact viewport bounds for each launched locale", async ({ page }) => {
    for (const width of [320, 390]) {
      for (const locale of ["zh-Hant", "ja", "en"] as const) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto("/");
        await page.evaluate((language) => localStorage.setItem("jabiko.lang", language), locale);
        await page.goto("/game");

        const trigger = page.locator(".jt1-header-menu .nav-more-trigger");
        await trigger.click();
        const panel = page.locator(".jt1-header-menu .nav-more-panel");
        await expect(panel).toBeVisible();
        const bounds = await panel.evaluate((element) => {
          const { left, right } = element.getBoundingClientRect();
          return { left, right, viewport: window.innerWidth };
        });
        expect(bounds.left, `${width}px ${locale} menu left edge`).toBeGreaterThanOrEqual(0);
        expect(bounds.right, `${width}px ${locale} menu right edge`).toBeLessThanOrEqual(bounds.viewport);
      }
    }
  });

  test("wraps the current place title and keeps the document within 320px at 200% root text size", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("jabiko.lang", "en"));
    await page.goto("/game");
    await page.addStyleTag({ content: ":root { font-size: 200% !important; }" });

    const measurements = await page.locator(".game-preview-content h1").evaluate((heading) => {
      const start = document.querySelector<HTMLButtonElement>(".game-world-start");
      const buttonBounds = start?.getBoundingClientRect();
      return {
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      headingScrollWidth: heading.scrollWidth,
      headingClientWidth: heading.clientWidth,
      startButtonRight: buttonBounds?.right ?? null,
      startButtonHeight: buttonBounds?.height ?? null,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth
      };
    });
    expect(measurements.rootFontSize).toBe("32px");
    expect(measurements.headingScrollWidth).toBeLessThanOrEqual(measurements.headingClientWidth);
    expect(measurements.startButtonRight).not.toBeNull();
    expect(measurements.startButtonRight).toBeLessThanOrEqual(measurements.viewport);
    expect(measurements.startButtonHeight).toBeGreaterThanOrEqual(44);
    expect(measurements.documentScrollWidth).toBeLessThanOrEqual(measurements.viewport);
  });
});

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

function appShell(page: Page) {
  return page.locator(".app-shell");
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

function relativeLuminance(rgb: number[]): number {
  const linear = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722;
}

function contrastRatio(foregroundColor: string, backgroundColor: string): number {
  const foreground = relativeLuminance(parseRgb(foregroundColor));
  const background = relativeLuminance(parseRgb(backgroundColor));
  return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
}

function parseRgb(value: string): number[] {
  const isSrgb = value.startsWith("color(srgb ");
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map((channel) => {
    const parsed = Number(channel);
    return isSrgb ? parsed * 255 : parsed;
  });
  if (!channels || channels.length !== 3) throw new Error(`Unsupported computed color: ${value}`);
  return channels;
}

function computedAlpha(value: string): number {
  const openParen = value.indexOf("(");
  const closeParen = value.lastIndexOf(")");
  if (openParen < 0 || closeParen < 0) throw new Error(`Unsupported computed color: ${value}`);
  const body = value.slice(openParen + 1, closeParen).trim();
  const slashParts = body.split("/");
  if (slashParts.length > 2) throw new Error(`Unsupported computed alpha syntax: ${value}`);
  let alphaText = slashParts[1]?.trim();
  if (!alphaText && value.startsWith("rgba(")) {
    const commaParts = body.split(",");
    if (commaParts.length === 4) alphaText = commaParts[3]?.trim();
  }
  if (!alphaText) return 1;
  const alpha = alphaText.endsWith("%")
    ? Number(alphaText.slice(0, -1)) / 100
    : Number(alphaText);
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
    throw new Error(`Unsupported computed alpha in ${value}`);
  }
  return alpha;
}

async function expectOpaqueRoleBackground(
  locator: Locator,
  role: string,
  context: string,
  foregroundRole?: string
) {
  // This check models solid opaque role surfaces only; it does not composite translucent ancestors.
  const expected = await locator.evaluate((element, roles) => {
    const probe = document.createElement("span");
    probe.style.cssText = "position:fixed;visibility:hidden;pointer-events:none";
    probe.style.backgroundColor = `var(${roles.background})`;
    if (roles.foreground) probe.style.color = `var(${roles.foreground})`;
    element.append(probe);
    const style = getComputedStyle(probe);
    const colors = {
      background: style.backgroundColor,
      ...(roles.foreground ? { foreground: style.color } : {})
    };
    probe.remove();
    return colors;
  }, { background: role, foreground: foregroundRole });
  await expect(locator, `${context}: wait for exact ${role} background`).toHaveCSS(
    "background-color",
    expected.background
  );
  await expect(locator, `${context}: role background must not be a gradient`).toHaveCSS(
    "background-image",
    "none"
  );
  const actual = await locator.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(computedAlpha(actual), `${context}: expected opaque ${role} background, got ${actual}`).toBe(1);
  const translucentAncestors = await locator.evaluate((element) => {
    const ancestors: Array<{ element: string; opacity: number }> = [];
    let current: Element | null = element;
    while (current) {
      const opacity = Number(getComputedStyle(current).opacity);
      if (opacity < 1) ancestors.push({ element: current.tagName.toLowerCase(), opacity });
      current = current.parentElement;
    }
    return ancestors;
  });
  expect(translucentAncestors, `${context}: opacity compositing is outside this contrast check`).toEqual([]);
  if (expected.foreground) {
    await expect(locator, `${context}: wait for exact ${foregroundRole} foreground`).toHaveCSS(
      "color",
      expected.foreground
    );
  }
  return expected.background;
}

async function expectReadableForeground(locator: Locator, context: string) {
  const colors = await locator.evaluate((element, context) => {
    const alphaOf = (value: string): number => {
      const isSrgb = value.startsWith("color(srgb ");
      const openParen = value.indexOf("(");
      const closeParen = value.lastIndexOf(")");
      if (openParen < 0 || closeParen < 0) {
        throw new Error(`${context}: unsupported computed background color: ${value}`);
      }
      const body = value.slice(openParen + 1, closeParen).trim();
      const slashParts = body.split("/");
      if (slashParts.length > 2) {
        throw new Error(`${context}: unsupported computed background alpha syntax: ${value}`);
      }
      let alphaText = slashParts[1]?.trim();
      if (!alphaText && !isSrgb && value.startsWith("rgba(")) {
        const commaParts = body.split(",");
        if (commaParts.length === 4) alphaText = commaParts[3]?.trim();
      }
      if (!alphaText) return 1;
      const alpha = alphaText.endsWith("%")
        ? Number(alphaText.slice(0, -1)) / 100
        : Number(alphaText);
      if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
        throw new Error(`${context}: unsupported computed background alpha in ${value}`);
      }
      return alpha;
    };
    const style = getComputedStyle(element);
    let current: Element | null = element;
    let background = "rgb(255, 255, 255)";
    while (current) {
      const candidate = getComputedStyle(current).backgroundColor;
      const alpha = alphaOf(candidate);
      if (alpha > 0 && alpha < 1) {
        throw new Error(
          `${context}: expected an opaque background for contrast measurement, found ${candidate}`
        );
      }
      if (alpha >= 0.999) {
        background = candidate;
        break;
      }
      current = current.parentElement;
    }
    return { foreground: style.color, background };
  }, context);
  const foreground = relativeLuminance(parseRgb(colors.foreground));
  const background = relativeLuminance(parseRgb(colors.background));
  const ratio = (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  expect(ratio, `${context}: ${colors.foreground} on ${colors.background}`).toBeGreaterThanOrEqual(4.5);
  return { ...colors, ratio: Number(ratio.toFixed(2)) };
}

async function expectRepresentativeRouteReady(
  page: Page,
  route: (typeof representativeRoutes)[number]
) {
  const shell = appShell(page);
  const routeContent = {
    "/": shell.getByRole("region", { name: "首頁" }),
    "/grammar/n5": shell.getByRole("heading", { name: /JLPT N5/ }),
    "/kana": shell.getByRole("heading", { name: "五十音表" }),
    "/privacy": shell.getByRole("heading", { name: "隱私政策" }),
    "/terms": shell.getByRole("heading", { name: "使用條款" })
  } satisfies Record<(typeof representativeRoutes)[number], Locator>;

  await expect(routeContent[route]).toBeVisible();
}

async function openResourcesMenu(page: Page, triggerName = "資料") {
  const trigger = appNavigation(page).getByRole("button", { name: triggerName });
  await trigger.focus();
  await trigger.press("ArrowDown");
  const menu = page.getByRole("menu", { name: "資料" });
  await expect(menu).toBeVisible();
  return { menu, trigger };
}

async function openHeaderMenu(page: Page) {
  const trigger = page.locator(".jt1-header-menu > .nav-more-trigger");
  await expect(trigger).toBeVisible();
  await trigger.focus();
  await trigger.press("ArrowDown");
  const menu = page.getByRole("menu", { name: "更多" });
  await expect(menu).toBeVisible();
  return { menu, trigger };
}

async function menuItems(menu: Locator) {
  const items = menu.locator('[role^="menuitem"]');
  await expect(items.first()).toBeFocused();
  return items;
}

async function selectKanaWithKeyboard(page: Page) {
  const { menu } = await openResourcesMenu(page);
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
    name: `資料（目前：${itemName}）`
  });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByRole("menuitem", { name: itemName })).toHaveAttribute(
    "aria-current",
    "page"
  );
  await page.keyboard.press("Escape");
}

async function expectHeaderMenuCurrent(page: Page, itemName: string) {
  const trigger = page.getByRole("button", { name: `更多（目前：${itemName}）` });
  await expect(trigger).toBeVisible();
  await trigger.press("ArrowDown");
  const menu = page.getByRole("menu", { name: "更多" });
  await expect(menu.getByRole("menuitem", { name: itemName })).toHaveAttribute("aria-current", "page");
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
      const compact = viewport.width < 1024;
      await expect(nav).toBeVisible();
      if (compact) {
        await expect(nav.locator(".nav-resources-compact")).toBeVisible();
        await expect(nav.locator(".nav-resources-wide")).toBeHidden();
      } else {
        await expect(nav.locator(".nav-resources-wide")).toBeVisible();
        await expect(nav.locator(".nav-resources-compact")).toBeHidden();
      }
      await expect(page.locator(".jt1-header-menu > .nav-more-trigger")).toBeVisible();
      await expect(nav.getByRole("link")).toHaveCount(compact ? 4 : 5);
      await expect(nav).toHaveCSS("display", compact ? "grid" : "flex");
      if (compact) {
        const compactTrackCount = await nav.evaluate((element) =>
          getComputedStyle(element).gridTemplateColumns.split(" ").length
        );
        expect(compactTrackCount).toBe(5);
      }

      await openResourcesMenu(page);
      await expectNoPageOverflow(page, `${viewport.name} open Resources menu`);
      await page.keyboard.press("Escape");
      const { menu: headerMenu } = await openHeaderMenu(page);
      await expect(headerMenu.getByRole("menuitem", { name: "題型練習", exact: true })).toBeVisible();
      await expect(headerMenu.getByRole("menuitem", { name: "關於" })).toBeVisible();
      await expectNoPageOverflow(page, `${viewport.name} open header menu`);
      await page.keyboard.press("Escape");

      if (compact) {
        await page.goto("/challenge");
        await expect(nav).toBeHidden();
        await expect(page.locator(".jt1-header-menu > .nav-more-trigger")).toBeVisible();
      }
      await page.goto("/mock");
      await expect(nav).toBeVisible();
      await expectNoPageOverflow(page, `${viewport.name} mock picker`);
    });

    test("supports keyboard traversal, focus return, selection, and exact current state", async ({ page }) => {
      await page.goto("/");
      const { menu, trigger } = await openResourcesMenu(page);
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

      await selectKanaWithKeyboard(page);
      await expect(appNavigation(page).getByRole("link", { name: "學習" })).not.toHaveAttribute(
        "aria-current",
        "page"
      );
      await expect(page.getByRole("navigation", { name: breadcrumbName })).toContainText("五十音表");

      await expect(appNavigation(page).getByRole("button", { name: "資料（目前：五十音表）" })).toBeVisible();
      const { menu: currentResourcesMenu } = await openResourcesMenu(page, "資料（目前：五十音表）");
      await expect(currentResourcesMenu.getByRole("menuitem", { name: "五十音表" })).toHaveAttribute(
        "aria-current",
        "page"
      );

      await page.goto("/");
      const { menu: headerMenu } = await openHeaderMenu(page);
      const mockItem = headerMenu.getByRole("menuitem", { name: "題型練習", exact: true });
      await page.keyboard.press("Home");
      await expect(mockItem).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(headerMenu).toBeHidden();
      await expect(page).toHaveURL(/\/mock$/);
      await expect(page.locator(".mock-panel")).toBeVisible();
      await expect(appNavigation(page).getByRole("link", { name: "練習" })).toHaveAttribute(
        "aria-current",
        "page"
      );
    });
  });
}

for (const viewport of [
  { name: "390x844", width: 390, height: 844 },
  { name: "1440x900", width: 1440, height: 900 }
] as const) {
  test.describe(`selected Resources contrast at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("keeps current Resources labels readable in both themes and pointer states", async ({ page }) => {
      const compact = viewport.width < 1024;
      const evidence: Array<Record<string, string | number>> = [];
      const trigger = page.locator(
        `.jt1-primary-nav .nav-resources-${compact ? "compact" : "wide"} > .nav-more-trigger.selected`
      );
      for (const theme of ["light", "dark"] as const) {
        await page.goto("/");
        await page.evaluate((storedTheme) => localStorage.setItem("jabiko.theme", storedTheme), theme);
        const routes = compact
          ? (["/kana", "/kanji", "/rules", "/grammar/n5"] as const)
          : (["/kana", "/kanji", "/rules"] as const);
        for (const route of routes) {
          await page.goto(route);
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          await expect(trigger).toBeVisible();
          await page.mouse.move(0, 0);
          await expect.poll(() => trigger.evaluate((element) => element.matches(":hover"))).toBe(false);
          await expectOpaqueRoleBackground(
            trigger,
            "--jt-surface-chrome",
            `${theme} ${route} resting Resources`,
            "--jt-accent-foreground"
          );
          evidence.push({ theme, route, state: "resting", ...(await expectReadableForeground(trigger, `${theme} ${route} resting Resources`)) });
          if (route === "/kana") {
            await test.info().attach(`${viewport.name}-${theme}-resources.png`, {
              body: await page.screenshot(),
              contentType: "image/png"
            });
          }
          await trigger.hover();
          await expectOpaqueRoleBackground(
            trigger,
            "--jt-action-tonal-hover",
            `${theme} ${route} hovered Resources`,
            "--jt-accent-foreground"
          );
          evidence.push({ theme, route, state: "hovered", ...(await expectReadableForeground(trigger, `${theme} ${route} hovered Resources`)) });
          await page.mouse.down();
          await expectOpaqueRoleBackground(
            trigger,
            "--jt-action-tonal-pressed",
            `${theme} ${route} pressed Resources`,
            "--jt-accent-foreground"
          );
          evidence.push({ theme, route, state: "pressed", ...(await expectReadableForeground(trigger, `${theme} ${route} pressed Resources`)) });
          await page.mouse.up();
          await expect(page.getByRole("menu", { name: "資料" })).toBeVisible();
          await expectOpaqueRoleBackground(
            trigger,
            "--jt-action-tonal-hover",
            `${theme} ${route} open Resources`,
            "--jt-accent-foreground"
          );
          evidence.push({ theme, route, state: "open", ...(await expectReadableForeground(trigger, `${theme} ${route} open Resources`)) });
          await page.keyboard.press("Escape");
        }
      }
      await test.info().attach(`${viewport.name}-resources-contrast.json`, {
        body: JSON.stringify(evidence, null, 2),
        contentType: "application/json"
      });
    });
  });
}

test.describe("compact navigation chrome while scrolling", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps the fixed bottom bar opaque over long content in both themes", async ({ page }) => {
    const evidence: Array<Record<string, string | number>> = [];
    for (const theme of ["light", "dark"] as const) {
      await page.goto("/");
      await page.evaluate((storedTheme) => localStorage.setItem("jabiko.theme", storedTheme), theme);
      await page.goto("/rules");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
      const nav = appNavigation(page);
      await expectOpaqueRoleBackground(nav, "--jt-surface-chrome", `${theme} scrolled compact navigation`);
      const chrome = await nav.evaluate((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          background: style.backgroundColor,
          borderTopWidth: style.borderTopWidth,
          borderTopStyle: style.borderTopStyle,
          position: style.position,
          bottom: Math.round(rect.bottom),
          viewportHeight: window.innerHeight
        };
      });
      expect(computedAlpha(chrome.background), `${theme} compact bar alpha`).toBe(1);
      expect(chrome.borderTopWidth).toBe("1px");
      expect(chrome.borderTopStyle).toBe("solid");
      expect(chrome.position).toBe("fixed");
      expect(chrome.bottom).toBe(chrome.viewportHeight);
      evidence.push({ theme, ...chrome });
      await test.info().attach(`390x844-${theme}-scrolled-bar.png`, {
        body: await page.screenshot(),
        contentType: "image/png"
      });
    }
    await test.info().attach("390x844-scrolled-bar-evidence.json", {
      body: JSON.stringify(evidence, null, 2),
      contentType: "application/json"
    });
  });
});

test.describe("legacy color compatibility contrast", () => {
  test("keeps the World start action text readable in both themes", async ({ page }) => {
    const evidence: Array<Record<string, string | number>> = [];
    for (const theme of ["light", "dark"] as const) {
      await page.goto("/");
      await page.evaluate((storedTheme) => localStorage.setItem("jabiko.theme", storedTheme), theme);
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.goto("/game");
      const start = page.locator(".game-world-start");
      await expect(start).toBeVisible();
      evidence.push({
        theme,
        route: "/game",
        selector: ".game-world-start",
        ...(await expectReadableForeground(start, `${theme} World start action`))
      });
    }
    await test.info().attach("game-world-start-contrast.json", {
      body: JSON.stringify(evidence, null, 2),
      contentType: "application/json"
    });
  });

  test("keeps selected controls and legacy accent ink readable in both themes", async ({ page }) => {
    const surfaces = [
      { route: "/challenge", selector: ".mode-card-count" },
      { route: "/grammar", selector: ".gi-level-badge" },
      { route: "/mock", selector: ".mock-section-head .eyebrow" }
    ] as const;
    const evidence: Array<Record<string, string | number>> = [];

    for (const theme of ["light", "dark"] as const) {
      await page.goto("/");
      await page.evaluate((storedTheme) => localStorage.setItem("jabiko.theme", storedTheme), theme);
      for (const surface of surfaces) {
        await page.goto(surface.route);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        if (surface.route === "/challenge") {
          // #866: the set list opens from the session bar's 換練習 title.
          await page.getByRole("button", { name: "換練習" }).click();
          await expect(page.locator(".practice-switcher .controls-panel")).toHaveCSS("opacity", "1");
          await expect(page.locator(".mode-card-count").first()).toBeVisible();
        }
        const target = page.locator(surface.selector).first();
        await expect(target).toBeVisible();
        evidence.push({
          theme,
          route: surface.route,
          selector: surface.selector,
          ...(await expectReadableForeground(target, `${theme} ${surface.route} ${surface.selector}`))
        });
      }
      await page.goto("/challenge?mode=exam");
      await page.locator(".session-length-custom input").fill("11");
      const customLength = page.locator(".session-length-custom.selected input");
      await expect(customLength).toBeVisible();
      evidence.push({
        theme,
        route: "/challenge",
        selector: ".session-length-custom.selected input",
        ...(await expectReadableForeground(customLength, `${theme} custom session length`))
      });
      await page.locator(".tts-rate-custom input").fill("0.9");
      const customRate = page.locator(".tts-rate-custom.selected input");
      await expect(customRate).toBeVisible();
      evidence.push({
        theme,
        route: "/challenge",
        selector: ".tts-rate-custom.selected input",
        ...(await expectReadableForeground(customRate, `${theme} custom speech rate`))
      });

      // Choosing a set closes the switcher; reopen it to read the set's own
      // segmented controls.
      await page.getByRole("button", { name: "換練習" }).click();
      await page.getByRole("button", { name: /^基礎變化/ }).click();
      await page.getByRole("button", { name: "換練習" }).click();
      await expect(page.locator(".practice-switcher .controls-panel")).toHaveCSS("opacity", "1");
      const selectedSegment = page.locator(".practice-switcher .segmented button.selected").first();
      await expect(selectedSegment).toBeVisible();
      await expectOpaqueRoleBackground(
        selectedSegment,
        "--jt-action-primary-background",
        `${theme} selected practice segment`,
        "--jt-action-primary-foreground"
      );
      evidence.push({
        theme,
        route: "/challenge",
        selector: ".segmented button.selected",
        ...(await expectReadableForeground(selectedSegment, `${theme} selected practice segment`))
      });

      await page.goto("/kanji");
      await page.locator(".kanji-cell").first().click();
      const reading = page.locator(".kanji-card-onyomi");
      await expect(reading).toBeVisible();
      evidence.push({
        theme,
        route: "/kanji",
        selector: ".kanji-card-onyomi after selecting a kanji",
        ...(await expectReadableForeground(reading, `${theme} selected kanji reading`))
      });

      await page.goto("/challenge");
      await page.getByRole("button", { name: "換練習" }).click();
      await page.getByRole("button", { name: /^基礎變化/ }).click();
      const choice = page.locator(".choice-option").first();
      await choice.click();
      const answeredChoice = page.locator('.choice-option[data-selected="true"]');
      await expect(answeredChoice).toBeVisible();
      // #866 / JT-1 §5: a judged option keeps the content surface; the verdict
      // is its assessment edge, the drawn mark and the margin label (no tint).
      // Measure once the question's turn-in (D-26) has settled.
      await expect(page.locator(".drill-panel")).toHaveCSS("opacity", "1");
      await expect(answeredChoice).toHaveCSS("opacity", "1");
      await expectOpaqueRoleBackground(
        answeredChoice,
        "--jt-surface-content",
        `${theme} selected answer feedback`,
        "--jt-text-primary"
      );
      await expect(answeredChoice).toHaveAttribute("data-verdict-label", /.+/);
      evidence.push({
        theme,
        route: "/challenge",
        selector: ".choice-option[data-selected=true]",
        ...(await expectReadableForeground(answeredChoice, `${theme} selected answer feedback`))
      });
    }
    await test.info().attach("legacy-color-contrast.json", {
      body: JSON.stringify(evidence, null, 2),
      contentType: "application/json"
    });
  });

  test("renders the Focus break primary action with readable colors in both themes", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-10-07T12:00:00.000Z") });
    const evidence: Array<Record<string, string | number>> = [];
    for (const theme of ["light", "dark"] as const) {
      await page.goto("/");
      await page.evaluate((storedTheme) => localStorage.setItem("jabiko.theme", storedTheme), theme);
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.getByRole("button", { name: "專注", exact: true }).click();
      const configure = page.getByRole("dialog", { name: "專注設定" });
      await configure.getByLabel("專注時間（分鐘）").fill("1");
      await configure.getByLabel("休息時間（分鐘）").fill("1");
      await configure.getByRole("button", { name: "開始", exact: true }).click();
      await page.clock.runFor(60_000);
      const pause = page.getByRole("dialog", { name: "休息一下" });
      await expect(pause).toBeVisible();
      const primary = pause.locator(".focus-break-primary");
      await expectOpaqueRoleBackground(
        primary,
        "--jt-action-primary-background",
        `${theme} Focus break primary action`,
        "--jt-action-primary-foreground"
      );
      evidence.push({
        theme,
        route: "/",
        selector: ".focus-break-primary",
        ...(await expectReadableForeground(primary, `${theme} Focus break primary action`))
      });
      await pause.getByRole("button", { name: "結束專注模式" }).click();
    }
    await test.info().attach("focus-break-color-contrast.json", {
      body: JSON.stringify(evidence, null, 2),
      contentType: "application/json"
    });
  });
});

// #866 Astra review round 5: enlarged text, the set list's inner scroll and
// reduced motion at the edges of the session bar and phone dock.
test.describe("practice session at the edges (#866)", () => {
  test("keeps the phone dock compact at 320px / 200% text so the question stays reachable", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("jabiko.lang", "en"));
    await page.goto("/challenge?mode=basic");
    await page.addStyleTag({ content: ":root { font-size: 200% !important; }" });
    const dock = page.locator(".action-row--dock");
    await expect(dock).toBeVisible();
    const dockHeight = await dock.evaluate((element) => element.getBoundingClientRect().height);
    expect(dockHeight, "dock height at 320x640, 200% text").toBeLessThanOrEqual(640 * 0.35);
    const option = page.locator(".choice-option").first();
    await option.scrollIntoViewIfNeeded();
    const reachable = await option.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + Math.min(rect.height / 2, 20));
      return top === element || element.contains(top);
    });
    expect(reachable).toBe(true);
  });

  test("brings the focused current set into the list's visible area when it opens", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("jabiko.lang", "zh-Hant"));
    await page.goto("/challenge?mode=basic");
    await page.getByRole("button", { name: "換練習" }).click();
    const list = page.locator(".practice-switcher .controls-panel");
    await expect(list).toHaveCSS("opacity", "1");
    const visible = await page.evaluate(() => {
      const focused = document.activeElement!.getBoundingClientRect();
      const box = document.querySelector(".practice-switcher .controls-panel")!.getBoundingClientRect();
      return focused.top >= box.top - 1 && focused.bottom <= box.bottom + 1 && focused.bottom <= window.innerHeight;
    });
    expect(visible).toBe(true);
  });

  for (const locale of ["zh-Hant", "ja", "en"] as const) {
    test(`keeps the current set's name readable in the session bar at 200% text (${locale})`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/");
      await page.evaluate((stored) => localStorage.setItem("jabiko.lang", stored), locale);
      await page.goto("/challenge?mode=basic");
      await page.addStyleTag({ content: ":root { font-size: 200% !important; }" });
      const title = page.locator(".session-title-text");
      const width = await title.evaluate((element) => element.getBoundingClientRect().width);
      const fontSize = await title.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
      expect(width, `${locale} title width`).toBeGreaterThanOrEqual(fontSize * 2);
      expect(await title.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    });
  }

  for (const locale of ["zh-Hant", "ja", "en"] as const) {
    test(`keeps every Small Talk length label inside its keycap on one shared column (${locale})`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/");
      await page.evaluate((stored) => localStorage.setItem("jabiko.lang", stored), locale);
      await page.goto("/conversation");
      const keycaps = page.locator(".conversation-scene-length");
      await expect(keycaps.first()).toBeVisible();
      const boxes = await keycaps.evaluateAll((elements) =>
        elements.map((element) => ({
          fits: element.scrollWidth <= element.clientWidth + 1,
          left: Math.round(element.getBoundingClientRect().left),
          text: element.textContent,
          width: Math.round(element.getBoundingClientRect().width)
        }))
      );
      for (const box of boxes) expect(box.fits, `${locale} keycap "${box.text}" fits`).toBe(true);
      expect(new Set(boxes.map((box) => box.width)).size, `${locale} keycaps share one width`).toBe(1);
      expect(new Set(boxes.map((box) => box.left)).size, `${locale} keycaps share one start edge`).toBe(1);
    });
  }

  test("answers and moves on by keyboard right after closing the list, with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("jabiko.lang", "zh-Hant"));
    await page.goto("/challenge?mode=basic");
    await page.addStyleTag({ content: ":root { font-size: 200% !important; }" });
    const panel = page.locator(".drill-panel");
    const firstQuestion = await panel.getAttribute("data-question-id");
    await page.getByRole("button", { name: "換練習" }).click();
    await page.locator(".practice-switcher .controls-panel button").last().scrollIntoViewIfNeeded();
    await page.keyboard.press("Escape");
    await page.keyboard.press("1");
    await expect(panel).not.toHaveAttribute("data-result", "unanswered");
    await page.keyboard.press("Enter");
    await expect(page.locator(".practice-layout")).toHaveAttribute("data-switcher", "closed");
    await expect.poll(() => panel.getAttribute("data-question-id")).not.toBe(firstQuestion);
  });
});

for (const viewport of [
  { name: "390x844", width: 390, height: 844 },
  { name: "1440x900", width: 1440, height: 900 }
] as const) {
  test.describe(`session exit at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("uses the accepted solid keyboard focus ring in both themes", async ({ page }) => {
      const evidence: Array<Record<string, string | number | boolean>> = [];
      for (const theme of ["light", "dark"] as const) {
        await page.goto("/");
        await page.evaluate((storedTheme) => localStorage.setItem("jabiko.theme", storedTheme), theme);
        await page.goto("/challenge?mode=basic");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

        const exit = page.getByRole("button", { name: "首頁", exact: true });
        await expect(exit).toBeVisible();
        let reachedExitByTab = false;
        for (let tabCount = 0; tabCount < 120; tabCount += 1) {
          await page.keyboard.press("Tab");
          if (await exit.evaluate((element) => element === document.activeElement)) {
            reachedExitByTab = true;
            break;
          }
        }
        expect(reachedExitByTab, `${theme}: Today exit is reachable by keyboard Tab`).toBe(true);

        const drillPanel = page.locator(".drill-panel");
        await expect(drillPanel).toHaveCSS("opacity", "1");
        const background = await expectOpaqueRoleBackground(
          drillPanel,
          "--jt-surface-content",
          `${theme} session exit parent surface`
        );
        await expect(exit).toHaveCSS("box-shadow", "none");
        const focusState = await exit.evaluate((element) => {
          const probe = document.createElement("span");
          probe.style.cssText = "position:fixed;visibility:hidden;pointer-events:none;color:var(--jt-focus-ring)";
          element.append(probe);
          const ringColor = getComputedStyle(probe).color;
          probe.remove();
          const style = getComputedStyle(element);
          return {
            visibleFocus: element.matches(":focus-visible"),
            outlineColor: style.outlineColor,
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            outlineOffset: style.outlineOffset,
            boxShadow: style.boxShadow,
            ringColor,
            parentBackground: getComputedStyle(element.parentElement!).backgroundColor
          };
        });
        expect(focusState.visibleFocus).toBe(true);
        expect(focusState.outlineColor).toBe(focusState.ringColor);
        expect(computedAlpha(focusState.outlineColor)).toBe(1);
        expect(focusState.outlineStyle).toBe("solid");
        expect(focusState.outlineWidth).toBe("3px");
        expect(focusState.outlineOffset).toBe("2px");
        expect(focusState.boxShadow).toBe("none");
        expect(focusState.parentBackground).toBe(background);
        const exitBounds = await exit.boundingBox();
        const panelBounds = await drillPanel.boundingBox();
        expect(exitBounds).not.toBeNull();
        expect(panelBounds).not.toBeNull();
        const outlineExtent = 5;
        expect(exitBounds!.x - outlineExtent).toBeGreaterThanOrEqual(0);
        expect(exitBounds!.y - outlineExtent).toBeGreaterThanOrEqual(0);
        expect(exitBounds!.x + exitBounds!.width + outlineExtent).toBeLessThanOrEqual(viewport.width);
        expect(exitBounds!.y + exitBounds!.height + outlineExtent).toBeLessThanOrEqual(viewport.height);
        expect(exitBounds!.x - outlineExtent).toBeGreaterThanOrEqual(panelBounds!.x);
        expect(exitBounds!.y - outlineExtent).toBeGreaterThanOrEqual(panelBounds!.y);
        expect(exitBounds!.x + exitBounds!.width + outlineExtent).toBeLessThanOrEqual(
          panelBounds!.x + panelBounds!.width
        );
        expect(exitBounds!.y + exitBounds!.height + outlineExtent).toBeLessThanOrEqual(
          panelBounds!.y + panelBounds!.height
        );
        const contrast =
          (Math.max(relativeLuminance(parseRgb(focusState.outlineColor)), relativeLuminance(parseRgb(background))) + 0.05) /
          (Math.min(relativeLuminance(parseRgb(focusState.outlineColor)), relativeLuminance(parseRgb(background))) + 0.05);
        expect(contrast, `${theme} focus ring against drill surface`).toBeGreaterThanOrEqual(3);
        await exit.hover();
        await expect(exit).toHaveCSS("box-shadow", "none");
        const hoverFocusState = await exit.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            visibleFocus: element.matches(":focus-visible"),
            outlineColor: style.outlineColor,
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            outlineOffset: style.outlineOffset,
            boxShadow: style.boxShadow
          };
        });
        expect(hoverFocusState.visibleFocus).toBe(true);
        expect(hoverFocusState.outlineColor).toBe(focusState.ringColor);
        expect(computedAlpha(hoverFocusState.outlineColor)).toBe(1);
        expect(hoverFocusState.outlineStyle).toBe("solid");
        expect(hoverFocusState.outlineWidth).toBe("3px");
        expect(hoverFocusState.outlineOffset).toBe("2px");
        expect(hoverFocusState.boxShadow).toBe("none");
        evidence.push({ theme, ...focusState, parentBackground: background, contrast: Number(contrast.toFixed(2)) });
      }
      await test.info().attach(`${viewport.name}-session-exit-focus-ring.json`, {
        body: JSON.stringify(evidence, null, 2),
        contentType: "application/json"
      });
    });

    test("keeps the Today exit available when a normal basic filter matches no questions", async ({ page }) => {
      const savedAttempt = {
        questionId: "n1-grammar-yainaya",
        vocabularyId: "n1-grammar-yainaya",
        targetForm: "meaning",
        prompt: "seed",
        expectedAnswers: ["や否や"],
        submittedAnswer: "x",
        isCorrect: false,
        timestamp: 1000,
        responseTimeMs: 100
      };
      await page.addInitScript((attempt) => {
        localStorage.setItem("jabiko:attempts", JSON.stringify([attempt]));
      }, savedAttempt);
      await page.goto("/challenge?mode=basic");
      await page.getByRole("button", { name: "換練習" }).click();
      const n5Filter = page.getByRole("button", { name: "N5", exact: true });
      await expect(n5Filter).toBeEnabled();
      await n5Filter.click();
      await n5Filter.click();

      await expect(page.getByText("目前設定沒有可練習的題目。", { exact: true })).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      const exit = page.getByRole("button", { name: "首頁", exact: true });
      await expect(exit).toBeVisible();
      const bounds = await exit.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
      const storedProgress = await page.evaluate(() => localStorage.getItem("jabiko:attempts"));
      const attempts = JSON.parse(storedProgress ?? "[]") as unknown[];
      expect(attempts.length).toBeGreaterThan(0);

      await exit.click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("region", { name: "首頁" })).toBeVisible();
      await expect.poll(() => page.evaluate(() => localStorage.getItem("jabiko:attempts"))).toBe(storedProgress);
    });

    test("exits by keyboard from revealed feedback without advancing or deleting the attempt", async ({ page }) => {
      await page.goto("/challenge?mode=basic");
      await page.getByRole("button", { name: "看答案", exact: true }).click();
      await expect(page.locator(".feedback")).toBeVisible();
      const storedProgress = await page.evaluate(() => localStorage.getItem("jabiko:attempts"));
      const attempts = JSON.parse(storedProgress ?? "[]") as unknown[];
      expect(attempts.length).toBeGreaterThan(0);

      const exit = page.getByRole("button", { name: "首頁", exact: true });
      await exit.focus();
      await page.keyboard.press("Enter");

      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("region", { name: "首頁" })).toBeVisible();
      await expect.poll(() => page.evaluate(() => localStorage.getItem("jabiko:attempts"))).toBe(storedProgress);
    });

    test("keeps a direct Today exit visible during active endless practice", async ({ page }) => {
      const savedAttempt = {
        questionId: "n1-grammar-yainaya",
        vocabularyId: "n1-grammar-yainaya",
        targetForm: "meaning",
        prompt: "seed",
        expectedAnswers: ["や否や"],
        submittedAnswer: "x",
        isCorrect: false,
        timestamp: 1000,
        responseTimeMs: 100
      };
      await page.addInitScript((attempt) => {
        localStorage.setItem("jabiko:attempts", JSON.stringify([attempt]));
        localStorage.setItem("jabiko.sessionLength", "all");
      }, savedAttempt);
      await page.goto("/challenge?mode=exam");
      const exit = page.getByRole("button", { name: "首頁", exact: true });
      await expect(exit).toBeVisible();
      // #866: the set list is one tap away from the session bar, and Esc
      // puts it away again.
      await page.getByRole("button", { name: "換練習" }).click();
      await expect(page.locator(".controls-panel")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator(".controls-panel")).toBeHidden();
      await expect(page.locator(".drill-panel")).toBeVisible();
      await expect(page.locator(".prompt-header span")).toHaveText(/^第 \d+ 題$/);
      const exitBounds = await exit.boundingBox();
      expect(exitBounds).not.toBeNull();
      expect(exitBounds!.y).toBeGreaterThanOrEqual(0);
      expect(exitBounds!.y + exitBounds!.height).toBeLessThanOrEqual(viewport.height);
      const storedProgress = await page.evaluate(() => localStorage.getItem("jabiko:attempts"));

      const endlessExitBounds = await exit.boundingBox();
      expect(endlessExitBounds).not.toBeNull();
      expect(endlessExitBounds!.y).toBeGreaterThanOrEqual(0);
      expect(endlessExitBounds!.y + endlessExitBounds!.height).toBeLessThanOrEqual(viewport.height);
      await exit.click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("region", { name: "首頁" })).toBeVisible();
      await expect.poll(() => page.evaluate(() => localStorage.getItem("jabiko:attempts"))).toBe(storedProgress);
    });
  });
}

// #866 (Astra review of #872): on a phone with enlarged text the docked
// action row covered the end of the open set list, so a tap on its last
// control landed on 看答案 underneath.
test("keeps every control of the open set list tappable above the phone dock at 200% text", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("jabiko.lang", "zh-Hant"));
  await page.goto("/challenge?mode=exam");
  await page.addStyleTag({ content: ":root { font-size: 200% !important; }" });
  await page.getByRole("button", { name: "換練習" }).click();
  const list = page.locator(".practice-switcher .controls-panel");
  await expect(list).toHaveCSS("opacity", "1");
  const last = list.locator("button").last();
  await last.scrollIntoViewIfNeeded();
  const hit = await last.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return { onTarget: top === element || element.contains(top), inViewport: rect.bottom <= window.innerHeight };
  });
  expect(hit).toEqual({ onTarget: true, inViewport: true });
});

for (const viewport of [
  { name: "320x640", width: 320, height: 640 },
  { name: "1280x800", width: 1280, height: 800 }
] as const) {
  test.describe(`JT-1 shell evidence at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("captures the themed kana shell at the requested viewport size", async ({ page }) => {
      const compact = viewport.width < 1024;
      for (const theme of ["light", "dark"] as const) {
        await page.goto("/");
        await page.evaluate((storedTheme) => localStorage.setItem("jabiko.theme", storedTheme), theme);
        await page.goto("/kana");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expectRepresentativeRouteReady(page, "/kana");
        await expectNoPageOverflow(page, `${viewport.name} ${theme} /kana shell`);

        const heading = page.locator(".app-heading");
        const nav = appNavigation(page);
        await expect(heading).toBeVisible();
        await expect(nav).toBeVisible();
        await expectOpaqueRoleBackground(
          compact ? nav : heading,
          "--jt-surface-chrome",
          `${viewport.name} ${theme} /kana shell ${compact ? "navigation" : "header"}`
        );
        await expect(nav.getByRole("link")).toHaveCount(compact ? 4 : 5);
        if (compact) {
          await expect(nav.locator(".nav-resources-compact")).toBeVisible();
          await expect(nav.locator(".nav-resources-wide")).toBeHidden();
        } else {
          await expect(nav.locator(".nav-resources-wide")).toBeVisible();
          await expect(nav.locator(".nav-resources-compact")).toBeHidden();
        }

        // Capture a synthetic static frame with finite transitions completed.
        await test.info().attach(`${viewport.name}-${theme}-kana-shell.png`, {
          body: await page.screenshot({ fullPage: false, animations: "disabled" }),
          contentType: "image/png"
        });
      }
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
          await appNavigation(page).getByRole("link", { name: "文型" }).click();
          await page.getByRole("button", { name: "瀏覽 N5" }).click();
        },
        assertCurrent: async () => {
          await expect(appNavigation(page).getByRole("link", { name: "文型" })).toHaveAttribute(
            "aria-current",
            "page"
          );
        }
      },
      {
        path: "/kana",
        expected: kanaBreadcrumb,
        navigate: async () => {
          await appNavigation(page).getByRole("button", { name: "資料" }).click();
          await page.getByRole("menuitem", { name: "五十音表" }).click();
        },
        assertCurrent: async () => {
          await expect(appNavigation(page).getByRole("link", { name: "學習" })).not.toHaveAttribute(
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
          await expectHeaderMenuCurrent(page, "關於");
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
          await expectHeaderMenuCurrent(page, "關於");
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
    await appNavigation(page).getByRole("link", { name: "文型" }).click();
    await page.getByRole("button", { name: "瀏覽 N5" }).click();
    await appNavigation(page).getByRole("button", { name: "資料" }).click();
    await page.getByRole("menuitem", { name: "五十音表" }).click();
    await expect(page).toHaveURL(/\/kana$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/grammar\/n5$/);
    await expect(appNavigation(page).getByRole("link", { name: "文型" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(await breadcrumbSnapshot(page)).toEqual(grammarN5Breadcrumb);
    await appNavigation(page).getByRole("button", { name: "資料" }).click();
    await expect(page.getByRole("menu").locator('[aria-current="page"]')).toHaveCount(0);
    await page.keyboard.press("Escape");

    await page.goForward();
    await expect(page).toHaveURL(/\/kana$/);
    await expect(appNavigation(page).getByRole("link", { name: "學習" })).not.toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(await breadcrumbSnapshot(page)).toEqual(kanaBreadcrumb);
    const resources = appNavigation(page).getByRole("button", { name: "資料（目前：五十音表）" });
    await resources.click();
    await expect(page.getByRole("menuitem", { name: "五十音表" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });
});

for (const viewport of [
  { name: "desktop", width: 1280, height: 844 },
  { name: "mobile", width: 390, height: 844 }
] as const) {
  test.describe(`conjugation recall at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("supports the keyboard-only quick drill without horizontal overflow", async ({ page }) => {
      await page.goto("/");
      const launcher = page.getByRole("button", { name: /動詞變化/ });
      await launcher.focus();
      await launcher.press("Enter");

      const drill = page.getByRole("region", { name: "目前題目" });
      const input = page.getByRole("textbox", { name: "輸入變化後的日文" });
      await expect(drill).toBeVisible();
      await expect(input).toBeFocused();
      await expect(page.locator(".recall-answer-row")).toHaveCSS("display", "grid");
      await expectNoPageOverflow(page, `${viewport.name} recall question`);

      if (viewport.name === "mobile") {
        const [inputBox, submitBox] = await Promise.all([
          input.boundingBox(),
          page.getByRole("button", { name: "送出答案" }).boundingBox()
        ]);
        expect(inputBox).not.toBeNull();
        expect(submitBox).not.toBeNull();
        expect(submitBox!.y).toBeGreaterThan(inputBox!.y);
      }

      const firstQuestionId = await drill.getAttribute("data-question-id");
      await input.fill("行きて");
      await input.press("Enter");

      await expect(drill).toHaveAttribute("data-result", "wrong");
      await expect(drill).toHaveAttribute("data-selected", "行きて");
      await expect(page.getByRole("heading", { name: "再想一下" })).toBeVisible();
      const next = page.getByRole("button", { name: "下一題" });
      await expect(next).toBeFocused();
      await expectNoPageOverflow(page, `${viewport.name} recall feedback`);

      await next.press("Enter");
      await expect(input).toBeFocused();
      await expect(drill).toHaveAttribute("data-result", "unanswered");
      expect(await drill.getAttribute("data-question-id")).not.toBe(firstQuestionId);
      await expectNoPageOverflow(page, `${viewport.name} next recall question`);
    });
  });
}
