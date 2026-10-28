// Saves each social media graphic on a page as a PNG file.
// Every element with data-graphic="square" or "story" and a data-file name
// is drawn at 1080px wide and saved in demo/social/ under that name.
// The export stops with a message (and exits with an error) if a graphic
// isn't exactly 1080 x 1080 or 1080 x 1920, which happens when the text is
// too long to fit, or if a story's text runs into the bands the apps cover.
// Usage: npm run social                       (demo/social.html)
//        npm run social -- demo/social-open-house.html
//        npm run social -- --out some/folder  (save somewhere else)
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import httpServer from "http-server";
import { chromium } from "playwright";

const PORT = 8126;
const IN_CI = Boolean(process.env.GITHUB_ACTIONS);
const SIZES = { square: { width: 1080, height: 1080 }, story: { width: 1080, height: 1920 } };
// The story bands covered by the account name (top) and reply box (bottom),
// in pixels of the PNG. The same sizes are tokens in tokens.css.
const STORY_SAFE = { top: 250, bottom: 340 };

const args = process.argv.slice(2);
let outDir = "demo/social";
const pages = [];
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--out") outDir = args[(i += 1)];
  else pages.push(args[i]);
}
if (pages.length === 0) pages.push("demo/social.html");

function problem(file, message) {
  console.log(`FAIL  ${message}`);
  if (IN_CI) console.log(`::error file=${file}::${message}`);
}

const server = httpServer.createServer({ root: ".", cache: -1, silent: true });
await new Promise((resolve) => server.listen(PORT, resolve));
const browser = await chromium.launch();
// Wide and tall enough that the window never squeezes a graphic
const page = await browser.newPage({ viewport: { width: 1280, height: 2100 }, deviceScaleFactor: 1 });
await mkdir(outDir, { recursive: true });
let failures = 0;
let saved = 0;

for (const path of pages) {
  const response = await page.goto(`http://localhost:${PORT}/${path}`, { waitUntil: "networkidle" });
  if (!response || !response.ok()) {
    failures += 1;
    problem(path, `${path} didn't open. Check the file name.`);
    continue;
  }
  await page.evaluate(() => document.documentElement.classList.add("social-export"));
  await page.evaluate(() => document.fonts.ready);

  const graphics = page.locator("[data-graphic]");
  const count = await graphics.count();
  if (count === 0) {
    failures += 1;
    problem(path, `${path} has no graphics. Each one needs data-graphic="square" or "story".`);
    continue;
  }

  for (let i = 0; i < count; i += 1) {
    const graphic = graphics.nth(i);
    const kind = await graphic.getAttribute("data-graphic");
    const file = await graphic.getAttribute("data-file");
    const size = SIZES[kind];
    if (!size || !file || !/^[a-z0-9-]+\.png$/.test(file)) {
      failures += 1;
      problem(path, `Graphic ${i + 1} on ${path} needs data-graphic="square" or "story" and a data-file name like event-name-square.png.`);
      continue;
    }

    const box = await graphic.boundingBox();
    const width = Math.round(box.width);
    const height = Math.round(box.height);
    if (width !== size.width || height !== size.height) {
      failures += 1;
      problem(path, `${file} would be ${width} x ${height} pixels instead of ${size.width} x ${size.height}. The text is too long to fit: shorten the title or the details.`);
      continue;
    }

    if (kind === "story") {
      // Every line of text must sit between the covered bands
      const outside = await graphic.evaluate((el, safe) => {
        const top = el.getBoundingClientRect().top;
        const height = el.getBoundingClientRect().height;
        const found = [];
        for (const node of el.querySelectorAll("p, dt, dd, .wordmark, span")) {
          const r = node.getBoundingClientRect();
          if (!r.height) continue;
          if (r.top - top < safe.top || r.bottom - top > height - safe.bottom) found.push(node.textContent.trim().slice(0, 40));
        }
        return found;
      }, STORY_SAFE);
      if (outside.length) {
        failures += 1;
        problem(path, `${file}: "${outside[0]}" sits where the apps cover the story. Shorten the text so it fits between the top ${STORY_SAFE.top}px and bottom ${STORY_SAFE.bottom}px.`);
        continue;
      }
    }

    const png = await graphic.screenshot({ type: "png", animations: "disabled" });
    await writeFile(join(outDir, file), png);
    saved += 1;
    console.log(`saved ${join(outDir, file)} (${size.width} x ${size.height})`);
  }
}

await browser.close();
server.close();

if (failures > 0) {
  console.log(`\n${failures} graphic(s) not saved.`);
  process.exit(1);
}
console.log(`\nSaved ${saved} graphic(s) in ${outDir}.`);
