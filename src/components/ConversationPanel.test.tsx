import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ConversationPanel } from "./ConversationPanel";
import { copy } from "../i18n";
import { conversationSessionDefinitions } from "../domain/conversationFixtures";
import { commuteConversationDefinitions } from "../domain/conversationContent/commute";
import { foodConversationDefinitions } from "../domain/conversationContent/food";
import { hobbiesConversationDefinitions } from "../domain/conversationContent/hobbies";
import { schoolWorkConversationDefinitions } from "../domain/conversationContent/schoolWork";
import { weatherConversationDefinitions } from "../domain/conversationContent/weather";
import { weekendConversationDefinitions } from "../domain/conversationContent/weekend";

const t = copy["zh-Hant"];

function renderPanel(language: "zh-Hant" | "ja" | "en" = "zh-Hant") {
  const user = userEvent.setup();
  render(<ConversationPanel language={language} definitions={conversationSessionDefinitions} />);
  return user;
}

async function startScenario(
  user: ReturnType<typeof userEvent.setup>,
  lengthLabel: string
) {
  await user.click(screen.getByRole("button", { name: new RegExp(`^${lengthLabel}`) }));
  await user.click(screen.getByRole("button", { name: t.conversationStart }));
}

// The engine opens every scenario on its partner_line step: the learner must
// explicitly continue before the response choices appear.
async function reachResponses(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: t.conversationContinue }));
}

describe("ConversationPanel fixture selection (#814)", () => {
  it("uses the full 21-scene production and fixture catalog by default", () => {
    render(<ConversationPanel language="zh-Hant" />);

    expect(screen.getAllByRole("button")).toHaveLength(21);
    expect(screen.getByRole("button", { name: /早上通勤時/ })).toBeInTheDocument();
  });

  it("runs an authored production scene through its curated completion", async () => {
    const user = userEvent.setup();
    render(<ConversationPanel language="zh-Hant" />);

    await user.click(screen.getByRole("button", { name: /早上通勤時/ }));
    await user.click(screen.getByRole("button", { name: t.conversationStart }));
    expect(screen.getByText("今朝は気持ちのいい天気ですね。通勤中も少し楽です。")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t.conversationContinue }));
    await user.click(screen.getByRole("button", { name: /そうですね。どちらの駅から乗っていらっしゃるんですか？/ }));
    await user.click(screen.getByRole("button", { name: t.conversationContinue }));
    expect(screen.getByText("普段は桜町駅からこの路線に乗っています。この時間は車内も落ち着いていて、通勤しやすいですね。")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t.conversationContinue }));

    expect(screen.getByRole("heading", { name: t.conversationCompleteTitle })).toBeInTheDocument();
    expect(screen.getByText("你從天氣招呼自然開啟車站和路線話題，了解對方常用的車站。")).toBeInTheDocument();
  });

  it("translates every production descriptive role in all launched locales", () => {
    const productionDefinitions = [
      ...commuteConversationDefinitions,
      ...foodConversationDefinitions,
      ...hobbiesConversationDefinitions,
      ...schoolWorkConversationDefinitions,
      ...weatherConversationDefinitions,
      ...weekendConversationDefinitions
    ];
    const expected: Record<string, readonly [string, string, string]> = {
      "classmate": ["同學", "クラスメート", "classmate"],
      "classmate planning lunch with a visiting friend": ["正和來訪朋友規劃午餐的同學", "訪問中の友人と昼食を計画しているクラスメート", "classmate planning lunch with a visiting friend"],
      "classmate sharing a recent hobby": ["分享最近新興趣的同學", "最近始めた趣味を話すクラスメート", "classmate sharing a recent hobby"],
      "classmate who knows local lunch spots": ["熟悉附近午餐地點的同學", "近くのランチスポットに詳しいクラスメート", "classmate who knows local lunch spots"],
      "classmate who recently started knitting": ["最近開始編織的同學", "最近編み物を始めたクラスメート", "classmate who recently started knitting"],
      "community class participant": ["社區課程的學員", "地域講座の参加者", "community class participant"],
      "community event participant": ["社區活動參加者", "地域イベントの参加者", "community event participant"],
      "coworker": ["同事", "同僚", "coworker"],
      "coworker who commutes by train": ["搭電車通勤的同事", "電車通勤の同僚", "coworker who commutes by train"],
      "coworker who sometimes commutes by bicycle": ["偶爾騎腳踏車通勤的同事", "ときどき自転車通勤をする同僚", "coworker who sometimes commutes by bicycle"],
      "coworker who uses the Aoba Line": ["搭青葉線通勤的同事", "青葉線を使う同僚", "coworker who uses the Aoba Line"],
      "junior coworker": ["資淺同事", "職場の後輩", "junior coworker"],
      "local resident": ["當地居民", "地元住民", "local resident"],
      "member who is joining an ongoing hobby conversation": ["正加入既有興趣話題的成員", "続いている趣味の話に加わるメンバー", "member who is joining an ongoing hobby conversation"],
      "new acquaintance who enjoys hiking but has limited energy for trips": ["喜歡健行、但最近較沒心力遠行的新朋友", "ハイキングが好きだが、最近は遠出をする余裕が少ない知り合い", "new acquaintance who enjoys hiking but has limited energy for trips"],
      "new acquaintance who prefers nearby walks and photography": ["偏好附近散步與攝影的新朋友", "近場の散歩と写真を好む知り合い", "new acquaintance who prefers nearby walks and photography"],
      "new resident deciding how to commute": ["正在考慮通勤方式的新住民", "通勤方法を検討している新住民", "new resident deciding how to commute"],
      "photo club member sharing a hobby": ["分享興趣的攝影社成員", "趣味を話す写真サークルのメンバー", "photo club member sharing a hobby"],
      "senior coworker": ["資深同事", "職場の先輩", "senior coworker"],
      "student and classmate": ["學生兼同學", "学生でクラスメート", "student and classmate"],
      "student and seminar classmate": ["學生兼研討課同學", "学生でゼミのクラスメート", "student and seminar classmate"],
      "student with a part-time job": ["有打工的學生", "アルバイトをしている学生", "student with a part-time job"],
      "student working on reports": ["正在寫報告的學生", "レポートに取り組んでいる学生", "student working on reports"]
    };
    const roles = new Set(productionDefinitions.flatMap(({ scenario }) => [
      scenario.relationship.learnerRole,
      scenario.relationship.partnerRole
    ]));
    expect([...roles].sort()).toEqual(Object.keys(expected).sort());
    const languages = ["zh-Hant", "ja", "en"] as const;
    for (const [role, localized] of Object.entries(expected)) {
      languages.forEach((language, index) => {
        expect((copy[language].conversationRoles as Record<string, string>)[role]).toBe(localized[index]);
      });
    }
  });

  it.each([
    ["zh-Hant", "同事", "活動參加者"],
    ["ja", "同僚", "参加者"],
    ["en", "coworker", "participant"]
  ] as const)("localizes authored role values and updates them when selecting another scene in %s", async (
    language, coworker, participant
  ) => {
    const user = renderPanel(language);
    await user.click(screen.getByRole("button", {
      name: new RegExp(`^${copy[language].conversationLengths.short}`)
    }));
    expect(screen.getAllByText(coworker, { exact: true })).toHaveLength(2);
    await user.click(screen.getByRole("button", {
      name: new RegExp(`^${copy[language].conversationLengths.long}`)
    }));
    expect(screen.getAllByText(participant, { exact: true })).toHaveLength(2);
    expect(screen.queryByText(coworker, { exact: true })).not.toBeInTheDocument();
    if (language !== "en") {
      expect(screen.queryByText("participant", { exact: true })).not.toBeInTheDocument();
    }
  });

  it.each([
    ["zh-Hant", "你的角色", "對方的角色", "關係與語氣"],
    ["ja", "あなたの役割", "相手の役割", "関係と言葉遣い"],
    ["en", "Your role", "Partner's role", "Relationship and register"]
  ] as const)("shows roles and localized relationship before starting in %s", async (
    language, learnerLabel, partnerLabel, contextLabel
  ) => {
    const user = userEvent.setup();
    const definition = conversationSessionDefinitions[0];
    const relationship = {
      ...definition.scenario.relationship,
      learnerRole: "visitor",
      partnerRole: "host"
    };
    render(<ConversationPanel language={language} definitions={[{
      ...definition,
      scenario: { ...definition.scenario, relationship }
    }]} />);
    await user.click(screen.getByRole("button", {
      name: new RegExp(`^${copy[language].conversationLengths.short}`)
    }));

    expect(screen.getByText(learnerLabel).nextElementSibling).toHaveTextContent("visitor");
    expect(screen.getByText(partnerLabel).nextElementSibling).toHaveTextContent("host");
    const expectedContext = language === "zh-Hant"
      ? relationship.context.textZh
      : relationship.context.textI18n![language]!;
    expect(screen.getByText(contextLabel).nextElementSibling).toHaveTextContent(expectedContext);
    if (language !== "zh-Hant") {
      expect(screen.queryByText(relationship.context.textZh)).not.toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: copy[language].conversationStart })).toBeInTheDocument();
    expect(screen.queryByText("電車、遅れてるみたいですね。")).not.toBeInTheDocument();
  });

  it("offers exactly the three fixtures labelled short / medium / long", () => {
    renderPanel();
    for (const label of [
      t.conversationLengths.short,
      t.conversationLengths.medium,
      t.conversationLengths.long
    ]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${label}`) })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("starts the selected scenario and renders the partner line as Japanese", async () => {
    const user = renderPanel();
    await startScenario(user, t.conversationLengths.short);

    const partnerLine = screen.getByText("電車、遅れてるみたいですね。");
    expect(partnerLine).toHaveAttribute("lang", "ja");
    expect(screen.getByText(t.conversationPartnerLabel)).toBeInTheDocument();
  });
});

describe("ConversationPanel short fixture (#814)", () => {
  it("keeps keyboard focus in the current stage through feedback, retry and completion", async () => {
    const user = renderPanel();
    await startScenario(user, t.conversationLengths.short);
    await reachResponses(user);
    const response = screen.getByRole("button", { name: "そうですね。" });
    response.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("heading", { name: t.conversationFeedbackTitle })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: t.conversationRetry })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByText(t.conversationChooseResponse)).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "そうですね。" })).toHaveFocus();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: t.conversationFeedbackTitle })).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: t.conversationContinue })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: t.conversationCompleteTitle })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: t.conversationReset })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("電車、遅れてるみたいですね。")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: t.conversationContinue })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: t.conversationChangeScenario }));
    expect(screen.getByRole("heading", { name: t.conversationTitle })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: new RegExp(`^${t.conversationLengths.short}`) })).toHaveFocus();
  });

  it("shows curated feedback for a dead_end response and does not silently complete", async () => {
    const user = renderPanel();
    await startScenario(user, t.conversationLengths.short);
    await reachResponses(user);

    await user.click(screen.getByRole("button", { name: "そうですね。" }));

    expect(
      screen.getByRole("heading", { name: t.conversationFeedbackTitle })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t.conversationRetry })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: t.conversationCompleteTitle })
    ).not.toBeInTheDocument();
  });

  it("retry returns to the response choices and clears the feedback", async () => {
    const user = renderPanel();
    await startScenario(user, t.conversationLengths.short);
    await reachResponses(user);
    await user.click(screen.getByRole("button", { name: "そうですね。" }));

    await user.click(screen.getByRole("button", { name: t.conversationRetry }));

    expect(
      screen.queryByRole("heading", { name: t.conversationFeedbackTitle })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "あ、本当ですね。何かあったんですか？" })
    ).toBeInTheDocument();
  });

  it("continues from feedback into an explicit completion summary", async () => {
    const user = renderPanel();
    await startScenario(user, t.conversationLengths.short);
    await reachResponses(user);
    await user.click(
      screen.getByRole("button", { name: "あ、本当ですね。何かあったんですか？" })
    );
    await user.click(screen.getByRole("button", { name: t.conversationContinue }));

    expect(
      screen.getByRole("heading", { name: t.conversationCompleteTitle })
    ).toBeInTheDocument();
    expect(screen.getByText("完成短對話的反應與追問練習。")).toBeInTheDocument();
    expect(screen.getByText(t.conversationSummaryTitle)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(t.conversationPracticedLabel))).toBeInTheDocument();
  });

  it("retry + a stronger response reaches completion (the improve path)", async () => {
    const user = renderPanel();
    await startScenario(user, t.conversationLengths.short);
    await reachResponses(user);
    await user.click(screen.getByRole("button", { name: "そうですね。" }));

    await user.click(screen.getByRole("button", { name: t.conversationRetry }));
    await user.click(
      screen.getByRole("button", { name: "あ、本当ですね。何かあったんですか？" })
    );
    await user.click(screen.getByRole("button", { name: t.conversationContinue }));

    expect(
      screen.getByRole("heading", { name: t.conversationCompleteTitle })
    ).toBeInTheDocument();
  });
});

describe("ConversationPanel medium fixture (#814)", () => {
  it("traverses the finite graph, shows feedback each turn, and completes at the end", async () => {
    const user = renderPanel();
    await startScenario(user, t.conversationLengths.medium);

    expect(screen.getByText("お昼、何食べるか決めました？")).toBeInTheDocument();
    await reachResponses(user);

    // Turn 1: only the authored response exists -- no phantom Add/Ask choices.
    const firstResponse = screen.getByRole("button", {
      name: "まだです。今日は軽いものがいい気分です。"
    });
    expect(screen.queryByRole("button", { name: /どんなお店なんですか/ })).not.toBeInTheDocument();
    await user.click(firstResponse);
    expect(
      screen.getByRole("heading", { name: t.conversationFeedbackTitle })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: t.conversationCompleteTitle })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t.conversationContinue }));

    // Turn 2.
    await reachResponses(user);
    await user.click(
      screen.getByRole("button", { name: "知らなかったです。どんなお店なんですか？" })
    );
    expect(
      screen.getByRole("heading", { name: t.conversationFeedbackTitle })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t.conversationContinue }));

    // Turn 3.
    await reachResponses(user);
    await user.click(
      screen.getByRole("button", { name: "いいですね。じゃあ、十一時半ごろに行きませんか？" })
    );
    expect(
      screen.getByRole("heading", { name: t.conversationFeedbackTitle })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t.conversationContinue }));

    expect(
      screen.getByRole("heading", { name: t.conversationCompleteTitle })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: t.conversationChangeScenario })
    ).toHaveLength(1);
  });
});

describe("ConversationPanel long fixture (#814)", () => {
  const partnerLines = [
    "日本語を習い始めて、どのくらいですか？",
    "そうなんですね。漢字を覚えるのは大変じゃないですか？",
    "それはいい方法ですね。週末はいつも何をしているんですか？",
    "いいですね。今度、そのカフェに一緒に行きませんか？"
  ];
  const responses = [
    "ええと、二年くらいです。アニメがきっかけで、大学で授業を取りました。",
    "大変ですけど、意味が見えると面白いです。わたしは絵を覚えるみたいに練習しています。",
    "土曜日はたいてい図書館で勉強して、日曜日は友達と街を歩きます。先週は新しいカフェを見つけました。",
    "いいですね。じゃあ、来月の土曜はどうですか。わたしは午後なら空いています。"
  ];

  it("traverses all four turns and only ever offers that turn's authored response", async () => {
    const user = renderPanel();
    await startScenario(user, t.conversationLengths.long);

    for (let turn = 0; turn < responses.length; turn += 1) {
      expect(screen.getByText(partnerLines[turn])).toBeInTheDocument();
      await reachResponses(user);

      responses.forEach((response, index) => {
        if (index === turn) return;
        expect(screen.queryByRole("button", { name: response })).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: responses[turn] }));
      expect(
        screen.getByRole("heading", { name: t.conversationFeedbackTitle })
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: t.conversationContinue }));
    }

    expect(
      screen.getByRole("heading", { name: t.conversationCompleteTitle })
    ).toBeInTheDocument();
  });
});

describe("ConversationPanel state isolation (#814)", () => {
  it("changing the scenario drops prior feedback and the stale selected response", async () => {
    const user = renderPanel();
    await startScenario(user, t.conversationLengths.short);
    await reachResponses(user);
    await user.click(screen.getByRole("button", { name: "そうですね。" }));
    expect(screen.getByText("そうですね。")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t.conversationChangeScenario }));

    expect(
      screen.queryByRole("heading", { name: t.conversationFeedbackTitle })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("そうですね。")).not.toBeInTheDocument();
    expect(screen.queryByText("電車、遅れてるみたいですね。")).not.toBeInTheDocument();

    await startScenario(user, t.conversationLengths.medium);
    expect(screen.getByText("お昼、何食べるか決めました？")).toBeInTheDocument();
    expect(screen.queryByText("そうですね。")).not.toBeInTheDocument();
  });
});

describe("ConversationPanel keyboard and locale honesty (#814)", () => {
  it("keeps every control a semantic button reachable by Tab", async () => {
    const user = renderPanel();
    const buttons = screen.getAllByRole("button");
    expect(buttons.every((button) => button.tagName === "BUTTON")).toBe(true);

    for (const button of buttons) {
      await user.tab();
      expect(document.activeElement).toBe(button);
    }
  });

  it("honestly marks grading and audio as unavailable", async () => {
    const user = renderPanel();
    expect(screen.getByText(t.conversationCuratedNote)).toBeInTheDocument();
    await startScenario(user, t.conversationLengths.short);
    await reachResponses(user);
    await user.click(screen.getByRole("button", { name: "そうですね。" }));
    expect(screen.getByText(t.conversationCuratedNote)).toBeInTheDocument();
  });

  it("localizes the UI and the scene overlays for ja without leaking the zh source", async () => {
    const ja = copy.ja;
    const user = renderPanel("ja");

    expect(screen.getByRole("heading", { name: ja.conversationTitle })).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: new RegExp(`^${ja.conversationLengths.short}`) })
    );

    const sceneText = screen.getAllByText(/ホームの電光掲示板/);
    expect(sceneText.length).toBeGreaterThan(0);
    expect(sceneText.every((element) => element.getAttribute("lang") === "ja")).toBe(true);
    expect(screen.queryByText(/月台上的電子看板/)).not.toBeInTheDocument();
  });
});
