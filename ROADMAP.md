# Roadmap

This is the backlog for Campus Kit. Each scheduled AI session picks the **first unchecked item**, builds it, checks it off, and records the work in [BUILD_LOG.md](BUILD_LOG.md).

The order follows what a small college's web and marketing team does week to week: build pages for departments, support admission, athletics and advancement, keep print and web on brand, train other staff, and measure how the site performs.

Dustin can add, remove or reorder items at any time. Items marked with **(Dustin)** need a decision or an account from him and are skipped by scheduled sessions.

## Version 0.1: the foundation

- [x] Design tokens, base styles and components
- [x] Demo college: home, program finder, program page, events, directory, news story
- [x] Print-ready event flyer from the same tokens
- [x] Living style guide with copyable HTML
- [x] Commented program-page template and a staff guide for using it
- [x] Automated HTML validation and axe accessibility checks on every push, deploying to GitHub Pages

## Next up

- [x] **Shared header and footer.** The header and footer are copied into every page, so a menu change means editing every file. Add a tiny, dependency-free Node script that fills `<!-- include: header -->` markers from one file, keep the output as plain HTML, and make CI fail if a page is out of date. Document it in the staff guide.
- [x] **Admission landing page.** An "Apply" page for prospective students: steps to apply as a real sequence, deadlines table, cost snapshot, and one clear call to action. Supports the Admission office.
- [x] **Athletics: team schedule and roster page.** One team's page with a season schedule (results and upcoming games), a roster table, and the gold athletics accents.
- [x] **Giving page.** An Advancement page with a fundraising campaign progress bar, giving levels and a donor story. The progress bar must be accessible (a real `<progress>` or `role="meter"` with text).
- [x] **Name the scrolling tables.** Each `.table-wrap` gets keyboard focus (`tabindex="0"`) so people can scroll wide tables, but a screen reader announces it only as "group" or nothing. Add `role="region"` and an `aria-labelledby` that points at the table's caption, on every page, the program template and the style guide. Update the template comment so new tables get it too.
- [x] **Zoom and text-spacing check.** Test every page at 200% and 400% browser zoom (WCAG 1.4.4 and 1.4.10) and with the WCAG 1.4.12 text-spacing overrides. Fix anything that's cut off, overlaps or scrolls sideways, and record the results in the build log.
- [ ] **(Dustin)** **Screen reader pass.** Go through the home page, program finder, how to apply and the team page with VoiceOver (Mac or iPhone) or NVDA (Windows). Note anything confusing, missing or read in the wrong order, and add the notes here so a session can fix them. Automated checks catch only part of what real screen reader users run into.
- [x] **404 page** that helps people recover: search box, popular links, and a way to report the broken link.
- [x] **Site performance report.** Add Lighthouse CI to the workflow with performance, accessibility and SEO budgets, and publish a `report.html` page that shows the latest scores. This is the "track site performance" part of a web designer's job.
- [x] **Analytics guide.** A doc on measuring what matters on a college site (apply clicks, visit sign-ups, program searches) with privacy-friendly analytics, using `data-track` attributes on key buttons. No real tracking code ships in the demo.
- [ ] **Program one-sheet for print.** A print stylesheet that turns any program page into a one-page handout for college fairs.
- [ ] **Social media graphics.** An HTML template that renders square (1080×1080) and story (1080×1920) event graphics from the same tokens, with a script that exports them as PNGs.
- [ ] **Event detail page** with an "Add to calendar" `.ics` download, a map link and accessibility information.
- [ ] **Accessibility statement and "report a problem" page,** the kind every public college needs.
- [ ] **Photo and image guidelines.** Responsive images with `srcset`, alt-text examples for common college photos, and file-size targets, added to the style guide.
- [ ] **Web editor training page.** A one-page quick reference that a web designer would hand faculty and staff after a training session: the five components they'll use most and the mistakes to avoid.
- [ ] **Site search page** that searches page titles and descriptions from a generated JSON index.
- [ ] **Content audit checklist.** A doc and spreadsheet template for reviewing a department's pages each semester.
- [ ] **Rebrand demo.** Prove the "one file to rebrand" claim: a second token file for a different fictional school, and a style-guide toggle that swaps between them.

## Ideas, not scheduled yet

- Dark mode tokens
- A Spanish-language version of one page, to show `lang` attributes and translation structure
- Emergency alert banner that can be switched on from a single JSON file
- Faculty profile page template
- **(Dustin)** A custom domain for the GitHub Pages site
