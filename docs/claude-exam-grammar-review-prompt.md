# Claude Prompt: Review And Import Original Grammar Candidates

請接手 Jabiko 題庫文法優化。先 review，再實作；不要直接把候選題整包無腦加入。

## Current State

- Repo: `nurockplayer/Jabiko`
- Current branch/status: 請以你所在工作樹最新狀態為準。
- 我新增了一份 docs-only 候選題清單：
  - `docs/exam-grammar-original-question-list.md`
- 這份清單目前有 24 題原創文法題：
  - N2: 12 題
  - N1: 12 題
- 題目格式接近 `examQuestion({...})`，但 id 使用 `candidate-...`，代表還沒正式導入。
- 目前還沒有修改 `src/domain/examBlocks.ts`。

## Goal

請你先對 `docs/exam-grammar-original-question-list.md` 做一輪品質 review，確認題目是否真的適合放進 Jabiko 的 N1/N2 文法題庫。通過 review 後，再把合格題目加入 `src/domain/examBlocks.ts`。

## Important Constraints

- 題目必須原創，不可抄官方、考古題、JLPT workbook、網路題庫或例句。
- 可以參考公開來源的題型與 coverage，但不能保留相同題幹、相同場景、相同句構或同一組選項。
- 主要目標是 N1/N2；不要在 UI 顯示難度分級。
- `promptLabel` 不得出現 `N1` / `N2` / `N3`。
- `hintZh` 是作答前顯示，不能洩漏正解語意。
- `promptContextZh` 是作答後翻譯，可以完整說明。
- 干擾選項不能太簡單：
  - 四個 options 都必須是真實文法。
  - 至少 2 個 distractors 要能在接續上成立。
  - 至少 2 個 distractors 要和正解屬於相近語意家族。
- explanation 必須逐一說明三個 distractors 為什麼不自然。

## Review Checklist

請逐題檢查：

1. 日文自然度：是否像 N1/N2 題幹，而不是翻譯腔。
2. 題型貼近度：是否符合 JLPT「文法形式選擇」風格。
3. 干擾選項品質：是否至少有兩個會讓中高階考生猶豫。
4. 接續品質：是否避免只有正解能接續、其他三個直接破句。
5. `hintZh` 是否中立：不能直接寫出「目的、逆接、義務、可能負面結果」等答案類型。
6. `meaningZh` / `promptContextZh` 是否和正解一致。
7. explanation 是否真的解釋 minimal pair，不只是翻譯正解。
8. 是否已有太相近的既有題，造成重複感。

如果某題不合格：

- 優先重寫，不要直接刪。
- 若要刪，請在 PR summary 說明原因。

## Implementation Guidance

把通過 review 的題目加入 `src/domain/examBlocks.ts`。

建議放置位置：

- N2 題放在現有 N2 文法形式選擇區塊附近。
- N1 題放在現有 N1 文法形式選擇區塊附近。

導入時請：

- 把 `candidate-...` id 改成正式 id，例如：
  - `n2-grammar-nitomonatte-denshi`
  - `n1-grammar-atteno-riyosya`
- 檢查 id 不重複。
- 檢查 `expectedAnswer` 必須存在於 `options`。
- 不要新增可見難度 label。
- 不要修改 unrelated UI / theme / learning block。

## Verification

完成後至少跑：

```bash
corepack pnpm check:exam
corepack pnpm test
corepack pnpm build
```

如果本機 `pnpm` 不在 PATH，用 `corepack pnpm ...`。

## Expected Output

請開 PR，PR summary 包含：

- 加入幾題 N1 / N2 文法題。
- 有沒有重寫或剔除候選題。
- 干擾選項品質如何改善。
- 驗證結果。

如果 review 發現候選題品質不夠，先修題目再加，不要為了加量硬塞。

