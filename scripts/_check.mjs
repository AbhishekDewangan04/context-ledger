/**
 * Temporary static checker (deleted after verification).
 *
 * 1. Transpiles every .ts/.tsx with sucrase -> catches syntax errors.
 * 2. Resolves every local import (@/... and relative) -> catches bad paths.
 * 3. Verifies every named import exists in the target module's exports.
 * 4. Verifies every package import is declared in package.json.
 * 5. Flags React hooks / DOM APIs in files missing "use client".
 */
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { transform } = require("sucrase");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const HOOK_RE =
  /\b(useState|useEffect|useRef|useMemo|useCallback|useReducer|useContext|useLayoutEffect|useFrame|useThree|useReducedMotion|useMotionValue|useSpring|useTransform|useParams)\s*\(/;
const DOM_RE = /\b(window\.|document\.|navigator\.|sessionStorage|localStorage)\b/;
const HANDLER_RE = /\son[A-Z][A-Za-z]*=\{/;

const problems = [];
const notes = [];

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "out"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function resolveLocal(spec, fromFile) {
  const base = spec.startsWith("@/")
    ? path.join(ROOT, spec.slice(2))
    : path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function exportedNames(source) {
  const names = new Set();
  if (/export\s+default\b/.test(source)) names.add("default");
  for (const match of source.matchAll(
    /export\s+(?:async\s+)?(?:function|const|let|var|class|type|interface|enum)\s+([A-Za-z0-9_$]+)/g,
  )) {
    names.add(match[1]);
  }
  for (const match of source.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const raw of match[1].split(",")) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(/\s+as\s+/);
      names.add(parts[parts.length - 1].trim().replace(/^type\s+/, ""));
    }
  }
  if (/export\s+\*/.test(source)) names.add("*");
  return names;
}

function importedBindings(source) {
  const bindings = [];

  for (const match of source.matchAll(/import\s+([^;]*?)\s+from\s+["']([^"']+)["']/g)) {
    const clause = match[1].trim();
    const spec = match[2];
    const typeOnly = /^type\s/.test(clause);

    if (!typeOnly) {
      const withoutNamed = clause.replace(/\{[^}]*\}/, "").replace(/,\s*$/, "").trim();
      if (withoutNamed) bindings.push({ spec, name: "default" });
    }

    const named = clause.match(/\{([^}]*)\}/);
    if (named) {
      for (const raw of named[1].split(",")) {
        const trimmed = raw.trim().replace(/^type\s+/, "");
        if (!trimmed) continue;
        bindings.push({ spec, name: trimmed.split(/\s+as\s+/)[0].trim() });
      }
    }
  }

  for (const match of source.matchAll(/import\s*\(\s*["']([^"']+)["']\s*\)/g)) {
    bindings.push({ spec: match[1], name: "default" });
  }

  return bindings;
}

function packageName(spec) {
  const parts = spec.split("/");
  return spec.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
}

const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
const declared = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
]);

const files = (await walk(ROOT)).sort();
const sources = new Map();

for (const file of files) {
  const source = await readFile(file, "utf8");
  sources.set(file, source);

  try {
    transform(source, { transforms: ["typescript", "jsx"], filePath: file });
  } catch (error) {
    problems.push(`${path.relative(ROOT, file)} -> syntax: ${error.message.split("\n")[0]}`);
  }

  const relative = path.relative(ROOT, file);
  const isClient = /^\s*["']use client["']/.test(source);

  if (!isClient) {
    const usesHook = HOOK_RE.test(source);
    const usesDom = DOM_RE.test(source);
    const usesHandler = HANDLER_RE.test(source);
    if (usesHook || usesHandler) {
      notes.push(
        `${relative} -> no "use client" but uses ${usesHook ? "React hooks" : "event handlers"}${
          usesDom ? " and DOM APIs" : ""
        }`,
      );
    } else if (usesDom) {
      notes.push(`${relative} -> touches browser globals without "use client"`);
    }
  }
}

for (const file of files) {
  const source = sources.get(file);
  const relative = path.relative(ROOT, file);

  for (const binding of importedBindings(source)) {
    const { spec, name } = binding;

    if (spec.startsWith(".") || spec.startsWith("@/")) {
      const target = resolveLocal(spec, file);
      if (!target) {
        problems.push(`${relative} -> unresolved import "${spec}"`);
        continue;
      }
      const targetSource = sources.get(target) ?? (await readFile(target, "utf8"));
      const exports = exportedNames(targetSource);
      if (name && !exports.has(name) && !exports.has("*")) {
        problems.push(
          `${relative} -> "${name}" is not exported by ${path.relative(ROOT, target)}`,
        );
      }
      continue;
    }

    if (spec.startsWith("node:")) continue;

    const name_ = packageName(spec);
    if (name_ === "next" || name_ === "react" || name_ === "react-dom") continue;
    if (!declared.has(name_)) {
      problems.push(`${relative} -> package "${name_}" is not in package.json`);
    }
  }
}

console.log(`Checked ${files.length} TypeScript files under ${path.relative(process.cwd(), ROOT)}`);
console.log(`\nProblems (${problems.length}):`);
for (const problem of problems) console.log(`  ✗ ${problem}`);

console.log(`\nNotes (${notes.length}):`);
for (const note of notes) console.log(`  · ${note}`);

if (problems.length > 0) process.exitCode = 1;