const fs = require("fs");
const path = require("path");

// Bruk: node verify-po-vs-csv.js nb.po norskpo.csv

const poFile = process.argv[2] || "nb.po";
const csvFile = process.argv[3] || "norskpo.csv";

// --- PO PARSER: henter alle msgstr i rekkefølge ---
function parsePoMsgstr(text) {
  const lines = text.split(/\r?\n/);
  const result = [];
  let msgid = null;
  let msgstr = null;
  let state = null; // "id" | "str"

  const extract = (line) => {
    const m = line.match(/"(.*)"/);
    return m ? m[1] : "";
  };

  function flush() {
    if (msgid !== null || msgstr !== null) {
      result.push({ msgid: msgid ?? "", msgstr: msgstr ?? "" });
    }
    msgid = null;
    msgstr = null;
    state = null;
  }

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

  // hopp header (første msgid "")
  return result.filter((e, i) => !(i === 0 && e.msgid === ""));
}

function readFirstColumnCsv(filePath) {
  let raw = fs.readFileSync(filePath, "utf8");

  // Fjern BOM om den finnes
  raw = raw.replace(/^\uFEFF/, "");

  // IKKE filter bort tomme linjer – de representerer msgstr ""
  let lines = raw.split(/\r?\n/);

  // Fjern kun én helt tom siste linje (typisk sluttlinje)
  if (lines.length && lines[lines.length - 1] === "") {
    lines.pop();
  }

  if (!lines.length) return [];

  // Første linje er header (f.eks. "nb")
  const dataLines = lines.slice(1);

  return dataLines.map((line) => {
    const sepIndex = line.indexOf(";");
    const first = sepIndex === -1 ? line : line.slice(0, sepIndex);
    // IKKE trim – vi vil at "Skoler " != "Skoler" skal synes hvis det faktisk er forskjell
    return first;
  });
}

// --- MAIN ---
const poText = fs.readFileSync(path.join(__dirname, poFile), "utf8");
const poEntries = parsePoMsgstr(poText);
const csvValues = readFirstColumnCsv(path.join(__dirname, csvFile));

console.log("Msgstr i PO (uten header):", poEntries.length);
console.log("Rader i CSV (uten header):", csvValues.length);

const n = Math.min(poEntries.length, csvValues.length);
let mismatchCount = 0;

for (let i = 0; i < n; i++) {
  const poVal = poEntries[i].msgstr;
  const csvVal = csvValues[i];

  if (poVal !== csvVal) {
    mismatchCount++;
    if (mismatchCount <= 10) {
      console.log("❌ Mismatch på index", i);
      console.log("   msgid:", poEntries[i].msgid);
      console.log("   PO:   ", JSON.stringify(poVal));
      console.log("   CSV:  ", JSON.stringify(csvVal));
    }
  }
}

if (poEntries.length !== csvValues.length) {
  console.log(
    "⚠️ Ulik lengde: PO har",
    poEntries.length,
    "msgstr, CSV har",
    csvValues.length,
    "rader"
  );
}

if (mismatchCount === 0 && poEntries.length === csvValues.length) {
  console.log("✅ CSV matcher PO 100% (rekkefølge og innhold)");
} else {
  console.log("Totalt mismatches:", mismatchCount);
}
