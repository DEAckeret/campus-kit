# Build log

Every AI work session on Campus Kit adds an entry here, newest first. Each entry says what was built, what went wrong, and what was decided, so anyone can see exactly how an AI-built project comes together, mistakes included.

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
