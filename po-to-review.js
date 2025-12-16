const fs = require("fs");
const path = require("path");

// Simple PO parser: collects msgid/msgstr as full strings
function parsePo(text) {
  const lines = text.split(/\r?\n/);
  const entries = [];

  let msgid = null;
  let msgstr = null;
  let state = null; // "id" | "str" | null

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

  for (let raw of lines) {
    const line = raw.trim();

    if (line.startsWith("msgid ")) {
      flush();
      state = "id";
      msgid = extract(line);
      continue;
    }

    if (line.startsWith("msgstr ")) {
      state = "str";
      msgstr = extract(line);
      continue;
    }

    if (line.startsWith('"')) {
      const part = extract(line);
      if (state === "id" && msgid !== null) msgid += part;
      else if (state === "str" && msgstr !== null) msgstr += part;
      continue;
    }

    // comments / blank lines — ignore
  }

  flush();
  return entries;
}

function escapeCsv(cell) {
  if (cell == null) cell = "";
  const s = String(cell).replace(/"/g, '""');
  return `"${s}"`;
}

// ---- main ----

const nbPo = fs.readFileSync(path.join(__dirname, "nb.po"), "utf8");
const daPo = fs.readFileSync(path.join(__dirname, "da.po"), "utf8");

const nbEntries = parsePo(nbPo);
const daEntries = parsePo(daPo);

if (nbEntries.length !== daEntries.length) {
  console.error(
    "Different number of entries:",
    nbEntries.length,
    daEntries.length
  );
  process.exit(1);
}

// sanity: msgid alignment
for (let i = 0; i < nbEntries.length; i++) {
  if (nbEntries[i].msgid !== daEntries[i].msgid) {
    console.error("msgid mismatch at index", i);
    console.error("nb:", nbEntries[i].msgid);
    console.error("da:", daEntries[i].msgid);
    process.exit(1);
  }
}

const rows = [];
rows.push(["msgid", "nb", "da"]);

for (let i = 0; i < nbEntries.length; i++) {
  const id = nbEntries[i].msgid;
  const nb = nbEntries[i].msgstr;
  const da = daEntries[i].msgstr;
  // skip the header row (msgid "")
  if (i === 0 && id === "") continue;
  rows.push([id, nb, da]);
}

const csv = "\uFEFF" + rows.map((r) => r.map(escapeCsv).join(";")).join("\n");

const outPath = path.join(__dirname, "review-nb-da.csv");
fs.writeFileSync(outPath, csv, "utf8");
console.log("✅ wrote review-nb-da.csv with", rows.length - 1, "rows");
