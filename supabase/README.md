# Supabase（跨裝置進度同步 / #151）

本資料夾存放 Jabiko 跨裝置「錯題與進度（attempts）同步」用的資料庫結構。應用程式平時把資料存在本機 localStorage（`src/domain/storage.ts`），登入後才與這裡的 `attempts` 表雙向同步。

## migrations

- [`migrations/0001_create_attempts.sql`](migrations/0001_create_attempts.sql) — 建 `attempts` 表（每筆 attempt 一列、**複合主鍵 `(user_id, id)`**、`id` 為 deterministic key／hash、append-only）＋ 開 RLS（每位使用者只能讀寫自己的列）。複合主鍵讓不同使用者的相同 attempt 不會撞鍵丟資料。

## 手動步驟（agent 無專案登入，需你執行）

1. **建表**：把 `migrations/0001_create_attempts.sql` 全文貼到 Supabase Dashboard → SQL Editor → Run（或 `supabase db push`）。冪等、可重跑。
2. **端到端驗證**（待同步程式碼 P2/P3 上線後）：真人 Google 登入（最好兩個瀏覽器/裝置）確認進度確實同步 —— 驗證通過後才會放行 P5 的「已同步」UI 文案。
3. 確認 Supabase Auth 的 redirect / allowed URL 含你的部署網址（多半已 OK）。

**不需**新環境變數或密鑰：anon key 已設定，存取一律靠 RLS ＋ 使用者 JWT。

> 相關程式碼：`src/domain/attemptSync.ts`（合併邏輯, #153）、後續 `attemptRemote.ts`（P2 遠端 repo）、`useProgressAttempts.ts`（P3 串接）。追蹤見 issue #151。
