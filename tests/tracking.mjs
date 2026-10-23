// Checks the counted buttons (data-track) and keeps third-party scripts out.
//
// 1. Every data-track name used on a page is listed in analytics.html
//    (a <tr data-event="NAME"> row), and every listed name is used somewhere
//    on the demo site, so the guide and the pages can't drift apart.
// 2. Names are lowercase words joined by hyphens, and data-track-place is
//    only used next to data-track.
// 3. No page loads a script from another server. Campus Kit ships no
//    analytics or other third-party code.
//
// Built-in Node modules only, so it runs before `npm install`.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PAGES } from "./pages.mjs";

const GUIDE = "analytics.html";
const NAME = /^[a-z]+(-[a-z]+)*$/;
const problems = [];

const partials = readdirSync("partials")
  .filter((file) => file.endsWith(".html"))
  .map((file) => join("partials", file));
const files = [...PAGES, ...partials];

// Opening tags only, so text inside <pre><code> examples (written as &lt;a ...)
// isn't counted as a real button
const tags = (html) => html.replace(/<!--[\s\S]*?-->/g, "").match(/<[a-z][^>]*>/gi) || [];
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

// Names listed in the guide
const guide = readFileSync(GUIDE, "utf8");
const listed = new Set(tags(guide).map((tag) => attr(tag, "data-event")).filter(Boolean));
if (listed.size === 0) problems.push(`${GUIDE}: no <tr data-event="..."> rows found`);

// Names used on pages (the guide itself only shows examples)
const used = new Map();
for (const file of files) {
  const html = readFileSync(file, "utf8");
  for (const tag of tags(html)) {
    const src = attr(tag, "src");
    if (/^<script\b/i.test(tag) && src && /^(https?:)?\/\//.test(src)) {
      problems.push(`${file}: loads a script from another server (${src}). Campus Kit ships no third-party scripts.`);
    }
    if (file === GUIDE) continue;
    const name = attr(tag, "data-track");
    if (name === undefined) {
      if (attr(tag, "data-track-place") !== undefined) {
        problems.push(`${file}: data-track-place without data-track in ${tag}`);
      }
      continue;
    }
    if (!NAME.test(name)) {
      problems.push(`${file}: "${name}" isn't lowercase words joined by hyphens (like apply-start)`);
    }
    if (!used.has(name)) used.set(name, new Set());
    used.get(name).add(file);
  }
}

for (const [name, where] of used) {
  if (!listed.has(name)) {
    problems.push(`"${name}" is used in ${[...where].join(", ")} but isn't listed in ${GUIDE}. Add a row for it to the table of counted buttons.`);
  }
}
for (const name of listed) {
  const where = [...(used.get(name) || [])].filter((file) => file.startsWith("demo/") || file.startsWith("partials/"));
  if (where.length === 0) {
    problems.push(`${GUIDE} lists "${name}", but no demo page uses it. Remove the row or mark the button.`);
  }
}

if (problems.length) {
  console.error(`Counted buttons check failed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`Counted buttons: ${used.size} names, all listed in ${GUIDE}, on ${files.length} files. No third-party scripts.`);
