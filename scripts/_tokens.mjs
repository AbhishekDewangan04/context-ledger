/**
 * Temporary token checker (deleted after verification).
 * Flags colour utilities that reference a token which is not defined in
 * app/globals.css and is not a Tailwind default — those silently do nothing.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const css = await readFile(path.join(ROOT, "app/globals.css"), "utf8");
const tokens = new Set();
for (const match of css.matchAll(/--(?:color|font|radius)-([a-z0-9-]+)\s*:/g)) tokens.add(match[1]);

const IGNORE = new Set([
  "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl",
  "light", "normal", "medium", "semibold", "bold", "extrabold",
  "left", "center", "right", "justify", "start", "end", "clip", "ellipsis", "wrap", "nowrap", "balance", "pretty",
  "top", "bottom", "middle", "first", "last", "odd", "even",
  "t", "b", "l", "r", "x", "y", "s", "e", "tl", "tr", "br", "bl",
  "solid", "dashed", "dotted", "double", "none", "hidden", "collapse", "separate", "inner", "outer", "inset",
  "white", "black", "transparent", "current", "inherit",
]);

const utilityRe =
  /\b(bg|text|border|ring|from|via|to|marker|fill|stroke|divide|outline|accent|caret|decoration)-([a-z][a-z0-9-]*)(?:\/\d{1,3})?/g;

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "out"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else if (/\.(tsx|ts|css)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const flagged = new Map();

for (const file of await walk(ROOT)) {
  if (file.endsWith("globals.css")) continue;
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(utilityRe)) {
    const utility = match[1];
    const name = match[2];
    if (IGNORE.has(name) || name.startsWith("offset") || name.startsWith("gradient")) continue;
    if (tokens.has(name)) continue;

    const bare = name.replace(/-(50|100|200|300|400|500|600|700|800|900|950)$/, "");
    if (["slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose"].includes(bare)) continue;

    const key = `${utility}-${name}`;
    const hits = flagged.get(key) ?? [];
    hits.push(path.relative(ROOT, file));
    flagged.set(key, hits);
  }
}

console.log(`Tokens defined in globals.css: ${[...tokens].sort().join(", ")}`);
console.log(`\nUnresolved colour utilities: ${flagged.size}`);
for (const [key, hits] of [...flagged].sort()) {
  console.log(`  ? ${key}  (${[...new Set(hits)].join(", ")})`);
}