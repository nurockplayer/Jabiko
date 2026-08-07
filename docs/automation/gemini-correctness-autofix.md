# Gemini correctness autofix — owner / security runbook

> 本文件是 **owner / security runbook**：說明如何把已合併的 Gemini correctness
> automation（#688 orchestration 狀態機 + #689 publication adapter 的 #690
> workflow 接線）從 `off` → `observe` → manual `repair` → scheduled `repair`
> 逐步上線，包含 rollout 證據、即時停止條件與復原、以及 orphan branch 清理。
>
> 本 runbook **只描述已合併的實作（#690 / PR #736）**，不重新設計任何行為。
> 若本文件與 `.github/workflows/gemini-correctness-autofix.yml` 或
> `scripts/gemini-correctness/**` 不符，以 workflow 與 scripts 為準並回報。

相關 issue：#638（parent）、#688（orchestration 狀態機）、#689（publication
adapter）、#690（workflow 接線）、#691（本 runbook）。

---

## 1. 系統概觀

單一 workflow：`.github/workflows/gemini-correctness-autofix.yml`
（名稱：`Gemini correctness autofix`），包含兩個 job：

- **`evaluate`**（Evaluate correctness (observe / repair)）
  - read-only permissions：`contents: read` + `pull-requests: read`。
  - 跑 #688 的 `runWorkflowOrchestration` 狀態機：open-PR gate → baseline →
    discovery →（repair 模式才）RED → clean reset → GREEN。
  - `GEMINI_API_KEY` **只注入這個 job 的 `orchestrate` step**。
  - 輸出：`mode`、`publicationAllowed`、`status` 三個 job outputs。
- **`publish`**（Publish verified repair）
  - 僅在 `evaluate` 輸出 `publicationAllowed == 'true' && mode == 'repair'`
    時執行（condition gate，見 workflow line 404）。
  - 最小 write scopes：`contents: write` + `pull-requests: write`。
  - **永不看到 model secret**，只呼叫 #689 的 `publishVerifiedRepair`
    adapter，不重跑 Gemini stage。
  - 行為：重新驗證 candidate → 重讀 remote main 比對 baseline →
    建 branch → 一個 commit → push → 開一個 **Draft PR**。

觸發：

- `workflow_dispatch`：`mode` 輸入（`observe` | `repair`，預設 `observe`）。
  **輸入永遠不能調整 limits、model policy 或 permissions。**
- `schedule`：固定 cron `17 19 * * *`（UTC 19:17 每日）。排程模式讀 repository
  variable `GEMINI_AUTOFIX_MODE`；缺失/空/未知值一律當 `off`，checkout 後立刻
  safe-skip（不呼叫 Gemini、不寫 repo）。

共用設定：`runs-on: ubuntu-latest`、`timeout-minutes: 30`、Node 22、
`pnpm/action-setup@v4`（10.33.0）、`pnpm install --frozen-lockfile`、
concurrency group `gemini-correctness-autofix`（`cancel-in-progress: false`）。

## 2. Repository 設定（exact names）

在 GitHub repo **Settings → Secrets and variables → Actions** 設定：

### Secret（`secrets.*`）

| 名稱 | 用途 |
| --- | --- |
| `GEMINI_API_KEY` | Gemini REST API key（`AIza...`）。只有 `evaluate.orchestrate` step 讀到。缺失時 observe/repair **fail closed**（不會呼叫 Gemini）。 |

### Repository variables（`vars.*`）

| 名稱 | 允許值 | 預設行為 |
| --- | --- | --- |
| `GEMINI_AUTOFIX_MODE` | `off` \| `observe` \| `repair` | 只供 **schedule** 路徑讀取；缺失/空/未知 → `off`（safe skip）。`workflow_dispatch` 的 `mode` input 具更高優先權。 |
| `GEMINI_AUTOFIX_MODEL` | 必須在 model policy allowlist 內 | allowlist：`gemini-2.5-flash`、`gemini-2.5-pro`、`gemini-2.5-flash-lite`。缺失/空/未知 → **fail closed**（無隱式預設）。 |
| `GEMINI_AUTOFIX_MIN_CONFIDENCE` | 數值，`[0,1]` | 預設 `0.8`；**tighten-only**：不可低於程式預設值。非數值或超界 → fail closed。 |
| `GEMINI_AUTOFIX_MAX_FILES` | 整數，`[1,200]` | 預設 `200`；hard cap `200`（**tighten-only**，變數不可能放寬）。 |
| `GEMINI_AUTOFIX_MAX_LINES` | 整數，`[1,250]` | 預設 `250`；hard cap `250`（**tighten-only**）。 |

> 這些 limits/model/secret 全部由 workflow 的 `orchestrate` step 以 **fail-closed**
> 方式驗證（model policy allowlist + tighten-only numeric limits +
> secret missing fail closed），任何不合規值都會讓 `evaluate` job 失敗並
> 標記 `config-error`，**不會**產生候選或 publish。

### 固定常數（程式內，不可被變數放寬）

- GREEN hard budgets（`policy.mjs`）：`MAX_GREEN_PRODUCTION_FILES = 3`、
  `MAX_GREEN_DIFF_LINES = 250`。
- Prompt 上限（`prompt-builder.mjs`）：`MAX_TOTAL_CHARS = 500_000`、
  `MAX_PROJECT_RULES_CHARS = 100_000`；`DEFAULT_MODEL = "gemini-2.5-flash"`。
- Gemini client（`gemini-client.mjs`）：`DEFAULT_TIMEOUT_MS = 30_000`、
  `DEFAULT_MAX_RETRIES = 2`；retryable HTTP `429, 500, 502, 503, 504`；
  exponential backoff（1s, 2s, 4s… 上限 30s）。
- Path policy（`policy.mjs`）：allowlist `src/domain/**` + `src/hooks/**`；
  大量 protected paths（`.github/`、`.env*`、`package.json`、`src/i18n.ts`、
  `src/domain/types.ts`、`src/domain/contentGuard.ts`、`src/domain/exam/items/`、
  `scripts/exam-batches/`、`supabase/`、`public/`、`vite.config.ts` …）。

## 3. 四階段 rollout

### Phase 1 — manual observe（scheduled mode 保持 `off`）

1. 設定 secret `GEMINI_API_KEY`（必填）。
2. **不要**設定 `GEMINI_AUTOFIX_MODE`（或保持 `off`）→ schedule 每日 cron 只會
   safe-skip，絕不會自己呼叫 Gemini 或寫 repo。
3. 設好其餘變數（`GEMINI_AUTOFIX_MODEL` 等）；初次可全部留白，讓程式用
   tighten-only 預設值。
4. 手動跑 **`workflow_dispatch` → mode = `observe`**（1–2 次），人工核對：
   - step summary 顯示 `Status: observed`（或 `no-finding` / fail-closed 理由）。
   - artifact `gemini-correctness-results` 內只有 allowlisted 檔案。
   - **沒有**任何 branch / commit / PR 被建立。
5. 檢視 discovery artifact 品質；先不要切 repair。

證據門檻（進入 Phase 2 前）：

- [ ] 至少 1 次成功的 manual observe 且有合理 finding（或可信的 no-finding）。
- [ ] step summary 未出現 secrets、env 值、絕對 runner 路徑或 raw model response。
- [ ] 確認無任何 branch/PR 被 observe 建立。

### Phase 2 — scheduled observe（owner opt-in）

1. 設定 `GEMINI_AUTOFIX_MODE = observe`（這是 owner 明確 opt-in 的信號）。
2. 等 1–2 個 cron 週期（`17 19 * * *`），核對：
   - schedule run 的 `mode` 確實為 `observe`（step summary `## Gemini correctness observe`）。
   - `evaluate` 正常產生 artifacts；`publish` job 不執行。
   - 沒有任何 branch/commit/PR。
3. 若 schedule run 顯示 `mode=off`，檢查 variable 名是否拼錯或未存到 repo level。

證據門檻（進入 Phase 3 前）：

- [ ] 至少 2 個連續 schedule observe 週期正常。
- [ ] observe 累積的 finding 品質足以判斷 candidate 值得修。
- [ ] 沒有意外 publish、沒有 branch/PR、沒有 secret 洩漏跡象。

### Phase 3 — manual repair（fixture-backed Draft PR + independent review）

> `repair` 只開 **Draft** PR。合併前必須經人工 independent review；workflow
> **不會 auto-approve / auto-merge**。

1. 保持 `GEMINI_AUTOFIX_MODE = observe`（schedule 維持 observe，不要排程 repair）。
2. 手動跑 **`workflow_dispatch` → mode = `repair`**。執行流程：
   - `evaluate`：open-PR gate → baseline（`pnpm lint` / `typecheck` / `test` /
     `build` / `git diff --check`）→ discovery → RED（fixture-backed：在
     `.tmp` 寫 test patch，initial run + replay 都 replay-confirmed）→ clean
     reset → GREEN（production diff 受 `3 files / 250 lines` 硬上限約束）。
   - `evaluate` 產出 sanitized `candidate`（內嵌 production diff 與 regression
     test source），`publicationAllowed=true`。
   - `publish`：re-validate candidate → 重讀 remote main 與 `baselineSha` 比對 →
     branch → 單一 commit → push → **一個 Draft PR**。
3. 預期 branch / commit / PR 契約：
   - Branch：`gemini/auto-fix-<runId>`（`runId` 由 `GITHUB_RUN_ID` slug 化，
     最長 80 chars；prefix 固定 `gemini/auto-fix-`）。
   - Commit：**恰一個**，message 為 `fix: <findingTitle>`（≤140 chars，strip
     control characters），內容 = regression test（`.regression.test.ts` /
     `.regression.test.tsx`，與 production file 同目錄）+ allowlisted
     production diff；**不含** `.tmp/**`、raw、secret 內容。
   - PR：**Draft**（`draft: true`），title `fix: <findingTitle>`，body 由
     validated candidate 欄位確定性生成，含 RED/GREEN evidence、checks、
     stats、branch、run URL、model。body 永不拼接 raw model Markdown。
4. **Independent review**：Draft PR 上的變更由 owner / 第二人獨立 review；
   approve 後才手動 merge。先看 regression test 是否真能復現、production diff
   是否只動 finding 相關檔、有無洩漏或測試竄改。

證據門檻（進入 Phase 4 前）：

- [ ] 至少 1 次 manual repair 產生 Draft PR，且其 branch/commit/diff 符合上述契約。
- [ ] Draft PR 經人工 independent review 並（選擇性）合併，未發生 scope escape /
  test tampering / secret 洩漏。
- [ ] 過程中的無效/失敗 run 皆未留下 orphan branch 或意外 PR。

### Phase 4 — scheduled repair（prior evidence 通過 + 明確 owner opt-in）

1. 只有在前三階段證據全過、且 owner **明確**把 `GEMINI_AUTOFIX_MODE` 改成
   `repair` 後才啟用。
2. 設定 `GEMINI_AUTOFIX_MODE = repair`，每天 `17 19 * * *` 會自動：
   - 跑完整 discover → RED → GREEN；通過才 `publicationAllowed=true`。
   - `publish` 只在此條件成立時開一個 Draft PR。
3. 每個排程 repair 週期後，owner 應檢查：
   - 是否有新的 Draft PR（**最多一個**）且符合契約。
   - 沒有新 PR = no-finding / fail-closed，**不**代表有問題。
4. **回退條件**：任何一次違反本 runbook 的 stop condition（見 §4）發生，立刻把
   `GEMINI_AUTOFIX_MODE` 設回 `observe`（或 `off`）→ 回到較低階段重新累積證據。

## 4. Per-run acceptance（每次 run 的驗收）

每次 run（手動或排程）完成後核對：

1. **baseline SHA 匹配 current main**：`evaluate` 的 baseline = `git rev-parse
   HEAD`（checkout 後的 current main）；`publish` 在寫入前會再讀一次 remote
   main，與 `candidate.baselineSha` 不一致 → `baseline-stale`，零寫入。
2. **no-finding / failure 不建立任何 branch/commit/PR**：只有 `repair-verified`
   且 `publicationAllowed=true` 的 run 才會進入 `publish`。
3. **successful repair 至多一個 Draft PR**，且 branch/commit/diff 符合 §3 契約
   （`gemini/auto-fix-<runId>`、單一 commit、allowlisted diff + regression test）。
4. **無 secrets / env 值 / 絕對 runner 路徑 / raw model response** 出現在
   summaries、artifacts 或 PR body（redaction + scrub 強制；§6 再講）。
5. **無 auto-approve / auto-merge**：Draft PR 一律人工 review 後才 merge。

## 5. Immediate-stop conditions 與復原

發生以下任一情況：**立即停止**（取消進行中的 run、把 mode 設回 `off` /
`observe`）、依下表復原、記錄事件，未確認 root cause 前不重啟。

| 情況 | 停止動作 | 復原 |
| --- | --- | --- |
| **懷疑 secret 洩漏**（step summary / artifact / PR body 出現 `AIza...`、`ghp_...`、`sk-...`、`AKIA...`、env 值） | 立即取消 run；關閉/刪除該 PR 與 branch | 到 GitHub **Settings → Secrets** 撤銷並輪替 `GEMINI_API_KEY`；檢查 Actions run log（官方 log 對 secret 有 mask，但不要依賴）；審視該 run 的 artifact 下載權限；找出洩漏源後才重啟 |
| **scope escape 或 test tampering**（production diff 觸及 protected/非 allowlisted 路徑，或 regression test 被改寫成不真正失敗） | 取消 run；不 merge；關閉該 PR | 檢查 `publication-adapter` 的 candidate 驗證失敗原因（`invalid-candidate`）；確認 GREEN 硬上限（3 files / 250 lines）與 allowlist；人工重建 repro 後才重試 |
| **stale-baseline publication**（`publish` 回報 `baseline-stale`） | 系統已 fail closed 零寫入；不需額外動作 | 確認 remote main 與 candidate 差距；重新跑一次 repair（會抓最新 main 當 baseline） |
| **multiple PRs / orphan branch**（一次 run 出現 >1 個 PR，或發現無 PR 的 `gemini/auto-fix-*` branch） | 停止後續 run；不要直接刪 branch | 先 `gh pr list` 檢查**所有 open PR 的 head branch 與 owner**（見 §6 清理流程），確認某 branch 確實沒有 open PR 且屬本次 automation 才刪除；用 `gh pr close <n> --delete-branch` 或 `git push origin --delete`，**絕不用 force push** |
| **failed checks 仍 publish**（baseline 或 GREEN checks 失敗卻產生 PR） | 立即關閉該 PR 並標記 | 這是違反契約的嚴重事件：檢查 `evaluate` 是否真的跑完 baseline 五項（lint/typecheck/test/build/diff-check）與 `publicationAllowed` gate；未確認 root cause 前禁止排程 repair |
| **workflow cancellation**（run 被取消 / concurrency 擋住） | `cancel-in-progress: false`，不會自動 cancel 既有 run；人工確認沒有半成品 | 檢查該 run 是否留下 branch（push 後才被 cancel）；若有，依 §6 清理；重新觸發一次 |
| **missing artifact**（`publish` 找不到 `command-summary.json` 或 candidate） | 系統 fail closed（`invalid-candidate`） | 重新檢查 `evaluate` 的 artifact upload 是否成功（`if-no-files-found: warn`）；缺 stage artifact 時只有 sanitized summary 會被上傳；重跑該 run |
| **Gemini quota / API failure**（429 / 5xx / timeout / network） | client 會 retry（429/5xx/network/timeout）；非 retryable（400/401/403）立即停 | 確認 `GEMINI_API_KEY` 額度與 quota；檢查 `quota-api-error` / `finding-rejected` 狀態；錯誤訊息已 truncate + redact，不會含 raw body 或 key；重試前一併檢查 model allowlist |
| **GitHub outage**（`gh` / API 失敗） | adapter 有 bounded retry（3 次）無窮重試；仍失敗則 fail closed | 等 GitHub 恢復後重新觸發；檢查是否有 push 成功但 PR 失敗留下的 branch（`publication-cleaned-up` / `cleanup-failed` 狀態，後者=orphan，依 §6 清理） |

## 6. Orphan branch 清理（無 force push）

場景：push 成功但 PR 建立失敗（adapter 自己會嘗試清掉**本次 run 的 branch**；
成功 → `publication-cleaned-up`，失敗 → `cleanup-failed` 且留下 orphan）；或
run 在 push 後被取消。

安全清理流程（**先檢查 open PR ownership 再刪**）：

1. 列出所有 open PR，對每個 `gemini/auto-fix-*` branch 確認其 head branch：
   ```bash
   gh pr list --state open --json headRefName,author,number
   ```
2. 只有當該 branch **沒有 open PR 指向它**（或被確認為本次 automation 留下的
   orphan）才刪除。
3. 用以下任一方式刪除，**絕不用 force push**：
   ```bash
   gh pr close <number> --delete-branch   # 有 open PR 且確認該關
   git push origin --delete gemini/auto-fix-<runId>   # 純 orphan branch
   ```
4. 刪除後確認 `gh pr list` / `git ls-remote --heads origin` 無殘留。

## 7. 防洩漏與紅acted 保證（已內建於實作）

- `discover.mjs` / `workflow-orchestrator.mjs` / `publication-adapter.mjs` 共用
  `redactForOutput`（redact `AIza...` + 精確 secret），再疊加 pattern scrub：
  `ghp_*`、`sk-*`、`AKIA*`、env-dump assignment（`KEY=value`）、絕對 POSIX 路徑
  （`/tmp|/var|/home|/Users|/etc|/usr|/opt|/root|/private|/Applications|/Library`）。
  URL（`https://...`）不受影響。
- `gemini-client.mjs`：API key 永不進 log / error / artifact；error 會 truncate
  response body 並 redact key；timeout + bounded retry。
- Artifact upload 只有 allowlisted 檔：`finding.json`、`red-result.json`、
  `repair-result.json`、`command-summary.json`、`publication-result.json`
  （retention 7 天）。raw prompt / response / env dump / headers / debug log /
  patch / source archive 永不 upload。
- PR body 由 validated candidate 欄位確定性生成；narrative 欄位（title、root
  cause、fix summary、test name）經 scrub + control-character 壓平，無法注入
  Markdown 結構或 secret。

## 8. Rollout 決策速查

| 階段 | `GEMINI_AUTOFIX_MODE` | 觸發方式 | 可能產出 |
| --- | --- | --- | --- |
| 1. manual observe | （留空 / `off`） | 手動 `workflow_dispatch: observe` | 只有 artifacts + summary |
| 2. scheduled observe | `observe` | cron `17 19 * * *` | 只有 artifacts + summary |
| 3. manual repair | `observe`（排程保持 observe） | 手動 `workflow_dispatch: repair` | ≤1 個 Draft PR |
| 4. scheduled repair | `repair` | cron `17 19 * * *` | 每次 ≤1 個 Draft PR |

任何 stop condition 觸發 → 把 mode 設回 `observe` 或 `off` → 處理後重跑
Phase 2/3 累積證據，才考慮回到 Phase 4。

---

_本 runbook 對應 merged implementation #690（PR #736）。任何行為描述以
`.github/workflows/gemini-correctness-autofix.yml` 與
`scripts/gemini-correctness/**` 為準。_
