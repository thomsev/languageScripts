const fs = require("fs");
const path = require("path");

// Bruk: node compare-norsk-dansk.js dansk.csv norskpo.csv compare-nb-da.csv
const daFile = process.argv[2] || "dansk.csv";
const nbFile = process.argv[3] || "norskpo.csv";
const outFile = process.argv[4] || "compare-nb-da.csv";

function readFirstColumnCsv(filePath) {
  let raw = fs.readFileSync(filePath, "utf8");

  // Fjern BOM om den finnes
  raw = raw.replace(/^\uFEFF/, "");

  const allLines = raw.split(/\r?\n/);
  // ta vekk helt tomme linjer på slutten
  while (allLines.length && allLines[allLines.length - 1].trim() === "") {
    allLines.pop();
  }

  if (!allLines.length) {
    return { header: "", values: [] };
  }

  const header = allLines[0];
  const dataLines = allLines.slice(1);

  const values = dataLines.map((line) => {
    // ta bare første kolonne (første ;)
    const parts = line.split(";");
    return (parts[0] || "").trim();
  });

  return { header, values };
}

function esc(cell) {
  return `"${String(cell ?? "").replace(/"/g, '""')}"`;
}

const daPath = path.join(__dirname, daFile);
const nbPath = path.join(__dirname, nbFile);

const da = readFirstColumnCsv(daPath);
const nb = readFirstColumnCsv(nbPath);

const maxLen = Math.max(da.values.length, nb.values.length);

console.log("Norsk rader:", nb.values.length);
console.log("Dansk rader:", da.values.length);

let sameCount = 0;
let diffCount = 0;

const rows = [];
rows.push(["index", "nb", "da", "equal"]);

for (let i = 0; i < maxLen; i++) {
  const nbVal = nb.values[i] ?? "";
  const daVal = da.values[i] ?? "";
  const equal = nbVal === daVal ? "SAME" : "";

  if (equal) sameCount++;
  else diffCount++;

  rows.push([String(i + 1), nbVal, daVal, equal]);
}

const csvOut = "\uFEFF" + rows.map((r) => r.map(esc).join(";")).join("\n");

const outPath = path.join(__dirname, outFile);
fs.writeFileSync(outPath, csvOut, "utf8");

console.log("Like rader:", sameCount);
console.log("Forskjellige / manglende rader:", diffCount);
console.log("✅ Skrev sammenligning til", outFile);
