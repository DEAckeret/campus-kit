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
