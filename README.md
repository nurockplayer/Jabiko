# Jabiko

Jabiko 是給《大家的日本語》學習者使用的日文變化練習網站。第一版聚焦在動詞一二三類、普通形、辭書形、否定形、過去、て形、た形，以及い形容詞、な形容詞的基本變化。

## 開發

```bash
rtk npm install
rtk npm run dev
rtk npm test
rtk npm run build
```

## 第一版範圍

- Vite + React + TypeScript 前端。
- 動詞與形容詞變化邏輯放在可測試的 TypeScript 模組。
- 練習紀錄使用瀏覽器 LocalStorage。
- 不包含登入、後端、雲端同步或 AI 解釋生成。
