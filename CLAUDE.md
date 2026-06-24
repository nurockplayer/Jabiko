# Jabiko 專案規則

## 技術棧

- React 19 + TypeScript strict mode + Vite 7 + Vitest 4 + jsdom
- pnpm 套件管理
- 領域驅動設計：`src/domain/`（商業邏輯）、`src/components/`（React UI）、`src/hooks/`

## 修改前必讀

- `src/domain/vocabulary.ts` 和 `src/domain/vocabulary-jlpt.ts` 是熱路徑
- `src/domain/types.ts` 是所有領域型別的定義處
- `src/domain/contentGuard.test.ts` 是題目內容的正確性驗證關卡
- 修改任何 domain 檔案時，先讀對應的 `.test.ts` 了解預期行為
- 新增／修改題庫題目前，先讀 [`docs/item-quality-rubric.md`](docs/item-quality-rubric.md)（出題品質規範：唯一正解、干擾、不洩漏、格式）

## Build 與測試

- TypeScript 改動後跑 `pnpm build` 確保編譯通過
- 領域邏輯改動後跑 `pnpm test` 確保回歸
- 只改 React 元件時可以只跑 `pnpm build`
- `pnpm check:exam` 是題目內容快速驗證，改題庫時必跑
- build 失敗時先讀錯誤再修，不要盲目重試

## TDD 開發流程（強制）

所有開發必須遵循 **Red-Green-Refactor** 循環：

1. **RED** — 先寫測試，跑 `pnpm test` 確認因功能不存在而失敗
2. **GREEN** — 寫最少程式碼讓測試通過
3. **REFACTOR** — 重構並保持測試綠燈

### 鐵則

- **沒有先寫測試就不准寫 production code**
- 每個新功能／修 bug 必須先有對應的測試
- 未觀察到測試失敗就直接通過，代表測錯了東西
- 若先寫了程式碼才想到要補測試，刪掉重來
- 例外（告知使用者後可豁免）：一次性 prototype、純設定檔、自動產生程式碼

## 不變條件

- 不要改變 `src/domain/contentGuard.ts` 的驗證規則，除非透過 issue 討論
- `src/domain/types.ts` 的型別是合約，不要隨意刪除或破壞向後相容
- 所有領域邏輯必須在 `src/domain/`，不要在 `src/components/` 放商業邏輯
- pnpm 為唯一套件管理工具，不產生 npm/yarn/bun lockfile

## 程式碼慣例

- TypeScript strict mode 全開，禁止 `any`，除非有明確註解說明
- 測試檔與原始檔放在同目錄，命名為 `*.test.ts` 或 `*.test.tsx`
- React 元件用函式元件 + hooks，不用 class component
- import 用 ES module 路徑（相對路徑）

## 題庫內容工作流（exam content pipeline）

新增 exam 題目（文法／詞彙等）一律走這條 loop，每批一個 PR：

1. **驗真缺**：對 `src/domain/exam/items/<level>.ts` grep 既有點，**同時搜 surface 與 expectedAnswer、漢字與假名**，確認不是已散見於其他題型。
2. **雙審設計**：subagent + codex 平行各出一份（每點 2 題），再**交叉判**（codex 判 subagent 檔、subagent 判 codex 檔），最後跑一次**終審** subagent 掃雙解/接續秒殺/洩漏。
   - 最大雷＝**近義雙解**與**接續秒殺**。鎖法：選項放完整述部、干擾用反義、用語境/時間副詞鎖死方向。codex 抓雙解通常比 subagent 準。
   - codex 用法：`codex exec --skip-git-repo-check "$(cat prompt.txt)" < /dev/null`（須關 stdin，否則卡住）。codex 有時寫日文解說，consolidate 時翻成繁中。
3. **轉檔**：簡化 shape（`question/answer/...`）轉成 importer 的 `ExamQuestionInput`（`id,level,surface,reading,meaningZh,promptLabel,instructionZh,promptText,promptContextZh,hintZh,expectedAnswer,options[4],explanation`），放 `scripts/exam-batches/<name>.json`。
   - **contentGuard 硬規則**：`hintZh` 非空且**與 `meaningZh` 不可共用任何 ≥2 字片段**；`options` 恰 4 個互不重複；`expectedAnswer ∈ options`；`promptLabel` 不含 N1–N5 字樣。
4. **驗證**：`node scripts/import-exam-items.mjs <file> --dry-run` 過 → 再去 `--dry-run` 拿掉實際 append。
5. **contentStats 同步**（`src/domain/contentStats.ts`，硬編碼數字、`contentStats.test.ts` 是 drift guard）：
   - `examItems` 計**所有**等級；`n1Grammar` 只計 N1 文法形式選擇。
   - **N1 批次：examItems 與 n1Grammar 都 +N；N2/N3 批次：只 +examItems。**
   - **furigana 重產**（#134 P4）：本批有新 exam 例句／題幹時跑 `pnpm build:furigana` 重產 `src/domain/furiganaData.ts`（從 vocab＋jlpt＋exam 全來源烤；新句的注音才會出現、漢字読み 題幹自動排除）。kuromoji 誤讀加進腳本的 `READING_OVERRIDES`（用複合詞 key、勿用 後/九 這種歧義單字）。`furiganaData` 只進 lazy challenge chunk，勿從 eager 路徑 import（[[jabiko-bundle-codesplit]]）。
6. **EOL**：`exam/items/*.ts` 在 git 是 `-text`，CRLF 會被 `git diff --check` 報。暫存時用 `git -c core.autocrlf=false add <files>`，commit 前確認 `git diff --cached --check` EXIT=0。
7. **三閘＋build**：`pnpm check:exam`、`pnpm test`（含 contentGuard/contentStats drift）、`pnpm build`（確認 `examBlocks` 仍是 lazy 獨立 chunk、`index` 不膨脹）。
8. **PR**：branch → push（pre-push hook 會跑 build）→ `gh pr create`。**CI 必過閘只有 `Test and build`**；CodeRabbit/Cloudflare 常是 rate-limit skip，不阻擋。green 後 `gh pr merge --squash --delete-branch`。
   - ⚠ 不要開背景 CI waiter 無限 loop（PR merge + branch 刪除後 `gh` 回空、`jq` 對 null 拋錯，條件永不成立 → 殭屍）。要等就用**有迭代上限**的 bounded loop，或 inline 查 `gh pr checks`。

## 目前進度快照（2026-06-25）

- **JLPT 文法 coverage 全數補完**：N1(#164)/N2(#165)/N3(#166) 三子議題已關閉，父議題 #157 收束。
- **N1 文字・語彙補平衡完成**（#152，三批 N1 vocab 用法/類義/詞彙填空）。`examItems = 989`、`n1Grammar = 265`。
- **跨裝置同步（#151）已完成並端到端驗證**：Supabase `attempts` 表 + RLS + 明確 grant（#196 補上，**別靠 Supabase 隱性 default privileges**）；prod 實測雲端 1065 列吻合本機。#181/#151 已關。詳見使用者 memory `jabiko-cross-device-sync`。
- 各 batch 來源 JSON 保留在 `scripts/exam-batches/`；grammar loop 細節另記於使用者 memory `jabiko-grammar-coverage-loop`。
- **下一步候選**（與使用者討論後再開工）：#195 漢字讀音速查表擴充全等級、#135 SRS 現代化 epic、#134 Furigana toggle、#124 題型分布補平衡。
