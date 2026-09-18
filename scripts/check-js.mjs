// check-js.mjs - structural gate: every script the browser will run must PARSE.
//
// Catches the 2026-09-18 outage class: a hand edit to a page (PR #60, Instagram removal)
// truncated the inline `self.__next_f.push(...)` payload, leaving an unterminated string.
// String-presence checks stayed GREEN; the homepage showed "This page couldn't load".
//
// Checks (no network, fast - compiles in-process, never executes):
//   1. every inline <script> (no src) in every .html file  -> must compile as JS
//   2. every <script type="application/ld+json">            -> must be valid JSON
//   3. every .js file in the site (incl. _next chunks)       -> must compile as JS
//
// Usage: node scripts/check-js.mjs [build_dir]   exit 0 = all parse, 1 = broken script found
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";

const build = path.resolve(process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), ".."));
const SKIP_DIRS = new Set([".git", "node_modules", "scripts", ".github", "functions"]);

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) yield* walk(path.join(dir, e.name)); }
    else yield path.join(dir, e.name);
  }
}

// Classic script first; ES module syntax (import/export) is valid in module chunks.
function compiles(code) {
  try { new vm.Script(code); return null; }
  catch (e) {
    if (/import|export/.test(e.message)) {
      const r = spawnSync(process.execPath, ["--input-type=module", "--check"], { input: code, encoding: "utf8" });
      return r.status === 0 ? null : (r.stderr.match(/SyntaxError: .*/) || [r.stderr.trim()])[0];
    }
    return e.message;
  }
}

const fails = [];
let scripts = 0, files = 0;
const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

for (const f of walk(build)) {
  const rel = path.relative(build, f);
  if (f.endsWith(".html")) {
    const html = fs.readFileSync(f, "utf8");
    let m, i = 0;
    while ((m = SCRIPT_RE.exec(html))) {
      i++;
      const attrs = m[1], code = m[2];
      if (/\bsrc\s*=/.test(attrs) || !code.trim()) continue;
      const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || "";
      scripts++;
      if (/ld\+json|application\/json/i.test(type)) {
        try { JSON.parse(code); } catch (e) { fails.push(`${rel} script #${i} (${type}): invalid JSON - ${e.message}`); }
      } else if (!type || /javascript|module/i.test(type)) {
        const err = compiles(code);
        if (err) fails.push(`${rel} inline script #${i}: ${err} | starts: ${code.slice(0, 90).replace(/\s+/g, " ")}`);
      }
    }
  } else if (f.endsWith(".js") || f.endsWith(".mjs")) {
    files++;
    const err = compiles(fs.readFileSync(f, "utf8"));
    if (err) fails.push(`${rel}: ${err}`);
  }
}

console.log("=".repeat(56));
console.log(` JS parse gate: ${scripts} inline scripts, ${files} .js files`);
if (fails.length) {
  console.log(` \x1b[31mRED - ${fails.length} script(s) will not parse. The page will crash in the browser. DO NOT deploy.\x1b[0m`);
  for (const x of fails.slice(0, 20)) console.log("   - " + x);
  console.log("=".repeat(56));
  process.exit(1);
}
console.log(" \x1b[32mGREEN - every script parses.\x1b[0m");
console.log("=".repeat(56));
