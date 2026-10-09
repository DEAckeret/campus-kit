// Runs axe-core accessibility checks (WCAG 2.2 A and AA) against every page.
// Usage: npm run test:a11y   (starts its own local server)
import { createServer } from "http-server";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  "index.html",
  "styleguide.html",
  "demo/index.html",
  "demo/programs.html",
  "demo/programs/biology.html",
  "demo/programs/_template.html",
  "demo/events.html",
  "demo/directory.html",
  "demo/news/article.html",
  "demo/flyer.html",
];
const PORT = 8123;
const IN_CI = Boolean(process.env.GITHUB_ACTIONS);

// In GitHub Actions, also report each problem as an annotation so it shows
// up on the run summary page without opening the full log.
function annotate(message) {
  if (IN_CI) console.log(`::error::${message.replace(/\n/g, " ")}`);
}

process.on("unhandledRejection", (error) => {
  annotate(`Test script crashed: ${error?.stack || error}`);
  console.error(error);
  process.exit(1);
});
const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "phone", width: 390, height: 844 },
];

const server = createServer({ root: ".", cache: -1, silent: true });
await new Promise((resolve) => server.listen(PORT, resolve));
const browser = await chromium.launch();
let failures = 0;

for (const viewport of VIEWPORTS) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  for (const path of PAGES) {
    await page.goto(`http://localhost:${PORT}/${path}`, { waitUntil: "load" });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();

    const problems = results.violations;
    const label = `${path} (${viewport.name})`;
    if (problems.length === 0 && errors.length === 0) {
      console.log(`  pass  ${label}`);
      continue;
    }
    failures += problems.length + errors.length;
    console.log(`  FAIL  ${label}`);
    for (const problem of problems) {
      console.log(`        ${problem.id}: ${problem.help}`);
      for (const node of problem.nodes.slice(0, 3)) console.log(`          at ${node.target.join(" ")}`);
      const where = problem.nodes.slice(0, 3).map((node) => node.target.join(" ")).join(" | ");
      annotate(`${label}: ${problem.id} (${problem.help}) at ${where}`);
    }
    for (const error of errors.splice(0)) {
      console.log(`        script error: ${error}`);
      annotate(`${label}: script error: ${error}`);
    }
  }
  await page.close();
}

await browser.close();
server.close();

if (failures > 0) {
  console.log(`\n${failures} accessibility problem(s) found.`);
  process.exit(1);
}
console.log("\nAll pages pass.");
