/**
 * Fill Danish translations from CSV into JSON format
 *
 * This script takes an empty Danish JSON file (with translation keys but empty values)
 * and fills it with Danish translations from a single-column CSV file. The script handles
 * CSV parsing with proper quote escaping and newline handling, and provides debugging
 * capabilities for specific ranges of translations.
 *
 * Workflow:
 * 1. Read empty Danish JSON template with translation keys
 * 2. Parse Danish translations from CSV file (handles quoted strings and newlines)
 * 3. Map CSV rows to JSON keys in order
 * 4. Output filled Danish JSON file
 * 5. Provide debug window for inspection
 *
 * @author Thomas Severinsen
 * @version 2.0
 * @since 2025-12-16
 */

const fs = require("fs");
const path = require("path");

// --- CONFIGURATION PARAMETERS ---
/** @type {string} Input JSON file with translation keys but empty values */
const JSON_INPUT = "nb.json.da.json";

/** @type {string} CSV file containing Danish translations in a single column */
const CSV_INPUT = "dk-translations.csv";

/** @type {string} Output JSON file with filled Danish translations */
const JSON_OUTPUT = "da.json";

/** @type {number} Number of header lines to skip in CSV (e.g., "Column1", "Oversættelse DK:") */
const SKIP_LINES = 2;

/** @type {number} Starting index (0-based) for debug output window */
const DEBUG_FROM = 550;

/** @type {number} Ending index (0-based) for debug output window */
const DEBUG_TO = 570;
// --- END CONFIGURATION ---

const jsonPath = path.join(__dirname, JSON_INPUT);
const csvPath = path.join(__dirname, CSV_INPUT);
const outPath = path.join(__dirname, JSON_OUTPUT);

/**
 * Parse a single-column CSV text with proper handling of quotes and newlines
 *
 * This parser handles the CSV standard for quoted strings:
 * - Strings containing newlines, quotes, or separators must be quoted
 * - Quotes inside quoted strings are escaped by doubling ("")
 * - Supports both LF (\n) and CRLF (\r\n) line endings
 * - Automatically strips UTF-8 BOM if present
 *
 * @param {string} text - Raw CSV text content to parse
 * @returns {string[]} Array of cell values (one per row)
 *
 * @example
 * parseSingleColumnCsv('"Hello\nWorld"\n"Quote: ""test"""')
 * // Returns: ['Hello\nWorld', 'Quote: "test"']
 */
function parseSingleColumnCsv(text) {
  // Remove UTF-8 Byte Order Mark if present (common in Excel exports)
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const rows = [];
  let current = ""; // Current cell being built
  let inQuotes = false; // Track if we're inside a quoted string

  // Character-by-character parsing to handle quotes and newlines properly
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      // Handle escaped quotes: "" becomes a single "
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote character
      } else {
        // Toggle quote state (entering or exiting quoted string)
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && (ch === "\n" || ch === "\r")) {
      // End of row detected (only when not inside quotes)
      if (ch === "\r" && text[i + 1] === "\n") {
        i++; // Skip the \n in CRLF line ending
      }
      rows.push(current);
      current = "";
    } else {
      // Regular character - add to current cell
      current += ch;
    }
  }

  // Add final row if text doesn't end with newline
  if (current.length > 0) {
    rows.push(current);
  }

  return rows;
}

// === STEP 1: Read input JSON template ===
// Load the JSON file containing translation keys with empty values
const json = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const keys = Object.keys(json); // Preserve original key order

// === STEP 2: Parse CSV translations ===
// Read and parse the CSV file containing Danish translations
const csvRaw = fs.readFileSync(csvPath, "utf8");
const rows = parseSingleColumnCsv(csvRaw);

console.log("Total CSV rows (including headers):", rows.length);

// Remove header rows (e.g., "Column1", "Oversættelse DK:")
const dataRows = rows.slice(SKIP_LINES);
const translations = dataRows; // Preserve empty rows as empty translations

// === STEP 3: Validate data integrity ===
console.log("Translation keys found:", keys.length);
console.log("CSV translation rows:", translations.length);

// Warn if there's a mismatch between keys and translations
if (translations.length !== keys.length) {
  console.warn(
    `⚠️  Data mismatch: ${translations.length} translations vs ${keys.length} keys.`
  );
}

// === STEP 4: Fill JSON with translations ===
// Map each translation to its corresponding key in order
keys.forEach((key, index) => {
  // Use empty string if translation is missing (prevents undefined values)
  json[key] = translations[index] || "";
});

// === STEP 5: Debug output window ===
// Display a sample range of translations for verification
const from = Math.max(0, DEBUG_FROM);
const to = Math.min(keys.length - 1, DEBUG_TO);

console.log(`\nDebug window ${from}–${to} (0-based index):`);
for (let i = from; i <= to; i++) {
  const key = keys[i];
  const translation = json[key];
  console.log(`${i}: key=${key} | dk=${JSON.stringify(translation)}`);
}

// === STEP 6: Write output JSON ===
// Save the filled JSON with proper formatting (2-space indentation)
fs.writeFileSync(outPath, JSON.stringify(json, null, 2), "utf8");
console.log("\n✅ Successfully wrote:", JSON_OUTPUT);
