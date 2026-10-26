// Checks that every program page prints as a one-page handout.
// A page opts in with <body class="one-sheet"> (see print.css). Each one is
// printed to PDF on US letter and on A4, the way a browser's Print would,
// and the check fails if any copy needs a second sheet.
// Usage: npm run test:print   (starts its own local server)
import { readFile } from "node:fs/promises";
import httpServer from "http-server";
import { chromium } from "playwright";
import { PAGES } from "./pages.mjs";

const PORT = 8125;
const IN_CI = Boolean(process.env.GITHUB_ACTIONS);
const PAPER = ["Letter", "A4"];

// Every page in the list whose <body> has the one-sheet class
const sheets = [];
for (const page of PAGES) {
  const html = await readFile(page, "utf8");
  if (/<body[^>]*class="[^"]*\bone-sheet\b/.test(html)) sheets.push(page);
}
if (sheets.length === 0) {
  console.error("No pages with <body class=\"one-sheet\"> found. Did the program pages lose the class?");
  process.exit(1);
}

const server = httpServer.createServer({ root: ".", cache: -1, silent: true });
await new Promise((resolve) => server.listen(PORT, resolve));
const browser = await chromium.launch();
const page = await browser.newPage();
let failures = 0;

for (const path of sheets) {
  // Wait for the web fonts too: they change how much fits on the sheet
  await page.goto(`http://localhost:${PORT}/${path}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  for (const format of PAPER) {
    const pdf = await page.pdf({ format });
    // Each sheet is one "/Type /Page" object in the PDF ("/Pages" is the list)
    const sheetsUsed = (pdf.toString("latin1").match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
    if (sheetsUsed === 1) {
      console.log(`ok    ${path} (${format})`);
    } else {
      failures += 1;
      const message = `${path} prints on ${sheetsUsed} sheets of ${format} paper instead of one. Shorten the text, or remove a course row, until Print preview shows one page.`;
      console.log(`FAIL  ${message}`);
      if (IN_CI) console.log(`::error file=${path}::${message}`);
    }
  }
}

await browser.close();
server.close();

if (failures > 0) {
  console.log(`\n${failures} handout check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${sheets.length} program pages print on one sheet of letter and A4 paper.`);
