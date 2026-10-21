/* ==========================================================================
   Campus Kit — behavior
   Small, dependency-free enhancements. Every page works without JavaScript;
   these scripts only make menus collapsible and lists filterable.
   ========================================================================== */

// Each page also adds this class in its <head>, so the menu starts closed
// without a jump; adding it here too keeps pages that leave that line out working.
document.documentElement.classList.add("js");

/* ---- Mobile menu -------------------------------------------------------- */
document.querySelectorAll("[data-nav-toggle]").forEach((button) => {
  const nav = document.getElementById(button.getAttribute("aria-controls"));
  if (!nav) return;
  nav.dataset.open = "false";
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    nav.dataset.open = String(!open);
  });
});

/* ---- Closable alert banners ----------------------------------------------
   Markup: <section class="alert-banner" data-dismissible> with a
   <button class="alert-banner__close" hidden> inside. The button stays hidden
   without JavaScript. Closing is remembered in this browser until the notice
   text changes, so a new notice always shows.
   ------------------------------------------------------------------------- */
document.querySelectorAll("[data-dismissible]").forEach((banner) => {
  const button = banner.querySelector(".alert-banner__close");
  if (!button) return;
  const message = banner.querySelector("p")?.textContent.trim() || "";
  const key = `campus-kit:closed-notice:${message}`;
  // Style guide examples close for the page view only
  const remember = !banner.closest(".sg-example");

  let closed = false;
  try {
    closed = remember && window.localStorage.getItem(key) === "1";
  } catch {
    /* storage unavailable (private browsing, blocked cookies): just show it */
  }
  if (closed) {
    banner.hidden = true;
    return;
  }

  button.hidden = false;
  button.addEventListener("click", () => {
    banner.hidden = true;
    try {
      if (remember) window.localStorage.setItem(key, "1");
    } catch {
      /* closing still works for this page view */
    }
    // Send keyboard focus somewhere sensible instead of losing it
    const next = document.querySelector(".site-header a, main a, main");
    if (next) next.focus();
  });
});

/* ---- Filterable lists ----------------------------------------------------
   Markup contract:
     <form data-filter="LIST_ID">  holds inputs with name="q" (text search)
                                   and/or <select name="KEY"> (exact match)
     <ul id="LIST_ID">             items carry data-KEY="value" attributes;
                                   text search matches each item's text
     <p data-filter-count="LIST_ID" aria-live="polite">  announces results
   ------------------------------------------------------------------------- */
document.querySelectorAll("[data-filter]").forEach((form) => {
  const list = document.getElementById(form.dataset.filter);
  if (!list) return;
  const items = Array.from(list.children);
  const count = document.querySelector(`[data-filter-count="${form.dataset.filter}"]`);
  const noun = count?.dataset.noun || "result";
  const plural = count?.dataset.plural || `${noun}s`;

  const apply = () => {
    const data = new FormData(form);
    const query = String(data.get("q") || "").trim().toLowerCase();
    let shown = 0;

    items.forEach((item) => {
      let match = !query || item.textContent.toLowerCase().includes(query);
      for (const [key, value] of data.entries()) {
        if (key === "q" || !value) continue;
        const itemValue = item.dataset[key] || "";
        if (!itemValue.split(" ").includes(String(value))) match = false;
      }
      item.hidden = !match;
      if (match) shown += 1;
    });

    if (count) {
      count.textContent =
        shown === 0
          ? `No ${plural} match. Try a shorter search or choose "All".`
          : `Showing ${shown} ${shown === 1 ? noun : plural}`;
    }
  };

  form.addEventListener("input", apply);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    apply();
  });

  // Let other pages link straight to a filtered view, e.g. programs.html?q=nursing
  const params = new URLSearchParams(window.location.search);
  params.forEach((value, key) => {
    const field = form.elements.namedItem(key);
    if (field) field.value = value;
  });
  apply();
});

/* ---- Demo contact links --------------------------------------------------
   College of the Sleeping Giant is fictional, so its phone numbers and email
   addresses don't go anywhere. In the demo they're written as
     <a href="#" data-demo-contact="phone">(406) 555-0140</a>
     <a href="#" data-demo-contact="email">giving@sleepinggiant.example</a>
   and clicking one opens a short note explaining what a real link would do.
   On a real site, use href="tel:+1..." and href="mailto:..." instead and
   leave out data-demo-contact.
   ------------------------------------------------------------------------- */
const demoContacts = document.querySelectorAll("[data-demo-contact]");
if (demoContacts.length && typeof HTMLDialogElement === "function") {
  const dialog = document.createElement("dialog");
  dialog.className = "demo-dialog";
  dialog.setAttribute("aria-labelledby", "demo-dialog-title");
  dialog.innerHTML =
    '<h2 id="demo-dialog-title" tabindex="-1"></h2><p data-demo-text></p><p data-demo-why></p>' +
    '<form method="dialog"><button class="button" type="submit">Close</button></form>';
  document.body.append(dialog);
  const title = dialog.querySelector("h2");
  const text = dialog.querySelector("[data-demo-text]");
  const why = dialog.querySelector("[data-demo-why]");
  let opener = null;

  demoContacts.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const contact = link.textContent.trim();
      if (link.dataset.demoContact === "email") {
        title.textContent = "This email address is just for the demo";
        text.textContent = `On a real college website, this link would open your email app with a new message to ${contact}.`;
        why.textContent = "College of the Sleeping Giant is a fictional school, so there's no inbox to reach.";
      } else {
        title.textContent = "This phone number is just for the demo";
        text.textContent = `On a real college website, tapping this link on a phone would call ${contact}.`;
        why.textContent = "College of the Sleeping Giant is a fictional school, so this demo doesn't place calls.";
      }
      opener = link;
      dialog.showModal();
      // Start at the heading, not the Close button, so the note reads from
      // the top even when it's taller than the window (400% zoom)
      title.focus();
    });
  });

  // Clicking the dimmed area outside the box closes it too
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  // Put keyboard focus back on the link that opened it
  dialog.addEventListener("close", () => opener?.focus());
}

/* ---- Missing address (404 page) ------------------------------------------
   Markup: <p data-missing-address hidden>…<code></code></p> and
           <p data-missing-referrer hidden>…<code></code></p>
   Shows the address the visitor tried, and the page on this site that
   linked to it, so they can copy both into a report. Nothing is sent
   anywhere. Without JavaScript both lines stay hidden.
   ------------------------------------------------------------------------- */
const showAddress = (selector, address) => {
  const line = document.querySelector(selector);
  const code = line?.querySelector("code");
  if (!line || !code || !address) return;
  code.textContent = address;
  line.hidden = false;
};
showAddress("[data-missing-address]", window.location.href);
// Only a page on this same site counts; other sites' links aren't ours to fix
if (document.referrer.startsWith(`${window.location.origin}/`)) {
  showAddress("[data-missing-referrer]", document.referrer);
}
