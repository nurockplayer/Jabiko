import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { Attempt } from "./domain/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import appSource from "./App.tsx?raw";

// #693: controlled auth + deletion-protocol seams for the account-entry
// integration tests. Default OFF: every existing test keeps running the REAL
// hooks with Supabase unconfigured (staying signed-out / local-only). Flipping
// `deletionTest.active` drives a fake signed-in user AND the deletion-protocol
// IO (through the same seams useProgressAttempts.test.tsx mocks), so the REAL
// useProgressAttempts hook runs end-to-end: remote delete -> local clear ->
// marker removal -> status. `isSupabaseConfigured` is a getter so inactive
// tests keep seeing "unconfigured" exactly as the real env does.
const deletionTest = vi.hoisted(() => ({
  active: false,
  user: null as {
    id: string;
    email: string;
    user_metadata: { full_name: string };
  } | null,
  /** The deleteRemoteAttempts outcome. */
  deleteRemoteResult: { ok: true } as { ok: true } | { ok: false; message: string },
  /** How many times the remote delete ran (1 per confirmed delete). */
  deleteRemoteCalls: 0
}));

vi.mock("./lib/supabase", () => ({
  get isSupabaseConfigured() {
    return deletionTest.active;
  },
  getSupabase: () => Promise.resolve({} as unknown as SupabaseClient)
}));

vi.mock("./domain/attemptRemote", async () => {
  const actual = await vi.importActual<typeof import("./domain/attemptRemote")>(
    "./domain/attemptRemote"
  );
  return {
    ...actual,
    fetchRemoteAttempts: async () => [] as Attempt[],
    pushAttempts: async () => {},
    deleteRemoteAttempts: async () => {
      deletionTest.deleteRemoteCalls += 1;
      return deletionTest.deleteRemoteResult;
    }
  };
});

vi.mock("./domain/practiceHistoryDeletion", () => ({
  readDeletionMarker: () => false,
  writeDeletionMarker: () => true,
  removeDeletionMarker: () => true
}));

vi.mock("./hooks/useAuth", async () => {
  const actual = await vi.importActual<typeof import("./hooks/useAuth")>("./hooks/useAuth");
  return {
    ...actual,
    useAuth: () => {
      if (deletionTest.active) {
        return {
          user: deletionTest.user,
          error: null,
          signInWithGoogle: () => Promise.resolve({ error: null }),
          signOut: () => Promise.resolve()
        };
      }
      return actual.useAuth();
    }
  };
});

// Default landing changed from "learn" to "home" so the first-time UX
// is a dashboard with four entry cards instead of dropping the learner
// straight into the chapter list. Every test that depends on Learn
// being visible needs this helper to navigate there first.
async function gotoLearn(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "學習" }));
}

async function gotoResource(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole("button", { name: /^資源/ }));
  await user.click(screen.getByRole("menuitem", { name: label }));
}

describe("App", () => {

  // The challenge / mock / kanji views are React.lazy in App, and
  // React.lazy only suspends on its first resolution. Prime the chunks
  // once here so every test below renders them synchronously regardless of
  // run order -- otherwise whichever test first navigates to a view would
  // run its synchronous assertions before the lazy chunk finished loading.
  // GrammarPointPage is reached through a direct URL rather than one of these
  // navigation clicks, so preload it explicitly for the route-level heading
  // test below as well.
  // Generous timeouts here: this hook cold-loads the lazy chunks, and the
  // challenge chunk now carries the ~700KB pre-baked furigana table (#134 P4),
  // so the first transform+eval can exceed the 1s findBy default in CI before
  // any other test has warmed the modules. Once primed, the per-test
  // navigations below resolve from cache at the default timeout.
  beforeAll(async () => {
    await import("./components/GrammarPointPage");
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(screen.getByRole("button", { name: "挑戰" }));
    await screen.findByRole("region", { name: "目前題目" }, { timeout: 30000 });
    await user.click(screen.getByRole("button", { name: "題型練習" }));
    await screen.findByRole("region", { name: "題型練習" }, { timeout: 30000 });
    await gotoResource(user, "漢字");
    await screen.findByRole("heading", { name: /漢字音読み/ }, { timeout: 30000 });
    unmount();
    // Priming navigated the URL (the app now routes view -> path); reset so the
    // first test starts at "/" (afterEach only runs after each test, not here).
    window.history.replaceState({}, "", "/");
  }, 60000);

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    window.history.replaceState({}, "", "/");
    // Reset the #693 deletion-test seam so no state leaks between tests.
    deletionTest.active = false;
    deletionTest.user = null;
    deletionTest.deleteRemoteResult = { ok: true };
    deletionTest.deleteRemoteCalls = 0;
  });

  it("renders the home dashboard with the four-tab nav by default", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /自習室/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "首頁" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "學習" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "資源" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "挑戰" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "題型練習" })).toBeInTheDocument();
    // Home hero copy + at least one entry card heading.
    expect(screen.getByRole("heading", { name: /今天想練什麼/ })).toBeInTheDocument();
    // Chapter index belongs to Learn view; not visible on Home.
    expect(screen.queryByRole("heading", { name: "一章一章解鎖" })).not.toBeInTheDocument();
  });

  it("keeps /stay-d out of the primary nav and lazy-loads its public route", async () => {
    expect(appSource).toMatch(/const StayDPage = lazy\(\(\) =>/);
    expect(appSource).toContain('import("./components/StayDPage")');

    // Make the expected localized route copy an explicit test precondition.
    localStorage.setItem("jabiko.lang", "zh-Hant");
    window.history.replaceState({}, "", "/stay-d");
    render(<App />);

    // This is the first cold import of the Stay.D route chunk. CI runners can
    // spend longer than Testing Library's default 1s transforming that chunk,
    // so allow the same bounded warm-up window as the grammar route below.
    await screen.findByRole(
      "heading",
      {
        name: "下一次來東京，不只是觀光。用學過的日文，和家人朋友一起更深入地享受東京的日常。",
        level: 1
      },
      { timeout: 15000 }
    );
    expect(
      within(screen.getByRole("navigation", { name: "學習流程" })).queryByRole("button", {
        name: /Stay\.D/
      })
    ).not.toBeInTheDocument();
  });

  it("marks the active nav tab with aria-current=page and moves it on navigation", async () => {
    const user = userEvent.setup();
    render(<App />);

    const nav = screen.getByRole("navigation", { name: "學習流程" });
    // Default view is home -> 首頁 is the current page, and the only one.
    expect(screen.getByRole("button", { name: "首頁" })).toHaveAttribute("aria-current", "page");
    expect(
      within(nav)
        .getAllByRole("button")
        .filter((button) => button.getAttribute("aria-current") === "page")
    ).toHaveLength(1);

    // Navigating moves aria-current to the new tab and clears the old one.
    await gotoResource(user, "規則表");
    expect(screen.getByRole("button", { name: "資源（目前：規則表）" })).toHaveClass("selected");
    expect(screen.getByRole("button", { name: "首頁" })).not.toHaveAttribute("aria-current");
  });

  it("home has a single h1 (the persistent app title); the hero is demoted to h2", () => {
    render(<App />);

    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Jabiko");
    // The hero heading stays visible but is now a level-2 heading.
    expect(screen.getByRole("heading", { name: "今天想練什麼？", level: 2 })).toBeInTheDocument();
  });

  it("grammar route: the single h1 is the grammar surface, and the app title yields to h2", async () => {
    const { allGrammarSurfaces } = await import("./domain/grammarPoints");
    const surface = allGrammarSurfaces()[0];
    window.history.replaceState({}, "", `/grammar/${encodeURIComponent(surface)}`);
    render(<App />);

    // This route resolves the heaviest lazy chain in the app (GrammarPointPage
    // -> grammar notes -> exam bank; #611 split furigana into one more async
    // module). The default 1s findBy timeout flaked on slow CI runners even
    // though local runs pass, so give the first paint room to land.
    await screen.findByRole("heading", { name: surface, level: 1 }, { timeout: 15000 });
    // Exactly one h1 on the SEO landing page, and it's the page-specific surface.
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(surface);
    // The persistent app title is still present, but demoted to h2 on this route.
    expect(screen.getByRole("heading", { name: /Jabiko/, level: 2 })).toBeInTheDocument();

    window.history.replaceState({}, "", "/");
  });

  describe("App breadcrumbs (#729)", () => {
    it("direct-load /grammar/n5: Home > Grammar > N5, and no duplicated route-parent back control", async () => {
      await import("./components/GrammarIndexPage");
      window.history.replaceState({}, "", "/grammar/n5");
      render(<App />);

      const breadcrumb = await screen.findByRole("navigation", { name: "目前位置" });
      expect(within(breadcrumb).getByRole("link", { name: "首頁" })).toHaveAttribute("href", "/");
      expect(within(breadcrumb).getByRole("link", { name: "文型" })).toHaveAttribute("href", "/grammar");
      const current = within(breadcrumb).getByText("N5");
      expect(current.tagName).toBe("SPAN");
      expect(current).toHaveAttribute("aria-current", "page");

      await screen.findByRole("heading", { name: "JLPT N5 文型" });
      // #729: the global nav + breadcrumbs replace the page-level route-parent
      // back controls (回首頁 header button / 回到文型一覽 CTA).
      expect(screen.queryByText("回首頁")).not.toBeInTheDocument();
      expect(screen.queryByText("回到文型一覽")).not.toBeInTheDocument();
    });

    it("direct-load /grammar/<surface>: current crumb is the surface with lang=ja", async () => {
      await import("./components/GrammarPointPage");
      const { allGrammarSurfaces } = await import("./domain/grammarPoints");
      const surface = allGrammarSurfaces()[0];
      window.history.replaceState({}, "", `/grammar/${encodeURIComponent(surface)}`);
      render(<App />);

      const breadcrumb = await screen.findByRole("navigation", { name: "目前位置" });
      expect(within(breadcrumb).getByRole("link", { name: "文型" })).toHaveAttribute("href", "/grammar");
      const current = within(breadcrumb).getByText(surface);
      expect(current).toHaveAttribute("aria-current", "page");
      expect(current).toHaveAttribute("lang", "ja");
    });

    it("direct-load /kana: Home > Learn > 五十音表, current crumb is not a link", async () => {
      await import("./components/KanaTablePage");
      window.history.replaceState({}, "", "/kana");
      render(<App />);

      const breadcrumb = await screen.findByRole("navigation", { name: "目前位置" });
      expect(within(breadcrumb).getByRole("link", { name: "首頁" })).toHaveAttribute("href", "/");
      expect(within(breadcrumb).getByRole("link", { name: "學習" })).toHaveAttribute("href", "/learn");
      const current = within(breadcrumb).getByText("五十音表");
      expect(current).toHaveAttribute("aria-current", "page");
      expect(within(breadcrumb).queryByRole("link", { name: "五十音表" })).not.toBeInTheDocument();
    });

    it("direct-load /privacy and /terms: Home > About > legal page", async () => {
      await import("./components/LegalPanel");
      window.history.replaceState({}, "", "/privacy");
      const { unmount } = render(<App />);
      const privacyCrumb = await screen.findByRole("navigation", { name: "目前位置" });
      expect(within(privacyCrumb).getByRole("link", { name: "關於" })).toHaveAttribute("href", "/about");
      expect(within(privacyCrumb).getByText("隱私政策")).toHaveAttribute("aria-current", "page");
      unmount();

      window.history.replaceState({}, "", "/terms");
      render(<App />);
      const termsCrumb = await screen.findByRole("navigation", { name: "目前位置" });
      expect(within(termsCrumb).getByRole("link", { name: "關於" })).toHaveAttribute("href", "/about");
      expect(within(termsCrumb).getByText("使用條款")).toHaveAttribute("aria-current", "page");
    });

    it("renders no breadcrumb on top-level routes (home and /grammar root)", async () => {
      await import("./components/GrammarIndexPage");
      const home = render(<App />);
      expect(screen.queryByRole("navigation", { name: "目前位置" })).not.toBeInTheDocument();
      home.unmount();

      window.history.replaceState({}, "", "/grammar");
      render(<App />);
      expect(screen.queryByRole("navigation", { name: "目前位置" })).not.toBeInTheDocument();
    });

    it("clicking a parent crumb navigates in-app (SPA) and updates the trail", async () => {
      await import("./components/GrammarIndexPage");
      const user = userEvent.setup();
      window.history.replaceState({}, "", "/grammar/n5");
      render(<App />);

      const breadcrumb = await screen.findByRole("navigation", { name: "目前位置" });
      await user.click(within(breadcrumb).getByRole("link", { name: "文型" }));

      expect(window.location.pathname).toBe("/grammar");
      await screen.findByRole("heading", { name: "JLPT 文型資料庫" });
      expect(screen.queryByRole("navigation", { name: "目前位置" })).not.toBeInTheDocument();
    });

    it("in-app navigation reproduces the direct-load breadcrumb (grammar overview -> N5)", async () => {
      await import("./components/GrammarIndexPage");
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole("button", { name: "文型" }));
      await screen.findByRole("heading", { name: "JLPT 文型資料庫" });
      expect(screen.queryByRole("navigation", { name: "目前位置" })).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "瀏覽 N5" }));
      const breadcrumb = await screen.findByRole("navigation", { name: "目前位置" });
      // In-app level navigation serializes the typed level (/grammar/N5);
      // direct loads are lowercase (/grammar/n5). Both parse to the same route
      // and render the identical Home > Grammar > N5 trail (#727 normalizes).
      expect(window.location.pathname.toLowerCase()).toBe("/grammar/n5");
      expect(within(breadcrumb).getByRole("link", { name: "首頁" })).toHaveAttribute("href", "/");
      expect(within(breadcrumb).getByRole("link", { name: "文型" })).toHaveAttribute("href", "/grammar");
      expect(within(breadcrumb).getByText("N5")).toHaveAttribute("aria-current", "page");
    });
  });

  it("opens the rules reference page after clicking the 規則表 tab", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoResource(user, "規則表");

    // Rules page banner + the full v2 eight-table set.
    expect(screen.getByRole("heading", { name: /動詞變化 速查/ })).toBeInTheDocument();
    // v1 tables (verb basics):
    expect(screen.getByRole("heading", { name: "動詞 三類分類" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ます形" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /一類動詞 て形・た形/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /一類例外動詞/ })).toBeInTheDocument();
    // v2 tables (advanced + adjectives + obligation past + patterns):
    expect(
      screen.getByRole("heading", { name: /動詞 進階形 速查/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /形容詞・名詞 變化四格/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /必要過去 step-by-step/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /句型 cheat sheet/ })).toBeInTheDocument();
  });

  it("shows the chapter index after clicking the Learn tab", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);

    expect(screen.getByRole("heading", { name: "一章一章解鎖" })).toBeInTheDocument();
    // A brand-new learner's default-active chapter is now the 入門 kana
    // chapter (#533) -- the true chapter zero -- not the く/に modifier one.
    expect(screen.getAllByRole("heading", { name: "五十音・平假名" }).length).toBeGreaterThan(0);
    expect(screen.getByText("あ a・い i・う u・え e・お o")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "練五十音認讀" })).toBeInTheDocument();
    // The former default chapter is still one click away with its content intact.
    await user.click(screen.getByRole("button", { name: "查看：先分清楚く / に" }));
    expect(screen.getByText("高い -> 高く")).toBeInTheDocument();
    expect(screen.getByText("静か -> 静かに")).toBeInTheDocument();
    expect(screen.getByText("学生 -> 学生に")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "練く/に修飾" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看：ない形家族" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "查看：動詞て形 / た形（一類音便重點）" })
    ).toBeInTheDocument();
    // 必要過去 is always clickable now (no lock UI); only the active
    // chapter's body content is rendered, so its examples should not
    // appear in the default view.
    expect(screen.getByRole("button", { name: "查看：必要過去" })).toBeEnabled();
    expect(screen.queryByText("学生 -> 学生にならなければならなかった")).not.toBeInTheDocument();
    expect(screen.queryByText("否定て形・ないで")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "開始挑戰" })).toBeInTheDocument();
    expect(screen.queryByText("答題方式")).not.toBeInTheDocument();
  });

  it("shows a single chapter detail after selecting a chapter", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "查看：ない形家族" }));

    expect(screen.getByRole("heading", { name: "ない形家族" })).toBeInTheDocument();
    expect(screen.getAllByText("書かない -> 書かなかった").length).toBeGreaterThan(1);
    expect(screen.getByRole("button", { name: "練否定整理" })).toBeInTheDocument();
    expect(screen.queryByText("学生 -> 学生にならなければならなかった")).not.toBeInTheDocument();
  });

  it("starts the first prerequisite from the recommended chapter CTA", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    // Default-active chapter for a brand-new learner is 五十音・平假名
    // (#533); its kana drill button is the "開始第 1 關" equivalent now.
    await user.click(screen.getByRole("button", { name: "練五十音認讀" }));

    expect(
      within(screen.getByRole("region", { name: "目前題目" })).getByText("五十音・平假名")
    ).toBeInTheDocument();
  });

  it("starts a focused negative drill from the learning guide", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "查看：ない形家族" }));
    await user.click(screen.getByRole("button", { name: "練否定整理" }));

    expect(screen.getByText("練習重點")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "否定整理" })).toHaveClass("selected");
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("ない形")).toBeInTheDocument();
    expect(screen.getByText("書く")).toBeInTheDocument();
  });

  it("starts an adjective drill from the learning guide", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "查看：先分清楚く / に" }));
    await user.click(screen.getByRole("button", { name: "練な形容詞" }));

    expect(screen.getByRole("button", { name: "な形容詞" })).toHaveClass("selected");
    expect(screen.getByText("静か")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("普通形・非過去肯定")).toBeInTheDocument();
  });

  it("starts a ku-ni modifier drill from the learning guide", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "查看：先分清楚く / に" }));
    await user.click(screen.getByRole("button", { name: "練く/に修飾" }));

    expect(screen.getByRole("button", { name: "く/に修飾" })).toHaveClass("selected");
    expect(screen.getByText("高い")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "高く" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("修飾形・く/に")).toBeInTheDocument();
  });

  it("renders the new verb-basic blocks and runs a ます drill from the ます chapter", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    // The new chapters surface in the chapter list.
    expect(screen.getByRole("button", { name: "查看：ます形" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看：可能形 (V られる)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看：使役形 (V せる/させる)" })).toBeInTheDocument();

    // Open the ます chapter; its example formulas and drill button render.
    await user.click(screen.getByRole("button", { name: "查看：ます形" }));
    expect(screen.getByText("書く → 書きます")).toBeInTheDocument();
    expect(screen.getByText("食べる → 食べます")).toBeInTheDocument();

    // Click the drill CTA -- challenge page should land in basic mode
    // with the masu target form selected.
    await user.click(screen.getByRole("button", { name: "練ます形" }));
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("ます形")).toBeInTheDocument();
  });

  it("renders the new sentence-pattern reference chapters and reaches their related drill", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    // All four B2 chapters surface in the chapter list (smoke check).
    expect(
      screen.getByRole("button", { name: "查看：てください / てもいい / てはいけない" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看：なくてもいい（不必）" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "查看：てもらう / てくれる / てあげる" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "查看：と思う / と言う（引用・意見）" })
    ).toBeInTheDocument();

    // For each new chapter, walk: open chapter → confirm an example
    // renders → click the related drill → confirm the practice region
    // lands on the expected target form. This catches drill-mapping
    // regressions on any of the four chapters individually.
    type DrillCase = { chapter: string; example: string; drill: string; form: string | RegExp };
    const cases: DrillCase[] = [
      {
        chapter: "查看：てください / てもいい / てはいけない",
        example: "書く → 書いてください",
        drill: "練一類て/た",
        form: "て形"
      },
      {
        chapter: "查看：なくてもいい（不必）",
        example: "書く → 書かなくてもいい",
        drill: "練否定整理",
        form: "ない形"
      },
      {
        chapter: "查看：てもらう / てくれる / てあげる",
        example: "友達が 教えてくれた",
        drill: "練一類て/た",
        form: "て形"
      },
      {
        chapter: "查看：と思う / と言う（引用・意見）",
        example: "明日は雨だ → 明日は雨だと思う",
        drill: "練普通形",
        // The plain focus shuffles across all four plain forms; any of
        // the four 普通形・... labels is acceptable as the first
        // question's form. Match the prefix only.
        form: /普通形・/
      }
    ];

    for (const { chapter, example, drill, form } of cases) {
      // Return to the learning view (idempotent if already there).
      await gotoLearn(user);
      await user.click(screen.getByRole("button", { name: chapter }));
      expect(screen.getByText(example)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: drill }));
      expect(within(screen.getByRole("region", { name: "目前題目" })).getByText(form)).toBeInTheDocument();
    }
  });

  it("launches the sentence-pattern drill from each reference chapter's pattern button", async () => {
    // The 4 reference chapters now expose a primary pattern-drill
    // button (above the existing form-variation drill). Clicking it
    // should set the challenge page to "句型練習" mode filtered to
    // that chapter's pattern, and the first question's prompt label
    // should reflect the pattern.
    const user = userEvent.setup();
    type PatternCase = {
      chapter: string;
      drill: string;
      promptLabelFragment: RegExp;
    };
    const cases: PatternCase[] = [
      {
        chapter: "查看：てください / てもいい / てはいけない",
        drill: "練句型：請求 / 許可 / 禁止",
        promptLabelFragment: /請求 \/ 許可 \/ 禁止/
      },
      {
        chapter: "查看：なくてもいい（不必）",
        drill: "練句型：不必 vs 必須",
        promptLabelFragment: /不必 \/ 必須/
      },
      {
        chapter: "查看：てもらう / てくれる / てあげる",
        drill: "練句型：授受視角",
        promptLabelFragment: /授受視角/
      },
      {
        chapter: "查看：と思う / と言う（引用・意見）",
        drill: "練句型：引用 / 意見",
        promptLabelFragment: /引用 \/ 意見/
      }
    ];

    render(<App />);

    for (const { chapter, drill, promptLabelFragment } of cases) {
      await gotoLearn(user);
      await user.click(screen.getByRole("button", { name: chapter }));
      await user.click(screen.getByRole("button", { name: drill }));
      // Challenge page: "句型練習" mode card is selected and the
      // question header includes the pattern label.
      expect(screen.getByRole("button", { name: /句型練習/ })).toHaveClass("selected");
      expect(
        within(screen.getByRole("region", { name: "目前題目" })).getByText(promptLabelFragment)
      ).toBeInTheDocument();
    }
  });

  it("marks the verb-types explainer '參考', and keeps the drill-note on pattern chapters", async () => {
    // verb-types is reading-only (no drill of its own) → status badge '參考'.
    // Sentence-pattern chapters now have a counted pattern drill, so they no
    // longer show '參考', but they keep a drillNote explaining their secondary
    // (prerequisite-form) drill.
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);

    const referenceChapter = screen.getByRole("button", { name: "查看：動詞三類怎麼分" });
    expect(referenceChapter.textContent).toContain("參考");

    const patternChapter = screen.getByRole("button", {
      name: "查看：てください / てもいい / てはいけない"
    });
    expect(patternChapter.textContent).not.toContain("參考");

    await user.click(patternChapter);
    expect(
      screen.getByText(/上方按鈕直接練本章句型判斷.*前置「て形」音便/)
    ).toBeInTheDocument();
  });

  it("renders a soft '建議先看' hint on chapters whose prereqs are incomplete", async () => {
    // Empty progress: 必要過去's three prereqs (adverbial / negative /
    // teTa) are all incomplete. The chapter-list subtitle should show
    // the hint instead of the block's default subtitle. The hint is
    // informational only -- the chapter itself is still openable and
    // the drill CTA still renders (covered by the next test).
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    const obligationButton = screen.getByRole("button", { name: "查看：必要過去" });
    expect(obligationButton.textContent).toContain("建議先看");
    expect(obligationButton.textContent).toContain("先分清楚く / に");
    expect(obligationButton).toBeEnabled();
  });

  it("starts an obligation past drill from the learning guide without prereqs", async () => {
    // No seedProgress -- with the unlock gate removed, 必要過去 must be
    // drillable cold. (Previously this required seeded prereq progress
    // and the drill was hidden otherwise.)
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "查看：必要過去" }));
    await user.click(screen.getAllByRole("button", { name: "練必要過去" })[0]);

    expect(screen.getByRole("button", { name: "必要過去" })).toHaveClass("selected");
    expect(screen.getByText("学生")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "学生にならなければならなかった" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("必要過去・なければならなかった")).toBeInTheDocument();
  });

  it("runs review as a finite pass and shows a completion screen (no infinite loop)", async () => {
    // Seed one wrong attempt on a real exam question so it's due in the
    // SRS review queue (box 0, due immediately).
    localStorage.setItem(
      "jabiko:attempts",
      JSON.stringify([
        {
          questionId: "n1-grammar-yainaya",
          vocabularyId: "n1-grammar-yainaya",
          targetForm: "meaning",
          prompt: "seed",
          expectedAnswers: ["や否や"],
          submittedAnswer: "x",
          isCorrect: false,
          timestamp: 1000,
          responseTimeMs: 100
        }
      ])
    );

    const user = userEvent.setup();
    render(<App />);

    // Home banner surfaces the due item; clicking it enters review mode.
    await user.click(screen.getByRole("button", { name: /等待複習/ }));

    // The single due question renders; answer it, then advance.
    expect(screen.getByRole("button", { name: "や否や" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "や否や" }));
    await user.click(screen.getByRole("button", { name: "下一題" }));

    // Finite pass -> completion screen, NOT a wrapped-around next question.
    expect(screen.getByRole("heading", { name: "複習完成！" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "や否や" })).not.toBeInTheDocument();
  });

  it("does not leak the answer in the pre-answer vocab row of an exam item", async () => {
    // n1-grammar-yainaya: surface や否や (== the answer), reading やいなや.
    // The old ExamPrompt rendered "surface・reading・meaning" pre-answer,
    // handing over the answer. Now that row is suppressed for items
    // whose surface/reading IS an expected answer.
    localStorage.setItem(
      "jabiko:attempts",
      JSON.stringify([
        {
          questionId: "n1-grammar-yainaya",
          vocabularyId: "n1-grammar-yainaya",
          targetForm: "meaning",
          prompt: "seed",
          expectedAnswers: ["や否や"],
          submittedAnswer: "x",
          isCorrect: false,
          timestamp: 1000,
          responseTimeMs: 100
        }
      ])
    );

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /等待複習/ }));

    // The answer is offered as a choice...
    expect(screen.getByRole("button", { name: "や否や" })).toBeInTheDocument();
    // ...but the reading row that used to spell it out is gone.
    expect(screen.queryByText(/やいなや/)).not.toBeInTheDocument();
  });

  it("gates the home 今日練習 CTA on a level choice, then auto-continues (#532)", async () => {
    const user = userEvent.setup();
    render(<App />);

    // A brand-new visitor taps the CTA with no level chosen: the session
    // must NOT start (the old behaviour fell back to the N1/N2-heavy "all"
    // pool). Instead the level ask appears...
    await user.click(screen.getByRole("button", { name: /開始今日練習/ }));
    expect(screen.queryByRole("region", { name: "目前題目" })).not.toBeInTheDocument();
    expect(screen.getByText(/先選擇你的程度/)).toBeInTheDocument();

    // ...and answering it continues straight into the daily session.
    await user.click(screen.getByRole("button", { name: /^初級N4・N5$/ }));
    await screen.findByRole("region", { name: "目前題目" });
    expect(screen.getByRole("button", { name: /今日練習/ })).toHaveClass("selected");
  });

  it("starts a 今日練習 session directly when a level is already set", async () => {
    localStorage.setItem("jabiko:targetLevel", "n2n3");
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /開始今日練習/ }));

    await screen.findByRole("region", { name: "目前題目" });
    expect(screen.getByRole("button", { name: /今日練習/ })).toHaveClass("selected");
  });

  it("完全新手 onboarding: enables furigana and lands on the 入門 chapters (#532)", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(localStorage.getItem("jabiko.furigana")).toBeNull();
    await user.click(screen.getByRole("button", { name: /完全新手/ }));

    // Preference persisted, furigana forced on for the beginner...
    expect(localStorage.getItem("jabiko:targetLevel")).toBe("starter");
    expect(localStorage.getItem("jabiko.furigana")).toBe("on");
    expect(screen.getByRole("button", { name: "隱藏註音" })).toHaveAttribute("aria-pressed", "true");
    // ...and the app lands on Learn, whose default-active chapter for a
    // fresh history is 五十音・平假名.
    expect(screen.getByRole("heading", { name: "一章一章解鎖" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "五十音・平假名" }).length).toBeGreaterThan(0);
  });

  it("gate -> 完全新手: honours the practice intent (starter daily, furigana on) (#532)", async () => {
    // Combined path: a brand-new visitor taps the daily CTA FIRST (gated),
    // THEN answers with 完全新手. The pick must continue into the starter
    // daily session -- they asked to practise, and the starter daily serves
    // 入門 questions -- NOT detour to the chapter list. Furigana still
    // turns on. (The learn-landing applies to the non-gated card path.)
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /開始今日練習/ }));
    await user.click(screen.getByRole("button", { name: /完全新手/ }));

    const panel = await screen.findByRole("region", { name: "目前題目" });
    expect(panel.getAttribute("data-question-id")).toMatch(/^(kana-|starter-)/);
    expect(localStorage.getItem("jabiko.furigana")).toBe("on");
    expect(localStorage.getItem("jabiko:targetLevel")).toBe("starter");
  });

  it("level-aware 背 card: a starter learner lands in the 基礎詞彙 drill, not N1/N2 readings", async () => {
    localStorage.setItem("jabiko:targetLevel", "starter");
    const user = userEvent.setup();
    render(<App />);

    // The card's sub-copy is unique to it (the 下一步 banner also mentions
    // 基礎詞彙, so the title alone would be ambiguous).
    await user.click(screen.getByRole("button", { name: /看詞選意思/ }));
    const panel = await screen.findByRole("region", { name: "目前題目" });
    expect(panel.getAttribute("data-question-id")).toMatch(/^starter-/);
  });

  it("level-aware 下一步 banner: a fresh n4n5 learner is offered their 備考 pool", async () => {
    localStorage.setItem("jabiko:targetLevel", "n4n5");
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /開始 N4＋N5 備考/ }));
    await screen.findByRole("region", { name: "目前題目" });
    // Lands in exam mode with the N4 備考 preset active.
    expect(screen.getByRole("button", { name: /N4 備考/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("完全新手 daily session serves 入門 content, not exam items (#532)", async () => {
    localStorage.setItem("jabiko:targetLevel", "starter");
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /開始今日練習/ }));
    const panel = await screen.findByRole("region", { name: "目前題目" });
    // Every question in a starter daily comes from the kana / starter pools.
    expect(panel.getAttribute("data-question-id")).toMatch(/^(kana-|starter-)/);
  });

  it("mock exam is a section picker that launches a filtered exam drill", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "題型練習" }));

    // Section cards from the N2 blueprint render; the grammar section has
    // items, so its card is enabled and clickable.
    const grammarCard = screen.getByRole("button", { name: /文の文法 1/ });
    await user.click(grammarCard);

    // Lands in the challenge drill, exam mode filtered to that section
    // (prompt-header shows the section's promptLabel).
    expect(
      within(screen.getByRole("region", { name: "目前題目" })).getByText("文法形式選擇")
    ).toBeInTheDocument();
  });

  it("starts the challenge from the learning path", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    // Default landing is now 今日練習 (#340); switch to 基礎變化 for the
    // conjugation-drill assertions below.
    await user.click(screen.getByRole("button", { name: /基礎變化/ }));

    expect(screen.getByText("練習重點")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "否定整理" })).toBeInTheDocument();
    expect(screen.getByText("書く")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "書いて" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("て形")).toBeInTheDocument();
  });

  it("shows success feedback when the learner picks a correct choice", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    // Default landing is now 今日練習 (#340); switch to 基礎變化 for the
    // conjugation-drill assertions below.
    await user.click(screen.getByRole("button", { name: /基礎變化/ }));
    await user.click(screen.getByRole("button", { name: "書いて" }));

    expect(screen.getByRole("heading", { name: "正解" })).toBeInTheDocument();
  });

  it("keeps the current question on screen after answering (no mid-attempt reshuffle)", async () => {
    // Regression: progressAttempts changes used to cascade through
    // reviewQueue into the questions useMemo deps, reshuffling the
    // pool on every answer. The user saw "答題後跳下一題、不能答、
    // 解析還在；按下一題又跳一題". After the fix, currentQuestion
    // stays put until the learner explicitly hits 下一題.
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    // Default landing is now 今日練習 (#340); switch to 基礎變化 for the
    // conjugation-drill assertions below.
    await user.click(screen.getByRole("button", { name: /基礎變化/ }));

    // Default first question in basic mode is 書く -> て形.
    expect(screen.getByText("書く")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "書いて" }));

    // Feedback overlays, the question itself is unchanged.
    expect(screen.getByRole("heading", { name: "正解" })).toBeInTheDocument();
    expect(screen.getByText("書く")).toBeInTheDocument();

    // Only after explicit advance does the question change.
    await user.click(screen.getByRole("button", { name: "下一題" }));
    expect(screen.queryByRole("heading", { name: "正解" })).not.toBeInTheDocument();
    // Next question per the te-form shuffle is 聞く (matches existing
    // "moves to the next question with Enter" test below).
    expect(screen.getByText("聞く")).toBeInTheDocument();
  });

  it("shows the accepted answer and explanation when the learner picks a wrong choice", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    // Default landing is now 今日練習 (#340); switch to 基礎變化 for the
    // conjugation-drill assertions below.
    await user.click(screen.getByRole("button", { name: /基礎變化/ }));
    await user.click(screen.getByRole("button", { name: "書って" }));

    expect(screen.getByText("再想一下")).toBeInTheDocument();
    expect(screen.getByText("正解：書いて")).toBeInTheDocument();
    expect(screen.getByText(/一類動詞/)).toBeInTheDocument();
  });

  it("adds missed questions to the review panel", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    // Default landing is now 今日練習 (#340); switch to 基礎變化 for the
    // conjugation-drill assertions below.
    await user.click(screen.getByRole("button", { name: /基礎變化/ }));
    await user.click(screen.getByRole("button", { name: "書って" }));

    expect(screen.getByRole("heading", { name: "錯題複習" })).toBeInTheDocument();
    expect(screen.getByText("書く -> て形")).toBeInTheDocument();
  });

  it("moves to the next question with Enter after feedback", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    // Default landing is now 今日練習 (#340); switch to 基礎變化 for the
    // conjugation-drill assertions below.
    await user.click(screen.getByRole("button", { name: /基礎變化/ }));
    await user.click(screen.getByRole("button", { name: "書いて" }));
    await user.keyboard("{Enter}");

    expect(screen.getByText("聞く")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "聞いて" })).toBeInTheDocument();
  });

  it("answers the MCQ drill with the matching number key (1-4)", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    // Default landing is now 今日練習 (#340); switch to 基礎變化 for the
    // conjugation-drill assertions below.
    await user.click(screen.getByRole("button", { name: /基礎變化/ }));

    // Options are shuffled, so find 書いて's slot and press its 1-based
    // position. The number key must select AND submit that option, even
    // with focus outside the drill (a global, focus-independent shortcut).
    const grid = screen.getByLabelText("答案選項");
    const options = within(grid).getAllByRole("button");
    const correctSlot = options.findIndex((button) => button.textContent === "書いて");
    expect(correctSlot).toBeGreaterThanOrEqual(0);

    await user.keyboard(String(correctSlot + 1));

    expect(screen.getByRole("heading", { name: "正解" })).toBeInTheDocument();
  });

  it("ignores a number key past the option count", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    // Default landing is now 今日練習 (#340); switch to 基礎變化 for the
    // conjugation-drill assertions below.
    await user.click(screen.getByRole("button", { name: /基礎變化/ }));

    // Only 4 options exist; pressing 9 must not submit anything.
    await user.keyboard("9");

    expect(screen.queryByRole("heading", { name: "正解" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "再想一下" })).not.toBeInTheDocument();
  });

  it("lets the learner focus on negative transformations", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    // Default landing is now 今日練習 (#340); switch to 基礎變化 for the
    // conjugation-drill assertions below.
    await user.click(screen.getByRole("button", { name: /基礎變化/ }));
    await user.click(screen.getByRole("button", { name: "否定整理" }));

    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("ない形")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "下一題" }));

    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("否定て形・ないで")).toBeInTheDocument();
  });

  it("lets the learner practice noun-like transformations", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoLearn(user);
    await user.click(screen.getByRole("button", { name: "開始挑戰" }));
    // Default landing is now 今日練習 (#340); switch to 基礎變化 for the
    // conjugation-drill assertions below.
    await user.click(screen.getByRole("button", { name: /基礎變化/ }));
    await user.click(screen.getByRole("button", { name: "名詞" }));

    expect(screen.getByText("学生")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "目前題目" })).getByText("普通形・非過去否定")).toBeInTheDocument();
  });

  it("defaults to light theme and stores a dark preference when toggled", async () => {
    // First-time default switched from dark to light when the wafuu
    // paper palette landed. Dark theme is still selectable via the
    // toggle, and explicit localStorage preferences (covered by the
    // two tests below) override the default in either direction.
    const user = userEvent.setup();
    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "深色模式" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "深色模式" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("jabiko.theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "淺色模式" })).toBeInTheDocument();
  });

  it("loads the stored dark theme preference", () => {
    localStorage.setItem("jabiko.theme", "dark");

    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("button", { name: "淺色模式" })).toBeInTheDocument();
  });

  it("loads the stored light theme preference", () => {
    localStorage.setItem("jabiko.theme", "light");

    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "深色模式" })).toBeInTheDocument();
  });

  it("defaults furigana OFF and stores an ON preference when toggled (#134)", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Default off (realistic exam condition): the button invites turning it on.
    const toggle = screen.getByRole("button", { name: "顯示註音" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);

    expect(screen.getByRole("button", { name: "隱藏註音" })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("jabiko.furigana")).toBe("on");
  });

  it("loads a stored furigana ON preference (#134)", () => {
    localStorage.setItem("jabiko.furigana", "on");

    render(<App />);

    expect(screen.getByRole("button", { name: "隱藏註音" })).toHaveAttribute("aria-pressed", "true");
  });

  it("renders the language switcher with the shipped locales (#299)", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: "首頁" })).toBeInTheDocument();

    // Language switcher is now a pill button that opens the LanguagePicker.
    const switcher = screen.getByRole("button", { name: "切換語言" });
    expect(switcher).toBeInTheDocument();
    expect(switcher).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.getByText("繁體中文")).toBeInTheDocument();
  });

  it("restores a drill from a /challenge?mode= deep link (#264)", async () => {
    window.history.replaceState({}, "", "/challenge?mode=vocab");
    render(<App />);

    // The challenge mounts with 単字讀音 (vocab) preselected from the URL,
    // not the default 今日練習 landing — proving the deep link was applied.
    const vocabCard = await screen.findByRole("button", { name: /単字讀音/ });
    expect(vocabCard).toHaveAttribute("aria-pressed", "true");

    window.history.replaceState({}, "", "/");
  });

  it("a grammar page's 開始挑戰 starts 今日練習, not 基礎變化 (#340)", async () => {
    const { allGrammarSurfaces } = await import("./domain/grammarPoints");
    const surface = allGrammarSurfaces()[0];
    window.history.replaceState({}, "", `/grammar/${encodeURIComponent(surface)}`);
    const user = userEvent.setup();
    render(<App />);

    // The page renders (route works) and its practice CTA drops into the
    // guided 今日練習 session, not the raw 基礎變化 cascade.
    await user.click(await screen.findByRole("button", { name: "開始挑戰" }));
    expect(await screen.findByRole("button", { name: /今日練習/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    window.history.replaceState({}, "", "/");
  });

  it("lists 綜合考題庫 / N1 備考 / N2 備考 as side-by-side mode presets", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "挑戰" }));
    await screen.findByRole("region", { name: "目前題目" });

    // The exam pool's level ranges are now first-class mode cards, not an
    // in-mode "題庫範圍" segmented filter.
    const exam = screen.getByRole("button", { name: /綜合考題庫/ });
    const n1 = screen.getByRole("button", { name: /N1 備考/ });
    const n2 = screen.getByRole("button", { name: /N2 備考/ });
    const n3 = screen.getByRole("button", { name: /N3 備考/ });
    expect(exam).toBeInTheDocument();
    expect(n1).toBeInTheDocument();
    expect(n2).toBeInTheDocument();
    expect(n3).toBeInTheDocument();
    expect(screen.queryByText("題庫範圍")).toBeNull();

    // Picking N2 備考 activates it (exam mode + N2+N3 range) and deselects
    // 綜合. The pool actually narrowing to N2/N3 is covered by
    // levelRange.test.ts (buildExamQuestionPool(["N2","N3"]) excludes N1).
    await user.click(n2);
    expect(n2).toHaveAttribute("aria-pressed", "true");
    expect(exam).toHaveAttribute("aria-pressed", "false");
    // The active-mode summary reflects the picked preset's copy (examN2
    // 「N2＋N3 綜合題」), not the generic 綜合 text -- so that copy now
    // appears on BOTH the N2 備考 card and the summary (>= 2 occurrences).
    expect(screen.getAllByText(/N2＋N3 綜合題/).length).toBeGreaterThanOrEqual(2);

    // The new N3 備考 (N3+N4) preset (#195 follow-up) activates the same way.
    await user.click(n3);
    expect(n3).toHaveAttribute("aria-pressed", "true");
    expect(n2).toHaveAttribute("aria-pressed", "false");
    expect(screen.getAllByText(/N3＋N4 綜合題/).length).toBeGreaterThanOrEqual(2);
  });

  it("opens 今日練習 by default when entering the challenge tab", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "挑戰" }));
    await screen.findByRole("region", { name: "目前題目" });

    // Entering the challenge tab lands on the guided 今日練習 mixed session,
    // not the raw 基礎變化 setup cascade, so the learner is practising on
    // arrival rather than configuring four selectors first.
    expect(screen.getByRole("button", { name: /今日練習/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /基礎變化/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows accuracy in the 今日戰報 stats block, not on the 錯題複習 heading", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "挑戰" }));
    await screen.findByRole("region", { name: "目前題目" });

    // Accuracy is a labelled value with a progress bar, both owned by the
    // 今日戰報 block (now sitting atop the right-hand 錯題複習 column).
    const scoreReport = screen.getByLabelText("今日戰報");
    expect(within(scoreReport).getByText("目前正解率")).toBeInTheDocument();
    expect(within(scoreReport).getByRole("progressbar")).toBeInTheDocument();

    // The 錯題複習 heading itself still does not carry the percentage
    // (which previously read as a mistake-list count).
    const reviewHeading = screen.getByRole("heading", { name: "錯題複習" });
    expect(reviewHeading.textContent ?? "").not.toMatch(/%/);
  });

  it("opens the 漢字音読み table and shows example words for a kanji", async () => {
    const user = userEvent.setup();
    render(<App />);

    await gotoResource(user, "漢字");

    // The table renders, grouped by homophone family.
    expect(await screen.findByRole("heading", { name: /漢字音読み/ })).toBeInTheDocument();
    // The full table now spans N5–N1 (#195), so narrow with the search box
    // before locating the cell -- keeps the accessible-name scan small/fast.
    await user.type(screen.getByRole("searchbox"), "解");
    // Tap the 解 kanji cell -> its example words (from the vocab bank) show.
    await user.click(screen.getByRole("button", { name: /解.*かい/s }));
    expect(screen.getByText("例詞")).toBeInTheDocument();
    // 解決's reading is unique to the example row (its surface 解決 also
    // shows as its own meaningZh, so assert on the reading instead).
    expect(screen.getByText("かいけつ")).toBeInTheDocument();
  });

  it("exposes data-selected and data-result on choice buttons after answering", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "挑戰" }));
    await screen.findByRole("region", { name: "目前題目" });

    const grid = screen.getByLabelText("答案選項");
    const options = within(grid).getAllByRole("button");
    // Nothing flagged before answering.
    options.forEach((button) => {
      expect(button).not.toHaveAttribute("data-selected");
      expect(button).not.toHaveAttribute("data-result");
    });

    await user.click(options[0]);

    // Exactly one button carries data-selected="true" -- the one picked.
    const selected = grid.querySelectorAll('[data-selected="true"]');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toBe(options[0]);

    // The picked button gets a result. If wrong, the correct answer is
    // flagged target; if correct, there is no target.
    const result = options[0].getAttribute("data-result");
    expect(["correct", "wrong"]).toContain(result);
    if (result === "wrong") {
      const target = grid.querySelector('[data-result="target"]');
      expect(target).not.toBeNull();
      expect(target).not.toBe(options[0]);
    } else {
      expect(grid.querySelector('[data-result="target"]')).toBeNull();
    }
  });

  it("flags the correct answer with data-result=target when revealed", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "挑戰" }));
    await screen.findByRole("region", { name: "目前題目" });

    await user.click(screen.getByRole("button", { name: "看答案" }));

    const grid = screen.getByLabelText("答案選項");
    // Revealing flags the correct answer(s) as target, with nothing selected.
    expect(grid.querySelectorAll('[data-result="target"]').length).toBeGreaterThanOrEqual(1);
    expect(grid.querySelector('[data-selected="true"]')).toBeNull();
  });

  it("exposes the whole answer state on the drill container for embedded AI", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "挑戰" }));
    const panel = await screen.findByRole("region", { name: "目前題目" });

    // Before answering: unanswered, with no selection / expected answer leaked.
    expect(panel).toHaveAttribute("data-result", "unanswered");
    expect(panel).not.toHaveAttribute("data-selected");
    expect(panel).not.toHaveAttribute("data-expected-answer");
    expect(panel).toHaveAttribute("data-question-id");

    const grid = screen.getByLabelText("答案選項");
    const options = within(grid).getAllByRole("button");
    await user.click(options[0]);

    // After answering: the container summarises selection + result + answer.
    expect(panel).toHaveAttribute("data-selected", options[0].textContent ?? "");
    expect(["correct", "wrong"]).toContain(panel.getAttribute("data-result"));
    expect(panel).toHaveAttribute("data-expected-answer");
  });

  it("marks the drill container revealed (no selection) after 看答案", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "挑戰" }));
    const panel = await screen.findByRole("region", { name: "目前題目" });

    await user.click(screen.getByRole("button", { name: "看答案" }));

    // Revealing sets result=revealed, exposes the answer, with no selection.
    expect(panel).toHaveAttribute("data-result", "revealed");
    expect(panel).not.toHaveAttribute("data-selected");
    expect(panel).toHaveAttribute("data-expected-answer");
  });

  it("navigates to JLPT level grammar routes", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Click the Grammar nav button to open the grammar index overview
    await user.click(screen.getByRole("button", { name: "文型" }));

    // GrammarIndexPage is lazy-loaded; wait for the overview heading
    expect(
      await screen.findByRole("heading", { name: "JLPT 文型資料庫" }, { timeout: 10000 })
    ).toBeInTheDocument();

    // Programmatically navigate to /grammar/n5 and trigger popstate
    // so App's popstate handler reads the new route and sets grammarSurface="n5"
    window.history.replaceState({}, "", "/grammar/n5");
    window.dispatchEvent(new PopStateEvent("popstate"));

    // The level-specific view renders with heading "JLPT N5 文型"
    expect(
      await screen.findByRole("heading", { name: "JLPT N5 文型" }, { timeout: 10000 })
    ).toBeInTheDocument();

    window.history.replaceState({}, "", "/");
  });

  it("shows the grammar-pattern database browse UI for all locales (#438/#427)", async () => {
    // The database cards render meaningZh/formation as raw Chinese, so the
    // browse UI is hidden for non-zh locales until its i18n overlay lands.
    // However, the grammar index is now available in all locales.
    localStorage.setItem("jabiko.lang", "en"); // must be set before App mounts
    render(<App />);

    // The 文型 (Grammar) index nav entry is now offered in English.
    expect(screen.getByRole("button", { name: "Grammar" })).toBeInTheDocument();

    // A direct /grammar URL now shows the grammar index (in English) instead of redirecting home.
    window.history.replaceState({}, "", "/grammar");
    window.dispatchEvent(new PopStateEvent("popstate"));
    // Wait for the grammar index heading (which is now in English: "JLPT Grammar Pattern Database")
    expect(
      await screen.findByRole("heading", { name: "JLPT Grammar Pattern Database" }, { timeout: 10000 })
    ).toBeInTheDocument();

    // We can also check that we are still on /grammar
    expect(window.location.pathname).toBe("/grammar");

    // Reset
    window.history.replaceState({}, "", "/");
  });









  it("navigates to secondary views through the nav's 更多 menu (#608)", async () => {
    const user = userEvent.setup();
    render(<App />);

    const nav = screen.getByRole("navigation", { name: "學習流程" });
    const trigger = within(nav).getByRole("button", { name: "更多" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    const menu = screen.getByRole("menu", { name: "更多" });
    // Secondary views first, then the header tools below the divider.
    for (const label of ["規則表", "漢字", "關於"]) {
      expect(within(menu).getByRole("menuitem", { name: label })).toBeInTheDocument();
    }
    expect(within(menu).getByRole("menuitemcheckbox", { name: /註音/ })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: /色模式/ })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "意見回饋" })).toBeInTheDocument();

    await user.click(within(menu).getByRole("menuitem", { name: "關於" }));
    expect(screen.queryByRole("menu", { name: "更多" })).not.toBeInTheDocument();
    // Same navigation contract as the plain nav button: URL + aria-current.
    expect(window.location.pathname).toBe("/about");
    expect(within(nav).getByRole("button", { name: "資源（目前：關於）" })).toHaveClass("selected");
    // The collapsed trigger carries the current location while a folded view
    // is active (PR #628 review).
    const selectedTrigger = within(nav).getByRole("button", { name: "更多（目前：關於）" });
    expect(selectedTrigger.className).toContain("selected");

    window.history.replaceState({}, "", "/");
  });


  it("opens the feedback form from a persistent header button (any view, #456)", async () => {
    const user = userEvent.setup();
    render(<App />);
    // The feedback entry lives in the always-visible header, not just the
    // homepage footer, so it's reachable from anywhere.
    await user.click(screen.getByRole("button", { name: "意見回饋" }));
    expect(await screen.findByRole("dialog", { name: "意見回饋" })).toBeInTheDocument();
  });

  // ---- Delete practice history (#693) --------------------------------------
  // Wired into the signed-in account entries (desktop heading-auth action +
  // mobile 更多 menu), both opening ONE shared dialog. The deletion protocol
  // itself is covered by useProgressAttempts.test.tsx; these integration tests
  // pin the UI contract: entries render only when signed in, the first click
  // never fires the delete, the checkbox gates confirm, success closes with a
  // readable status + focus return, failure keeps the dialog with a retryable
  // error, and nothing outside the practice history is touched.
  const signedInUser = {
    id: "user-693",
    email: "test@example.com",
    user_metadata: { full_name: "花雪" }
  };
  // A wrong answer that seeds box-0 (the review pool) -- the same shape the
  // real attempt store persists.
  const mistakeAttempt: Attempt = {
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

  it("signed out: neither desktop nor mobile renders the delete entry (#693)", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Desktop heading-auth block is absent entirely (Supabase unconfigured),
    // so no delete action can exist.
    expect(screen.queryByRole("button", { name: "刪除練習紀錄" })).not.toBeInTheDocument();

    // Mobile 更多 menu: auth section absent -> no delete entry either.
    await user.click(screen.getByRole("button", { name: "更多" }));
    expect(
      within(screen.getByRole("menu", { name: "更多" })).queryByRole("menuitem", {
        name: "刪除練習紀錄"
      })
    ).not.toBeInTheDocument();
  });

  it("signed in: desktop entry opens the shared dialog; first click fires zero deletes (#693)", async () => {
    deletionTest.active = true;
    deletionTest.user = signedInUser;
    const user = userEvent.setup();
    render(<App />);

    // Desktop heading-auth action under the sign-out row.
    const desktopEntry = screen.getByRole("button", { name: "刪除練習紀錄" });
    await user.click(desktopEntry);

    const dialog = screen.getByRole("dialog", { name: "刪除練習紀錄" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    // Opening the dialog must NOT start the deletion protocol.
    expect(deletionTest.deleteRemoteCalls).toBe(0);
    // Double-confirm: confirm disabled until the checkbox is ticked.
    expect(screen.getByRole("button", { name: "刪除" })).toBeDisabled();
  });

  it("signed in: confirm fires the protocol once, on success closes, shows status, clears review count, returns focus (#693)", async () => {
    deletionTest.active = true;
    deletionTest.user = signedInUser;
    // Seed the persistent attempt store with a wrong answer (box-0 review item).
    localStorage.setItem("jabiko:attempts", JSON.stringify([mistakeAttempt]));
    const user = userEvent.setup();
    render(<App />);

    // A wrong answer in the store -> the home review banner shows a count.
    expect(screen.getByRole("button", { name: /等待複習/ })).toBeInTheDocument();

    const desktopEntry = screen.getByRole("button", { name: "刪除練習紀錄" });
    await user.click(desktopEntry);
    await user.click(screen.getByRole("checkbox", { name: "我了解此操作不可復原" }));
    await user.click(screen.getByRole("button", { name: "刪除" }));

    // Remote delete ran exactly once, then the dialog closed on success.
    await waitFor(() => expect(deletionTest.deleteRemoteCalls).toBe(1));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "刪除練習紀錄" })).not.toBeInTheDocument()
    );
    // Honest success status is readable (aria-live), and the review count is
    // gone (the protocol cleared attempts -> no more 等待複習 banner).
    expect(screen.getByRole("status")).toHaveTextContent("練習紀錄已刪除");
    expect(screen.queryByRole("button", { name: /等待複習/ })).not.toBeInTheDocument();
    // Focus returned to the original desktop trigger.
    expect(desktopEntry).toHaveFocus();
  });

  it("signed in: a failed delete keeps the dialog, shows a retryable error, clears nothing (#693)", async () => {
    deletionTest.active = true;
    deletionTest.user = signedInUser;
    deletionTest.deleteRemoteResult = { ok: false, message: "remote fail" };
    localStorage.setItem("jabiko:attempts", JSON.stringify([mistakeAttempt]));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "刪除練習紀錄" }));
    await user.click(screen.getByRole("checkbox", { name: "我了解此操作不可復原" }));
    await user.click(screen.getByRole("button", { name: "刪除" }));

    // Dialog stays open with a retryable error; no success status anywhere.
    expect(screen.getByRole("dialog", { name: "刪除練習紀錄" })).toBeInTheDocument();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("刪除失敗，請再試一次。");
    expect(screen.queryByText("練習紀錄已刪除")).not.toBeInTheDocument();
    // The UI attempts were NOT cleared (the review banner still shows a count).
    expect(screen.getByRole("button", { name: /等待複習/ })).toBeInTheDocument();
    // Retry is possible.
    expect(screen.getByRole("button", { name: "刪除" })).toBeEnabled();
  });

  it("signed in: cancel closes without side effects and returns focus (#693)", async () => {
    deletionTest.active = true;
    deletionTest.user = signedInUser;
    const user = userEvent.setup();
    render(<App />);

    const desktopEntry = screen.getByRole("button", { name: "刪除練習紀錄" });
    await user.click(desktopEntry);
    expect(deletionTest.deleteRemoteCalls).toBe(0);
    await user.click(screen.getByRole("button", { name: "取消" }));

    expect(screen.queryByRole("dialog", { name: "刪除練習紀錄" })).not.toBeInTheDocument();
    expect(deletionTest.deleteRemoteCalls).toBe(0);
    expect(screen.queryByText("練習紀錄已刪除")).not.toBeInTheDocument();
    expect(desktopEntry).toHaveFocus();
  });

  it("sign-out clears deletion UI so the same account cannot revive stale state", async () => {
    deletionTest.active = true;
    deletionTest.user = signedInUser;
    const user = userEvent.setup();
    const { rerender } = render(<App />);

    await user.click(screen.getByRole("button", { name: "刪除練習紀錄" }));
    expect(screen.getByRole("dialog", { name: "刪除練習紀錄" })).toBeInTheDocument();

    deletionTest.user = null;
    rerender(<App />);
    expect(screen.queryByRole("dialog", { name: "刪除練習紀錄" })).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    deletionTest.user = signedInUser;
    rerender(<App />);
    expect(screen.getByRole("button", { name: "刪除練習紀錄" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "刪除練習紀錄" })).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("signed in: the mobile 更多 entry opens the SAME dialog instance (#693)", async () => {
    deletionTest.active = true;
    deletionTest.user = signedInUser;
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "更多" }));
    const menuEntry = screen.getByRole("menuitem", { name: "刪除練習紀錄" });
    await user.click(menuEntry);

    // Exactly one dialog (shared instance), and the menu has closed first.
    expect(screen.getAllByRole("dialog", { name: "刪除練習紀錄" })).toHaveLength(1);
    expect(screen.queryByRole("menu", { name: "更多" })).not.toBeInTheDocument();
    expect(deletionTest.deleteRemoteCalls).toBe(0);
  });

  it("signed in: cancel from the mobile entry returns focus to the 更多 trigger (#693)", async () => {
    deletionTest.active = true;
    deletionTest.user = signedInUser;
    const user = userEvent.setup();
    render(<App />);

    const moreTrigger = screen.getByRole("button", { name: "更多" });
    await user.click(moreTrigger);
    await user.click(screen.getByRole("menuitem", { name: "刪除練習紀錄" }));
    await user.click(screen.getByRole("button", { name: "取消" }));

    expect(screen.queryByRole("dialog", { name: "刪除練習紀錄" })).not.toBeInTheDocument();
    expect(moreTrigger).toHaveFocus();
  });

  it("delete keeps bookmarks / language / theme / furigana / auth session intact (#693)", async () => {
    deletionTest.active = true;
    deletionTest.user = signedInUser;
    // Distinct preferences that must survive the delete. The language is set
    // to ja up front, so the whole UI (including the entry and dialog labels)
    // is Japanese -- proving the preference was read AND survived.
    localStorage.setItem("jabiko:attempts", JSON.stringify([mistakeAttempt]));
    localStorage.setItem("jabiko:bookmarks", JSON.stringify(["q1", "q2"]));
    localStorage.setItem("jabiko.lang", "ja");
    localStorage.setItem("jabiko.theme", "dark");
    localStorage.setItem("jabiko.furigana", "on");
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "練習履歴を削除" }));
    await user.click(screen.getByRole("checkbox", { name: "この操作は元に戻せないことを理解しています" }));
    await user.click(screen.getByRole("button", { name: "削除" }));
    await waitFor(() => expect(deletionTest.deleteRemoteCalls).toBe(1));

    // Attempts were cleared, but every other localStorage key survived.
    expect(screen.getByRole("status")).toHaveTextContent("練習履歴を削除しました");
    expect(localStorage.getItem("jabiko:bookmarks")).toBe(JSON.stringify(["q1", "q2"]));
    expect(localStorage.getItem("jabiko.lang")).toBe("ja");
    expect(localStorage.getItem("jabiko.theme")).toBe("dark");
    expect(localStorage.getItem("jabiko.furigana")).toBe("on");
    // The auth session is untouched: the signed-in entry is still rendered.
    expect(screen.getByRole("button", { name: "練習履歴を削除" })).toBeInTheDocument();
  });

  it("Escape closes the dialog with zero side effects (#693)", async () => {
    deletionTest.active = true;
    deletionTest.user = signedInUser;
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "刪除練習紀錄" }));
    expect(deletionTest.deleteRemoteCalls).toBe(0);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "刪除練習紀錄" })).not.toBeInTheDocument();
    expect(deletionTest.deleteRemoteCalls).toBe(0);
    expect(screen.queryByText("練習紀錄已刪除")).not.toBeInTheDocument();
  });

  it("StrictMode: confirm fires the protocol exactly once (#693)", async () => {
    const { StrictMode } = await import("react");
    deletionTest.active = true;
    deletionTest.user = signedInUser;
    const user = userEvent.setup();
    render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    await user.click(screen.getByRole("button", { name: "刪除練習紀錄" }));
    await user.click(screen.getByRole("checkbox", { name: "我了解此操作不可復原" }));
    await user.click(screen.getByRole("button", { name: "刪除" }));

    await waitFor(() => expect(deletionTest.deleteRemoteCalls).toBe(1));
    expect(screen.queryByRole("dialog", { name: "刪除練習紀錄" })).not.toBeInTheDocument();
  });

});
