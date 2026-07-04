# Jabiko · ジャビ子

**A free, open, no-signup JLPT self-study web app.** Practice grammar, kanji
readings, vocabulary, and mock-exam-style questions from **N5 to N1** — wrong
answers flow into spaced-repetition review, so you keep drilling your weak
points. Open it and practise; nothing to install, no account needed.

> 免費、免註冊、開源的 **JLPT 日檢自習室**：N5〜N1 文法、漢字讀音、單字與依官方題型的練習，答錯自動排進間隔重複複習，跨裝置同步，打開就能練。

**▶ Live: [jabiko.app](https://jabiko.app/)**

![Jabiko](public/og-image.png)

---

## Features

- **Today's practice (今日練習)** — a guided ~20-question mixed set: due reviews first, then fresh grammar / vocab, balanced for you.
- **Exam question bank (綜合考題庫)** — ~2,000 original exam-style items across N5–N1: grammar-form choice, sentence-flow (文章脈絡), word order, kanji readings, vocabulary cloze, synonyms and usage. Level bands (N1/N2/N3/N4 備考 presets) let you dial the difficulty, and **unseen questions surface first** so new content comes up before things you've already done.
- **Conjugation drills (基礎變化)** — verb groups, ます/て・た, negatives, adjective and noun forms, potential / volitional / passive / causative, and more.
- **Kanji readings (漢字読み)** — an on'yomi/kun'yomi reference table (N5–N1) plus reading drills.
- **Weak-point review (弱點複習)** — a Leitner spaced-repetition system: miss a question and it comes back on a schedule until it sticks.
- **Grammar study pages** — jump from any grammar item to a focused note (formation, usage, examples, common confusions).
- **Cross-device sync** — your progress follows you across devices (optional sign-in; everything works logged-out too, stored locally first).
- **8-language UI** — Traditional Chinese, Japanese, English, Thai, Indonesian, Korean, Vietnamese, Burmese. Furigana toggle, dark / light theme.
- **Installable PWA** — add to home screen and practise offline.

## Who it's for

- JLPT candidates preparing for **N5 through N1**
- Self-learners and anyone working through **《大家的日本語》/ Minna no Nihongo**
- Learners who want short, focused drills with automatic weak-point review

## Tech stack

- **React 19 + TypeScript** (strict) + **Vite 7**, tested with **Vitest 4** / jsdom
- **Domain-driven** layout: business logic in `src/domain/`, UI in `src/components/`, hooks in `src/hooks/`
- **PWA** via `vite-plugin-pwa` (installable + offline)
- **Supabase** for optional cross-device sync
- **pnpm**; deployed on **Cloudflare Pages**

## Development

```bash
pnpm install
pnpm dev        # local dev server
pnpm test       # unit tests (Vitest)
pnpm build      # typecheck + production build
pnpm check:exam # fast content-guard check for question-bank edits
```

The question bank is generated from typed data in `src/domain/exam/items/` via
`scripts/import-exam-items.mjs`; content correctness is enforced by
`src/domain/contentGuard.test.ts`.

## Contributing

- **TDD** is the house rule: write the failing test first, then the code.
- New question-bank content follows a batch pipeline (author → adversarial
  double-answer / leak review → import → three content gates → PR). See
  `CLAUDE.md` and `docs/item-quality-rubric.md`.
- Every change lands via a PR; CI (`Test and build`) must be green before merge.

## Roadmap

Tracked in [GitHub Issues](https://github.com/nurockplayer/Jabiko/issues). In
flight / planned: AI-assisted content localisation (per-locale explanations),
a personal favourites list, more grammar study chapters (N3/N2), achievement
badges + daily goals, and data-driven difficulty once there's enough signal.

## License & credits

Built by **花雪 (HanaYukii)**. The mascot ジャビ子 is Jabiko's own.

> **License:** the source is public but a formal open-source license file has
> not been added yet — see [issue tracker] before reusing the code.

[issue tracker]: https://github.com/nurockplayer/Jabiko/issues
