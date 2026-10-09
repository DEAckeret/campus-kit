# Build log

Every AI work session on Campus Kit adds an entry here, newest first. Each entry says what was built, what went wrong, and what was decided, so anyone can see exactly how an AI-built project comes together, mistakes included.

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
- **The accessibility tests failed three times in CI before passing, all because of my test script, not the site.** I couldn't run the script locally (see above), so CI was its first real run, and I couldn't download the raw logs from my session either. In order:
  1. Imported `createServer` as a named export from `http-server`, which is a CommonJS package. The script crashed on load.
  2. That crash happened before my error-reporting code ran, so the run page only said "exit code 1." I changed the workflow to post the last lines of the test output as GitHub annotations, which made the next failure readable.
  3. `@axe-core/playwright` refuses pages opened with `browser.newPage()` and requires a browser context. Fixed.

  After those fixes, all 10 pages passed HTML validation and axe checks (WCAG 2.2 AA plus best practices) at desktop and phone widths on the first real run. Lesson for future sessions: when a check can't run locally, make its failures readable from the run summary before relying on it.

### Left for next time

The header and footer are copied into every page. That's the first roadmap item, because it's the kind of maintenance problem the person who inherits a site runs into first.
