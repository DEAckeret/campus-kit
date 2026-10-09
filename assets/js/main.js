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
