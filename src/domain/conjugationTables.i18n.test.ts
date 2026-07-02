import { describe, expect, it } from "vitest";
import { CONJUGATION_TABLES, localizeConjugationTable } from "./conjugationTables";
import { conjugationTableI18n } from "./conjugationTables.i18n";

describe("conjugationTables i18n (#427)", () => {
  it("covers every table in en and ja with matching dimensions", () => {
    for (const table of CONJUGATION_TABLES) {
      for (const locale of ["en", "ja"] as const) {
        const overlay = conjugationTableI18n[table.id]?.[locale];
        expect(overlay, `${table.id}:${locale}`).toBeTruthy();
        expect(overlay!.columns.length, `${table.id}:${locale} columns`).toBe(table.columns.length);
        expect(overlay!.rows.length, `${table.id}:${locale} rows`).toBe(table.rows.length);
        overlay!.rows.forEach((row, index) => {
          expect(row.length, `${table.id}:${locale} row ${index}`).toBe(table.rows[index].length);
        });
        expect((overlay!.pitfalls ?? []).length, `${table.id}:${locale} pitfalls`).toBe(
          (table.pitfalls ?? []).length
        );
        // The caption is always Chinese prose in the source -- a matching
        // overlay caption means the table was not just copied through.
        expect(overlay!.caption).not.toBe(table.caption);
      }
    }
  });

  it("localizeConjugationTable swaps the text layer and keeps zh as fallback", () => {
    const base = CONJUGATION_TABLES[0];
    const en = localizeConjugationTable(base, "en", conjugationTableI18n);
    expect(en.id).toBe(base.id);
    expect(en.caption).toBe(conjugationTableI18n[base.id].en!.caption);
    // Unknown locale -> untouched base table.
    expect(localizeConjugationTable(base, "th", conjugationTableI18n)).toBe(base);
    expect(localizeConjugationTable(base, "zh-Hant", conjugationTableI18n)).toBe(base);
  });

  it("has no dangling overlay ids", () => {
    const ids = new Set(CONJUGATION_TABLES.map((table) => table.id));
    for (const id of Object.keys(conjugationTableI18n)) {
      expect(ids.has(id), `dangling table overlay: ${id}`).toBe(true);
    }
  });
});
