#!/usr/bin/env node
/* ==========================================================================
   Campus Kit — content audit spreadsheet
   Writes the spreadsheet a department fills in when it reviews its pages
   each semester (the checklist is audit.html):

     assets/downloads/content-audit.xlsx   three tabs: "Pages" (blank, with
                                           drop-down lists), "Example" (the
                                           biology department's audit) and
                                           "How to use"
     assets/downloads/content-audit.csv    the column headings only, for
                                           tools that don't open .xlsx

   It also writes the "What each column means" table, and the file size on
   the download button, into audit.html,
   between these markers, so the page and the spreadsheet can't disagree:

     <!-- content-audit: columns -->
     ...replaced every time...
     <!-- /content-audit -->

   To add, rename or reword a column, change COLUMNS below and run the
   script. The header colors come from assets/css/tokens.css, so a rebrand
   reaches the spreadsheet too.

   Usage:
     node scripts/content-audit.mjs          write the files
                                             (npm run audit-sheet)
     node scripts/content-audit.mjs --check  change nothing; exit 1 if any
                                             is out of date (used in CI)

   No dependencies: only Node's built-in modules. The .xlsx file is a zip
   of XML files, written here by hand. The XML inside is the same every
   time, so CI can check it.
   ========================================================================== */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync, inflateRawSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "assets", "downloads");
const XLSX = join(OUT_DIR, "content-audit.xlsx");
const CSV = join(OUT_DIR, "content-audit.csv");
const PAGE = join(ROOT, "audit.html");
const TOKENS = join(ROOT, "assets", "css", "tokens.css");
const CHECK = process.argv.includes("--check");

const PAGE_MARKER = /^([ \t]*)<!-- content-audit: columns -->\n[\s\S]*?^[ \t]*<!-- \/content-audit -->/m;
const CHECKLIST_URL = "https://deackeret.github.io/campus-kit/audit.html";
const BLANK_ROWS = 200; // drop-down lists reach this far down the Pages tab

// Show mistakes as one plain sentence, not a stack trace
process.on("uncaughtException", (error) => {
  console.error(error.message);
  process.exit(1);
});

/* ---- What goes in the spreadsheet --------------------------------------- */

/** "Choose Yes or Needs work", or "Choose one: Keep, Update, ..." */
const choose = (choices) => (choices.length === 2 ? `Choose ${choices.join(" or ")}` : `Choose one: ${choices.join(", ")}`);

const CHECK_CHOICES = ["Yes", "Needs work"];
const DECISIONS = ["Keep", "Update", "Combine", "Remove"];

// kind: text, date, number or choice. width is in characters.
const COLUMNS = [
  { name: "Page", kind: "text", width: 30, means: "The page's title, as it appears at the top of the page." },
  { name: "Address", kind: "text", width: 40, means: "The page's web address." },
  { name: "Page owner", kind: "text", width: 22, means: "The person or office that answers for what the page says." },
  { name: "Last reviewed", kind: "date", width: 14, means: "When someone last went through the whole page. Change it when the page passes." },
  { name: "Visits last semester", kind: "number", width: 12, means: "From the web team's analytics. Few visits is a question to ask, not a reason on its own to remove a page." },
  { name: "Correct", kind: "choice", choices: CHECK_CHOICES, width: 12, means: "Names, dates, rooms, phone numbers, costs and deadlines are right." },
  { name: "Still needed", kind: "choice", choices: CHECK_CHOICES, width: 12, means: "Someone still needs the page, and no other page says the same thing." },
  { name: "Clear", kind: "choice", choices: CHECK_CHOICES, width: 12, means: "The title and headings say what's there, and the next step is easy to find." },
  { name: "Accessible", kind: "choice", choices: CHECK_CHOICES, width: 12, means: "Alt text, table headers, link words, captions, and no scanned PDFs or color alone." },
  { name: "Works", kind: "choice", choices: CHECK_CHOICES, width: 12, means: "Links, buttons and forms work, and the page reads well on a phone." },
  { name: "Decision", kind: "choice", choices: DECISIONS, width: 12, means: "Keep, Update, Combine or Remove." },
  { name: "What to change", kind: "text", width: 50, means: "Specific enough that someone else could do it." },
  { name: "Who does it", kind: "text", width: 22, means: "One person or office." },
  { name: "Due by", kind: "date", width: 14, means: "The date it should be done." },
  { name: "Done on", kind: "date", width: 14, means: "Fill in when it's done." },
];

// The biology department's fall 2026 audit, for the Example tab.
// Everyone and every page here is fictional.
const EXAMPLE_ROWS = [
  ["Biology", "www.sleepinggiant.example/programs/biology", "Dr. Priya Raman", "2026-03-12", 2140,
    "Needs work", "Yes", "Yes", "Yes", "Yes", "Update",
    "BIO 340 is now BIO 345 in the course table, and the advising office moved to Larch Hall 214.", "Dr. Priya Raman", "2026-10-30", "2026-10-21"],
  ["Biology faculty and staff", "www.sleepinggiant.example/directory?dept=biology", "Biology office", "2026-03-12", 610,
    "Needs work", "Yes", "Yes", "Yes", "Yes", "Update",
    "Add the new lab coordinator.", "Biology office", "2026-10-30", ""],
  ["Students track river health", "www.sleepinggiant.example/news/river-health", "Communications office", "2026-10-02", 1380,
    "Yes", "Yes", "Yes", "Yes", "Yes", "Keep",
    "", "", "", ""],
  ["Pre-health advising", "www.sleepinggiant.example/biology/pre-health", "Dr. Thomas Whitehorse", "2024-09-09", 230,
    "Needs work", "Needs work", "Yes", "Yes", "Needs work", "Combine",
    "Says the same as the Advising office's health professions page, with last year's deadline. Move the biology course list onto that page and send this address there.", "Web team, with the Advising office", "2026-11-13", ""],
  ["Summer field course 2019", "www.sleepinggiant.example/biology/field-course-2019", "Dr. Thomas Whitehorse", "2019-06-04", 12,
    "Needs work", "Needs work", "Yes", "Needs work", "Needs work", "Remove",
    "The course ended in 2019. Remove the page and send its address to the biology page.", "Web team", "2026-10-30", "2026-10-20"],
  ["Lab safety rules (PDF)", "www.sleepinggiant.example/biology/lab-safety.pdf", "Biology office", "2025-08-20", 95,
    "Yes", "Yes", "Needs work", "Needs work", "Yes", "Update",
    "A scanned PDF that screen readers can't read. Put the rules on a page, and keep a PDF only for the form students sign.", "Biology office", "2026-12-11", ""],
];

const HOW_TO = [
  ["title", "How to use this spreadsheet"],
  ["text", "Once a semester, go through every page your department owns, one row per page, on the Pages tab."],
  ["text", "1. Fill in each page's title, address and owner. The web team can send you the list with last semester's visits filled in."],
  ["text", "2. Read each page, on a phone as well as a computer. For each of the five checks, choose Yes or Needs work."],
  ["text", `3. Choose a decision: Keep, Update, Combine or Remove. The checklist explains each one: ${CHECKLIST_URL}`],
  ["text", "4. For anything but Keep, say what to change, who does it and by when."],
  ["text", "5. Send the spreadsheet to the web team at web@sleepinggiant.example by the audit deadline. Fill in Done on as things get fixed."],
  ["text", "The Example tab shows the biology department's fall 2026 audit."],
  ["blank"],
  ["heading", "What each column means"],
  ...COLUMNS.map((column) => ["column", column.name, column.means]),
];

/* ---- Colors from the design tokens -------------------------------------- */

const tokens = readFileSync(TOKENS, "utf8");
function token(name) {
  const match = tokens.match(new RegExp(`--${name}:\\s*#([0-9a-fA-F]{6})\\b`));
  if (!match) throw new Error(`tokens.css has no six-digit --${name} color; the spreadsheet needs it.`);
  return `FF${match[1].toUpperCase()}`;
}
const COLOR = {
  header: token("color-spruce"),
  headerText: token("color-paper"),
  line: token("color-line"),
  ink: token("color-ink"),
};

/* ---- Spreadsheet XML ---------------------------------------------------- */

const escapeXml = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A1-style column letters: 0 → A, 26 → AA. */
function letter(index) {
  let name = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
}
const LAST = letter(COLUMNS.length - 1);

/** Days since December 30, 1899, which is how spreadsheets store dates. */
function serialDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000;
}

// Cell styles, by their position in cellXfs in styles.xml
const STYLE = { header: 1, text: 2, date: 3, number: 4, title: 5, heading: 6, label: 7, plain: 8 };

function cell(ref, value, kind) {
  if (value === "" || value === undefined || value === null) return `<c r="${ref}" s="${STYLE[kind] ?? STYLE.text}"/>`;
  if (kind === "date") return `<c r="${ref}" s="${STYLE.date}"><v>${serialDate(value)}</v></c>`;
  if (kind === "number") return `<c r="${ref}" s="${STYLE.number}"><v>${value}</v></c>`;
  const style = STYLE[kind] ?? STYLE.text;
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function headerRow() {
  const cells = COLUMNS.map((column, i) => cell(`${letter(i)}1`, column.name, "header")).join("");
  return `<row r="1" ht="32" customHeight="1">${cells}</row>`;
}

function dataRow(values, r) {
  const cells = COLUMNS.map((column, i) => {
    const kind = column.kind === "choice" ? "text" : column.kind;
    return cell(`${letter(i)}${r}`, values[i], kind);
  }).join("");
  return `<row r="${r}">${cells}</row>`;
}

const PAGE_SETUP =
  `<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>` +
  `<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>`;

/** The Pages and Example tabs: same columns, drop-downs, frozen header. */
function auditSheet(rows, { selected, lastRow }) {
  const cols = COLUMNS.map((column, i) => `<col min="${i + 1}" max="${i + 1}" width="${column.width + 2}" customWidth="1"/>`).join("");
  const body = rows.map((values, i) => dataRow(values, i + 2)).join("");
  const validations = [];
  COLUMNS.forEach((column, i) => {
    const range = `${letter(i)}2:${letter(i)}${lastRow}`;
    if (column.kind === "choice") {
      validations.push(
        `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" ` +
          `errorTitle="${escapeXml(column.name)}" error="${escapeXml(choose(column.choices))}." sqref="${range}">` +
          `<formula1>"${escapeXml(column.choices.join(","))}"</formula1></dataValidation>`
      );
    } else if (column.kind === "date") {
      validations.push(
        `<dataValidation type="date" operator="greaterThan" allowBlank="1" showErrorMessage="1" ` +
          `errorTitle="${escapeXml(column.name)}" error="Type a date, such as 10/30/2026." sqref="${range}">` +
          `<formula1>1</formula1></dataValidation>`
      );
    } else if (column.kind === "number") {
      validations.push(
        `<dataValidation type="whole" operator="greaterThanOrEqual" allowBlank="1" showErrorMessage="1" ` +
          `errorTitle="${escapeXml(column.name)}" error="Type a whole number, such as 120." sqref="${range}">` +
          `<formula1>0</formula1></dataValidation>`
      );
    }
  });
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>` +
    `<dimension ref="A1:${LAST}${Math.max(rows.length + 1, 1)}"/>` +
    `<sheetViews><sheetView ${selected ? 'tabSelected="1" ' : ""}workbookViewId="0">` +
    `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
    `<selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>` +
    `<cols>${cols}</cols>` +
    `<sheetData>${headerRow()}${body}</sheetData>` +
    `<autoFilter ref="A1:${LAST}${lastRow}"/>` +
    `<dataValidations count="${validations.length}">${validations.join("")}</dataValidations>` +
    PAGE_SETUP +
    `</worksheet>`
  );
}

function howToSheet() {
  const rows = HOW_TO.map(([kind, a, b], i) => {
    const r = i + 1;
    if (kind === "blank") return `<row r="${r}"/>`;
    if (kind === "column") return `<row r="${r}">${cell(`A${r}`, a, "label")}${cell(`B${r}`, b, "text")}</row>`;
    const style = kind === "title" ? "title" : kind === "heading" ? "heading" : "plain";
    const height = kind === "title" ? ' ht="24" customHeight="1"' : "";
    // Instructions run across both columns
    return `<row r="${r}"${height}>${cell(`A${r}`, a, style)}</row>`;
  });
  const merges = HOW_TO.map(([kind], i) => (kind === "column" || kind === "blank" ? null : `<mergeCell ref="A${i + 1}:B${i + 1}"/>`)).filter(Boolean);
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>` +
    `<dimension ref="A1:B${HOW_TO.length}"/>` +
    `<sheetViews><sheetView workbookViewId="0"/></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>` +
    `<cols><col min="1" max="1" width="24" customWidth="1"/><col min="2" max="2" width="90" customWidth="1"/></cols>` +
    `<sheetData>${rows.join("")}</sheetData>` +
    `<mergeCells count="${merges.length}">${merges.join("")}</mergeCells>` +
    PAGE_SETUP.replace("landscape", "portrait") +
    `</worksheet>`
  );
}

const SHEETS = [
  { name: "Pages", xml: () => auditSheet([], { selected: true, lastRow: BLANK_ROWS + 1 }), filter: BLANK_ROWS + 1 },
  { name: "Example", xml: () => auditSheet(EXAMPLE_ROWS, { selected: false, lastRow: EXAMPLE_ROWS.length + 1 }), filter: EXAMPLE_ROWS.length + 1 },
  { name: "How to use", xml: howToSheet },
];

function stylesXml() {
  const border = `<left/><right/><top/><bottom style="thin"><color rgb="${COLOR.line}"/></bottom><diagonal/>`;
  const top = `<alignment vertical="top" wrapText="1"/>`;
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<numFmts count="1"><numFmt numFmtId="164" formatCode="mmm d, yyyy"/></numFmts>` +
    `<fonts count="4">` +
    `<font><sz val="11"/><color rgb="${COLOR.ink}"/><name val="Arial"/><family val="2"/></font>` +
    `<font><b/><sz val="11"/><color rgb="${COLOR.headerText}"/><name val="Arial"/><family val="2"/></font>` +
    `<font><b/><sz val="16"/><color rgb="${COLOR.ink}"/><name val="Arial"/><family val="2"/></font>` +
    `<font><b/><sz val="11"/><color rgb="${COLOR.ink}"/><name val="Arial"/><family val="2"/></font>` +
    `</fonts>` +
    `<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>` +
    `<fill><patternFill patternType="solid"><fgColor rgb="${COLOR.header}"/><bgColor indexed="64"/></patternFill></fill></fills>` +
    `<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border>${border}</border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="9">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">${top}</xf>` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">${top}</xf>` +
    `<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1">${top}</xf>` +
    `<xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1">${top}</xf>` +
    `<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
    `<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1">${top}</xf>` +
    `<xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">${top}</xf>` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1">${top}</xf>` +
    `</cellXfs>` +
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
    `</styleSheet>`
  );
}

function workbookXml() {
  const sheets = SHEETS.map((sheet, i) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("");
  // Spreadsheet apps expect each filtered range to have this hidden name
  const names = SHEETS.map((sheet, i) =>
    sheet.filter ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${sheet.name}'!$A$1:$${LAST}$${sheet.filter}</definedName>` : ""
  ).join("");
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<bookViews><workbookView activeTab="0"/></bookViews>` +
    `<sheets>${sheets}</sheets><definedNames>${names}</definedNames>` +
    `</workbook>`
  );
}

function packageFiles() {
  const sheetTypes = SHEETS.map((_, i) =>
    `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join("");
  const sheetRels = SHEETS.map((_, i) =>
    `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
  ).join("");
  const head = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  return [
    ["[Content_Types].xml", head +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
      sheetTypes + `</Types>`],
    ["_rels/.rels", head +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
      `</Relationships>`],
    ["xl/workbook.xml", workbookXml()],
    ["xl/_rels/workbook.xml.rels", head +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` + sheetRels +
      `<Relationship Id="rId${SHEETS.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      `</Relationships>`],
    ["xl/styles.xml", stylesXml()],
    ...SHEETS.map((sheet, i) => [`xl/worksheets/sheet${i + 1}.xml`, sheet.xml()]),
  ];
}

/* ---- A minimal zip writer ----------------------------------------------- */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// A fixed file date (January 1, 2026), so the zip is the same every run
const DOS_TIME = 0;
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;

function zip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, text] of files) {
    const nameBytes = Buffer.from(name, "utf8");
    const data = Buffer.from(text, "utf8");
    const packed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);          // version needed
    local.writeUInt16LE(0x0800, 6);      // names are UTF-8
    local.writeUInt16LE(8, 8);           // deflate
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBytes, packed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);        // made by
    central.writeUInt16LE(20, 6);        // version needed
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);   // other fields stay 0
    centrals.push(central, nameBytes);

    offset += local.length + nameBytes.length + packed.length;
  }
  const centralSize = centrals.reduce((sum, b) => sum + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}

/** The files inside a zip this script wrote: [[name, text], ...]. */
function unzip(buffer) {
  const files = [];
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) return files;
  let at = buffer.readUInt32LE(end + 16);
  for (let i = 0; i < buffer.readUInt16LE(end + 10); i++) {
    const nameLength = buffer.readUInt16LE(at + 28);
    const name = buffer.toString("utf8", at + 46, at + 46 + nameLength);
    const local = buffer.readUInt32LE(at + 42);
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const packed = buffer.subarray(start, start + buffer.readUInt32LE(at + 20));
    const method = buffer.readUInt16LE(at + 10);
    files.push([name, (method === 8 ? inflateRawSync(packed) : packed).toString("utf8")]);
    at += 46 + nameLength + buffer.readUInt16LE(at + 30) + buffer.readUInt16LE(at + 32);
  }
  return files;
}

/* ---- The CSV and the page's table --------------------------------------- */

const csvField = (text) => (/[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);
const csv = COLUMNS.map((column) => csvField(column.name)).join(",") + "\r\n";

const escapeHtml = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function pageTable(indent) {
  const kindWords = {
    text: "Type it in",
    date: "Type a date",
    number: "Type a number",
  };
  const rows = COLUMNS.map((column) => {
    const kind = column.kind === "choice" ? choose(column.choices) : kindWords[column.kind];
    return `${indent}      <tr><th scope="row">${escapeHtml(column.name)}</th><td>${escapeHtml(column.means)}<span class="audit-columns__kind">${escapeHtml(kind)}</span></td></tr>`;
  });
  return [
    `${indent}<!-- content-audit: columns -->`,
    `${indent}<!-- Made by scripts/content-audit.mjs from its list of columns. Edit the list there, not here. -->`,
    `${indent}<section class="table-wrap" tabindex="0" aria-labelledby="columns-caption">`,
    `${indent}  <table class="audit-columns">`,
    `${indent}    <caption id="columns-caption">The spreadsheet's ${COLUMNS.length} columns, left to right</caption>`,
    `${indent}    <thead>`,
    `${indent}      <tr><th scope="col">Column</th><th scope="col">What goes in it</th></tr>`,
    `${indent}    </thead>`,
    `${indent}    <tbody>`,
    ...rows,
    `${indent}    </tbody>`,
    `${indent}  </table>`,
    `${indent}</section>`,
    `${indent}<!-- /content-audit -->`,
  ].join("\n");
}

/* ---- Write, or check -------------------------------------------------- */

const xlsx = zip(packageFiles());
const page = readFileSync(PAGE, "utf8");
const marker = page.match(PAGE_MARKER);
if (!marker) throw new Error("audit.html has no <!-- content-audit: columns --> ... <!-- /content-audit --> markers.");
// The download button gives the file's size, which changes with the columns
const sizeKb = Math.max(1, Math.round(xlsx.length / 1024));
const newPage = page
  .replace(PAGE_MARKER, pageTable(marker[1]))
  .replace(/\(Excel, \d+(?: |&nbsp;)KB\)/, `(Excel, ${sizeKb}&nbsp;KB)`);

const outputs = [
  [XLSX, xlsx, "assets/downloads/content-audit.xlsx"],
  [CSV, Buffer.from(csv, "utf8"), "assets/downloads/content-audit.csv"],
  [PAGE, Buffer.from(newPage, "utf8"), "audit.html (the column table)"],
];

function current(path) {
  try {
    return readFileSync(path);
  } catch {
    return null;
  }
}

// Compare what's inside the spreadsheet, not its bytes: another version of
// Node's zlib can pack the same XML a little differently.
const sameContents = (path, data) => {
  const before = current(path);
  if (!before) return false;
  if (path !== XLSX) return before.equals(data);
  try {
    return JSON.stringify(unzip(before)) === JSON.stringify(unzip(data));
  } catch {
    return false;
  }
};

if (CHECK) {
  const stale = outputs.filter(([path, data]) => !sameContents(path, data));
  if (stale.length) {
    console.error(`Out of date: ${stale.map(([, , label]) => label).join(", ")}. Run npm run audit-sheet and commit the result.`);
    process.exit(1);
  }
  console.log(`The content audit spreadsheet, its CSV and the column table in audit.html are up to date (${COLUMNS.length} columns).`);
} else {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [path, data, label] of outputs) {
    if (sameContents(path, data)) continue;
    writeFileSync(path, data);
    console.log(`Wrote ${label}`);
  }
  console.log(`${COLUMNS.length} columns, ${EXAMPLE_ROWS.length} example rows, ${(xlsx.length / 1024).toFixed(1)} KB spreadsheet.`);
}
