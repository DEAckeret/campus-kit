# Campus Kit

**Website templates for small colleges that a small team can keep up.**

Campus Kit is a hand-written HTML and CSS design system with ready-made pages for academic programs, events, news and staff directories. It's built to WCAG 2.2 AA, prints cleanly, and needs no framework or build tools.

**[See it live](https://deackeret.github.io/campus-kit/)** · [Demo college](https://deackeret.github.io/campus-kit/demo/) · [Style guide](https://deackeret.github.io/campus-kit/styleguide.html) · [Performance report](https://deackeret.github.io/campus-kit/report.html) · [Analytics guide](https://deackeret.github.io/campus-kit/analytics.html)

> **This project was built entirely by AI.** Every line of code, page and piece of copy was written by Claude, an AI model, as a proof of concept directed by [Dustin Ackeret](https://github.com/DEAckeret). Dustin chose the goal, reviewed the work and set the direction. Claude returns on a schedule to build the next item on the [roadmap](ROADMAP.md), and every session is recorded, mistakes included, in the [build log](BUILD_LOG.md).

## What's in it

| Page | What it shows |
|---|---|
| [Home](https://deackeret.github.io/campus-kit/demo/) | Program search in the hero, paths for new students, key facts, events, a featured story |
| [Program finder](https://deackeret.github.io/campus-kit/demo/programs.html) | Every program, filterable by school and type; `?q=nursing` links open a filtered list |
| [Program page](https://deackeret.github.io/campus-kit/demo/programs/biology.html) | The template a department fills in: overview, outcomes, course table, careers, contact |
| [How to apply](https://deackeret.github.io/campus-kit/demo/apply.html) | Admission page: numbered steps, deadlines table, cost snapshot, one call to action |
| [Events and athletics](https://deackeret.github.io/campus-kit/demo/events.html) | Filterable event list, with gold date blocks for game days |
| [Team page](https://deackeret.github.io/campus-kit/demo/athletics/womens-soccer.html) | Season schedule with spelled-out results, roster table, gold athletics accents |
| [Giving page](https://deackeret.github.io/campus-kit/demo/give.html) | Campaign progress bar (a real `<progress>` with a text label), giving levels, a donor story |
| [Staff directory](https://deackeret.github.io/campus-kit/demo/directory.html) | Search by name, title or department |
| [News story](https://deackeret.github.io/campus-kit/demo/news/article.html) | Article layout with an accessible SVG chart |
| [Page not found](https://deackeret.github.io/campus-kit/demo/404.html) | Program search, popular pages, and the address the visitor tried, ready to report. Shown at any [missing address](https://deackeret.github.io/campus-kit/demo/no-such-page.html) |
| [Print flyer](https://deackeret.github.io/campus-kit/demo/flyer.html) | US letter event flyer built from the same tokens as the site |
| [Social media graphics](https://deackeret.github.io/campus-kit/demo/social.html) | A square post (1080 × 1080) and a story (1080 × 1920) for one event, from the same tokens, with alt text. `npm run social` saves them as PNG files |
| Program handout | Print any program page (try [Biology](https://deackeret.github.io/campus-kit/demo/programs/biology.html)) and it comes out as a one-page handout for college fairs, on US letter or A4 |

## How it's built

- **Design tokens.** All colors, type sizes and spacing live in [`assets/css/tokens.css`](assets/css/tokens.css). Rebranding the kit means editing one file.
- **Progressive enhancement.** Every page works with JavaScript off. A small dependency-free script collapses the mobile menu and filters lists, announcing result counts to screen readers.
- **Accessibility.** Skip link, visible focus on everything, labeled forms, real tables with captions and headers, a chart with a text description, and measured contrast (body text is 15.6 to 1).
- **Automated checks.** Every push runs HTML validation, axe-core accessibility tests at desktop and phone widths, zoom and text-spacing checks (200% and 400% zoom, WCAG 1.4.12 spacing), a check that every program page prints on one sheet, and an export of the social media graphics that fails if text doesn't fit, in GitHub Actions, then deploys to GitHub Pages only if they pass.
- **Performance budgets.** [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) scores ten pages on every push. A page below 90 for performance or SEO, or below 100 for accessibility, stops the deploy. The scores are published on the [performance report](https://deackeret.github.io/campus-kit/report.html); the budgets live in [`lighthouserc.json`](lighthouserc.json).
- **One shared header and footer.** They live in [`partials/`](partials/). A tiny dependency-free script (`npm run build`) copies them into every page as plain HTML, and CI fails if a page falls out of date.
- **Docs for the people who maintain it.** [Adding a program page](docs/adding-a-program-page.md) walks a non-technical staff member through creating a page from the [commented template](demo/programs/_template.html), and [changing the menu](docs/changing-the-header-and-footer.md) covers the shared header and footer.
- **Measuring what matters, without tracking people.** The [analytics guide](https://deackeret.github.io/campus-kit/analytics.html) covers the three numbers worth watching on a college site (application starts, visit sign-ups, program searches), how to choose a privacy-friendly tool, and the code to connect one. Key buttons carry `data-track` names; no analytics code ships, and a check fails the build if a page uses an unlisted name or loads a third-party script.

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
npm install
npm run serve       # http://localhost:8080
npm run build       # copy partials/ into every demo page
npm test            # include and tracking checks, HTML validation, accessibility, zoom and text spacing, one-sheet printing
npm run test:lighthouse   # Lighthouse scores and budgets (needs Chrome installed)
```

The tests need Playwright's Chromium the first time: `npx playwright install chromium`.

## License

MIT. College of the Sleeping Giant and everyone at it are fictional.
