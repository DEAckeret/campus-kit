# Rebranding the kit for another school

Campus Kit gets its colors, fonts, corners and spacing from one file: `assets/css/tokens.css`. Change the values there and every page follows, including the print flyer, the program handouts, the social media graphics and the content audit spreadsheet's header row.

To prove it, the kit has a second fictional school, **Kettle Harbor College**, in `assets/css/tokens-kettle-harbor.css`. The [style guide](https://deackeret.github.io/campus-kit/styleguide.html?brand=kettle-harbor) has a switch at the top that swaps between the two files, so you can see every component in both brands.

This guide is for the web team. Steps 1 and 2 are the rebrand itself; steps 3 and 4 cover the few brand pieces that aren't tokens.

## Step 1: Copy the token file and change the values

Copy `assets/css/tokens.css` to a new file, such as `tokens-your-school.css`, and change the values. Keep every token name exactly as it is, and don't add or remove any.

The names come from the first school's colors, but the components look each color up by its name, so a renamed token breaks them. What matters is each token's job. In Kettle Harbor's file, `--color-spruce` is navy:

| Token | What it does | Sleeping Giant | Kettle Harbor |
| --- | --- | --- | --- |
| `--color-spruce` | Links, buttons, header | Spruce green | Harbor navy |
| `--color-violet` | Focus ring, accents | Violet | Sea teal |
| `--color-gold` | Athletics, highlights, the button on the header | Gold | Buoy coral |
| `--font-display` | Headings | Literata | Bitter |
| `--font-body` | Body text | Public Sans | Atkinson Hyperlegible |
| `--radius-small`, `--radius-large` | Corners | 3px, 10px | 6px, 16px |

Some colors have rules the components rely on:

- `--color-spruce` carries white text (buttons, the header) and is the link color on white, so it must be dark.
- `--color-gold` sits behind dark text and next to `--color-spruce`, and is never used for text on white, so it must be light.
- `--color-ink-muted` is used for captions on every light background, including the tints.

To try your file before it's live, use it in place of `tokens.css` in one page's `<link>`, or add it to the style guide's brand switch (one more radio button in `styleguide.html`).

## Step 2: Check the contrast

Add your file to the `BRANDS` list at the top of `tests/tokens.mjs`, then run:

```
npm run check:tokens
```

It measures every color pair the components use, in every brand, and lists each one with its ratio. It fails if text falls under 4.5 to 1 or a focus ring under 3 to 1 (WCAG 2.2 AA), or if your file is missing a token or has one `tokens.css` doesn't. It needs only Node, no `npm install`.

When it passes, copy your values into `tokens.css` itself (or rename your file to `tokens.css`). That is the only file the pages load.

## Step 3: Change the font link

The token file says which fonts to use, but each page loads its web fonts in its `<head>`, with two lines that link to Google Fonts. If your school uses different fonts, change the font names in those lines on every page, so visitors don't download fonts that are no longer used. A search and replace across the project does it.

Kettle Harbor's token file loads its fonts itself, with an `@import` at the top, so the style guide's switch can show them. That's fine for a demo, but it makes the browser fetch the fonts later than a link in the `<head>` would, so use the link for a real rebrand.

## Step 4: Replace the logo and the school's name

These are content, not tokens:

- The wordmark and the school's name are in `partials/header.html` and `partials/footer.html`. Change them there and run `npm run build` (see [Changing the menu, header or footer](changing-the-header-and-footer.md)).
- The mark itself is `assets/img/giant-mark.svg`, which has its own color written into it. Replace the file, or change its `fill`.
- Page titles, email addresses and the text of each page name the school. Search for the old name.

## Before you publish

- `npm run check:tokens` passes.
- `npm test` passes. It runs the accessibility checks on every page, and runs them again with the Kettle Harbor tokens. If you add your own brand file, you can point that second run at it in `tests/accessibility.mjs`.
- You've looked at the home page, a program page and the printed flyer in the new brand.
