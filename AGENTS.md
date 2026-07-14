# Jabiko — Codex Agent Guidelines

> **Source of truth：`CLAUDE.md`。** 本檔是給 Codex 的精簡鏡像；兩檔衝突時以 CLAUDE.md 為準。（#314）

## 語言設定

永遠使用台灣正體中文回覆。日文只用於學習材料、例句、UI 標籤或語法說明。

## 專案定位（2026-07 現況）

Jabiko（jabiko.app）是免費、免註冊的 **JLPT N5–N1 日檢自習室**：文法／單字／漢字讀音／官方題型練習／模擬考／學習文章。題庫 3,600+、學習章 73+、文章區已上線。

- 技術棧：React 19 + TypeScript strict + Vite 7 + Vitest 4 + jsdom、pnpm、PWA（vite-plugin-pwa）
- 資料：local-first（localStorage）＋**選配** Supabase 跨裝置同步（Google 登入）；Cloudflare Pages 部署＋prerender
- i18n：上線語系 zh-Hant／ja／en（`LAUNCHED_LANGUAGES`），另有 ko/th/id/vi/my Copy 檔未上線

舊描述（《大家的日本語》動詞變化工具、無後端無登入）已過時，勿依其做設計假設。`docs/superpowers/specs/` 是 2026-05 的歷史設計稿，非現行 spec。

## Shell 指令

直接執行指令即可（**沒有 `rtk` 這個工具**——舊規範遺留，勿再等待或宣稱缺它而跳過驗證）。

- Node／frontend tooling 一律 `pnpm`；不得使用 npm/yarn/bun（也不得產生其 lockfile）
- 驗證三閘：`pnpm test`、`pnpm build` 每個 PR 必跑；`pnpm check:exam` 在改動題庫（`src/domain/exam/`）時必跑，其他改動可省
- 新增／修改**文章**後必跑 `pnpm build:sitemap`（sitemap drift guard 會擋 CI——這是 Codex 歷史上最常漏的一步）
- 新增 exam 例句／題幹後跑 `pnpm build:furigana`

## 政策關鍵規則（CLAUDE.md 摘要，違反=擋 merge）

- **TDD 強制**：先寫測試觀察 RED 再實作；例外僅限一次性 prototype、純設定檔、自動產生程式碼（要先告知）
- **contentGuard 不變條件**：不得改 `src/domain/contentGuard.ts` 驗證規則，除非透過 issue 討論
- **語言隔離**：`*Zh` 欄位不得對 zh-Hant 以外渲染，除非走 `pickLocalized()`＋有效 i18n overlay；`isZhHant` 是唯一閘門變數；不得動 `LAUNCHED_LANGUAGES`／`LocaleCode`／`pickLocalized()` fallback
- **分層**：領域邏輯在 `src/domain/`，React 元件不放商業邏輯；TypeScript strict、禁 `any`
- **Bundle 紀律**：examBlocks／furigana 資料／文章 body 只准進 lazy chunk，勿從 eager 路徑（App／components barrel／首頁）import
- **EOL**：`exam/items/*.ts` 是 `-text`，暫存用 `git -c core.autocrlf=false add <files>`（明列檔名），commit 前 `git diff --cached --check` 必須乾淨

## Scope 邊界

- 不把未要求的功能、重構或 future work 混進同一個變更
- 需要新增依賴、調整架構或擴大範圍時，先回報理由與替代方案
- 內容批次（題庫／文章）天然 diff 大，屬正常，不必為 diff 大小道歉

## Git／PR 規範

- Branch 命名 `codex/<short-description>`；commit 訊息簡潔（英文祈使句或 `<type>: <desc>`）
- 不用 `git add -A`／`git add .`；只 stage 本次任務檔案
- GitHub／git 指令必須 non-interactive
- **PR 開出來請轉為 ready**（draft 會擋 merge）
- **勿開 stacked PR**（base 指向另一個 PR 的分支）：前面的 PR squash 合併刪分支時，後面的會被 GitHub 自動關閉且無法 reopen。多篇內容各自從 main 開分支
- CI 必過閘只有「Test and build」；CodeRabbit 綠勾可能是 rate-limit skip，不算真審

## 供應鏈安全

- 不得自行新增依賴，除非任務需要且已在回報中說明原因
- 不得執行 `npx`、`pnpm dlx`、`npm exec`、`curl | bash`、`wget | sh` 這類遠端即時執行指令
- `package.json` 與 lockfile 改動必須在回報中明確說明

## 內容品質（出題／文章）

- 出題先讀 `docs/item-quality-rubric.md`：唯一正解、干擾誘答、不洩漏、格式
- 最大雷＝近義雙解與接續秒殺；教學句最大雷＝**顧客句用「〜ますか」問聽話者動作**（主語錯位）
- 文章不轉載歌詞（外連＋片段佔位）；例句一律原創

## 測試與驗證

宣稱完成前回報實際執行過的驗證（三閘結果 pass/fail）。優先測：變化邏輯（音便／ない形／不規則）、答案 normalization、contentGuard／contentStats drift、主要練習流程。

## 回報格式

- 只列關鍵變更：檔案＋一句說明
- 測試結果只報 pass/fail 與失敗原因，不貼完整 log
- 遇到錯誤先給診斷與建議修法，再問是否繼續
