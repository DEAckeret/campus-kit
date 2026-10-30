// Every page the automated checks visit (accessibility.mjs, zoom.mjs, print.mjs).
// Add each new page here.
export const PAGES = [
  "index.html",
  "styleguide.html",
  "demo/index.html",
  "demo/programs.html",
  "demo/programs/biology.html",
  "demo/programs/_template.html",
  "demo/events.html",
  "demo/events/fall-choir-concert.html",
  "demo/directory.html",
  "demo/news/article.html",
  "demo/flyer.html",
  "demo/apply.html",
  "demo/athletics/womens-soccer.html",
  "demo/give.html",
  "demo/social.html",
  "demo/404.html",
  "report.html",
  "analytics.html",
];

// The demo's welcome note (main.js) opens over the first page a visitor
// sees. The checks visit every page with it already closed, then visit
// this page once more with it open. A "#welcome" address opens it.
export const WELCOME_PAGE = "demo/index.html#welcome";

// Add to each browser context with context.addInitScript(SKIP_WELCOME)
export function SKIP_WELCOME() {
  const visitKey = "campus-kit:demo-welcome-closed";
  const foreverKey = "campus-kit:demo-welcome-hidden";
  try {
    if (window.location.hash === "#welcome") {
      window.sessionStorage.removeItem(visitKey);
      window.localStorage.removeItem(foreverKey);
    } else {
      window.sessionStorage.setItem(visitKey, "1");
    }
  } catch {
    /* no storage: the note opens on every page */
  }
}
