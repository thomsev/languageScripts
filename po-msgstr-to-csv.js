const fs = require("fs");
const path = require("path");

// Usage: node po-msgstr-to-csv.js input.po output.csv
const inputFile = process.argv[2] || "da.po";
const outputFile = process.argv[3] || "msgstr-nb.csv";

// Read .po file as UTF-8
const poContent = fs.readFileSync(path.join(__dirname, inputFile), "utf8");

// Helper: get text inside quotes on a line
function extractString(line) {
  const match = line.match(/"(.*)"/);
  return match ? match[1] : "";
}

const lines = poContent.split(/\r?\n/);

let msgstrs = [];

let currentMsgId = null;
let currentMsgStr = null;
let inMsgId = false;
let inMsgStr = false;

function flushEntry() {
  if (currentMsgId !== null && currentMsgStr !== null) {
    // Skip header block (msgid "")
    if (currentMsgId !== "") {
      msgstrs.push(currentMsgStr);
    }
  }
}

for (let rawLine of lines) {
  let line = rawLine.trim();

  // New msgid
  if (line.startsWith("msgid ")) {
    // Save previous pair
    flushEntry();

    inMsgId = true;
    inMsgStr = false;
    currentMsgId = extractString(line);
    currentMsgStr = null;
    continue;
  }

  // msgstr
  if (line.startsWith("msgstr ")) {
    inMsgId = false;
    inMsgStr = true;
    currentMsgStr = extractString(line);
    continue;
  }

  // Continuation lines
  if (line.startsWith('"')) {
    const text = extractString(line);
    if (inMsgId && currentMsgId !== null) {
      currentMsgId += text;
    } else if (inMsgStr && currentMsgStr !== null) {
      currentMsgStr += text;
    }
    continue;
  }

  // Comments / empty lines → ignore
}

// Flush last entry
flushEntry();

// Build CSV (one column: nb), **no quotes**
const rows = [];
rows.push(["nb"]); // header

for (const s of msgstrs) {
  // Replace any line breaks inside strings so Excel doesn't freak out
  const clean = String(s).replace(/\r?\n/g, " ");
  rows.push([clean]);
}

// Use ; as separator, still add BOM for æøå/Excel
const csv = "\uFEFF" + rows.map((row) => row.join(";")).join("\n");

fs.writeFileSync(path.join(__dirname, outputFile), csv, "utf8");
console.log(`✅ Extracted ${msgstrs.length} msgstr values`);
console.log(`✅ Wrote CSV to ${outputFile}`);
