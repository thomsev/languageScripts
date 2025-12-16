const fs = require("fs");
const path = require("path");

// ---- CONFIG ----
// Usage: node apply-danish-to-po.js source.po da.csv output.po
const poInputFile = process.argv[2] || "nb.po"; // original PO with Norwegian
const csvInputFile = process.argv[3] || "dansk.csv"; // CSV with Danish in first column
const poOutputFile = process.argv[4] || "da2.po"; // new PO with Danish

const SKIP_LINES = 2; // in your screenshot: 1: Column2, 2: da
// ---- END CONFIG ----

function readCsvColumn(filePath) {
  let raw = fs.readFileSync(filePath, "utf8");

  // Remove BOM if present
  raw = raw.replace(/^\uFEFF/, "");

  const lines = raw.split(/\r?\n/);
  // Don't filter empty lines – they are needed to keep alignment!
  const dataLines = lines.slice(SKIP_LINES);

  console.log("Total CSV lines:", lines.length);
  console.log("Translations (after headers):", dataLines.length);

  return dataLines;
}

function escapePoString(str) {
  // convert newlines to literal \n, escape quotes and backslashes
  return String(str)
    .replace(/\r?\n/g, "\\n")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

const translations = readCsvColumn(path.join(__dirname, csvInputFile));
let tIndex = 0;

const poRaw = fs.readFileSync(path.join(__dirname, poInputFile), "utf8");
const poLines = poRaw.split(/\r?\n/);

let inHeader = false;
let headerDone = false;

// Detect header start
for (let i = 0; i < poLines.length; i++) {
  let line = poLines[i];

  // Start of header block
  if (line.startsWith('msgid ""') && !headerDone) {
    inHeader = true;
  }

  if (inHeader && line.startsWith('msgstr ""')) {
    // header msgstr line – we skip this one and mark header done
    headerDone = true;
    inHeader = false;
    // We do NOT replace this msgstr
    continue;
  }

  // After header: replace every msgstr "..."
  if (headerDone && line.startsWith("msgstr ")) {
    const dk = translations[tIndex] ?? "";
    const escaped = escapePoString(dk.trim());
    poLines[i] = `msgstr "${escaped}"`;
    tIndex++;
  }
}

console.log("msgstr entries replaced:", tIndex);

if (tIndex < translations.length) {
  console.warn(
    "⚠️ Warning: more translations in CSV than msgstr entries in PO. Extra CSV lines ignored."
  );
}

const outPath = path.join(__dirname, poOutputFile);
fs.writeFileSync(outPath, poLines.join("\n"), "utf8");
console.log("✅ Wrote new PO:", poOutputFile);
