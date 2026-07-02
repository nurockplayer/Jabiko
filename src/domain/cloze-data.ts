import type { ClozeSentence } from "./cloze";

// 20 seed sentences covering two N5 grammar patterns.
// Each sentence references a vocabulary id from src/domain/vocabulary.ts
// (extra verbs from PR #13 use the "verb-{kanji}" id scheme).

const teRequestSentences: ClozeSentence[] = [
  {
    id: "te-request-matsu",
    prefix: "ちょっと ",
    suffix: " ください。",
    vocabularyId: "matsu",
    targetForm: "te",
    grammarPoint: "〜てください",
    translationZh: "請稍等。",
    translationI18n: { en: "Please wait a moment.", ja: "すこしのあいだ そのままで いてほしい、というおねがい。" },
    level: "N5"
  },
  {
    id: "te-request-kaku-name",
    prefix: "ここに 名前を ",
    suffix: " ください。",
    vocabularyId: "kaku",
    targetForm: "te",
    grammarPoint: "〜てください",
    translationZh: "請在這裡寫名字。",
    translationI18n: { en: "Please write your name here.", ja: "このばしょに なまえを きにゅうしてほしい、というおねがい。" },
    level: "N5"
  },
  {
    id: "te-request-hanasu-slow",
    prefix: "もう一度 ",
    suffix: " ください。",
    vocabularyId: "hanasu",
    targetForm: "te",
    grammarPoint: "〜てください",
    translationZh: "請再說一次。",
    translationI18n: { en: "Please say it one more time.", ja: "おなじことを もういちど いってほしい、というおねがい。" },
    level: "N5"
  },
  {
    id: "te-request-nomu",
    prefix: "この 薬を ",
    suffix: " ください。",
    vocabularyId: "nomu",
    targetForm: "te",
    grammarPoint: "〜てください",
    translationZh: "請吃這個藥。",
    translationI18n: { en: "Please take this medicine.", ja: "このくすりを ふくようしてほしい、というおねがい。" },
    level: "N5"
  },
  {
    id: "te-request-yomu",
    prefix: "この 本を ",
    suffix: " ください。",
    vocabularyId: "yomu",
    targetForm: "te",
    grammarPoint: "〜てください",
    translationZh: "請讀這本書。",
    translationI18n: { en: "Please read this book.", ja: "このほんに めを とおしてほしい、というおねがい。" },
    level: "N5"
  },
  {
    id: "te-request-miru",
    prefix: "この 写真を ",
    suffix: " ください。",
    vocabularyId: "miru",
    targetForm: "te",
    grammarPoint: "〜てください",
    translationZh: "請看這張照片。",
    translationI18n: { en: "Please look at this photo.", ja: "このしゃしんを ごらんになってほしい、というおねがい。" },
    level: "N5"
  },
  {
    id: "te-request-kuru",
    prefix: "早く ",
    suffix: " ください。",
    vocabularyId: "kuru",
    targetForm: "te",
    grammarPoint: "〜てください",
    translationZh: "請快點來。",
    translationI18n: { en: "Please come quickly.", ja: "はやく こちらに とうちゃくしてほしい、というおねがい。" },
    level: "N5"
  },
  {
    id: "te-request-akeru-window",
    prefix: "窓を ",
    suffix: " ください。",
    vocabularyId: "verb-開ける",
    targetForm: "te",
    grammarPoint: "〜てください",
    translationZh: "請打開窗戶。",
    translationI18n: { en: "Please open the window.", ja: "まどを ひらいてほしい、というおねがい。" },
    level: "N5"
  },
  {
    id: "te-request-kasu-pen",
    prefix: "ペンを ",
    suffix: " ください。",
    vocabularyId: "verb-貸す",
    targetForm: "te",
    grammarPoint: "〜てください",
    translationZh: "請借我筆。",
    translationI18n: { en: "Please lend me your pen.", ja: "ペンを すこしのあいだ つかわせてほしい、というおねがい。" },
    level: "N5"
  },
  {
    id: "te-request-taberu",
    prefix: "ご飯を いっぱい ",
    suffix: " ください。",
    vocabularyId: "taberu",
    targetForm: "te",
    grammarPoint: "〜てください",
    translationZh: "請多吃一點飯。",
    translationI18n: { en: "Please eat plenty of rice.", ja: "ごはんを たくさん くちにしてほしい、というおねがい。" },
    level: "N5"
  }
];

const desiderativeSentences: ClozeSentence[] = [
  {
    id: "tai-nomu-water",
    prefix: "つめたい 水を ",
    suffix: " です。",
    vocabularyId: "nomu",
    targetForm: "desiderative",
    grammarPoint: "〜たいです",
    translationZh: "想喝冰水。",
    translationI18n: { en: "I want to drink some cold water.", ja: "ひえた みずが ほしい、というきもち。" },
    level: "N5"
  },
  {
    id: "tai-iku-japan",
    prefix: "夏休みに 日本へ ",
    suffix: " です。",
    vocabularyId: "iku",
    targetForm: "desiderative",
    grammarPoint: "〜たいです",
    translationZh: "暑假想去日本。",
    translationI18n: { en: "I want to go to Japan during summer vacation.", ja: "なつやすみは にほんを おとずれたい、というきもち。" },
    level: "N5"
  },
  {
    id: "tai-taberu-ramen",
    prefix: "今日は ラーメンが ",
    suffix: " です。",
    vocabularyId: "taberu",
    targetForm: "desiderative",
    grammarPoint: "〜たいです",
    translationZh: "今天想吃拉麵。",
    translationI18n: { en: "Today I feel like eating ramen.", ja: "きょうは ラーメンの きぶんだ、といういみ。" },
    level: "N5"
  },
  {
    id: "tai-au-friend",
    prefix: "国の 友達に ",
    suffix: " です。",
    vocabularyId: "verb-会う",
    targetForm: "desiderative",
    grammarPoint: "〜たいです",
    translationZh: "想見家鄉的朋友。",
    translationI18n: { en: "I want to see my friends back home.", ja: "こきょうの ともだちが こいしい、というきもち。" },
    level: "N5"
  },
  {
    id: "tai-kaeru-home",
    prefix: "もう ",
    suffix: " です。",
    vocabularyId: "kaeru",
    targetForm: "desiderative",
    grammarPoint: "〜たいです",
    translationZh: "已經想回家了。",
    translationI18n: { en: "I already want to go home.", ja: "そろそろ いえに もどりたい、というきもち。" },
    level: "N5"
  },
  {
    id: "tai-benkyo",
    prefix: "もっと 日本語を ",
    suffix: " です。",
    vocabularyId: "benkyo-suru",
    targetForm: "desiderative",
    grammarPoint: "〜たいです",
    translationZh: "想更深入學日文。",
    translationI18n: { en: "I want to study Japanese more.", ja: "にほんごを もっと ふかく まなびたい、というきもち。" },
    level: "N5"
  },
  {
    id: "tai-miru-movie",
    prefix: "新しい 映画を ",
    suffix: " です。",
    vocabularyId: "miru",
    targetForm: "desiderative",
    grammarPoint: "〜たいです",
    translationZh: "想看新電影。",
    translationI18n: { en: "I want to watch the new movie.", ja: "あたらしい えいがを かんしょうしたい、というきもち。" },
    level: "N5"
  },
  {
    id: "tai-hanasu",
    prefix: "もう少し ",
    suffix: " です。",
    vocabularyId: "hanasu",
    targetForm: "desiderative",
    grammarPoint: "〜たいです",
    translationZh: "想再多說一點。",
    translationI18n: { en: "I want to talk a little more.", ja: "かいわを もうすこし つづけたい、というきもち。" },
    level: "N5"
  },
  {
    id: "tai-kau-book",
    prefix: "あの 本を ",
    suffix: " です。",
    vocabularyId: "kau",
    targetForm: "desiderative",
    grammarPoint: "〜たいです",
    translationZh: "想買那本書。",
    translationI18n: { en: "I want to buy that book.", ja: "あのほんを こうにゅうしたい、というきもち。" },
    level: "N5"
  },
  {
    id: "tai-suru-tennis",
    prefix: "週末に テニスを ",
    suffix: " です。",
    vocabularyId: "suru",
    targetForm: "desiderative",
    grammarPoint: "〜たいです",
    translationZh: "週末想打網球。",
    translationI18n: { en: "I want to play tennis on the weekend.", ja: "しゅうまつに テニスを やりたい、というきもち。" },
    level: "N5"
  }
];

export const clozeSentences: ClozeSentence[] = [...teRequestSentences, ...desiderativeSentences];
