#!/usr/bin/env node
/* build.mjs — validate content, then bundle src/ into a single index.html.
 *
 * Usage: node build.mjs [--out dist/index.html] [--max-bytes 200000]
 *
 * Pipeline:
 *   1. Load every module in dependency order (constants → plan → validatePlan
 *      → reducer → render → clock → audio → storage → taught → demo → commit → app).
 *   2. Run validateAll(PLANS, EX) — fail the build on over-length labels.
 *   3. Concatenate modules + inject CSS into shell.html.
 *   4. Enforce a size gate (default 200 KB) so the bundle stays lean for the
 *      glasses' Web App cache.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "src");
const OUT = resolve(__dirname, "dist", "index.html");

// Dependency order matters: each module attaches to SetPace.api.<name> at
// load time, and app.js reads them all. constants first (EX/PLANS/LEVEL_MULT),
// then pure helpers, then adapters, then app.
const MODULES = [
  "core/constants.js",
  "core/plan.js",
  "core/validatePlan.js",
  "core/reducer.js",
  "core/render.js",
  "adapters/clock.js",
  "adapters/audio.js",
  "adapters/storage.js",
  "adapters/taught.js",
  "adapters/dom/demo.js",
  "adapters/dom/commit.js"
];

function read(p) {
  return readFileSync(resolve(SRC, p), "utf8");
}

// --- 1. Load modules in Node to run validatePlan ---------------------------
const sandbox = { SetPace: { api: {} } };
for (const m of MODULES) {
  const code = read(m);
  // Pass module as undefined so each module attaches to SetPace.api.<name>
  // (the `module.exports` branch is only for Node require, not the browser).
  const fn = new Function("SetPace", "module", "exports", code + "\n;return SetPace;");
  fn(sandbox.SetPace, undefined, {});
}
const { PLANS, EX } = sandbox.SetPace.api.constants;
const { validateAll } = sandbox.SetPace.api.validatePlan;

const errors = validateAll(PLANS, EX);
if (errors.length) {
  console.error("Content validation failed:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`Content OK: ${Object.keys(PLANS).length} plans, ${Object.keys(EX).length} exercises`);

// --- 2. Concatenate modules + app ------------------------------------------
const css = read("styles.css");
const modulesJs = MODULES.map(read).join("\n\n");
const appJs = read("app.js");

let html = read("shell.html");
html = html.replace("/*__SETPACE_CSS__*/", css);
html = html.replace("/*__SETPACE_MODULES__*/", modulesJs);
html = html.replace("/*__SETPACE_APP__*/", appJs);

// --- 3. Size gate --------------------------------------------------------------
const bytes = Buffer.byteLength(html, "utf8");
const maxBytes = Number(process.env.SETPACE_MAX_BYTES || 200000);
if (bytes > maxBytes) {
  console.error(`Bundle ${bytes} bytes exceeds gate ${maxBytes} bytes`);
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
console.log(`Built ${OUT} (${bytes} bytes)`);