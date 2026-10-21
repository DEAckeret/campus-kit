#!/usr/bin/env node
/* ==========================================================================
   Campus Kit — site performance report
   Fills in the "Latest results" section of report.html from Lighthouse CI's
   results, so the published page always shows the scores for the version
   of the site it belongs to. The workflow runs it after `lhci collect` and
   `lhci upload --target=filesystem`; nobody needs to run it by hand.

   Usage:
     node scripts/performance-report.mjs --results lighthouse-results [--out report.html]

   --results  the folder `lhci upload --target=filesystem` wrote, with its
              manifest.json and one JSON report per run.
   --out      where to write the page (default: report.html, in place).

   It reads the budgets from lighthouserc.json and checks that the budget
   table in report.html says the same thing, so the page can't drift from
   the real check. It doesn't fail when a page misses a budget; `lhci
   assert` does that in the next step.

   No dependencies: only Node's built-in modules.
   ========================================================================== */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = join(ROOT, "report.html");
const START = "<!-- performance-results -->";
const END = "<!-- /performance-results -->";

// The categories in the order the table shows them, with the names people see
const CATEGORIES = [
  ["performance", "Performance"],
  ["accessibility", "Accessibility"],
  ["seo", "SEO"],
  ["best-practices", "Best practices"],
];

// Names for pages whose <title> doesn't say what they are
const PAGE_NAMES = {
  "index.html": "Campus Kit project page",
  "demo/index.html": "Demo home page",
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) {
    if (fallback !== undefined) return fallback;
    fail(`Missing --${name}. Usage: node scripts/performance-report.mjs --results lighthouse-results`);
  }
  return process.argv[index + 1];
}

const escape = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const resultsDir = resolve(option("results"));
const out = resolve(option("out", PAGE));

// ---- Budgets, from the same file Lighthouse CI uses ------------------------
const config = JSON.parse(readFileSync(join(ROOT, "lighthouserc.json"), "utf8"));
const budgets = {};
for (const [id] of CATEGORIES) {
  const assertion = config.ci.assert.assertions[`categories:${id}`];
  // Only "error" assertions stop a deploy; "warn" ones are shown for reference
  if (assertion && assertion[0] === "error") budgets[id] = Math.round(assertion[1].minScore * 100);
}

let html = readFileSync(PAGE, "utf8");
for (const [id, name] of CATEGORIES) {
  const match = html.match(new RegExp(`data-budget="${id}">([^<]*)<`));
  if (!match) fail(`report.html has no budget cell for ${name} (data-budget="${id}").`);
  const expected = id in budgets ? String(budgets[id]) : "None";
  if (!new RegExp(`^${expected}(\\D|$)`).test(match[1])) {
    fail(`report.html says the ${name} budget is "${match[1]}", but lighthouserc.json says ${expected}. Update the budget table.`);
  }
}

// ---- Results ----------------------------------------------------------------
let manifest;
try {
  manifest = JSON.parse(readFileSync(join(resultsDir, "manifest.json"), "utf8"));
} catch (error) {
  fail(`Couldn't read ${join(resultsDir, "manifest.json")}: ${error.message}`);
}

// Lighthouse CI marks the median run of each page as its representative run
const runs = manifest.filter((entry) => entry.isRepresentativeRun);
if (runs.length === 0) fail("The manifest has no representative runs.");

const pages = config.ci.collect.url.map((url) => new URL(url).pathname.replace(/^\//, ""));

function pageName(path) {
  if (PAGE_NAMES[path]) return PAGE_NAMES[path];
  const title = readFileSync(join(ROOT, path), "utf8").match(/<title>([^<|]*)/);
  return title ? title[1].trim() : path;
}

const rows = runs
  .map((entry) => {
    const path = new URL(entry.url).pathname.replace(/^\//, "");
    // jsonPath may be absolute or relative; the file is always in the results folder
    const file = [resolve(entry.jsonPath), join(resultsDir, basename(entry.jsonPath))].find(existsSync);
    if (!file) fail(`Couldn't find ${entry.jsonPath}.`);
    const lhr = JSON.parse(readFileSync(file, "utf8"));
    const audit = (id) => lhr.audits[id]?.numericValue;
    const scores = {};
    for (const [id] of CATEGORIES) {
      const score = lhr.categories[id]?.score;
      scores[id] = typeof score === "number" ? Math.round(score * 100) : null;
    }
    return {
      path,
      name: pageName(path),
      fetchTime: lhr.fetchTime,
      version: lhr.lighthouseVersion,
      scores,
      fcp: audit("first-contentful-paint"),
      lcp: audit("largest-contentful-paint"),
      tbt: audit("total-blocking-time"),
      cls: audit("cumulative-layout-shift"),
      bytes: audit("total-byte-weight"),
    };
  })
  .sort((a, b) => pages.indexOf(a.path) - pages.indexOf(b.path));

// ---- Formatting ---------------------------------------------------------------
const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];

function formatDate(iso) {
  const date = new Date(iso);
  const hours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const time = `${hours % 12 || 12}:${minutes} ${hours < 12 ? "a.m." : "p.m."}`;
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}, at ${time} UTC`;
}

const number = (value, digits) =>
  typeof value === "number"
    ? value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : "Not measured";

function scoreCell(row, id) {
  const score = row.scores[id];
  if (score === null) return "<td>Not scored</td>";
  if (id in budgets && score < budgets[id]) {
    return `<td><strong class="over-budget">${score}, below ${budgets[id]}</strong></td>`;
  }
  return `<td>${score}</td>`;
}

const misses = rows.filter((row) =>
  Object.keys(budgets).some((id) => row.scores[id] !== null && row.scores[id] < budgets[id])
);

const lowest = Object.keys(budgets).map((id) => {
  const low = rows.reduce((min, row) => (row.scores[id] < min.scores[id] ? row : min));
  const name = id === "seo" ? "SEO" : CATEGORIES.find(([key]) => key === id)[1].toLowerCase();
  const all = rows.every((row) => row.scores[id] === low.scores[id]);
  return all ? `${name} ${low.scores[id]} on every page` : `${name} ${low.scores[id]} (${escape(low.name)})`;
});

const sha = process.env.GITHUB_SHA;
const repo = process.env.GITHUB_REPOSITORY;
const server = process.env.GITHUB_SERVER_URL || "https://github.com";
const commit = sha
  ? `, from commit <a href="${server}/${repo}/commit/${sha}"><code>${sha.slice(0, 7)}</code></a>`
  : "";
const checked = rows.map((row) => row.fetchTime).sort().at(-1);

let status;
if (misses.length === 0) {
  status = `<section class="callout" aria-labelledby="status-title">
          <h3 id="status-title">All ${rows.length} pages met every budget</h3>
          <p>Lowest scores: ${lowest.join(", ")}.</p>
        </section>`;
} else {
  const list = misses
    .map((row) => {
      const missed = Object.keys(budgets)
        .filter((id) => row.scores[id] < budgets[id])
        .map((id) => `${CATEGORIES.find(([key]) => key === id)[1]} ${row.scores[id]}`);
      return `<li>${escape(row.name)}: ${missed.join(", ")}</li>`;
    })
    .join("\n            ");
  const count = misses.length === 1 ? "1 page" : `${misses.length} pages`;
  status = `<section class="callout callout--alert" aria-labelledby="status-title">
          <h3 id="status-title">${count} missed a budget</h3>
          <ul>
            ${list}
          </ul>
          <p>This version of the site can't be published until the scores are back within budget.</p>
        </section>`;
}

const scoreRows = rows
  .map((row) => `<tr><th scope="row"><a href="${escape(row.path)}">${escape(row.name)}</a></th>${CATEGORIES.map(([id]) => scoreCell(row, id)).join("")}</tr>`)
  .join("\n              ");

const speedRows = rows
  .map((row) => `<tr><th scope="row"><a href="${escape(row.path)}">${escape(row.name)}</a></th><td>${number(row.fcp / 1000, 1)}</td><td>${number(row.lcp / 1000, 1)}</td><td>${number(row.tbt, 0)}</td><td>${number(row.cls, 2)}</td><td>${number(row.bytes / 1024, 0)}</td></tr>`)
  .join("\n              ");

const section = `${START}
        <p class="note">Checked ${formatDate(checked)}${commit}, with Lighthouse ${escape(rows[0].version)}.</p>
        ${status}

        <section class="table-wrap" tabindex="0" aria-labelledby="scores-caption">
          <table class="table--numbers">
            <caption id="scores-caption">Lighthouse scores by page, out of 100</caption>
            <thead>
              <tr><th scope="col">Page</th>${CATEGORIES.map(([, name]) => `<th scope="col">${name}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${scoreRows}
            </tbody>
          </table>
        </section>

        <section class="table-wrap" tabindex="0" aria-labelledby="speed-caption">
          <table class="table--numbers">
            <caption id="speed-caption">Loading speed and download size by page</caption>
            <thead>
              <tr><th scope="col">Page</th><th scope="col">First text (seconds)</th><th scope="col">Main content (seconds)</th><th scope="col">Blocked time (milliseconds)</th><th scope="col">Layout shift</th><th scope="col">Download size (KB)</th></tr>
            </thead>
            <tbody>
              ${speedRows}
            </tbody>
          </table>
        </section>
        <p class="note">Times are for a simulated mid-range phone on a slow 4G connection, so they're slower than most visitors will see. Google calls a page good when its main content shows within 2.5 seconds and its layout shift is 0.1 or less.</p>
        ${END}`;

const startAt = html.indexOf(START);
const endAt = html.indexOf(END);
if (startAt === -1 || endAt === -1) fail(`report.html is missing the ${START} and ${END} markers.`);
html = html.slice(0, startAt) + section + html.slice(endAt + END.length);

writeFileSync(out, html);
console.log(`Wrote ${out}: ${rows.length} pages, ${misses.length} over budget.`);
