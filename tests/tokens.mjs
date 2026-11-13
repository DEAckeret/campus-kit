// Checks every brand's token file, so a second school can't drift from the
// first or ship text people can't read.
//
// 1. Each brand file in BRANDS sets exactly the tokens tokens.css sets: none
//    missing (a component would lose its color) and none extra (a component
//    might start depending on a token only one brand has).
// 2. Every color pair the components use is measured, in every brand, against
//    WCAG 2.2 AA: 4.5 to 1 for text, 3 to 1 for focus rings and the gold
//    button on the header (non-text contrast).
//
// Built-in Node modules only, so it runs before `npm install`.
// Usage: npm run check:tokens
import { readFileSync } from "node:fs";

export const BRANDS = [
  { name: "College of the Sleeping Giant", file: "assets/css/tokens.css" },
  { name: "Kettle Harbor College", file: "assets/css/tokens-kettle-harbor.css" },
];

// [foreground, background, minimum ratio, where the pair appears]
const PAIRS = [
  ["ink", "paper", 4.5, "body text"],
  ["ink-muted", "paper", 4.5, "captions and secondary text"],
  ["ink-muted", "mist", 4.5, "secondary text in quiet sections"],
  ["ink-muted", "sky", 4.5, "secondary text on soft fills"],
  ["ink-muted", "gold-tint", 4.5, "secondary text in athletics callouts and search highlights"],
  ["ink-muted", "violet-tint", 4.5, "secondary text in callouts"],
  ["ink", "gold", 4.5, "the gold button"],
  ["ink", "gold-tint", 4.5, "the alert banner and next-game row"],
  ["ink", "sky", 4.5, "tags"],
  ["spruce", "paper", 4.5, "links and quiet buttons"],
  ["spruce", "mist", 4.5, "links in quiet sections"],
  ["spruce", "sky", 4.5, "links on soft fills"],
  ["spruce", "gold-tint", 4.5, "links in the alert banner and search highlights"],
  ["spruce", "violet-tint", 4.5, "links in callouts"],
  ["spruce-dark", "mist", 4.5, "quiet button on hover"],
  ["paper", "spruce", 4.5, "button text, header and hero text"],
  ["paper", "spruce-dark", 4.5, "button text on hover"],
  ["paper", "ink", 4.5, "footer text"],
  ["gold-tint", "spruce", 4.5, "series name on the social graphics"],
  ["alert", "paper", 4.5, "error messages"],
  ["alert", "alert-tint", 4.5, "alert callouts"],
  ["success", "paper", 4.5, "success messages"],
  ["violet", "paper", 3, "focus ring"],
  ["violet", "mist", 3, "focus ring in quiet sections"],
  ["violet", "violet-tint", 3, "focus ring in callouts"],
  ["violet", "gold-tint", 3, "focus ring in the alert banner"],
  ["gold", "spruce", 3, "focus ring and gold button on the header and hero"],
  ["gold", "ink", 3, "focus ring in the footer"],
];

// Custom properties set in :root, in the order written. Comments are removed
// first so a token mentioned in a comment doesn't count.
export function readTokens(file) {
  const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const tokens = new Map();
  for (const [, name, value] of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    tokens.set(name, value.trim());
  }
  return tokens;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const problems = [];
const reference = readTokens(BRANDS[0].file);

for (const brand of BRANDS) {
  const tokens = readTokens(brand.file);
  if (brand !== BRANDS[0]) {
    for (const name of reference.keys()) {
      if (!tokens.has(name)) problems.push(`${brand.file}: missing ${name} (tokens.css sets it)`);
    }
    for (const name of tokens.keys()) {
      if (!reference.has(name)) problems.push(`${brand.file}: sets ${name}, which tokens.css doesn't`);
    }
  }

  const color = (name) => {
    const value = tokens.get(`--color-${name}`);
    if (!/^#[0-9a-f]{6}$/i.test(value || "")) {
      problems.push(`${brand.file}: --color-${name} should be a six-digit hex color, not "${value}"`);
      return null;
    }
    return value;
  };

  console.log(`\n${brand.name} (${brand.file})`);
  for (const [fg, bg, minimum, where] of PAIRS) {
    const [a, b] = [color(fg), color(bg)];
    if (!a || !b) continue;
    // Round down to two places, so 4.499 never shows as a passing 4.50
    const ratio = Math.floor(contrast(a, b) * 100) / 100;
    const ok = ratio >= minimum;
    console.log(`  ${ok ? "pass" : "FAIL"}  ${ratio.toFixed(2)} to 1  ${fg} on ${bg} (${where})`);
    if (!ok) {
      problems.push(`${brand.file}: ${fg} on ${bg} is ${ratio.toFixed(2)} to 1, needs ${minimum} (${where})`);
    }
  }
}

if (problems.length) {
  console.log("");
  for (const problem of problems) {
    console.log(problem);
    if (process.env.GITHUB_ACTIONS) console.log(`::error::${problem}`);
  }
  process.exit(1);
}
console.log(`\nEvery brand sets the same ${reference.size} tokens, and every color pair passes.`);
