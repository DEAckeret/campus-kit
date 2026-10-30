// Checks the "Add to calendar" files (.ics) that event pages link to.
//
// Every .ics file linked from a page in pages.mjs is checked against the
// event page in the same folder that links to it:
// 1. The file exists and follows the calendar format (RFC 5545) closely
//    enough for Apple Calendar, Google Calendar and Outlook: CRLF line
//    endings, lines no longer than 75 bytes, one event with a UID, DTSTAMP,
//    DTSTART, DTEND and SUMMARY, and times written in UTC (ending in Z).
// 2. The event starts and ends at the same moments as the page's first two
//    <time datetime="..."> elements (in the event summary), so the page and
//    the calendar can't disagree.
// 3. The SUMMARY matches the page's h1.
//
// Built-in Node modules only, so it runs before `npm install`.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { PAGES } from "./pages.mjs";

const problems = [];
let checked = 0;
const seen = new Set();
const linkedElsewhere = new Set();

// "20251102T013000Z" -> milliseconds since 1970
function utc(value) {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return NaN;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  return Date.UTC(y, mo - 1, d, h, mi, s);
}

function checkCalendar(file, page, html) {
  const raw = readFileSync(file);
  const text = raw.toString("utf8");
  const where = `${file} (linked from ${page})`;

  if (/[^\r]\n/.test(text) || !text.endsWith("\r\n")) {
    problems.push(`${where}: every line must end with CRLF. Check .gitattributes has "*.ics text eol=crlf".`);
  }
  const physical = text.split("\r\n").slice(0, -1);
  physical.forEach((line, i) => {
    if (Buffer.byteLength(line) > 75) {
      problems.push(`${where}: line ${i + 1} is longer than 75 bytes. Fold it onto the next line, which starts with a space.`);
    }
  });

  // Unfold, then read NAME:value pairs inside the event
  const lines = text.replace(/\r\n[ \t]/g, "").split("\r\n").filter(Boolean);
  if (lines[0] !== "BEGIN:VCALENDAR" || lines.at(-1) !== "END:VCALENDAR") {
    problems.push(`${where}: must start with BEGIN:VCALENDAR and end with END:VCALENDAR`);
  }
  for (const needed of ["VERSION:2.0", "PRODID:"]) {
    if (!lines.some((l) => l.startsWith(needed))) problems.push(`${where}: missing ${needed}`);
  }
  const events = lines.filter((l) => l === "BEGIN:VEVENT").length;
  if (events !== 1) problems.push(`${where}: should hold exactly one event, found ${events}`);

  const props = new Map();
  for (const line of lines) {
    const colon = line.indexOf(":");
    const name = line.slice(0, colon).split(";")[0];
    if (!props.has(name)) props.set(name, line.slice(colon + 1));
  }
  for (const name of ["UID", "DTSTAMP", "DTSTART", "DTEND", "SUMMARY"]) {
    if (!props.get(name)) problems.push(`${where}: the event needs ${name}`);
  }
  for (const name of ["DTSTAMP", "DTSTART", "DTEND"]) {
    if (props.get(name) && Number.isNaN(utc(props.get(name)))) {
      problems.push(`${where}: ${name} should be a UTC time like 20251102T013000Z, not "${props.get(name)}"`);
    }
  }

  // Compare with the page
  const times = [...html.matchAll(/<time[^>]*\sdatetime="([^"]+)"/g)].map((m) => m[1]);
  if (times.length < 2) {
    problems.push(`${page}: needs a start and end <time datetime="..."> in the event summary to compare with ${file}`);
  } else {
    const [start, end] = times.map((t) => Date.parse(t));
    if (start !== utc(props.get("DTSTART") || "")) {
      problems.push(`${where}: DTSTART ${props.get("DTSTART")} doesn't match the page's start time ${times[0]}`);
    }
    if (end !== utc(props.get("DTEND") || "")) {
      problems.push(`${where}: DTEND ${props.get("DTEND")} doesn't match the page's end time ${times[1]}`);
    }
  }
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, "").trim();
  if (h1 && props.get("SUMMARY") !== h1) {
    problems.push(`${where}: SUMMARY "${props.get("SUMMARY")}" doesn't match the page's heading "${h1}"`);
  }
  checked += 1;
}

for (const page of PAGES) {
  const html = readFileSync(page, "utf8").replace(/<!--[\s\S]*?-->/g, "");
  const links = [...html.matchAll(/<a\s[^>]*href="([^"#?]+\.ics)"[^>]*>/g)];
  for (const [tag, href] of links) {
    if (!/\sdownload[\s>=]/.test(tag)) {
      problems.push(`${page}: the link to ${href} needs a download attribute, so phones save the file instead of showing its text`);
    }
    const file = join(dirname(page), href);
    if (!existsSync(file)) {
      problems.push(`${page}: links to ${href}, but ${file} doesn't exist`);
      continue;
    }
    // Compare each file with the event page beside it. Other pages that
    // link to it (the style guide) only need the link to work.
    if (dirname(file) === dirname(page) && !seen.has(file)) {
      seen.add(file);
      checkCalendar(file, page, html);
    } else {
      linkedElsewhere.add(file);
    }
  }
}
for (const file of linkedElsewhere) {
  if (!seen.has(file)) problems.push(`${file}: no event page in the same folder links to it, so nothing checks it against a page`);
}

if (problems.length) {
  console.error(`Calendar file problems:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`Calendar files checked: ${checked}. Each is valid and matches its page.`);
