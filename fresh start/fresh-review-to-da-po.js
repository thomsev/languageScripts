const fs = require("fs");
const path = require("path");

// Usage:
//   node fresh-review-to-da-po.js nb.po fresh-review-nb-da.csv da.clean.po
const NB_PO = process.argv[2] || "nb.po";
const REVIEW_CSV = process.argv[3] || "fresh-review-nb-da.csv";
const OUT_DA_PO = process.argv[4] || "da.clean.po";

function parsePo(poText) {
  const lines = poText.split(/\r?\n/);
  const entries = [];
  let msgid = null;
  let msgstr = null;
  let state = null;

  function flush() {
    if (msgid !== null || msgstr !== null) {
      entries.push({ msgid: msgid ?? "", msgstr: msgstr ?? "" });
    }
    msgid = null;
    msgstr = null;
    state = null;
  }

  const extract = (line) => {
    const m = line.match(/"(.*)"/);
    return m ? m[1] : "";
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (line.startsWith("msgid ")) {
      flush();
      state = "id";
      msgid = extract(line);
    } else if (line.startsWith("msgstr ")) {
      state = "str";
      msgstr = extract(line);
    } else if (line.startsWith('"')) {
      const part = extract(line);
      if (state === "id" && msgid !== null) msgid += part;
      else if (state === "str" && msgstr !== null) msgstr += part;
    }
  }
  flush();
  return entries;
}

function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && ch === ";") {
      row.push(field);
      field = "";
    } else if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function escapePoString(str) {
  if (str == null) str = "";
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\\n/g, "\\n")
    .replace(/\r?\n/g, "\\n");
}

// --- load nb.po ---
const nbPoText = fs.readFileSync(path.join(__dirname, NB_PO), "utf8");

// --- load review CSV (msgid;nb;da...) ---
const csvRaw = fs.readFileSync(path.join(__dirname, REVIEW_CSV), "utf8");
const csvRows = parseCsv(csvRaw);
if (!csvRows.length) {
  console.error("CSV is empty");
  process.exit(1);
}

const header = csvRows[0];
const idIdx = header.indexOf("msgid");
const daIdx = header.indexOf("da");

if (idIdx === -1 || daIdx === -1) {
  console.error("CSV must have columns 'msgid' and 'da'");
  process.exit(1);
}

const daById = new Map();
for (let i = 1; i < csvRows.length; i++) {
  const row = csvRows[i];
  const id = row[idIdx];
  if (!id) continue;
  const daRaw = row[daIdx] || "";
  const da = daRaw.replace(/\\n/g, "\n"); // turn \n into real newlines
  daById.set(id, da);
}

console.log("Loaded", daById.size, "Danish strings from CSV");

// --- walk nb.po and replace msgstr with Danish (or empty) ---
const lines = nbPoText.split(/\r?\n/);

let currentId = null;
let inHeader = false;
let headerDone = false;
let replaced = 0;

for (let i = 0; i < lines.length; i++) {
  const rawLine = lines[i];
  const line = rawLine.trim();

  if (line.startsWith("msgid ")) {
    const m = line.match(/"(.*)"/);
    currentId = m ? m[1] : "";
    if (!headerDone && currentId === "") {
      inHeader = true; // the metadata header
    } else {
      inHeader = false;
    }
  } else if (line.startsWith("msgstr ")) {
    if (inHeader && !headerDone) {
      // don't touch header msgstr
      headerDone = true;
      continue;
    }

    // if we have a Danish value for this id, use it; otherwise keep empty
    let text = "";
    if (daById.has(currentId)) {
      text = daById.get(currentId);
    }

    // write new single-line msgstr
    lines[i] = `msgstr "${escapePoString(text)}"`;
    replaced++;

    // remove any continuation lines that belong to the old msgstr
    let j = i + 1;
    while (j < lines.length) {
      const nextTrimmed = lines[j].trim();
      if (nextTrimmed.startsWith('"')) {
        // blank it out (keeps line count stable)
        lines[j] = "";
        j++;
      } else {
        break;
      }
    }
  }
}

fs.writeFileSync(path.join(__dirname, OUT_DA_PO), lines.join("\n"), "utf8");
console.log(`✅ Wrote ${OUT_DA_PO} with ${replaced} msgstr entries`);
