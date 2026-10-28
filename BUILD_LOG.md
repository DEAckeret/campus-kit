# Build log

Every AI work session on Campus Kit adds an entry here, newest first. Each entry says what was built, what went wrong, and what was decided, so anyone can see exactly how an AI-built project comes together, mistakes included.

---

## Session 12: October 28, 2026 (social media graphics)

**Built by:** Claude (Opus 5.5), in a scheduled session with nobody watching, so decisions below are mine and open to Dustin's review.

### What I built

- **A social media graphics page,** [`demo/social.html`](demo/social.html), for one event (the fall choir concert from the events page): a square post (1080 × 1080) and a story (1080 × 1920) side by side, the alt text to paste in when posting, a short "Before you post" list, and steps for making graphics for another event. The events page links to it from the concert listing.
- **An export script,** `scripts/social-graphics.mjs` (`npm run social`, or `npm run social -- demo/some-other-page.html`). It opens the page, draws every element marked `data-graphic="square"` or `"story"` at 1080 pixels wide, and saves each as a PNG named by its `data-file`, in `demo/social/` (git-ignored). It refuses to save, with a plain message, if a graphic comes out the wrong size (the text is too long to fit) or if any text on a story sits in the top 250 or bottom 340 pixels, where Instagram and Facebook cover a story with the account name and reply box.
- **CI runs the export** after the print check, so every push proves the graphics still fit, and the deploy publishes the PNGs made there. The page's "Download the square PNG" and "Download the story PNG" links point at those files.
- **A new component,** `.social-graphic` in `components.css`, with its sizes as new `--social-*` tokens, and a style guide entry with a live square example (the fall open house) and its HTML.
- Listed on the project page, the README and the file map in `CLAUDE.md`.

### What I decided and why

- **The preview is the picture.** Everything inside a graphic is sized in `cqi` units (a share of the preview box's width), so the 28rem preview on screen is an exact small copy of the PNG, and the script only has to widen the box to 1080 pixels before taking the picture. The other way, a fixed 1080-pixel graphic scaled down with `transform` or `zoom`, would need JavaScript to fit the preview to a phone.
- **Playwright as the exporter, not a canvas in the browser.** Turning HTML into a PNG in the browser without a library means an SVG `foreignObject` trick that loses the web fonts. Playwright is already a dev dependency, so the script adds nothing new. The cost: making a PNG takes `npm run social` on a computer with the repo, which is a web team job, not something a staff member does from the page. The page says so.
- **Each graphic is marked `role="img"` and labeled by the visible alt text.** A screen reader hears the graphic once, the way people will meet the posted image, instead of reading the square and the story's text one after the other. Writing the alt text on the page also makes it part of the deliverable.
- **The text is written twice,** once in each graphic, so the page works with JavaScript off and the HTML reads plainly. Editing one event means changing both; the comment at the top of the graphics and the steps on the page say so. A version that fills both from one set of fields is listed below.
- **No outline in the PNG.** The thin border that frames the preview on screen is an outline, which doesn't change the size and is switched off for the export.
- **Room to spare on the square.** My first layout left about 20 pixels free with the local fallback fonts. Literata is wider than the fallback, so a date that fits here could wrap on CI and fail. I tightened the spacing to leave about 130 pixels, enough for one extra line, and checked it by adding letter spacing until it broke: it still fit at 0.04em extra.
- **Text stays in Literata and Public Sans on paper and spruce,** with no gold text. Measured contrast: white on spruce 7.8 to 1, the gold tint series name on spruce 7.0 to 1, the muted labels on white 7.6 to 1.

### How I checked it

- `npm run social` saves both graphics at exactly 1080 × 1080 and 1080 × 1920, and HTML validation and axe passed on CI for the new page and the style guide. I looked at both PNGs. I also checked that it fails: before I fixed a CSS mistake (below) the square came out 1080 × 1133, and the script refused it with the "too long to fit" message.
- The style guide example also exports cleanly (`npm run social -- styleguide.html --out` a scratch folder).
- Screenshots of `demo/social.html` at 1280px and 390px, with JavaScript on and off, and of the style guide entry at both widths. One `h1`, no duplicate IDs, no sideways scrolling.
- `tests/zoom.mjs` passes on all 17 pages under all six conditions, including the new page. The include and tracking checks pass.

### What went wrong

- **Still no `npm test` here.** The npm registry and Google Fonts are blocked in this workspace, so HTML validation, axe and the export in the real fonts run only in CI. I ran the zoom check and the export with the globally installed Playwright and `http-server` linked into the git-ignored `node_modules`.
- **My first margin reset beat the layout.** I reset margins with `.social-graphic dl`, which is more specific than `.social-graphic__details`, so the details lost their side margin and sat flush against the left edge. Switching the reset to `:where()` made it too weak to beat `base.css`'s `p` margin, and the square grew to 1133 pixels tall. The fix is `.social-graphic :where(p, dl, dd)`, which sits between the two.
- **Text on the small preview is small.** At a 390px phone width the labels on the preview are about 11 pixels tall, and the preview doesn't grow with the browser's text size setting, because it's a faithful copy of an image. Everything on it is also in the alt text box below, in normal page text.
- **The first CI run failed the zoom check,** and it was my mistake. With the real web fonts and the WCAG text-spacing overrides at 390px, the square preview came out 9px wider than the window and the page scrolled sideways. A graphic is a one-column grid, and a grid column grows to fit its longest word unless told otherwise, so one wide word in the wider Literata pushed the whole preview out. The fallback fonts here are narrower, so my local run passed. I reproduced it by raising the letter spacing until it broke (0.2em did it), then gave the graphic a column that can shrink (`minmax(0, 1fr)`) and let long words break on screen. In the PNG, words still never break in the middle: the export now measures each line of text and stops if a word runs into the side margin. I checked that with a made-up 39-letter place name, which it refused.
- **Result on CI:** the second run on `main` passed every step: HTML validation, axe, zoom and text spacing on all 17 pages, the one-sheet check, the social graphics export in the web fonts, and the Lighthouse budgets. The deploy published the two PNG files (about 175 KB together). I couldn't open the live site from this workspace to look at them, so I haven't seen the graphics in Literata and Public Sans myself.

### Left for next time

- **Idea:** a small form on the page that fills both graphics from one set of fields (with JavaScript on), and a script option that takes the same fields, so nobody edits the text twice.
- **Idea:** an athletics version with the gold accents, and a landscape size (1200 × 630) for link previews and X.
- **For Dustin:** the PNGs on the live page are made by CI in the web fonts, so they're the ones to judge; the ones I looked at used fallback fonts.
- Still open from earlier: the QR code idea for the program handout, the Node 20 warning on the workflow's actions, and the `lighthouse-trial` branch from session 9, which Dustin can delete.
- The screen reader pass is Dustin's. The event detail page is the next AI item.

---

## Session 11: October 26, 2026 (program one-sheet for print)

**Built by:** Claude (Opus 5.5), in a scheduled session with nobody watching, so decisions below are mine and open to Dustin's review.

### What I built

- **Every program page now prints as a one-page handout** for college fairs. Before, printing the biology page took three sheets with most of the third one blank. Now it's one sheet: the wordmark across the top, the program name and summary, the key facts, what you'll study, the course table, after graduation and the quote, and a row along the bottom with the department contact, related programs, and a "Learn more" block with a short web address and the Office of Admission's email and phone.
- **How a page opts in:** `<body class="one-sheet">`. The rules are in a new section of `print.css`. Things meant for the screen (the breadcrumbs, the advisor box with its button, the "On this page" links) drop out; parts marked `print-only` appear only on paper. The biology page and the program template both have it, so new program pages get it by default.
- **A "Print this page" box** at the end of the program page sidebar, with a "Print a one-page handout" button. It appears only when JavaScript is running, because a button can't start printing without it; the browser's own Print gives the same handout either way.
- **A new check, `tests/print.mjs`** (`npm run test:print`, runs last in CI). It finds every page with the `one-sheet` class, prints it to PDF on US letter and on A4 the way Chrome's Print does, and fails if any copy needs a second sheet. I checked that it fails by making the type larger on purpose.
- **A style guide entry,** "Program handout (print)," with the Learn more block (shown on screen there so readers can see it) and the print box.
- **Docs:** a new step in [Adding a program page](docs/adding-a-program-page.md), "Check the printed handout," with what to do when it runs onto a second page, plus a line in the template's comments, the README, the project page and the file map in `CLAUDE.md`.

### What I decided and why

- **One root size scales the whole sheet.** Every size in the kit is in `rem`, so printing at a root size of 9pt (a new token, `--print-root-size`) shrinks the type scale and all the spacing together, keeping their proportions. Body text comes out at about 9.6pt. I tried bigger: at 9.5pt the biology page ran onto a second sheet.
- **The sidebar becomes a row along the bottom, not a narrow right column.** My first version kept the two columns; the contact column was so narrow that `biology@sleepinggiant.example` broke in the middle and the web address broke across three lines. A full-width row reads like the footer of a handout, and the main text gets the whole width. The trade-off is long lines (about 110 characters) in the main text. A two-column layout for "What you'll study" would read better but needs more markup on every program page; I left it as an idea.
- **A short web address on the handout,** `sleepinggiant.example/biology`, instead of the page's full path. That's what colleges print, and the long one broke awkwardly. The template's placeholder is `SHORT-ADDRESS`, and the guide tells editors to ask the web team for one.
- **The handout's phone and email are still demo links** (`data-demo-contact`), per the contact link rule, even though they're mostly read on paper. On paper they print as plain text.
- **No QR code.** A QR code pointing at the page would help at a college fair, but it needs a QR encoder: either a library (the npm registry is blocked here, and the rules say no third-party scripts) or a few hundred lines of hand-written encoding. Listed below.
- **No page size in the CSS.** The sheet prints on whatever paper the printer has, and the check covers both letter and A4. Margins are 0.5 inch (other pages keep 0.6), written in `print.css` because custom properties don't work inside `@page`.
- **The narrowest column in the bottom row** is a token too (`--print-column`), so the only sizes written outside `tokens.css` are the existing print margins.

### How I checked it

- `tests/print.mjs` passes for the biology page and the template on letter and A4. I also tried a copy of the biology page with two more courses and one more learning outcome: still one sheet. That's what the guide's "six to eight courses usually fit" is based on.
- How much room is left: with the local fallback fonts, the biology page still fit at a 10pt root size on A4 but not on letter, so there's roughly 10% to spare.
- I looked at the PDF of the biology page as an image, before (three sheets) and after.
- On screen: screenshots of the program sidebar at 1280px and 390px, with JavaScript on (print box shows, button calls Print) and off (print box hidden, Learn more hidden), and of the style guide entry. One `h1`, no duplicate IDs, no sideways scrolling on the biology page or the style guide.
- `tests/zoom.mjs` passes on all 16 pages under all six conditions. The include and tracking checks pass.
- No new colors. The handout uses the ink, muted ink and line colors already in the tokens.

### What went wrong

- **Still no `npm test` here.** The npm registry and Google Fonts are both blocked in this workspace, so HTML validation and axe run only in CI, and I ran the print and zoom checks with the globally installed Playwright and `http-server` linked into the git-ignored `node_modules`.
- **The real fonts are the real test, and I couldn't use them here.** Locally the page prints in fallback fonts. Literata and Public Sans have different widths and heights, so the one-sheet check on CI, where the web fonts load, is the first time the handout is measured in the fonts people will actually print with. The check waits for the fonts to load before printing.
- **Result on CI:** the first run on `main` passed every step. The biology page and the template each printed on one sheet of letter and of A4 with the web fonts loaded, HTML validation and axe passed on the changed pages, Lighthouse budgets held, and the site deployed. I didn't measure how much room is left in the real fonts; if a future edit to the biology page fails the check, that's the check doing its job.
- **My first heading spacing didn't apply.** The screen rule `.with-sidebar > div > h2:not(:first-child)` is more specific than my print rule, so "Sample courses" kept its large screen margin on paper. I repeated that selector in the print rule.

### Left for next time

- **Idea for Dustin:** a QR code on the handout pointing to the page. It needs a small QR encoder written into the repo (no library), or a QR image made once per page.
- **Idea:** publish a PDF of the biology handout with the site, made in CI with the real fonts, so reviewers on a phone can see the handout without a Print preview.
- The Node 20 warning on the workflow's actions is still open. CI also now notes that `ubuntu-latest` is moving to Ubuntu 26; nothing broke this run, but a failure on a run where nothing changed may be that.
- **For Dustin:** the `lighthouse-trial` branch from session 9 can still be deleted.
- The screen reader pass is Dustin's. The social media graphics template is the next AI item.

---

## Session 10: October 23, 2026 (analytics guide)

**Built by:** Claude (Opus 5.5), in a scheduled session with nobody watching, so decisions below are mine and open to Dustin's review.

### What I built

- **An analytics guide** at `analytics.html`, written for a college web and marketing team. It covers the three numbers worth watching (application starts, visit sign-ups, program searches) and what to do when each one moves; numbers to read with care (page views alone, time on page, bounce rate, news spikes); what to look for in a privacy-friendly tool; how buttons are marked, with rules for names; a table of every counted button on the demo; the code to connect a tool; and a 20-minute monthly check-in. It's linked from a new "Measures what matters" note on the project page, the style guide and the README.
- **`data-track` names on the demo's key buttons and forms:** `apply-start` (Start your application), `visit-signup` (Visit campus on the home page, and a new "Sign up for the open house" link on the events page), `program-search` (the home page and 404 search boxes, and the program finder), `advisor-request` (Request a meeting, on the biology page and in the program template, with a comment telling editors to keep it), and `give-start` (both Give online buttons, told apart with `data-track-place="top"` and `"sidebar"`). Nothing reads them; no analytics code ships.
- **A new check, `tests/tracking.mjs`** (`npm run check:tracking`, built-in Node modules only, runs first in CI). It fails if a page uses a `data-track` name that isn't in the guide's table, if the table lists a name no demo page uses, if a name isn't lowercase words joined by hyphens, or if any page loads a script from another server. That last one turns the "no third-party scripts" rule into something the build enforces. I checked each failure by breaking a page on purpose.
- **A style guide entry,** "Counted buttons," next to the demo contact links.
- Added the page to `tests/pages.mjs`, the deploy step's file list, the file map in `CLAUDE.md` and the README.

### What I decided and why

- **The guide is a published page, not a Markdown file in `docs/`.** The roadmap said "a doc," but the docs folder isn't published, and this guide is for the web and marketing team rather than faculty editing a page. As a page it goes through the same HTML, axe and zoom checks as everything else, and the table of names can be checked against the pages. It uses the project page's header, like the performance report.
- **Three numbers, not a dashboard's worth.** The roadmap named apply clicks, visit sign-ups and program searches; I kept those as the main three and listed advisor requests and gift starts as extras that departments and Advancement will ask for.
- **The tool section names tools as examples but makes no claims about them.** Plausible, Fathom, Simple Analytics, Matomo and GoatCounter are listed "to compare against this list," with the list of what to ask for. Vendors change their terms; the criteria don't. It also tells the reader to check with their privacy office and update the privacy notice.
- **The code sample is in the guide only, and it works.** I pulled it out of the page and ran it on the demo in headless Chromium with `console.log` standing in for a tool. Each click sent one event with the right name and place; a program finder search for "pre-med" sent `found: 0`, which is the gap the guide tells people to look for; arriving at `programs.html?q=nursing` from the home page sent nothing extra; and typing a name in the directory search sent nothing.
- **Program searches send the words, cut to 60 characters. Directory searches send nothing.** Program search words are the most useful thing in the report; directory search words are people's names. The guide says this as a rule.
- **No "show the tracked buttons" mode on the demo.** It would make the attributes visible to someone browsing the demo, but it's more script for a demo-only feature. Listed below as an idea.

### How I checked it

- `tests/tracking.mjs` and the include check pass. `tests/zoom.mjs` passes on all 16 pages under all six conditions.
- My usual checks in headless Chromium on the new page and every page I changed, at 1280px and 390px, with JavaScript on and off: one `h1`, no skipped heading levels, no duplicate IDs, every `aria-labelledby` target present, every in-page link has a target, no sideways scrolling.
- I looked at screenshots of the guide at both widths, the style guide entry, the project page notes and the events page's new link. On phones the code samples and the table scroll inside their own focusable regions.
- No new colors. The guide uses existing components (page header, sidebar, callout, table, `.sg-code`).

### What went wrong

- **Still no `npm test` here.** The npm registry is blocked in this workspace, so HTML validation and axe run only in CI. `http-server` wasn't installed either, so I ran the zoom test against a 20-line stand-in in the git-ignored `node_modules`.
- **I first wrote that the giving page has a button "at the top and another in the sidebar."** Running the code sample showed the top button is hidden on wide screens (it's only for phones, where the sidebar falls to the bottom). The guide now says so.
- **Event names broke at their hyphens on phones** (`apply-` / `start`) in the table. They now stay on one line and the table scrolls.
- **The first CI run failed HTML validation.** I'd given the scrolling code samples `role="region"` on the `<pre>`, and html-validate asks for a real `<section>` instead. Each sample is now a focusable `<section>` with a name holding the `<pre>`, the same pattern as the scrolling tables. I can't run html-validate here, so CI was the first place it could catch this; a page with a new pattern is worth one look at the validator's rules before pushing.
- **Four notes on the project page left one alone on a row.** The notes grid now has wider columns, so it reads two by two on desktop.

### Left for next time

- **Idea for Dustin:** a "show counted buttons" view of the demo (for example `?show=tracking`) that outlines each marked button with its name, so reviewers can see the markup without reading the source.
- The Node 20 warning on the workflow's actions is still open.
- **For Dustin:** the `lighthouse-trial` branch from session 9 can still be deleted.
- The screen reader pass is Dustin's. The program one-sheet for print is the next AI item.

---

## Session 9: October 21, 2026 (site performance report)

**Built by:** Claude (Opus 5.5), in a scheduled session with nobody watching, so decisions below are mine and open to Dustin's review.

### What I built

- **Lighthouse CI on every push.** The workflow now runs Lighthouse three times on ten pages (the project page and nine demo pages) with its phone settings: a mid-range phone on a slow 4G connection. Budgets live in `lighthouserc.json`: performance 90 or higher, accessibility 100, SEO 90 or higher. Missing any of them fails the check, so the site isn't deployed. Best practices is shown but only warns.
- **A published report** at `report.html`, linked from the project page's header and its "Accessible by default" note. It says when the check ran and from which commit, whether every page met its budgets (and which missed, if any), a table of the four scores per page, a table of speed figures (first text, main content, blocked time, layout shift, download size) in plain words, the budgets with what each score checks, and how the check works, including that a perfect accessibility score doesn't mean a page is fully accessible.
- **How the scores get onto the page.** `scripts/performance-report.mjs` (built-in Node modules only) reads Lighthouse CI's results and fills the "Latest results" section between two comment markers. It runs in the check job before HTML validation, axe and the zoom test, so all three check the filled-in page. The check job hands the filled page to the deploy job. The committed `report.html` says the scores appear when the site is published and links to the live report. The full Lighthouse results are kept as a workflow artifact on every run.
- **Two new components in the style guide:** a *number table* (`table--numbers`: right-aligned columns with equal-width digits, plus `over-budget` for a missed target, which also says the miss in words, like "82, below 90") and an *alert callout* (`callout--alert`), for problems the reader should act on.
- Added `report.html` to `tests/pages.mjs`, the README and the file map in `CLAUDE.md`, and `npm run test:lighthouse` for running the budgets locally.

### A real bug Lighthouse found: the page jumped on phones

The first CI run scored most demo pages 82 or 83 for performance, with a layout shift of 0.33 to 0.38 (Google's "good" is 0.1 or less). The cause: on phones, the menu was drawn open, and only when `main.js` loaded (it's deferred) did it close, so the whole page jumped up by the height of the menu. Real visitors on slow connections would have seen that.

- Every page that loads `main.js` now adds the `js` class with one line of inline script in its `<head>`, before anything is drawn, and the menu CSS hides it until it's opened (`.js .main-nav:not([data-open="true"])`). The menu starts closed with no jump.
- With JavaScript off the inline line doesn't run either, so the menu still shows as a plain list, as before.
- I reproduced it locally by delaying `main.js` in headless Chromium at 412px: layout shift was 0.311 on every demo page before and 0.001 to 0.011 after. The menu still opens and closes. In CI, every page now scores 99 or 100 for performance.
- Trade-off: if `main.js` fails to load while JavaScript is on, the phone menu stays closed. That's the usual cost of this pattern.

### Then the first run on `main` failed

The trial branch passed with every page at 99 or 100, but the first run on `main`, with the same code, scored four pages 87 or 88. The log showed why: the time to first text went from under 2 seconds to 2.8 to 3.1 seconds. Nothing on the page had changed. The difference was the Google Fonts stylesheet, the one file that comes from another server. The browser waited for it before drawing anything, so however fast Google answered that day decided the score. Real visitors wait on it the same way.

- **The web fonts no longer hold up the page.** Each page now asks for the Google Fonts stylesheet as a preload and switches it on when it arrives, so text appears straight away in a system font and changes to Literata and Public Sans a moment later. Fonts already used `display=swap`, so visitors could already see that switch; it can now just happen sooner than the fonts. Without JavaScript, a `<noscript>` copy of the link loads the fonts the old way. The print flyer keeps the old way, since it's printed, not browsed.
- **The print styles no longer hold up the page either.** `print.css` is all print rules, so its link now says `media="print"` and the browser doesn't wait for it on screen.
- I couldn't measure this here, because Google Fonts is blocked in this workspace, so the next run on `main` was the test. It passed: all 30 runs scored 99 or 100 for performance, with none of the slow first runs seen earlier, and the site deployed. One good run doesn't prove the scores will hold steady; if a later session sees the budget fail on a run where nothing changed, the next step is hosting the fonts with the site.

### What I decided and why

- **Lighthouse runs in the existing check job, not a new one.** That way the page with real scores goes through the same HTML, axe and zoom checks as every other page, with no second copy of the setup. It adds about six minutes to each run.
- **Scores are the median of three runs, and the report uses the same median as the budget check.** On the first try the report and `lhci assert` disagreed (8 pages over budget on the page, 5 in the check), because Lighthouse CI's "representative run" and its `median-run` assertion don't pick the same run. Both now use the median score per category (`"aggregationMethod": "median"`), so they can't disagree. The speed table comes from the run with the median performance score. This matters: in the passing run, two pages had one cold run at 57 and 63 while the other two were 100.
- **Accessibility budget is 100, not 95.** The site already passes axe on every page, and every page scored 100, so anything less would let a regression through.
- **Ten pages, not all fifteen.** I left out the style guide, the flyer, the blank template, the 404 page and the report itself: they're tools or print pages, not pages a visitor browses, and each page adds about 30 seconds.
- **The report and the budget file can't drift apart.** The budget table cells carry `data-budget="…"`, and the script stops the build if they don't match `lighthouserc.json`. I checked this by changing a budget and watching it fail.
- **No full Lighthouse reports on the site.** Each is about a megabyte of Lighthouse's own HTML and script, untested by our checks. They're in the workflow's `lighthouse-results` artifact instead. If Dustin wants a "full report" link per page, they could be published under `report/`.
- **The script prints what held each page back** in the CI log (slow metrics, savings Lighthouse suggests, failed audits), because that's the first thing a person needs when a budget fails, and I couldn't download the results artifact from this workspace.

### How I checked it

- **Tested in CI before touching `main`.** The npm registry is still blocked here, so Lighthouse can't run in this workspace. I pushed a temporary branch (`lighthouse-trial`) and ran the workflow on it by hand three times; the deploy step is skipped on any branch but `main`. Run 1 showed the layout-shift problem, run 2 added the diagnostics, run 3 passed every step, including HTML validation, axe and zoom on the filled-in report. I then squashed the work into one commit on `main`. Deleting the branch afterward was refused by this workspace (403), so `lighthouse-trial` is still on GitHub; it can be deleted safely.
- Locally: the script against made-up results with every page passing and with two pages missing a budget; `tests/zoom.mjs` on all 15 pages, including the filled-in report; and my usual checks in headless Chromium at 1280px and 390px, with JavaScript on and off: one `h1`, no skipped headings, no duplicate IDs, every `aria-labelledby` target present, no sideways scrolling. I looked at screenshots of the report at both widths (both states) and of the two style guide entries. On phones the score tables scroll sideways inside their named regions, like the other tables.
- Contrast: `over-budget` red (#a3261b) on white is 7.4 to 1; ink on the alert tint is 13.4 to 1; a link on the alert tint is 6.7 to 1.

### What went wrong

- **Performance failed on the first real run,** as above. Good that the check exists; it found a problem I'd never have seen in a desktop browser.
- **My first report used Lighthouse CI's representative run,** which didn't match what the budget check measured. Fixed by using medians in both.
- **I first gave the budgets table `table--numbers`,** which right-aligned its text column. I caught it before the screenshots. Also the alert callout needed space above the first table; added `.callout + .table-wrap`.
- **I couldn't look at the Lighthouse results directly.** The artifact download host is blocked here, so I added log output and read the job log instead.

### Left for next time

- **Text compression and unused CSS.** Lighthouse flags about 30 KB of savings from compression on every page; GitHub Pages already compresses files, so that's only true of the test server. Unused CSS (16 to 22 KB per page, because every page loads all of `components.css`) is real but small. Neither costs points today.
- **Google Fonts are the slowest part of a cold load** and are the likely cause of the occasional slow first run. Hosting the two fonts with the site would remove that and the third-party request. It needs the font files, which I can't download here.
- **For Dustin:** delete the `lighthouse-trial` branch on GitHub; I couldn't from here.
- The Node 20 warning on the workflow's actions is still open.
- The screen reader pass is Dustin's. The analytics guide is the next AI item.

---

## Session 8: October 19, 2026 (404 page)

**Built by:** Claude (Opus 5.5), in a scheduled session with nobody watching, so decisions below are mine and open to Dustin's review.

### What I built

- **A "page not found" page** at `demo/404.html`, with the shared header and footer. It says plainly what happened ("We can't find that page"), then offers three ways out: a program search, a list of seven popular pages with one line about each, and a box for telling the web team about the broken link.
- **It's the real 404 for the whole site.** GitHub Pages shows `/404.html` for any address that doesn't exist, so the deploy step now copies the demo page there. Any mistyped address under `deackeret.github.io/campus-kit/` shows it.
- **The page shows the address the visitor tried** and, if they came from another page on this site, the page with the broken link, so they can copy both into their email. This runs in the visitor's browser only; nothing is sent or stored. Without JavaScript both lines stay hidden and the text still tells people what to include.
- **Two new components in the style guide:** a *link list* (the program list's rows, for any list of pages) and a *search box* for light backgrounds (`finder--light`, the home page's program search with a visible edge, stacking on narrow screens). The *missing address* lines have a short entry too.
- Added the page to `tests/pages.mjs`, the project page and the README, and the two scripts to the file map in `CLAUDE.md`.

### What I decided and why

- **Relative links break on a 404 page, so the deploy copy rewrites them.** GitHub Pages shows the 404 page at whatever address was asked for. At `/campus-kit/demo/programs/old/page.html`, a link to `apply.html` or `../assets/css/base.css` points to the wrong folder, and the page would load without its styles. A `<base>` tag would fix the paths but also turn every `href="#"` and the skip link into links to another page. Instead, a small script (`scripts/site-404.mjs`, built-in Node modules only) copies `demo/404.html` and turns each relative link into a full path like `/campus-kit/demo/apply.html`. The path comes from `actions/configure-pages`, so it keeps working if Dustin moves the site to a custom domain. Editors change `demo/404.html` only; the copy is never committed.
- **The search box searches programs, not the whole site.** The site search page is a later roadmap item, and the program finder is the only search there is. The box sends the words to `programs.html?q=…`, the same way the home page does, and the heading says "Search our programs" so it doesn't promise more. When the site search page is built, that session should point this form at it.
- **Reporting is an email link, not a form.** A form would collect data, which the project rules rule out, and the demo has no inbox anyway. The email address uses `data-demo-contact` like every other address. The "page with the link" line only appears for pages on this site, because a broken link on someone else's site isn't ours to fix.
- **The page asks search engines not to list it** (`<meta name="robots" content="noindex">`). It has no breadcrumbs, since it isn't part of the site's structure.

### A small fix along the way

- **The demo contact note now starts at its heading.** Session 7 found that at 400% zoom the note is taller than the window and focus landed on Close at the bottom, so the heading started out of view. Focus now moves to the note's heading when it opens (and still returns to the link when it closes). The heading has no focus ring, because it isn't a control.

### How I checked it

- `node scripts/includes.mjs --check` passes, and `tests/zoom.mjs` passes on all 14 pages under all six conditions, menu open included.
- In headless Chromium I built a copy of the deployed site with the generated `404.html` and loaded a missing address three folders deep. It returned status 404 with all styles, the script and the logo loading, and no failed requests. At 1280px and 390px, with JavaScript on and off: one `h1`, no skipped heading levels, no duplicate IDs, every field labeled, every `aria-labelledby` target present, no sideways scrolling.
- Clicking a broken link from the home page showed both the address tried and the page with the link. Searching "nursing" opened the program finder filtered to one program. Opening the email note put focus on its heading, and Escape put it back on the link.
- I looked at screenshots of the page at 1280px and 390px and of the new style guide entries. The long address breaks inside the callout instead of widening it.
- The search box's edge is `--color-ink-muted` on white, 7.6 to 1, above the 3 to 1 needed for a form field's border.

### What went wrong

- **Still no `npm test` here.** The npm registry is blocked in this workspace (403 at the proxy), so HTML validation and axe ran only in CI. I ran the zoom test with the globally installed Playwright and `http-server`, linked into a `node_modules` folder that git ignores.
- **I first wrote the "on narrow screens, stack the button" rule for every search box,** which would have changed the home page's hero search on phones. I caught it before testing and limited it to `finder--light`.
- **The deploy step can't be tested before it runs.** I ran the script locally with the same arguments, but the `base_path` output from `configure-pages` is only known in the real deploy, so the first deploy is the real test. After it, `https://deackeret.github.io/campus-kit/demo/no-such-page.html` should show the styled page.

### Left for next time

- When the site search page is built, point the 404 search at it and rename the heading.
- The footer's "Report a website problem" link still goes nowhere. The accessibility statement and "report a problem" page item will give it a home.
- The Node 20 warning on the workflow's actions is still open.
- The screen reader pass is Dustin's. The site performance report is the next AI item.

---

## Session 7: October 16, 2026 (zoom and text-spacing check)

**Built by:** Claude (Opus 5.5), in a scheduled session with nobody watching, so decisions below are mine and open to Dustin's review.

### How I tested

All 13 pages, in headless Chromium, under six conditions. Browser zoom shrinks the window in CSS pixels, so I tested zoom by window size, which is how WCAG 1.4.10 defines it:

- **200% zoom:** a 1280 × 900 window at 200% is 640 × 450.
- **400% zoom:** the same window at 400% is 320 × 225 (the 320px reflow width in WCAG 1.4.10).
- **200% text size only:** 1280px wide with the browser's font-size setting doubled (16px to 32px), for WCAG 1.4.4.
- **Text spacing** (WCAG 1.4.12: line height 1.5, letter spacing 0.12em, word spacing 0.16em, 2em after paragraphs) at 1280px, 390px and 320px.

On every page with a Menu button, I checked again with the menu open. A page failed if it scrolled sideways, if anything stuck out past the right edge (outside a scrolling table or code sample, which 1.4.10 allows), if text was cut off in a box that hides overflow, or if text from two elements overlapped.

### What I found and fixed

Before the fixes, 25 page and condition pairs failed. After them, all pass.

- **Long email addresses pushed pages sideways.** An address like twhitehorse@sleepinggiant.example is one long "word" that can't wrap. It broke the directory at 200% zoom, at 400% and at 200% text size, and broke the admission, biology, soccer and style guide pages at 400% zoom or with text spacing. Fixes:
  - Every body text now breaks a word that is too long for its line (`overflow-wrap: break-word` on `body`).
  - Contact links (`data-demo-contact` and real `mailto:` links) can break anywhere (`overflow-wrap: anywhere`), so the rows and columns holding them can shrink.
  - The text column in each directory entry can now shrink beside the initials (`min-width: 0`).
- **Grids had a minimum width that could be wider than the screen.** Every auto-filling grid (directory, pathways, key facts, footer, style guide swatches, project page) used a fixed minimum like `minmax(17rem, 1fr)`. At 200% text size, 17rem is 544px. Each one is now `minmax(min(17rem, 100%), 1fr)`, so a column never gets wider than its container. Normal sizes look the same; I compared screenshots at 1280px and 390px.
- **The directory's department menu** was too wide at 320px with text spacing, because a select is as wide as its longest option. Form fields now stop at the width of their container.
- **The flyer cut off its own text.** On wide screens it was a fixed 11 inches tall with overflow hidden, so at 200% text size about 40% of it was cut off. At 400% zoom its print margins (0.7 inch on each side) and headline pushed it past the edge. On screen it is now at least 11 inches tall and grows to fit the text; on phones and at high zoom it uses the page's gutter instead of print margins, and the bottom row wraps. Print still sets it to exactly 11 inches. I printed it to PDF before and after the change, and both came out as one page.

Nothing overlapped and nothing was cut off on any page except the flyer. The header, menu, tables, steps, giving levels and progress meter all reflowed cleanly.

### The checks now run on every push

I turned the test into `tests/zoom.mjs` (`npm run test:zoom`) and added it to `npm test` and the workflow, so a new page that breaks at 400% zoom fails the build. I left out the overlap check: it depends on exact font sizes, and CI loads the real web fonts while this workspace can't, so it could fail on one and pass on the other. The page list moved to `tests/pages.mjs` so both test files share it; `CLAUDE.md` and the README say so.

I ran the new script against the old CSS to make sure it catches the problems: it found the same 25 failures.

### What went wrong

- **My first text-size screenshots were wrong.** Playwright's full-page screenshot quietly resets the font-size setting, so the 200% text screenshots after the first page showed normal-size text. The pass or fail results weren't affected (the first run had no screenshots and found the flyer problem), but I only noticed because one screenshot looked too small. The script now sets the font size again before each page and reports if it's not applied. For the screenshots, I doubled the root font size in CSS instead.
- **Still no `npm test` here.** The npm registry is blocked in this workspace. I ran `tests/zoom.mjs` with a globally installed Playwright and a small stand-in for `http-server` (not committed). HTML validation and axe run only in CI, and this is the first CI run of the zoom test, so watch that run.
- **The demo contact note scrolls at 400% zoom.** At 320 × 225 the note is taller than the window, and focus lands on Close at the bottom, so the heading starts scrolled out of view. It can be scrolled with arrow keys or touch and nothing is cut off, so it passes, but it's not ideal. Moving focus to the note itself would fix it; I left it for a later session to keep this one to the roadmap item.

### Left for next time

- The contact note focus, above.
- The Node 20 warning on the workflow's actions is still open.
- The screen reader pass is Dustin's. The 404 page is the next AI item.

---

## Session 6: October 14, 2026 (named scrolling tables)

**Built by:** Claude (Opus 5.5), in a scheduled session with nobody watching, so decisions below are mine and open to Dustin's review.

### What I built and decided

- **Every scrolling table now has a name.** All six table wrappers (biology courses, application deadlines, the soccer schedule and roster, the program template and the style guide example) point `aria-labelledby` at their table's `<caption>`, which now has an `id`. In Chromium's accessibility tree each one is a region named after its caption, for example "2026 women's soccer schedule." A screen reader user who tabs to a table hears what it is before scrolling it.
- **I used `<section>` instead of `<div role="region">`.** The roadmap asked for `role="region"`, but a `<section>` with `aria-labelledby` is a region in HTML already, with the same role and the same name, and needs no ARIA. It's also how the rest of the site names its regions (the campus notice, sidebar boxes). Just as practical: the HTML validator's recommended rules include one that flags ARIA roles with a native element, and I believe `region` is on its list. I couldn't run the validator here to be sure, so I chose the version I knew would pass. No CSS targets the wrapper by element, so nothing looks different.
- **New Table entry in the style guide,** with a course-table example that explains `tabindex`, the caption `id` and `aria-labelledby` in plain words. The athletics schedule example uses the same pattern.
- **The program template's comment** now explains the wrapper and says what to change when adding a second table. The staff guide (`docs/adding-a-program-page.md`) says the same in its "Add or remove courses" step, since two tables can't share an `id`.

### What went wrong

- **I first wrote it the way the roadmap said** (`<div role="region">`) and only then checked the validator config and remembered its prefer-native rule. I switched every wrapper before committing rather than push a likely failing build.
- **Still no `npm test` here.** The npm registry is blocked by this workspace's network policy (403 at the proxy). Instead I checked all 13 pages in headless Chromium at 1280px and 390px for one `h1`, skipped heading levels, duplicate IDs, `aria-labelledby` targets that don't exist, every `.table-wrap` being a focusable section named by its own caption, missing alt text, horizontal scrolling and script errors (all clean). I read the region names from the browser's accessibility tree and looked at screenshots of the soccer schedule with keyboard focus at both widths and the new style guide entry. HTML validation and axe run in CI.

### Left for next time

- **For Dustin:** the roadmap wording says `role="region"`; the build uses a named `<section>`, which screen readers treat the same way. If you'd rather have the literal `role="region"`, it's a one-line change per table, but the validator may need a rule exception.
- The Node 20 warning on the workflow's actions is still open (version numbers can't be looked up from here).
- The zoom and text-spacing check is next.

---

## Session 5: October 13, 2026 (changes Dustin asked for)

**Built by:** Claude (Opus 5.5), from two requests Dustin made after session 4.

### What Dustin asked for

1. Yes to a phone-only "Give online" link near the top of the giving page (my open question from session 4).
2. Phone and email links should never actually call or email anyone. Make them `#` links that open a pop-up explaining what would happen on a real site.

### What I built and decided

- **Demo contact links, site-wide.** All 43 `tel:` and `mailto:` links are now `href="#"` with `data-demo-contact="phone"` or `"email"`. That covers the directory, every page's footer (through the shared partial), the program, admission, team and giving pages, the template and the style guide. Dustin asked about faculty contacts, but office contacts and the footer number were the same problem, so I changed every one.
  - Clicking one opens a native `<dialog>` that names the number or address and says what a real link would do ("tapping this link on a phone would call (406) 555-0140"), then that the school is fictional. `main.js` builds the one dialog per page, so no page needed extra markup.
  - It works with a keyboard: focus moves to the Close button, Escape or Close shuts it, and focus returns to the link that opened it. Clicking outside the box closes it too. The text is filled in with `textContent`, not HTML.
  - Without JavaScript, a `#` link does nothing, but the number or address is still on the page to read. That's the trade-off of using `#` as asked.
  - Added it to the style guide as "Demo contact links," explained it in the template's comments and the program-page staff guide (including what to use on a real site), and added the rule to `CLAUDE.md` so future sessions keep to it.
- **Phone-only "Give online" button** in the giving page's header. It shows only when the sidebar stacks below the content (56rem and narrower), so wide screens still have one call to action. It's a reusable `page-header__action` class, added to the CSS with a comment explaining when to use it.

### What went wrong

- **Couldn't update the GitHub Actions versions.** Session 4's run warned that the workflow's actions target Node 20, which GitHub is retiring. I couldn't look up the current release numbers from here (GitHub's API is limited to this repository in this workspace), and guessing a version that doesn't exist would break the deploy. It's only a warning for now.
- **Still no `npm test` here** (registry blocked). I tested the dialog in headless Chromium at 1280px and 390px: it opens from the keyboard, focus lands on Close and returns to the link, Escape and clicking outside both close it, the page address doesn't change, and there are no script errors. All 13 pages passed my structural checks at both widths. HTML validation and axe run in CI.

### Left for next time

- Update the workflow's actions to versions that run on Node 24 once the right version numbers can be checked.
- The 404 page is next on the roadmap.

---

## Session 4: October 12, 2026 (giving page)

**Built by:** Claude (Opus 5.5), in a scheduled session with nobody watching, so decisions below are mine and open to Dustin's review.

### What I built and decided

- **Giving page (`demo/give.html`).** An Advancement page with four parts: progress on a scholarship campaign, giving levels, a donor story, and other ways to give. The sidebar has one call to action ("Give online"), an on-this-page list and the Advancement office contact.
  - The campaign is "Open Doors": $5 million for scholarships by June 30, 2028, with $3.42 million raised. I tied it to scholarships for students from rural towns so the page has one clear reason to give instead of a list of funds.
  - The donor story is Ruth Ann Kessler, a fictional 1989 nursing graduate who arrived with a $600 scholarship and now funds one. A story with a specific number in it does more than general praise of giving.
  - A note says when the totals were last updated, so a stale number is obvious to the staff member who maintains it.
- **New Progress meter component.** A real `<progress>` element with a visible `<label>`, as the roadmap asked. In Chromium's accessibility tree it is a progress bar named "$3.42 million raised of our $5 million goal" with a value out of 5,000,000, which screen readers read as 68 percent. The amounts are also written out in text, and the percentage, donor count and end date sit under the bar, so nothing depends on seeing the bar. I chose `<progress>` over `role="meter"` because it needs no ARIA and works the same with JavaScript off.
  - The bar is spruce on a mist track with a muted-ink border so the full length of the goal is visible. Fill against track measures 7.1 to 1 and the border against white 7.6 to 1, well above the 3 to 1 needed for graphics.
  - The print stylesheet keeps the fill, since browsers drop background colors when printing.
- **New Giving levels component.** Rows, not cards: amount on the left, level name and what the gift pays for on the right. Each level names something concrete (a semester of textbooks, a summer research stipend). The level name comes first in the HTML so it's read first; on phones the amount sits under the name. The amount is spruce on white, 7.8 to 1.
- The **"Give" menu link** now goes to the new page (changed once in `partials/header.html` and copied to every page with `npm run build`). Added both components to the style guide, the page to the project page, README and the accessibility test list.

### What went wrong

- **The style guide example didn't match the page.** Inside the style guide, the level names are `h4` (the component's section is already an `h3`), and `h4` defaults to the body font, so the names showed up in bold sans-serif instead of the serif used on the giving page. I caught it in the 1280px screenshot and made the component set its own heading font for both `h3` and `h4`.
- **My own check script cried wolf at first.** The link check fetched every local link from inside the page, and those requests were cancelled when the script moved to the next page, which reported every link on every page as failed. The links were fine; I filtered out the cancelled check requests and reran.
- **Couldn't run `npm test` here again.** The npm registry returned a 403 from this workspace's network policy. Instead I ran the include check with Node and checked all 13 pages in headless Chromium at 1280px and 390px for one `h1`, skipped heading levels, duplicate IDs, unlabeled fields, missing alt text, broken in-page anchors and local links, horizontal scrolling and script errors (all clean). I also checked the menu with JavaScript off. HTML validation and axe run in CI.

### Left for next time

- **For Dustin:** on phones the "Give online" button comes after the whole page, the same choice as the admission page. For giving, a donor who already knows they want to give has to scroll a long way. A short "Give online" link near the top for phones would fix that but makes a second call to action. I left it as one for consistency; say the word if you'd rather have it.
- The 404 page is next. "Cost & aid" and "Campus life" in the menu are still `#` links.

---

## Session 3: October 11, 2026 (three roadmap items)

**Built by:** Claude (Opus 5.5). Dustin asked for more progress while he worked on something else, so I took the first three roadmap items in one session instead of one.

### What I built and decided

- **Shared header and footer.** The campus notice, header and footer now live in `partials/header.html` and `partials/footer.html`. `scripts/includes.mjs` (Node built-ins only, no dependencies) copies them into every demo page between `<!-- include: ... -->` and `<!-- /include -->` markers. The output stays plain HTML, so pages still open straight from disk and nothing runs in the visitor's browser.
  - `{{root}}` fills in `""` or `"../"` per page, so the same partial works from `demo/` and its subfolders.
  - `section="..."` on the marker sets `aria-current="page"` on that menu link. A name that matches no link stops the build with a one-line message listing the valid names.
  - `npm run build` updates pages; `npm run check:includes` changes nothing and fails if any page is out of date. CI runs the check first, before installing anything, so it fails fast.
  - New staff guide: `docs/changing-the-header-and-footer.md`. The program-page guide and the template's comment now say not to edit between the markers.
- **Admission page (`demo/apply.html`).** Four steps as a real numbered list, a deadlines table, a cost snapshot (published cost, average aid, cost after aid, with the breakdown underneath), and one call to action, "Start your application." I kept a single call to action, as the roadmap asked; on phones it lands after the content, where the reader has just finished the steps.
  - New **Steps** component: an `<ol>` with CSS-counter numbers and a line joining them, so screen readers still announce "list, 4 items."
  - New **Note** style for small print under figures or tables.
  - The home page's "Apply as a first-year student" and "Transfer your credits" links now go here instead of `#`.
- **Team page (`demo/athletics/womens-soccer.html`).** Season record, a schedule with results and upcoming games, a roster table, a "Next home game" callout and a coach contact. I chose women's soccer because the events page already features its senior day.
  - Results are spelled out ("Won," "Lost," "Tied") and only "Won" is colored, so nothing depends on color. Conference games are marked in text.
  - Roster names are row headers (`<th scope="row">`), so screen readers announce the player with each cell.
  - New athletics accents: `page-header--athletics`, `facts--athletics`, `callout--athletics` and a highlighted `schedule__next` row. Gold is only used for borders and tints, never text on white.
  - The main menu's "Athletics" link now goes to this page, and the events page links the soccer game to it.
- Added Steps and Athletics accents to the style guide, both new pages to the project page, README and the accessibility test list.

### What went wrong

- **The new team page scrolled sideways on phones (404px wide at 390px).** The schedule table sits in a scrolling wrapper, but the page's one-column phone layout used `1fr`, which won't shrink below its content. Fixed at the cause: the phone layout is now `minmax(0, 1fr)`, which the desktop layout already used. This would have hit any program page with a wide course table too.
- **Scores wrapped onto two lines on phones** ("3–" over "0"). The result column no longer wraps.
- **Headings after paragraphs and tables sat too close** on the admission page; the main column now adds space above each section heading. This also spaces out the biology page slightly.
- **The pages had already drifted before this session**, which is the problem the includes solve: two program pages marked "Academics" as current and the others didn't. Every page now gets it from the same place.
- **Couldn't run `npm test` here again.** This workspace still blocks the npm registry. I ran the include check with Node, and checked all 12 pages in headless Chromium at 1280px and 390px for duplicate IDs, one `h1`, skipped heading levels, labels, alt text, broken anchors and local links, horizontal scrolling and script errors (all clean), plus the menu with JavaScript off. I measured the new text colors: spruce on white 7.8 to 1, muted text on the gold tint 6.7 to 1, spruce on the gold tint 7.0 to 1. HTML validation and axe run in CI.

### Left for next time

The giving page is next. "Cost & aid," "Campus life" and "Give" in the menu are still `#` links until those pages exist.

---

## Session 2: October 9, 2026 (changes Dustin asked for)

**Built by:** Claude (Opus 5.5), from three requests Dustin made after reviewing the live site.

### What Dustin asked for

1. A way to close the alert banner.
2. Rename the demo school to College of the Sleeping Giant.
3. Center the text in the Major, Minor and Certificate tags on the program finder.

### What I built and decided

- **Closable banner.** Each banner has a close button (an X, with "Close this notice" for screen readers). Closing is remembered in that browser until the notice text changes, so the next notice always shows up. Without JavaScript the button stays hidden, because a button that does nothing is worse than none. Storage is wrapped in error handling so private browsing just shows the banner. After closing, keyboard focus moves to the first header link instead of disappearing. In the style guide, closing the example only lasts for the page view.
- **New name, new mark.** Renamed the school everywhere, including emails (`sleepinggiant.example`), page titles, the template, docs and `CLAUDE.md`. The Sleeping Giant is a mountain that looks like a person lying on their back, which fits the ridgeline motif, so I replaced the larkspur flower logo with a silhouette of a reclining figure. I renamed the `--color-larkspur` tokens to `--color-violet` so token names don't reference the old school. The fictional town is now Pine Hollow.
- **Tags fixed at the cause.** The tags weren't just off-center: the program-row rule `.program-list li` also matched the tags nested inside each row, so every tag got the row's grid layout, padding and bottom border. I scoped the rule to `.program-list > li` and centered the tag text. The tags are now compact pills with centered labels.

### What went wrong

- **My first two versions of the new logo didn't read as a giant.** The first looked like a lump at header size, and the second, with sharp peaks, looked more like a cat. The third uses a smooth face profile (forehead, nose, lips, chin) as the main feature, which is how the real mountain reads.
- **The longer name broke the phone header.** "College of the Sleeping Giant" pushed the Menu button onto its own line at 390px. On narrow screens the logo now stacks above a slightly smaller name, which keeps Menu beside it down to 320px.
- **The tag bug was mine from session 1.** I wrote a descendant selector where I meant a child selector, and didn't zoom in far enough on screenshots to notice. Lesson: when a component nests the same element type (`li` in `li`), use child selectors.

---

## Session 1: October 9, 2026

**Built by:** Claude (Opus 5.5), in one session with Dustin available for questions.

### The brief

Dustin asked for a portfolio project built entirely by AI, aimed at a web and graphic designer job at a small college. The posting asked for website maintenance, new pages for programs and services, analytics, print and graphic design, staff training on web tools, and support for athletics, admission and advancement. It named HTML, CSS and Adobe Creative Cloud. Dustin asked that nothing be specific to that college.

### What I decided

- **A starter kit, not a single website.** A kit with a fictional demo school (Larkspur College) shows both the design and the system behind it: tokens, components, templates and documentation for non-technical editors. That matches the job better than one polished page would.
- **Plain HTML and CSS, no framework.** The posting asked for HTML and CSS, and college sites are often edited by people who don't code. Every page works without JavaScript; the scripts only collapse the menu and filter lists.
- **Visual identity.** Spruce green, deep slate ink and a larkspur violet, with gold reserved for athletics and highlights. Literata (a book serif) for headings and Public Sans (made for public-service sites) for body text. The one signature element is a mountain ridgeline edge that closes the hero and opens the footer. Everything else is kept quiet on purpose.
- **Lists instead of card grids.** Programs, events and the project page index are rows people scan top to bottom, not identical cards.
- **The style guide shows real code.** A small script copies each live example's HTML into the code block under it, so the copyable code can never drift from what's rendered.
- **Print counts.** The event flyer is built from the same tokens as the site, because the job covers print and web together.

### What went wrong, and the fixes

- **Header links ran off the right edge.** The quick-links bar reused the `.wrap` class for its side padding, then a component rule reset `padding` to `0` and wiped it out. Found in a desktop screenshot. Fixed by setting only vertical padding.
- **Gold text on green failed contrast.** The flyer's series label was gold on spruce at 4.0 to 1, below the 4.5 to 1 AA minimum for normal text. Switched it to the pale gold tint.
- **I overstated contrast in my own copy.** The first draft of the project page said all text was at least 7 to 1. Muted text on the mist background measures 6.9 to 1, which passes AA but not that claim. Rewrote the sentence to say what's actually true, and corrected three contrast numbers in the style guide after measuring them.
- **Smaller fixes from screenshots:** quotes had the browser's default 40px indent, and course codes like "BIO 230" wrapped onto two lines on phones.
- **Couldn't run the full test suite locally.** The workspace I ran in blocks the npm registry and the font CDN, so I couldn't install axe-core or html-validate here. Instead I checked every page in headless Chromium at desktop and phone sizes for duplicate IDs, unlabeled form fields, missing alt text, skipped heading levels, broken in-page anchors, broken local links, horizontal scrolling and script errors (all clean), and reviewed screenshots. The real axe and HTML validation checks run in GitHub Actions on every push.
- **Couldn't create the repository.** GitHub access in this session only covers existing repos, so Dustin created `campus-kit` himself and installed the Claude GitHub app on it so I could push. Turning on GitHub Pages is also a setting only he can change.
- **The accessibility tests failed three times in CI before passing, all because of my test setup, not the site.** I couldn't run the script locally (see above), so CI was its first real run, and I couldn't download the raw logs from my session either. In order:
  1. The first two runs only said "exit code 1." The script was crashing on load, before my error-reporting code could run. I guessed at the cause and switched the `http-server` import to its default export. That may not have been the problem; I can't confirm it, but it's the safer form for a CommonJS package either way.
  2. So I changed the workflow to post the last lines of the test output as GitHub annotations, which made the next failure readable.
  3. The real error: `@axe-core/playwright` refuses pages opened with `browser.newPage()` and requires a browser context. Fixed.

  After those fixes, all 10 pages passed HTML validation and axe checks (WCAG 2.2 AA plus best practices) at desktop and phone widths on the first real run. Lesson for future sessions: when a check can't run locally, make its failures readable from the run summary before relying on it.

### Left for next time

The header and footer are copied into every page. That's the first roadmap item, because it's the kind of maintenance problem the person who inherits a site runs into first.
