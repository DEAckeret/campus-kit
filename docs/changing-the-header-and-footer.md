# Changing the menu, header or footer

Every page on the demo site shares one header (the campus notice, quick links and main menu) and one footer. Each lives in its own file, so a change is made once instead of on every page.

- `partials/header.html`: the campus notice, quick links and main menu
- `partials/footer.html`: the address, footer links, the legal line, and the welcome note that tells first-time visitors the college isn't real (a real college site would delete the note)

You don't need to know how to code, but you will run one command. If you've never used the command line, ask the web team to run it for you after you've made your edit. It takes a few seconds.

## Step 1: Edit the shared file

Open `partials/header.html` or `partials/footer.html` in a text editor and make your change. For example, to point "Campus life" at a new page, change:

```html
<li><a href="#">Campus life</a></li>
```

to:

```html
<li><a href="{{root}}campus-life.html">Campus life</a></li>
```

Two placeholders are filled in for each page, so links work from every folder:

- `{{root}}` goes in front of every link to another demo page. Leave it in.
- `{{current:NAME}}` marks a menu link as "the page you're on," for screen readers and for the underline. Copy it from a neighboring link and give it a short name, such as `{{current:campus-life}}`.

## Step 2: Copy your change into every page

In the project folder, run:

```
npm run build
```

It prints the pages it updated. Open one or two in a browser to check the change looks right, then commit all the changed files together.

## Step 3: Let the automatic check confirm it

When you push to GitHub, the first check compares every page with the shared files. If someone edited a header directly on one page, or forgot step 2, the check fails and names the pages to fix. Running `npm run build` and committing again fixes it.

## Rules for page files

Inside each page, the shared parts sit between two markers:

```html
<!-- include: header section="academics" -->
...
<!-- /include -->
```

- **Don't edit anything between these markers.** The next build replaces it, so your change would disappear. Edit the file in `partials/` instead.
- **`section` sets which menu item is marked as current.** Use one of: `academics`, `admission`, `athletics`, `directory` or `events`. Leave it out for pages that aren't in the menu, like the home page or a news story. If you type a name that doesn't match a menu link, the build stops and lists the names you can use.
- **New pages need both markers.** The program template already has them, so a page copied from it is ready.

## Need help?

Contact the web team at web@sleepinggiant.example. (This is a demo address; College of the Sleeping Giant is fictional.)
