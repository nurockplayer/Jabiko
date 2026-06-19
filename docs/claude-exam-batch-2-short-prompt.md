# Claude Short Prompt: Exam Question Batch 2

請 review `docs/exam-public-practice-quality-review-and-batch-2.md`，再把合格題目匯入 `src/domain/examBlocks.ts`。

重點：

- 不要整包硬塞；逐題檢查日文自然度、唯一正解、`hintZh` 是否洩漏答案、干擾選項是否夠迷惑。
- 同一個文法點可以重複，但必須是不同情境、不同語意線索、不同 distractor family；不要只因 `surface` 重複就跳過。
- 優先匯入 6 題「文章脈絡」，再選 6-8 題「文法形式選擇」；「語順組合」因選項較長，匯入前要注意手機 UI。
- 題目必須原創，不可抄官方、考古題、JLPT workbook 或網路題庫；公開來源只能參考題型和 coverage。
- 匯入後跑 `node scripts/check-exam-options.mjs`、`corepack pnpm test`、`corepack pnpm build`。

PR summary 請列：匯入幾題、跳過/重寫哪些題、為什麼、驗證結果。
