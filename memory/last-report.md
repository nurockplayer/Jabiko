# 最終報告 — 防範 AI 內容可見性決策越權

## 完成項目

三層防線防止 AI 未經人工批准就移除語言閘門。

### Layer 1 — 測試合約（主要防線）
- **`src/components/GrammarPointPage.test.tsx`** — 新增 `content language gates` describe block（10 個測試）
  - zh-Hant 控制組證明夾具有效
  - en/ja 在 exam-data 分支不該看到中文資料庫內容（examples, media, related, commonMistakes）
  - en/ja 在 database-only 分支不該看到 meaningZh、formation、example meaningZh、related meaningZh、commonMistakes
- **`src/components/GrammarPointPage.tsx`** — database-only 分支對非 zh-Hant 提前回傳空殼（修正 `5faea8a` 的閘門缺口）
- 測試夾具動態從 `grammarDatabase` 和 `grammarPoints` 選取，不寫死字串

### Layer 2 — CLAUDE.md 規則
- **`CLAUDE.md`** — 新增 `## 內容可見性規則` 章節
  - 定義 `*Zh` 欄位為未翻譯中文，必須受 `isZhHant` 保護
  - `formation` 等同 `meaningZh` 處理；`lineZh`/`contextZh` 即使在子元件也必須 gated
  - 明列 AI 禁止事項（移除閘門、新增無閘門元件、改 LAUNCHED_LANGUAGES、改 pickLocalized 行為）
  - 升級條件：若認為該移除閘門 → 停下來問使用者

### Layer 3 — CI gate-lint 腳本
- **`scripts/check-content-gates.mjs`** — 掃描 `.tsx` 偵測無閘門的中文內容渲染
- **`scripts/content-gate-baseline.json`** — 已知問題 baseline（2 項）
- **`.github/workflows/ci.yml`** — 新增 `Check content language gates` step

## 驗證狀態

| 項目 | 結果 |
|------|------|
| `pnpm test` | 649 tests passed ✓ |
| `pnpm build` | build succeeded ✓ |
| `node scripts/check-content-gates.mjs` | no new violations ✓ |

## 殘餘風險

- **GrammarIndexPage `PatternCard`**：`meaningZh` 和 `formation` 無語言閘門（已進 baseline），需等 `GrammarPattern` 新增 i18n overlay 欄位
- **LearningPanel `explanation`**：無 i18n overlay（已進 baseline）
- **Gate-lint 腳本**：啟發式掃描，複雜 JSX 可能假陰性，不能取代測試合約
- **測試夾具**：依賴 database-only pattern 存在，目前有 8 個；若全進題庫需新增測試用假資料
