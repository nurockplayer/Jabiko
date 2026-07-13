// Minimal, testable quote-aware / brace-depth-aware parser that splits a
// TypeScript array literal of flat object literals into per-entry source
// strings.  Used by build-sitemap.mjs to parse rawArticleMetas without a
// bundler.
//
// Handles:
//  - Double-quoted strings (with escaped chars)
//  - Template-literals (backtick strings with ${…} interpolation)
//  - Top-level { … } nesting (objects within the array)
//  - Comma / }, inside strings do NOT affect boundary detection
//
// Does NOT handle: TypeScript generics with angle brackets, arbitrary-depth
// nesting beyond one level, computed property keys, spread, or comments.

/**
 * Split a TypeScript array-literal body (the content between `[...]`) into
 * per-entry source strings.  Each entry is one top-level object literal,
 * including its trailing property values.
 *
 * @param {string} body — the text between `[...]`
 * @returns {string[]} — per-entry substrings, in order
 * @throws {Error} if the body does not start with `{` or contains unbalanced
 *   braces/strings
 */
export function splitArrayEntries(body) {
  const entries = [];
  let i = 0;
  const len = body.length;

  while (i < len) {
    // Skip whitespace / newlines / commas between entries
    while (i < len && (/\s/.test(body[i]) || body[i] === ",")) i++;
    if (i >= len) break;

    // Expect '{'
    if (body[i] !== "{") {
      throw new Error(
        `Expected '{' at position ${i}, got ${JSON.stringify(body[i])}`
      );
    }

    // Scan to matching '}' at depth 0
    const start = i;
    let depth = 0;
    let inString = false;
    let inTemplate = false;
    let escape = false;

    while (i < len) {
      const ch = body[i];

      if (escape) {
        escape = false;
        i++;
        continue;
      }

      if (inString) {
        if (ch === "\\") {
          escape = true;
        } else if (ch === '"') {
          inString = false;
        }
        i++;
        continue;
      }

      if (inTemplate) {
        if (ch === "\\") {
          escape = true;
        } else if (ch === "$" && i + 1 < len && body[i + 1] === "{") {
          // Skip over "${...}" interpolation
          i += 2;
          let interpDepth = 1;
          while (i < len && interpDepth > 0) {
            if (body[i] === "{") interpDepth++;
            else if (body[i] === "}") interpDepth--;
            i++;
          }
          continue;
        } else if (ch === "`") {
          inTemplate = false;
        }
        i++;
        continue;
      }

      if (ch === '"') {
        inString = true;
        i++;
        continue;
      }

      if (ch === "`") {
        inTemplate = true;
        i++;
        continue;
      }

      if (ch === "{") {
        depth++;
        i++;
        continue;
      }

      if (ch === "}") {
        depth--;
        i++;
        if (depth === 0) {
          // End of this entry — swallow optional trailing comma
          if (i < len && body[i] === ",") i++;
          entries.push(body.slice(start, i));
          break;
        }
        if (depth < 0) {
          throw new Error(`Unbalanced '}' at position ${i}`);
        }
        continue;
      }

      i++;
    }

    if (depth !== 0) {
      throw new Error(`Unbalanced '{' — entry starting at ${start} never closed`);
    }
  }

  return entries;
}
