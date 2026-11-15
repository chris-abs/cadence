// Budget for the JavaScript the browser loads before the first screen: the
// entry chunk plus its static imports, gzipped. Route components are split out
// (TanStack Router autoCodeSplitting) and load on demand, so they are listed
// but not counted. Reads Vite's manifest from a fresh `vite build`.
import { readFileSync } from "node:fs";
import process from "node:process";
import { gzipSync } from "node:zlib";

const BUDGET_KB = 200;
const dist = new URL("../dist/", import.meta.url);

interface Chunk {
  file: string;
  isEntry?: boolean;
  imports?: string[];
}

function isChunk(value: unknown): value is Chunk {
  return typeof value === "object" && value !== null && "file" in value;
}

const parsed: unknown = JSON.parse(readFileSync(new URL(".vite/manifest.json", dist), "utf8"));
const manifest = new Map<string, Chunk>();
if (typeof parsed === "object" && parsed !== null) {
  for (const [key, value] of Object.entries(parsed)) {
    if (isChunk(value)) manifest.set(key, value);
  }
}

const gzipKb = (file: string) => gzipSync(readFileSync(new URL(file, dist))).length / 1024;

const entry = [...manifest.entries()].find(([, chunk]) => chunk.isEntry);
if (!entry) throw new Error("No entry chunk in the Vite manifest");

const initial = new Set<string>();
function collect(key: string) {
  const chunk = manifest.get(key);
  if (!chunk || initial.has(chunk.file)) return;
  initial.add(chunk.file);
  for (const dep of chunk.imports ?? []) collect(dep);
}
collect(entry[0]);

const lazy = [...manifest.values()]
  .map((chunk) => chunk.file)
  .filter((file) => file.endsWith(".js") && !initial.has(file));

const list = (label: string, files: string[]) => {
  for (const file of files)
    process.stdout.write(`  ${label} ${gzipKb(file).toFixed(1).padStart(6)} kB  ${file}\n`);
};
list("initial", [...initial]);
list("lazy   ", lazy);

const initialKb = [...initial].reduce((sum, file) => sum + gzipKb(file), 0);
const lazyKb = lazy.reduce((sum, file) => sum + gzipKb(file), 0);
process.stdout.write(
  `Initial JavaScript: ${initialKb.toFixed(1)} kB gzipped (budget ${BUDGET_KB} kB); ` +
    `lazy chunks: ${lazyKb.toFixed(1)} kB\n`,
);

if (initialKb > BUDGET_KB) {
  console.error(`Over budget by ${(initialKb - BUDGET_KB).toFixed(1)} kB`);
  process.exitCode = 1;
}
