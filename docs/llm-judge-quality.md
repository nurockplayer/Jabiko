# LLM-as-judge 題目品質關卡（語意第二道）

> 每批新題 merge 前必跑的**語意審查**流程＋可複製的 judge prompt 模板。
> 補 `pnpm check:exam` 自動 lint（A，#139）抓不到的：**雙解、日文不自然、近義干擾、洩漏**。
> 評分準則一律引用 [`docs/item-quality-rubric.md`](item-quality-rubric.md)（#138）——本文件不另立一套標準。
>
> 相關：[#87](https://github.com/nurockplayer/Jabiko/issues/87)（多解 audit 傘）、#139（A 確定性 lint）、#141（讀音客觀驗證）。

---

## 定位：三道閘，各司其職

| 閘 | 來源 | 抓什麼 | 機制 / 成本 |
|---|---|---|---|
| **A 確定性 lint** | #139 `contentGuard.test.ts` | 格式/機械：非假名選項、options 重複、explanation 空、語順不可打散、題幹重複 | 程式，秒判、零成本，**每次必跑** |
| **B 語意 judge** | **本文件** | 語意：**唯一正解（雙解）**、日文自然度、近義干擾、洩漏 | LLM/agent 判讀，**每批新題 merge 前跑** |
| F 讀音驗證 | #141（規劃中） | 漢字読み 讀音是否該詞合法讀音、干擾是否誤為合法讀音 | kuromoji/JMdict dev script |

**A 過了不代表題目對。** 「飾る／並べた」「貸す」「寒い」這類失誤格式全對、只有語感上存在第二解——只有 B 抓得到。A 是門檻，B 是把關。

---

## SOP：何時跑 / 誰跑 / 結果去哪

- **何時**：任何新增或改寫 exam 題目（`src/domain/exam/items/*.ts`）的批次，**開 PR 後、merge 前**。純改 code 不需。
- **誰**：subagent（general-purpose）＋ codex，**兩者並行**。實務上互補——codex 抓過 subagent 漏的近義雙解、subagent 抓過 codex 漏的 a11y/邊界。
- **輸入**：該批候選題 JSON，或已匯入的 item id 清單 / `git diff` range。
- **輸出**：結構化 findings 貼到該批 PR comment（或 #87）。
- **門檻**：**P1/P2 必修再 merge**；P3 記錄、可後補。任一 judge 報 P1 即視為 P1（寧可誤報）。

---

## 判定維度（每題逐項，引用 rubric）

1. **唯一正解（rubric §1）** ← 最重要、最常失守。**主動把每個干擾代回空格，試著找出第二個成立的答案**；找不到才算過。
2. **日文自然度（rubric §4）**：母語者會這樣說嗎？beginner-safe？符合該 JLPT 級？
3. **干擾項（rubric §2）**：接續/語法在該空格成立（不是純接續錯被秒殺）；無近義雙解；漢字読み 干擾非同詞合法異讀。
4. **洩漏（rubric §3）**：hintZh 不含答案 gloss；promptText / promptLabel 不洩；語順題詞塊已打散。

---

## Judge prompt 模板（複製去派 subagent / codex）

````text
你是嚴格、帶敵意的日語出題審查者，唯一任務是揪出「不只一個正解」的題目。
審查對象：<貼上候選題 JSON，或 repo 路徑 + item id 清單 / git diff range>。
評分準則見 docs/item-quality-rubric.md（§1 唯一正解、§2 干擾、§3 不洩漏、§4 自然+分級）；先讀它。

逐題執行（按嚴重度回報，不要客氣）：
1. 唯一正解【最重要】：把其餘 3 個干擾**逐一代回空格**，問「母語者會不會也接受？」。
   只要找到第二個說得通的答案，這題就是壞的（P1）。預設懷疑，找不到第二解才放行。
   特別盯近義干擾（例：飾る 的 並べた、我慢 的 遠慮、過ごす 的 暮らす）。
2. 日文自然度：promptText 是自然母語句嗎？背景用詞有沒有比被考點還難？合該級嗎？
3. 干擾項：每個干擾在該空格接續/語法成立嗎（不能只因接續錯被秒殺）？漢字読み 干擾是否誤放了同詞的另一個合法讀音？
4. 洩漏：hintZh 是否含 meaningZh 的詞（作答前就洩答）？promptText/promptLabel 是否洩級數或答案類別？語順題詞塊是否已打散？

輸出：
- 一張逐題表：item id | 單一正解? Y/N | 問題 | 嚴重度(P1/P2/P3)
- 對每個「N」明確寫出你找到的第二解與理由。
- 結尾總評：可 merge / 需修清單。
不確定算 P 不算過——寧可誤報，不可放過真雙解。
````

> 派法：用 Agent 工具開 general-purpose subagent 貼上述 prompt；另用 codex 並行（`/codex:review`，或 Bash 跑 `codex exec review --base main`）。兩邊 findings 合併，P1/P2 修完再 merge。
>
> 本機操作注意：`codex exec` 要**從 repo 內**執行；用 Bash 工具跑時把 stdin 關掉（`< /dev/null`）否則會等 stdin 卡住。若不在 git repo（例如從上層資料夾），加 `--skip-git-repo-check`。

---

## 嚴重度

- **P1**：雙解／答案實際是錯的／嚴重洩漏 → **阻斷 merge**。
- **P2**：日文不自然／干擾純秒殺／邊緣雙解 → merge 前修。
- **P3**：用詞可更好／解析可加強 → 記錄，可後補。

---

## 收斂多個判定

- 跑多個 judge 或多輪時：**任一報 P1 → P1**。
- 雙解採「找到一個可辯護的第二解即成立」——不靠多數決，一票否決。

---

## 後續（非第一步）

- `scripts/` harness：自動把 batch JSON 餵給 judge、收斂多 judge / 多輪結果、產 findings 報告（半自動化本流程）。
- 與 #141（讀音客觀驗證）串成 **A 確定性 → B 語意 → F 讀音** 三道。
