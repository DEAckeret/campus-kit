# Instructions for AI work sessions

Campus Kit is a proof-of-concept project: it is built **entirely by AI** for Dustin Ackeret's portfolio. Dustin directs and reviews; Claude writes everything. Keep that true. Don't ask Dustin to write code.

## Each scheduled session

1. Read `ROADMAP.md`, `BUILD_LOG.md` (at least the latest two entries) and this file.
2. Pick the **first unchecked roadmap item** that isn't marked **(Dustin)**. Do only that item, plus small fixes to things you notice are broken.
3. Build it to the standards below, matching the existing tokens and components. Add any new component to `styleguide.html` with a live example.
4. Check your work: run `npm test` (HTML validation, axe accessibility checks at desktop and phone sizes, and zoom and text-spacing checks). If you can't run it, do the manual checks listed in the latest build log entry and take screenshots at 1280px and 390px wide. Look at the screenshots.
5. Check the item off in `ROADMAP.md`. If the item turned out bigger than one session, split it and check off only the finished part.
6. Add a `BUILD_LOG.md` entry at the top: what you built, what you decided and why, what went wrong (be specific and honest), and anything left over.
7. Commit to `main` with a clear message and push. Then confirm the GitHub Actions run passed. If it failed, fix it in the same session.

## Standards

- **Plain HTML, CSS and vanilla JavaScript.** No frameworks, no build step for the site itself. Pages must work with JavaScript off.
- **All values come from `assets/css/tokens.css`.** No new hard-coded colors or sizes in component CSS.
- **Accessible to WCAG 2.2 AA:** one `h1` per page, no skipped heading levels, labeled form fields, visible focus, text contrast of at least 4.5 to 1 (measure it, don't guess), and no horizontal scrolling at 390px.
- **Copy is plain and specific.** Sentence case, active voice, buttons say what happens. Write for a prospective student or a non-technical staff member. No marketing filler.
- **Design restraint.** The ridgeline is the one signature motif; don't add competing decoration. Prefer lists and rows over identical card grids. No all-caps labels.
- **Nothing tied to a real college.** College of the Sleeping Giant and everyone at it are fictional. Use `.example` email domains and 555 phone numbers.
- **Contact links never call or email anyone.** Dustin's rule: write every phone number and email address as `<a href="#" data-demo-contact="phone">` or `data-demo-contact="email"`, never `tel:` or `mailto:`. Clicking one opens a note (built by `main.js`) explaining what a real link would do.
- **Don't add tracking code, third-party scripts, or anything that collects data.**

## File map

- `index.html`: the project page recruiters land on
- `styleguide.html`: every token and component, with copyable HTML
- `report.html`: the site performance report; CI fills in its "Latest results" section
- `analytics.html`: the analytics guide, with the list of every `data-track` name
- `demo/`: the College of the Sleeping Giant demo site
- `demo/programs/_template.html`: commented template for new program pages
- `assets/css/tokens.css`: colors, type, spacing (the only file to change when rebranding)
- `assets/css/base.css`, `components.css`, `print.css`: site styles
- `assets/css/kit-site.css`, `assets/js/kit-site.js`: only for the project page and style guide
- `docs/`: guides for non-technical editors
- `scripts/includes.mjs`: copies the shared header and footer into demo pages (`npm run build`)
- `scripts/site-404.mjs`: the deploy step's copy of `demo/404.html` as the site-wide 404 page
- `lighthouserc.json`: Lighthouse CI pages and budgets (the budget table in `report.html` must match)
- `scripts/performance-report.mjs`: fills `report.html` with the Lighthouse results in CI
- `tests/pages.mjs`: the list of pages the checks visit; add every new page to it
- `tests/accessibility.mjs`: axe checks
- `tests/zoom.mjs`: 200% and 400% zoom, 200% text size and text-spacing checks
- `tests/tracking.mjs`: every `data-track` name is listed in `analytics.html`, and no page loads a third-party script
- `.github/workflows/site.yml`: checks, then deploys to GitHub Pages from `main`
