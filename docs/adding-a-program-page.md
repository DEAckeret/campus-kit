# Adding a new program page

This guide is for faculty and staff who need to add a page for a new major, minor or certificate. You don't need to know how to code. You'll copy a file, replace some placeholder text, and add one link.

It takes about 20 minutes once you have your text ready.

## Before you start, gather your content

Have these ready in a document so you can paste them in:

- The program name, exactly as it appears in the catalog
- One sentence describing what students get from the program
- Two or three short paragraphs about what students study
- Three to five things students will be able to do when they finish
- A list of required courses: course code, title, credits and the year students usually take it
- Where graduates work or continue their studies
- The department contact's name, title, office, email and phone
- Optional: a short quote from a student or graduate, with their permission

**Writing tip:** write for a high school senior. Use plain words, keep sentences short, and include one specific detail they can picture, like "you'll sample the river behind campus in your second week."

## Step 1: Copy the template

1. Open the folder `demo/programs/`.
2. Make a copy of `_template.html`.
3. Rename the copy after your program, in lowercase with hyphens instead of spaces. For example: `public-health.html`.

## Step 2: Replace the placeholder text

Open your new file in a text editor (VS Code, or Notepad on Windows, or TextEdit in plain-text mode on a Mac).

Everything you need to change is written in CAPITAL LETTERS. Use your editor's search (Ctrl+F or Cmd+F) to find each one and replace it with your text. There are notes in the file, between `<!--` and `-->`, that explain each part. Those notes never show up on the website.

A few things to watch:

- **Change the page title near the very top.** It's the line that starts with `<title>`. Keep the ` | College of the Sleeping Giant` ending.
- **Change the description just below it.** Search engines show this under your page's link.
- **Update the breadcrumb.** Replace `_template.html` with your new file name, and `PROGRAM NAME` with your program's name.
- **Only change the words between the tags,** not the tags themselves. For example, in `<dd>44</dd>`, change only `44`.
- **Contact links are demo links.** In this demo, email addresses and phone numbers use `href="#"` with `data-demo-contact`, so clicking one shows a note that the school is fictional instead of calling or emailing anyone. Replace only the visible email address and number. On a real college site, you'd write `href="mailto:name@your-college.edu"` and `href="tel:+14065550100"` and remove `data-demo-contact`.
- **Leave the header and footer alone.** They sit between `<!-- include: ... -->` and `<!-- /include -->` markers and are filled in from shared files, so edits there get overwritten. To change the menu for every page, see [Changing the menu, header or footer](changing-the-header-and-footer.md).

## Step 3: Add or remove courses

Each course is one line that starts with `<tr>`. To add a course, copy a whole line and paste it below, then change the text. To remove one, delete its whole line.

## Step 4: Delete what you don't need

Don't have a student quote? Delete everything from `<figure class="pull-quote">` down to `</figure>`, including those two lines.

## Step 5: Add your program to the program list

1. Open `demo/programs.html`.
2. Find a program in the same school as yours and copy its whole block, from `<li` to the matching `</li>`.
3. Paste it in the list and change:
   - the link (`href="programs/your-file-name.html"`) and the program name
   - the one-sentence description
   - `data-school`: one of `arts`, `science`, `health` or `business`
   - `data-level`: any of `major`, `minor` and `certificate`, separated by spaces
   - the tags, so they match `data-level`

The search and filters on the program list read `data-school` and `data-level`, so if those are missing your program won't show up when someone filters.

## Step 6: Check your page

Open your page in a web browser and check:

- [ ] The page title in the browser tab is right
- [ ] No CAPITAL-LETTER placeholders are left
- [ ] Every link goes where it should
- [ ] The program shows up on the program list, and when you filter by its school
- [ ] The page looks right on your phone

If you're submitting your change through GitHub, the automatic checks will also test your page for accessibility problems, like a missing label or heading levels that skip. If a check fails, the error message says which page and which part to fix.

## Need help?

Contact the web team at web@sleepinggiant.example. (This is a demo address; College of the Sleeping Giant is fictional.)
