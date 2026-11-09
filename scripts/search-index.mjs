#!/usr/bin/env node
/* ==========================================================================
   Campus Kit — site search index
   Reads the title and description of every demo page and writes them to
   demo/search-index.json, which the search page (demo/search.html) searches
   in the visitor's browser. It also writes the same pages as a plain list
   into the search page, between these markers, for visitors without
   JavaScript:

     <!-- search-index: list -->
     ...replaced every time...
     <!-- /search-index -->

   Which pages are in it: every page under demo/ that has the shared header
   (<!-- include: header -->), except
     - pages marked <meta name="robots" content="noindex"> (the search page
       and "page not found"), which search engines skip too
     - templates, whose file names start with "_"
   Print and social media pages (the flyer, the graphics) have no shared
   header, so they aren't in it.

   What gets searched is each page's <title> (the part before " | "; the
   home page is called "Home page") and its <meta name="description">. To change how a page shows up in search, edit
   those two lines in the page, then run this script.

   Usage:
     node scripts/search-index.mjs          update the index and the list
                                            (npm run build runs this)
     node scripts/search-index.mjs --check  change nothing; exit 1 if either
                                            is out of date (used in CI)

   No dependencies: only Node's built-in modules.
   ========================================================================== */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEMO = join(ROOT, "demo");
const INDEX = join(DEMO, "search-index.json");
const SEARCH_PAGE = join(DEMO, "search.html");
const CHECK = process.argv.includes("--check");

const LIST_MARKER = /^([ \t]*)<!-- search-index: list -->\n[\s\S]*?^[ \t]*<!-- \/search-index -->/m;

// Show mistakes as one plain sentence, not a stack trace
process.on("uncaughtException", (error) => {
  console.error(error.message);
  process.exit(1);
});

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

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (text) =>
  text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (whole, name) => ENTITIES[name.toLowerCase()] ?? whole)
    .replace(/\s+/g, " ")
    .trim();
const escape = (text) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const pages = [];
for (const path of demoPages()) {
  const html = readFileSync(path, "utf8");
  const file = relative(ROOT, path);
  if (basename(path).startsWith("_")) continue;
  if (!/<!-- include: header[ a-z="-]*-->/.test(html)) continue;
  if (/<meta name="robots" content="[^"]*noindex/i.test(html)) continue;

  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (!title) throw new Error(`${file} has no <title>. Add one, or mark the page noindex.`);
  if (!description) {
    throw new Error(`${file} has no <meta name="description">. Search shows it under the title, so add one sentence about the page.`);
  }
  pages.push({
    // The home page's title is the college's name, so call it what it is
    title: path === join(DEMO, "index.html") ? "Home page" : decode(title).split(" | ")[0],
    description: decode(description),
    url: relative(DEMO, path).split(sep).join("/"),
  });
}
pages.sort((a, b) => a.title.localeCompare(b.title, "en"));

const json = `${JSON.stringify(
  {
    note: "Made by scripts/search-index.mjs from each page's title and description. Don't edit by hand: run npm run build.",
    pages,
  },
  null,
  2
)}\n`;

if (!existsSync(SEARCH_PAGE)) throw new Error("demo/search.html is missing.");
const before = readFileSync(SEARCH_PAGE, "utf8");
if (!LIST_MARKER.test(before)) {
  throw new Error("demo/search.html has no <!-- search-index: list --> ... <!-- /search-index --> markers.");
}
const after = before.replace(LIST_MARKER, (_, indent) => {
  const items = pages.flatMap((page) => [
    `${indent}  <li>`,
    `${indent}    <a href="${escape(page.url)}">${escape(page.title)}</a>`,
    `${indent}    <p>${escape(page.description)}</p>`,
    `${indent}  </li>`,
  ]);
  return [
    `${indent}<!-- search-index: list -->`,
    `${indent}<ul class="link-list" id="all-pages-list">`,
    ...items,
    `${indent}</ul>`,
    `${indent}<!-- /search-index -->`,
  ].join("\n");
});

const outdated = [];
if (!existsSync(INDEX) || readFileSync(INDEX, "utf8") !== json) outdated.push("demo/search-index.json");
if (after !== before) outdated.push("the list of every page in demo/search.html");

if (CHECK) {
  if (outdated.length) {
    console.error("The site search index doesn't match the pages' titles and descriptions:");
    for (const file of outdated) console.error(`  ${file}`);
    console.error('Run "npm run build" and commit the result.');
    process.exit(1);
  }
  console.log(`The search index is up to date (${pages.length} pages).`);
} else {
  writeFileSync(INDEX, json);
  writeFileSync(SEARCH_PAGE, after);
  console.log(
    outdated.length
      ? `Updated ${outdated.join(" and ")} (${pages.length} pages).`
      : `The search index was already up to date (${pages.length} pages).`
  );
}
