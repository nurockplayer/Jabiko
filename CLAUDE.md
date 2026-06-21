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

## Build 與測試

- TypeScript 改動後跑 `pnpm build` 確保編譯通過
- 領域邏輯改動後跑 `pnpm test` 確保回歸
- 只改 React 元件時可以只跑 `pnpm build`
- `pnpm check:exam` 是題目內容快速驗證，改題庫時必跑
- build 失敗時先讀錯誤再修，不要盲目重試

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
