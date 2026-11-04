// Checks the images on every page in pages.mjs, using built-in Node modules
// only, so it runs in CI before npm install.
//
// For every <img>:
// 1. It has an alt attribute (alt="" is fine for decoration), and a width
//    and height, so the browser saves its space and the page doesn't jump.
// 2. Its src file exists.
// For every file listed in a srcset (on <img> or <source>):
// 3. The file exists and is exactly as wide as its "w" number says, so the
//    browser doesn't pick a file that's blurrier than it expects.
// 4. It weighs no more than MAX_KB, the largest target in the style guide's
//    "Sizes to save" table.
// 5. The element has a sizes attribute, since "w" numbers mean nothing
//    without it.
// 6. The <img> width and height have the same shape as its largest file,
//    so the photo isn't stretched.
//
// Run with: npm run check:images

import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { PAGES } from "./pages.mjs";

const MAX_KB = 250;
const problems = [];
let images = 0;
let files = 0;

// Width and height in pixels, read from the file's header
function pixelSize(file) {
  const b = readFileSync(file);
  if (b.toString("ascii", 1, 4) === "PNG") {
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  }
  if (b.toString("ascii", 0, 4) === "GIF8") {
    return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
  }
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const chunk = b.toString("ascii", 12, 16);
    if (chunk === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const bits = b.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === "VP8X") return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    // JPEG: walk the markers to the frame header (SOF0 to SOF15, except
    // C4, C8 and CC, which are other kinds of marker)
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) { i += 1; continue; }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null; // SVG, or a format this check doesn't read
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "i"));
  return m ? m[1] : null;
}

const isLocal = (url) => !/^[a-z]+:|^\/\//i.test(url);

// Checks each srcset file; returns the widest one's pixel size
function checkSrcset(page, tag, label) {
  const srcset = attr(tag, "srcset");
  if (!srcset) return null;
  let widest = null;
  const candidates = srcset.split(",").map((part) => part.trim().split(/\s+/)).filter((c) => c[0]);
  if (candidates.some((c) => /w$/.test(c[1] || "")) && attr(tag, "sizes") === null) {
    problems.push(`${page}: ${label} lists widths in srcset but has no sizes attribute. Add one that says how wide the photo shows, like sizes="(min-width: 48rem) 44rem, 100vw".`);
  }
  for (const [url, descriptor = ""] of candidates) {
    if (!isLocal(url)) continue;
    const file = join(dirname(page), url);
    if (!existsSync(file)) {
      problems.push(`${page}: ${label} lists ${url}, but ${file} doesn't exist`);
      continue;
    }
    files += 1;
    const kb = statSync(file).size / 1024;
    if (kb > MAX_KB) {
      problems.push(`${page}: ${url} weighs ${Math.round(kb)} KB. Save it smaller (under ${MAX_KB} KB): lower the quality to 70 to 80, or use WebP.`);
    }
    const size = pixelSize(file);
    const claimed = descriptor.match(/^(\d+)w$/);
    if (size && claimed && Number(claimed[1]) !== size.width) {
      problems.push(`${page}: srcset says ${url} is ${claimed[1]} pixels wide, but the file is ${size.width}. Fix the number or save the file at that width.`);
    }
    if (size && (!widest || size.width > widest.width)) widest = size;
  }
  return widest;
}

for (const page of PAGES) {
  const html = readFileSync(page, "utf8").replace(/<!--[\s\S]*?-->/g, "");
  // Each <picture> is checked as a group, so its <img> can be compared with
  // its WebP files too
  const blocks = [...html.matchAll(/<picture[\s>][\s\S]*?<\/picture>|<img\s[^>]*>/gi)].map((m) => m[0]);
  for (const block of blocks) {
    const img = block.match(/<img\s[^>]*>/i)?.[0];
    if (!img) {
      problems.push(`${page}: a <picture> has no <img>. The <img> is what shows the photo and holds its alt text.`);
      continue;
    }
    images += 1;
    const name = attr(img, "src") || "an image";
    if (attr(img, "alt") === null) {
      problems.push(`${page}: ${name} has no alt attribute. Describe the photo, or use alt="" if it's only decoration.`);
    }
    const width = Number(attr(img, "width"));
    const height = Number(attr(img, "height"));
    if (!width || !height) {
      problems.push(`${page}: ${name} needs width and height attributes (the size of its largest file), so the page doesn't jump while it loads.`);
    }
    const src = attr(img, "src");
    if (src && isLocal(src) && !existsSync(join(dirname(page), src))) {
      problems.push(`${page}: ${src} doesn't exist`);
    }
    let widest = checkSrcset(page, img, name);
    for (const source of block.match(/<source\s[^>]*>/gi) || []) {
      const size = checkSrcset(page, source, `a <source> for ${name}`);
      if (size && (!widest || size.width > widest.width)) widest = size;
    }
    if (widest && width && height) {
      const off = Math.abs(width / height - widest.width / widest.height) / (widest.width / widest.height);
      if (off > 0.01) {
        problems.push(`${page}: ${name} says width="${width}" height="${height}", but its files are ${widest.width} by ${widest.height}. Use the largest file's size so the photo isn't stretched.`);
      }
    }
  }
}

if (problems.length) {
  console.error(`Image problems:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`Images checked: ${images} on ${PAGES.length} pages, with ${files} files in srcset lists. All have alt text, a width and a height, and every file is the width it claims and under ${MAX_KB} KB.`);
