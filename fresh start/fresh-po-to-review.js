const fs = require("fs");
const path = require("path");

// Usage: node fresh-po-to-review.js nb.po da.po fresh-review-nb-da.csv
const nbPoFile = process.argv[2] || "nb.po";
const daPoFile = process.argv[3] || "da.po";
const outCsvFile = process.argv[4] || "fresh-review-nb-da.csv";

function parsePo(poText) {
  const lines = poText.split(/\r?\n/);
  const entries = [];
  let msgid = null;
  let msgstr = null;
  let state = null; // "id" | "str"

  function flush() {
    if (msgid !== null || msgstr !== null) {
      entries.push({
        msgid: msgid ?? "",
        msgstr: msgstr ?? "",
      });
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
      msgid = extract(line); // "msgid " line (may be "")
    } else if (line.startsWith("msgstr ")) {
      state = "str";
      msgstr = extract(line); // first msgstr line (may be "")
    } else if (line.startsWith('"')) {
      const part = extract(line);
      if (state === "id" && msgid !== null) {
        msgid += part; // continuation of msgid
      } else if (state === "str" && msgstr !== null) {
        msgstr += part; // continuation of msgstr
      }
    } else {
      // comments etc. -> ignore
    }
  }

  flush();
  return entries;
}

function esc(cell) {
  const s = String(cell ?? "")
    .replace(/\r?\n/g, "\\n") // keep line breaks as \n so Excel doesn't split rows
    .replace(/"/g, '""');
  return `"${s}"`;
}

const nbPo = fs.readFileSync(path.join(__dirname, nbPoFile), "utf8");
const daPo = fs.readFileSync(path.join(__dirname, daPoFile), "utf8");

const nbEntries = parsePo(nbPo);
const daEntries = parsePo(daPo);

// Build maps by msgid (skip header with msgid "")
const nbMap = {};
for (const e of nbEntries) {
  if (e.msgid === "") continue;
  nbMap[e.msgid] = e.msgstr;
}

const daMap = {};
for (const e of daEntries) {
  if (e.msgid === "") continue;
  daMap[e.msgid] = e.msgstr;
}

// Go in the order of nb.po (safer for your brain)
const rows = [];
rows.push(["msgid", "nb", "da", "status"]);

for (const e of nbEntries) {
  if (e.msgid === "") continue; // skip header

  const id = e.msgid;
  const nb = nbMap[id] ?? "";
  const da = daMap[id] ?? "";

  let status = "";
  if (nb && da) {
    status = nb === da ? "same" : "diff";
  } else if (nb && !da) {
    status = "missing_da";
  } else if (!nb && da) {
    status = "missing_nb";
  }

  rows.push([id, nb, da, status]);
}

// Warn if da.po has ids that nb.po doesn't
for (const id of Object.keys(daMap)) {
  if (!(id in nbMap)) {
    rows.push([id, "", daMap[id], "only_in_da"]);
  }
}

const csv = "\uFEFF" + rows.map((r) => r.map(esc).join(";")).join("\n");

fs.writeFileSync(path.join(__dirname, outCsvFile), csv, "utf8");
console.log(
  `✅ Wrote ${outCsvFile} with ${rows.length - 1} rows (msgid/nb/da/status)`
);
