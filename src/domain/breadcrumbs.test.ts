import { describe, expect, it } from "vitest";
import { buildBreadcrumbs, type BreadcrumbLabels } from "./breadcrumbs";
import { grammarRoute, parseRoute, serializeRoute, staticRoute } from "./routes";

const labels: BreadcrumbLabels = {
  nav: "目前位置",
  home: "首頁",
  learn: "學習",
  grammar: "文型",
  about: "關於",
  kanaTable: "五十音表",
  privacy: "隱私政策",
  terms: "使用條款"
};

describe("buildBreadcrumbs route hierarchy (#729)", () => {
  it("builds Home > Grammar > N5 for a grammar level route", () => {
    const model = buildBreadcrumbs(parseRoute("/grammar/n5"), labels);
    expect(model).not.toBeNull();
    expect(model!.label).toBe("目前位置");
    expect(model!.crumbs).toEqual([
      { route: staticRoute("home"), label: "首頁" },
      { route: grammarRoute(), label: "文型" },
      { route: null, label: "N5" }
    ]);
  });

  it("normalizes a lowercase level segment to the JLPT label", () => {
    const model = buildBreadcrumbs(parseRoute("/grammar/n4"), labels);
    expect(model!.crumbs[2]).toEqual({ route: null, label: "N4" });
  });

  it("builds Home > Grammar > <surface> for a grammar point route", () => {
    const model = buildBreadcrumbs(
      parseRoute("/grammar/%E3%80%9C%E3%81%A6%E3%82%82%E3%81%84%E3%81%84"),
      labels
    );
    expect(model!.crumbs).toEqual([
      { route: staticRoute("home"), label: "首頁" },
      { route: grammarRoute(), label: "文型" },
      { route: null, label: "〜てもいい", lang: "ja" }
    ]);
  });

  it("builds Home > Learn > Kana table for the kana route", () => {
    const model = buildBreadcrumbs(parseRoute("/kana"), labels);
    expect(model!.crumbs).toEqual([
      { route: staticRoute("home"), label: "首頁" },
      { route: staticRoute("learn"), label: "學習" },
      { route: null, label: "五十音表" }
    ]);
  });

  it("builds Home > About > Privacy for the privacy route", () => {
    const model = buildBreadcrumbs(parseRoute("/privacy"), labels);
    expect(model!.crumbs).toEqual([
      { route: staticRoute("home"), label: "首頁" },
      { route: staticRoute("about"), label: "關於" },
      { route: null, label: "隱私政策" }
    ]);
  });

  it("builds Home > About > Terms for the terms route", () => {
    const model = buildBreadcrumbs(parseRoute("/terms"), labels);
    expect(model!.crumbs).toEqual([
      { route: staticRoute("home"), label: "首頁" },
      { route: staticRoute("about"), label: "關於" },
      { route: null, label: "使用條款" }
    ]);
  });

  it("renders no breadcrumb for top-level routes", () => {
    for (const path of [
      "/",
      "/learn",
      "/rules",
      "/kanji",
      "/about",
      "/challenge",
      "/mock",
      "/stay-d",
      "/grammar"
    ]) {
      expect(buildBreadcrumbs(parseRoute(path), labels), path).toBeNull();
    }
  });

  it("only marks the final crumb as current", () => {
    const model = buildBreadcrumbs(parseRoute("/privacy"), labels);
    const current = model!.crumbs.filter((c) => c.route === null);
    expect(current).toHaveLength(1);
    expect(current[0].label).toBe("隱私政策");
  });

  it("keeps parent crumbs serializable to canonical paths", () => {
    const model = buildBreadcrumbs(parseRoute("/grammar/n5"), labels)!;
    const parentPaths = model.crumbs
      .filter((c) => c.route !== null)
      .map((c) => serializeRoute(c.route!));
    expect(parentPaths).toEqual(["/", "/grammar"]);
  });
});
