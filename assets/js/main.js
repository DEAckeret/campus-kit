/* ==========================================================================
   Campus Kit — behavior
   Small, dependency-free enhancements. Every page works without JavaScript;
   these scripts only make menus collapsible and lists filterable.
   ========================================================================== */

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
