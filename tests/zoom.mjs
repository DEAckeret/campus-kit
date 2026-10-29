// Checks every page at high zoom and with extra text spacing:
//   - 200% and 400% browser zoom (WCAG 1.4.4 and 1.4.10). Zooming a
//     1280 x 900 window to 200% leaves 640 x 450 CSS pixels; 400% leaves
//     320 x 225, so those viewport sizes stand in for zoom.
//   - 200% text size only (the browser's font-size setting), at 1280px.
//   - The WCAG 1.4.12 text-spacing overrides, at 1280px, 390px and 320px.
// A page fails if it scrolls sideways, if something sticks out past the
// right edge (outside a scrolling table or code box), or if text is cut off
// inside a box that hides overflow. The phone menu is checked open, too.
// Usage: npm run test:zoom   (starts its own local server)
import httpServer from "http-server";
import { chromium } from "playwright";
import { PAGES, SKIP_WELCOME, WELCOME_PAGE } from "./pages.mjs";

const PORT = 8124;
const IN_CI = Boolean(process.env.GITHUB_ACTIONS);
const SPACING = `*, *::before, *::after {
  line-height: 1.5 !important;
  letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important;
}
p { margin-bottom: 2em !important; }`;
const CONDITIONS = [
  { name: "200% zoom", width: 640, height: 450 },
  { name: "400% zoom", width: 320, height: 225 },
  { name: "200% text size", width: 1280, height: 900, fontSize: 32 },
  { name: "text spacing, 1280px", width: 1280, height: 900, css: SPACING },
  { name: "text spacing, 390px", width: 390, height: 844, css: SPACING },
  { name: "text spacing, 320px", width: 320, height: 225, css: SPACING },
];

function annotate(message) {
  if (IN_CI) console.log(`::error::${message.replace(/\n/g, " ")}`);
}

// Runs inside the page. Returns a list of problems in plain words.
function findProblems() {
  const problems = [];
  const root = document.documentElement;
  const width = root.clientWidth;
  if (root.scrollWidth > width + 1) {
    problems.push(`page scrolls sideways (${root.scrollWidth}px wide in a ${width}px window)`);
  }
  const isHidden = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const style = getComputedStyle(e);
      if (style.display === "none" || style.visibility === "hidden") return true;
      if (e.classList.contains("visually-hidden") || e.classList.contains("skip-link")) return true;
    }
    return false;
  };
  // Wide tables and code samples scroll inside their own box, which is allowed
  const insideScroller = (el) => {
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(e).overflowX)) return true;
    }
    return false;
  };
  const describe = (el) => {
    const classes = typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/).join(".")}` : "";
    return `${el.tagName.toLowerCase()}${classes} "${el.textContent.trim().replace(/\s+/g, " ").slice(0, 40)}"`;
  };
  for (const el of document.body.querySelectorAll("*")) {
    if (isHidden(el)) continue;
    const box = el.getBoundingClientRect();
    if (box.width && box.height && box.right > width + 1 && !insideScroller(el)) {
      problems.push(`sticks out ${Math.round(box.right - width)}px past the right edge: ${describe(el)}`);
    }
    const style = getComputedStyle(el);
    if (/(hidden|clip)/.test(style.overflowX + style.overflowY) && el.tagName !== "PROGRESS" && el.textContent.trim()) {
      if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) {
        problems.push(`text is cut off: ${describe(el)}`);
      }
    }
  }
  return [...new Set(problems)];
}

const server = httpServer.createServer({ root: ".", cache: -1, silent: true });
await new Promise((resolve) => server.listen(PORT, resolve));
const browser = await chromium.launch();
let failures = 0;

for (const condition of CONDITIONS) {
  const context = await browser.newContext({ viewport: { width: condition.width, height: condition.height } });
  await context.addInitScript(SKIP_WELCOME);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Page.enable");

  for (const path of [...PAGES, WELCOME_PAGE]) {
    if (condition.fontSize) {
      // The same setting as "Font size" in the browser's settings
      await cdp.send("Page.setFontSizes", { fontSizes: { standard: condition.fontSize, fixed: Math.round(condition.fontSize * 0.8125) } });
    }
    await page.goto(`http://localhost:${PORT}/${path}`, { waitUntil: "load" });
    if (condition.css) await page.addStyleTag({ content: condition.css });
    if (path === WELCOME_PAGE && !(await page.locator("dialog[data-demo-welcome][open]").count())) {
      failures += 1;
      console.log(`  FAIL  ${path} (${condition.name}): the welcome note didn't open on a first visit`);
      annotate(`${path} (${condition.name}): the welcome note didn't open on a first visit`);
      continue;
    }

    const states = [{ label: "", open: false }];
    const toggle = page.locator("[data-nav-toggle]");
    // The menu can't be opened behind the welcome note
    if (path !== WELCOME_PAGE && (await toggle.count()) && (await toggle.first().isVisible())) states.push({ label: ", menu open", open: true });

    for (const state of states) {
      if (state.open) await toggle.first().click();
      const problems = await page.evaluate(findProblems);
      const label = `${path} (${condition.name}${state.label})`;
      if (problems.length === 0) {
        console.log(`  pass  ${label}`);
        continue;
      }
      failures += problems.length;
      console.log(`  FAIL  ${label}`);
      for (const problem of problems.slice(0, 5)) {
        console.log(`        ${problem}`);
        annotate(`${label}: ${problem}`);
      }
    }
  }
  await context.close();
}

await browser.close();
server.close();

if (failures > 0) {
  console.log(`\n${failures} zoom or text-spacing problem(s) found.`);
  process.exit(1);
}
console.log("\nAll pages pass at 200% and 400% zoom and with text spacing.");
