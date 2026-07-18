# Last report — Cloudflare Zaraz anonymous learning analytics (Phase 1, issue #404)

**Date**: 2026-07-06（rounded 2；Codex 雙重驗證完成於 2026-07-06）
**PR**: https://github.com/nurockplayer/Jabiko/pull/476
**Branch**: `worktree-zaraz-analytics-404`
**Risk**: S2
**Codex status**: ✅ available — 雙重驗證完成。
  - Round 1 verdict: **must-fix**（3 項）
  - Round 2 verdict: **SAFE，PR ready to merge**

## 完成了什麼

### 程式碼（commit e46043c + 74bdb4f）
- `src/lib/analytics.ts`（NEW）：typed `trackEvent(name, payload)`、`AnalyticsEventName` union（8 事件）、`AnalyticsPayloadMap` per-event allowlist。`source`/`questionType` 型別為 `PracticeMode`（非 `string`，Codex must-fix 1）。env gate `import.meta.env.PROD && VITE_ZARAZ_ENABLED === "true"`（string compare）。Safe no-op in all failure paths；never throws；no `any`；no module-load side effect。
- `src/lib/analytics.test.ts`（NEW）：11 tests。TDD RED→GREEN 證據完整。
- `src/vite-env.d.ts`：`Window.zaraz` augmentation。
- `src/App.tsx`：
  - `page_view`（`useEffect` keyed on `[appView]`）
  - `study_page_viewed` 改為 effect（Codex must-fix 2）：keyed on `appView==="grammar" && grammarSurface && !isGrammarLevelRoute`，`lastStudySurfaceRef` dedupe，涵蓋 in-app openGrammar + 直接 `/grammar/<surface>` deep-link + back/forward；level-route（index）排除
  - `locale_changed`（`LanguagePicker onChoose`）
  - `level_changed` global（`handleChooseLevel`）
  - `practice_started` + `weak_review_started`（`openChallenge`，依 `mode==="review"` 分流）
  - `useLanguage()` 提早到 analytics effects 之前（Codex must-fix 3：移除 TDZ violation）
- `src/hooks/usePracticeSession.ts`：`answer_submitted`（`handleChoiceSubmit`；`questionType` 用 `practiceMode`、`level` 用 `practiceFilter.examSection?.level ?? "all"`）、`level_changed` session（`handleLevelRangeChange`）。
- `src/components/ChallengePanel.tsx`：`practice_completed`（rising-edge `useEffect` on `sessionExhausted`）。
- `docs/analytics.md`（NEW）：event table、env gate、privacy rules。
- `.env.example`：補 `VITE_ZARAZ_ENABLED=true`（Codex must-fix 3）。

### 驗證
- `pnpm test`：695/695 passed（67 files；含新 11 tests；既有測試無回歸）。
- `pnpm build`：passes（tsc strict + vite build；`index` chunk 540.53 kB，未膨脹）。
- PR #476 CI：**Test and build** pass（唯一必過閘）、Cloudflare Pages pass、CodeRabbit pass。
- Codex Round 2：**SAFE，ready to merge**。

## Codex 雙重驗證結果

### Round 1 — must-fix（已全修）
1. `source`/`questionType` 型別太鬆（`string`）→ 改 `PracticeMode`。
2. `study_page_viewed` 漏 deep-link 與 index 入口 → 改 effect 涵蓋。
3. `useLanguage()` 在 effects 之後 → TDZ violation → 提早宣告。
4. `.env.example` 未更新 → 已補。

### Round 1 — spec gaps（未改，Codex 第二輪確認 acceptable）
- `/challenge` deep-link 初始載入不觸發 `practice_started`（Phase 1 邊緣，interim decision 1 acceptable）。
- Challenge nav 重按可能重觸發 `practice_started`（low-risk noise，未 fix）。
- `__setAnalyticsEnabledForTest` test-only override（acceptable）。

### Round 2 — SAFE
- 3 must-fix 全部 resolved；無新 must-fix。
- dedupe 邏輯正確（locale 變化不重 fire、離開 grammar 重置 ref）。
- `PracticeMode` typing 未破壞 wiring。

## 殘餘風險 / 未驗證項

1. **未 merge**：base branch policy 阻擋直接 merge（需人工 reviewer 批准）；repo 未啟用 auto-merge。Claude 未使用 `--admin` 強制繞過（破壞 branch protection，且 Codex 全域守則標示需人類判斷）。**PR 留給人類 review/merge**。Issue assignee 為 HanaYukii。
2. **Zaraz snippet 未部署**：本 PR 只加 client-side gate + event 呼叫。實際 prod 追蹤需同時 (a) `VITE_ZARAZ_ENABLED=true` 設在 prod env，(b) Cloudflare dashboard / index.html 裝設 Zaraz snippet。部署端工作，不在本 PR scope。
3. **未做瀏覽器 manual UI 驗證**：純 static build/test，沒有 dev server 跑。analytics 在 dev 預設 OFF，無法在 dev 觀察事件觸發。

## 自行設計決策（Codex 後審重點，全已驗證 acceptable）

1. `practice_started` 從 App `openChallenge` 觸發。in-session mode switch 走 `applyModePreset`（hook 內）不重觸發 → 無 double-fire。`resetSession` 不重觸發。
2. `level_changed` 同時發 global + session，用 `scope` 區分。
3. `answer_submitted.questionType` 復用 `practiceMode`（coarse、無內容）。
4. `practice_completed.level="all"`；fixed mock-section level 已由 `answer_submitted.level` 捕捉。
5. `practice_completed.totalQuestions = sessionTotal ?? attempts.length`（endless 模式永不 `sessionExhausted`，null 分支純防禦）。
6. `page_view.view` 型別為 `string`（非 App-internal `AppView` union）避免 lib→App 層耦合。
7. `answer_submitted.level = practiceFilter.examSection?.level ?? "all"`。

## 檔案清單

```
.env.example                        | +4
docs/analytics.md                   | +129
src/App.tsx                         | +38
src/components/ChallengePanel.tsx    | +30
src/hooks/usePracticeSession.ts      | +13
src/lib/analytics.test.ts           | +145
src/lib/analytics.ts                | +96
src/vite-env.d.ts                   | +9
```

## 下一步

- 人類 review + merge PR #476（CI 已綠、Codex 已 SAFE）。
- 部署端：裝設 Zaraz snippet + 設 prod env `VITE_ZARAZ_ENABLED=true`。
- Phase 2 議題另開 issue（GA4/PostHog、consent banner、server-side events、account/sync events、自有 DB 深度分析）—issue #404 已列 follow-up 清單。
