#!/usr/bin/env node
/* ==========================================================================
   Campus Kit — shared header and footer
   Copies partials/header.html and partials/footer.html into every demo page,
   so a menu change is made once. The output stays plain HTML: pages work
   when opened straight from disk, and nothing runs in the visitor's browser.

   In a page, mark where each partial goes:

     <!-- include: header section="academics" -->
     ...anything here is replaced...
     <!-- /include -->

   `section` is optional. It marks that section's menu link as the current
   page (aria-current="page").

   Usage:
     node scripts/includes.mjs          update every page
     node scripts/includes.mjs --check  change nothing; exit 1 if a page is
                                        out of date (used in CI)

   No dependencies: only Node's built-in modules.
   ========================================================================== */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEMO = join(ROOT, "demo");
const PARTIALS = join(ROOT, "partials");
const CHECK = process.argv.includes("--check");

const MARKER =
  /^([ \t]*)<!-- include: ([a-z-]+)((?: [a-z]+="[^"]*")*) -->\n[\s\S]*?^[ \t]*<!-- \/include -->/gm;

/** Load a partial and drop its leading explanatory comment. */
function loadPartial(name) {
  const path = join(PARTIALS, `${name}.html`);
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    throw new Error(`No partial named "${name}" (looked for ${relative(ROOT, path)})`);
  }
  return text.replace(/^<!--[\s\S]*?-->\n/, "").trimEnd();
}

/** Every .html file under demo/, in a stable order. */
function demoPages(dir = DEMO) {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return demoPages(path);
      return name.endsWith(".html") ? [path] : [];
    });
}

function parseAttributes(raw) {
  return Object.fromEntries([...raw.matchAll(/([a-z]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
}

function render(partial, page, attrs, indent) {
  const depth = relative(DEMO, dirname(page)).split(sep).filter(Boolean).length;
  const root = "../".repeat(depth);
  const known = new Set();
  const html = partial
    .replaceAll("{{root}}", root)
    .replace(/\{\{current:([a-z-]+)\}\}/g, (_, name) => {
      known.add(name);
      return name === attrs.section ? ' aria-current="page"' : "";
    });
  if (attrs.section && !known.has(attrs.section)) {
    throw new Error(
      `${relative(ROOT, page)}: section="${attrs.section}" doesn't match any menu link. ` +
        `Use one of: ${[...known].join(", ")}`
    );
  }
  return html
    .split("\n")
    .map((line) => (line ? indent + line : line))
    .join("\n");
}

// Show mistakes as one plain sentence, not a stack trace
process.on("uncaughtException", (error) => {
  console.error(error.message);
  process.exit(1);
});

const cache = new Map();
const outdated = [];
let markers = 0;

for (const page of demoPages()) {
  const before = readFileSync(page, "utf8");
  const after = before.replace(MARKER, (_, indent, name, rawAttrs) => {
    markers += 1;
    if (!cache.has(name)) cache.set(name, loadPartial(name));
    const attrs = parseAttributes(rawAttrs);
    const body = render(cache.get(name), page, attrs, indent);
    return `${indent}<!-- include: ${name}${rawAttrs} -->\n${body}\n${indent}<!-- /include -->`;
  });
  if (after !== before) {
    outdated.push(relative(ROOT, page));
    if (!CHECK) writeFileSync(page, after);
  }
}

if (CHECK) {
  if (outdated.length) {
    console.error("These pages don't match the shared header or footer:");
    for (const page of outdated) console.error(`  ${page}`);
    console.error('Run "npm run build" and commit the result.');
    process.exit(1);
  }
  console.log(`All ${markers} shared sections are up to date.`);
} else {
  console.log(
    outdated.length
      ? `Updated ${outdated.length} page${outdated.length === 1 ? "" : "s"}:\n  ${outdated.join("\n  ")}`
      : "Every page was already up to date."
  );
}
