# Campus Kit

**Website templates for small colleges that a small team can keep up.**

Campus Kit is a hand-written HTML and CSS design system with ready-made pages for academic programs, events, news and staff directories. It's built to WCAG 2.2 AA, prints cleanly, and needs no framework or build tools.

**[See it live](https://deackeret.github.io/campus-kit/)** · [Demo college](https://deackeret.github.io/campus-kit/demo/) · [Style guide](https://deackeret.github.io/campus-kit/styleguide.html)

> **This project was built entirely by AI.** Every line of code, page and piece of copy was written by Claude, an AI model, as a proof of concept directed by [Dustin Ackeret](https://github.com/DEAckeret). Dustin chose the goal, reviewed the work and set the direction. Claude returns on a schedule to build the next item on the [roadmap](ROADMAP.md), and every session is recorded, mistakes included, in the [build log](BUILD_LOG.md).

## What's in it

| Page | What it shows |
|---|---|
| [Home](https://deackeret.github.io/campus-kit/demo/) | Program search in the hero, paths for new students, key facts, events, a featured story |
| [Program finder](https://deackeret.github.io/campus-kit/demo/programs.html) | Every program, filterable by school and type; `?q=nursing` links open a filtered list |
| [Program page](https://deackeret.github.io/campus-kit/demo/programs/biology.html) | The template a department fills in: overview, outcomes, course table, careers, contact |
| [Events and athletics](https://deackeret.github.io/campus-kit/demo/events.html) | Filterable event list, with gold date blocks for game days |
| [Staff directory](https://deackeret.github.io/campus-kit/demo/directory.html) | Search by name, title or department |
| [News story](https://deackeret.github.io/campus-kit/demo/news/article.html) | Article layout with an accessible SVG chart |
| [Print flyer](https://deackeret.github.io/campus-kit/demo/flyer.html) | US letter event flyer built from the same tokens as the site |

## How it's built

- **Design tokens.** All colors, type sizes and spacing live in [`assets/css/tokens.css`](assets/css/tokens.css). Rebranding the kit means editing one file.
- **Progressive enhancement.** Every page works with JavaScript off. A small dependency-free script collapses the mobile menu and filters lists, announcing result counts to screen readers.
- **Accessibility.** Skip link, visible focus on everything, labeled forms, real tables with captions and headers, a chart with a text description, and measured contrast (body text is 15.6 to 1).
- **Automated checks.** Every push runs HTML validation and axe-core accessibility tests at desktop and phone widths in GitHub Actions, then deploys to GitHub Pages only if they pass.
- **Docs for the people who maintain it.** [Adding a program page](docs/adding-a-program-page.md) walks a non-technical staff member through creating a page from the [commented template](demo/programs/_template.html).

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
npm install
npm run serve       # http://localhost:8080
npm test            # HTML validation + accessibility checks
```

The tests need Playwright's Chromium the first time: `npx playwright install chromium`.

## License

MIT. College of the Sleeping Giant and everyone at it are fictional.
