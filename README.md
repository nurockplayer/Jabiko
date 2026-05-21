# Jabiko

Jabiko 是給《大家的日本語》學習者使用的日文變化練習網站。第一版聚焦在動詞一二三類、普通形、辭書形、否定形、過去、て形、た形、否定て形 `ないで`、否定接續 `なくて`，以及い形容詞、な形容詞、名詞型的基本變化。

## 開發

```bash
rtk pnpm install
rtk pnpm dev
rtk pnpm test
rtk pnpm build
```

## 第一版範圍

- Vite + React + TypeScript 前端。
- 動詞與形容詞變化邏輯放在可測試的 TypeScript 模組。
- 支援單一形、て/た比較、否定整理、普通形整理等練習重點。
- 練習紀錄使用瀏覽器 LocalStorage。
- 不包含登入、後端、雲端同步或 AI 解釋生成。
