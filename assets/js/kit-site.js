/* ==========================================================================
   Campus Kit — style guide helper
   Shows the HTML of each live example underneath it, so the code a reader
   copies is always exactly what they see rendered.
   ========================================================================== */

document.querySelectorAll(".sg-example").forEach((example) => {
  const lines = example.innerHTML.replace(/^\n+|\s+$/g, "").split("\n");
  const indent = Math.min(
    ...lines.filter((line) => line.trim()).map((line) => line.match(/^ */)[0].length)
  );
  const pre = document.createElement("pre");
  pre.className = "sg-code";
  pre.tabIndex = 0; // lets keyboard users scroll wide code
  pre.setAttribute("aria-label", "HTML for this example");
  const code = document.createElement("code");
  // innerHTML writes boolean attributes as hidden=""; show them the way people write them
  code.textContent = lines.map((line) => line.slice(indent)).join("\n").replace(/=""/g, "");
  pre.append(code);
  example.after(pre);
});

/* ---- Brand switch (style guide) ----------------------------------------
   Swaps the page's token file for another school's, to show that one file
   rebrands the kit. Markup: <link ... data-brand-tokens> for tokens.css, and
   <fieldset data-brand-switch hidden> holding one radio button per brand
   (value = the name in the address, data-file = the token file) and a
   <p role="status" data-brand-status>. The choice is kept in the address
   (styleguide.html?brand=kettle-harbor) so it can be linked, and nowhere
   else. Without JavaScript the switch stays hidden.

   Elements with data-token="--color-…" show that token's value, plus its
   contrast with --color-paper when they have data-contrast. Elements with
   data-font="--font-…" show the first font in that token.               */
const brandSwitch = document.querySelector("[data-brand-switch]");
const brandLink = document.querySelector("[data-brand-tokens]");

if (brandSwitch && brandLink) {
  const radios = [...brandSwitch.querySelectorAll('input[type="radio"]')];
  const status = brandSwitch.querySelector("[data-brand-status]");
  const folder = brandLink.getAttribute("href").replace(/[^/]*$/, "");
  let current = brandLink;

  const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
  };

  const showValues = () => {
    const styles = getComputedStyle(document.documentElement);
    const token = (name) => styles.getPropertyValue(name).trim();
    const paper = token("--color-paper");
    document.querySelectorAll("[data-token]").forEach((element) => {
      const value = token(element.dataset.token).toLowerCase();
      if (!/^#[0-9a-f]{6}$/.test(value)) return;
      let text = value;
      if (element.hasAttribute("data-contrast")) {
        // Rounded down, so a color never looks better than it measures
        text += `, ${(Math.floor(contrast(value, paper) * 10) / 10).toFixed(1)} to 1`;
      }
      element.textContent = text;
    });
    document.querySelectorAll("[data-font]").forEach((element) => {
      const first = token(element.dataset.font).split(",")[0].replace(/["']/g, "").trim();
      if (first) element.textContent = first;
    });
  };

  const useBrand = (radio, { announce }) => {
    radio.checked = true;
    const href = folder + radio.dataset.file;
    const name = radio.parentElement.textContent.replace(radio.dataset.file, "").trim();
    const done = () => {
      showValues();
      if (announce) status.textContent = `Showing ${name}'s brand.`;
    };
    if (current.getAttribute("href") === href) {
      done();
      return;
    }
    // Load the new file next to the old one and remove the old one once the
    // new one is in, so the page never shows without tokens
    const next = current.cloneNode();
    next.setAttribute("href", href);
    // A token file can @import its school's web fonts. If those are blocked
    // (an ad blocker, a school network), the browser reports an error even
    // though the tokens themselves loaded, so check for the style sheet
    // rather than trusting the event.
    const settle = () => {
      if (next.sheet) {
        current.remove();
        current = next;
        done();
        return;
      }
      // The file itself didn't load: keep the brand that's showing
      next.remove();
      const showing = radios.find((other) => folder + other.dataset.file === current.getAttribute("href"));
      if (showing) showing.checked = true;
      if (announce) status.textContent = `${name}'s brand couldn't load. Try again.`;
    };
    next.addEventListener("load", settle, { once: true });
    next.addEventListener("error", settle, { once: true });
    current.after(next);
  };

  const fromAddress = new URLSearchParams(window.location.search).get("brand");
  const start = radios.find((radio) => radio.value === fromAddress) || radios[0];
  brandSwitch.hidden = false;
  useBrand(start, { announce: false });

  brandSwitch.addEventListener("change", (event) => {
    const radio = event.target;
    if (!radios.includes(radio)) return;
    useBrand(radio, { announce: true });
    const address = new URL(window.location.href);
    if (radio === radios[0]) address.searchParams.delete("brand");
    else address.searchParams.set("brand", radio.value);
    window.history.replaceState(null, "", address);
  });
}
