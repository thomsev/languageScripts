const fs = require("fs");
const path = require("path");

const poFile = process.argv[2] || "nb.po";
const outFile = process.argv[3] || "nb-from-po.csv";

function parsePoMsgstr(text) {
  const lines = text.split(/\r?\n/);
  const entries = [];
  let msgid = null;
  let msgstr = null;
  let state = null; // "id" | "str"

  const extract = (line) => {
    const m = line.match(/"(.*)"/);
    return m ? m[1] : "";
  };

  function flush() {
    if (msgid !== null || msgstr !== null) {
      entries.push({ msgid: msgid ?? "", msgstr: msgstr ?? "" });
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

  // dropp header (første msgid "")
  return entries.filter((e, i) => !(i === 0 && e.msgid === ""));
}

const poText = fs.readFileSync(path.join(__dirname, poFile), "utf8");
const entries = parsePoMsgstr(poText);

console.log("Antall msgstr (uten header):", entries.length);

const rows = [];
rows.push(["nb"]);

for (const e of entries) {
  // enkel CSV: én kolonne, ingen anførselstegn
  const clean = String(e.msgstr).replace(/\r?\n/g, " ");
  rows.push([clean]);
}

const csv = "\uFEFF" + rows.map((r) => r.join(";")).join("\n");

fs.writeFileSync(path.join(__dirname, outFile), csv, "utf8");
console.log("✅ Skrev", outFile);
