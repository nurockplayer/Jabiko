# Jabiko — Codex Agent Guidelines

## 語言設定

永遠使用台灣正體中文回覆。日文內容只用於學習材料、例句、UI 標籤或語法說明。

## 專案定位

Jabiko 是給《大家的日本語》學習者使用的日文變化練習網站。第一版以動詞變化訓練為主，並預留い形容詞、な形容詞與 `てもらえますか`、`てくれますか`、`てあげます` 等文型練習。

設計文件以 `docs/superpowers/specs/` 為準。實作前先確認最新 spec。

## Shell 指令

所有 shell 指令都必須以 `rtk` 開頭，以降低輸出 token。

例：

```bash
rtk git --no-optional-locks status
rtk pnpm build
rtk pnpm test
```

Node / frontend tooling 統一使用 `pnpm`。不得使用 `npm install`、`npm run`、`npm test` 或其他 npm 指令。

## 技術方向

目前設計決策：

- Vite
- React
- TypeScript
- Vitest
- LocalStorage

第一版不需要後端、登入、雲端同步或 AI 解釋生成。

## Scope 邊界

- 不要把未要求的功能、重構或 future work 混進同一個變更。
- 文件、研究草稿與討論紀錄不能自動視為 implementation source of truth；實作前要確認 spec。
- 若發現需要新增依賴、調整架構或擴大功能範圍，先回報理由與替代方案。
- 空專案初期可以調整腳手架，但仍要避免無關檔案與 metadata churn。

## Git 規範

- Branch 命名預設使用 `codex/<short-description>`，除非使用者指定其他名稱。
- Commit 訊息使用簡潔英文祈使句或 `<type>: <short description>`。
- 在 mixed worktree 中不得使用 `git add -A` 或 `git add .`；只 stage 本次任務需要的檔案。
- 不要直接 revert 使用者未要求 revert 的變更。
- GitHub / git 指令必須 non-interactive。

## 供應鏈安全

- 不得自行新增依賴，除非任務需要且已在回報中說明原因。
- 不得執行 `npx`、`pnpm dlx`、`npm exec`、`curl | bash`、`wget | sh` 這類遠端即時執行指令。
- `package.json` 與 lockfile 改動必須在回報中明確說明。

## 前端品質重點

- 第一畫面應該是實際練習工具，不是 landing page。
- UI 文字以台灣正體中文為主，日文用於題目、答案、例句與語法名稱。
- 動詞與形容詞變化邏輯要放在可測試的 TypeScript 模組，不要散落在 React component。
- 錯誤答案要顯示正解與規則說明，不能只顯示失敗狀態。
- 練習流程要支援鍵盤操作，尤其是 Enter 送出與下一題。
- 手機與桌面都要檢查文字不重疊、不截斷。

## 測試與驗證

宣稱完成前至少回報實際執行過的驗證。

優先測：

- 一類動詞 `て形` / `た形` 音便。
- 一類動詞 `ない形` 母音變化。
- 二類動詞規則變化。
- 三類動詞不規則變化。
- い形容詞與な形容詞的否定、過去、否定過去。
- 答案 normalization。
- 主要練習流程。

## 回報格式

回報保持精簡：

- 只列出關鍵變更：檔案名稱 + 一句說明。
- 測試結果只報 pass/fail 與失敗原因，不貼完整 log。
- 遇到錯誤時先給診斷與建議修法，再問是否繼續。
