#!/usr/bin/env node
/* ==========================================================================
   Campus Kit — site-wide "page not found" page
   GitHub Pages shows the 404.html at the top of the site for every address
   that doesn't exist, at the address the visitor asked for. A visitor at
   /campus-kit/demo/programs/old-page.html sees it from that folder, so the
   relative links in demo/404.html ("apply.html", "../assets/...") would
   point at the wrong place and the page would load without its styles.

   This script copies demo/404.html and rewrites every relative link to a
   full path from the top of the site, so the copy works from any folder.
   The deploy step runs it; nobody needs to run it by hand.

   Usage:
     node scripts/site-404.mjs --base /campus-kit --out _site/404.html

   --base  where the site lives on its server: "/campus-kit" on GitHub
           Pages, "" for a custom domain or a local server. In the workflow
           this comes from actions/configure-pages.
   --out   where to write the copy.

   No dependencies: only Node's built-in modules.
   ========================================================================== */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "demo", "404.html");

function option(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1 || index + 1 >= process.argv.length) {
    console.error(`Missing --${name}. Usage: node scripts/site-404.mjs --base /campus-kit --out _site/404.html`);
    process.exit(1);
  }
  return process.argv[index + 1];
}

const base = option("base").replace(/\/+$/, "");
const out = option("out");
if (base && !base.startsWith("/")) {
  console.error(`--base should start with "/" (got "${base}")`);
  process.exit(1);
}

// demo/404.html's links are written relative to demo/
const pageFolder = new URL(`https://site.example${base}/demo/`);
let rewritten = 0;

// Leave alone: same-page links (#main), full addresses (https:, mailto:),
// and paths that already start at the top of the site (/...)
const isRelative = (url) => url !== "" && !/^(#|\/|[a-z][a-z0-9+.-]*:)/i.test(url);

const html = readFileSync(SOURCE, "utf8").replace(
  /(\s(?:href|src|action)=")([^"]*)"/g,
  (match, start, url) => {
    if (!isRelative(url)) return match;
    const resolved = new URL(url, pageFolder);
    rewritten += 1;
    return `${start}${resolved.pathname}${resolved.search}${resolved.hash}"`;
  }
);

if (!rewritten) {
  console.error("Found no relative links in demo/404.html, which is unexpected. Check the file.");
  process.exit(1);
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`Wrote ${out} with ${rewritten} links starting at "${base || "/"}".`);
