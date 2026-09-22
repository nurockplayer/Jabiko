import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ConversationPanel } from "./ConversationPanel";
import { copy } from "../i18n";
import { conversationSessionDefinitions } from "../domain/conversationFixtures";

const t = copy["zh-Hant"];

function renderPanel(language: "zh-Hant" | "ja" | "en" = "zh-Hant") {
  const user = userEvent.setup();
  render(<ConversationPanel language={language} />);
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
