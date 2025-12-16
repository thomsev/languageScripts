/**
 * Create empty Danish translation templates from Norwegian Bokmål JSON files
 *
 * This script processes Norwegian Bokmål translation files and creates corresponding
 * empty Danish template files. The Danish files contain the same translation keys
 * as the source files but with empty string values, ready to be filled with Danish
 * translations.
 *
 * Features:
 * - Processes all .json files in the current directory
 * - Preserves translation key structure and order
 * - Smart filename generation (Bokmål → Dansk or adds .da.json suffix)
 * - Maintains JSON formatting with 2-space indentation
 *
 * Input: Norwegian Bokmål JSON files with translations
 * Output: Danish JSON template files with empty values
 *
 * @author Thomas Severinsen
 * @version 1.0
 * @since 2025-12-16
 *
 */

const fs = require("fs");
const path = require("path");

// Configuration
const dir = __dirname; // Current script directory

// Find all JSON files in the current directory (Norwegian Bokmål translation files)
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

// Process each Norwegian JSON file
for (const file of files) {
  const fullPath = path.join(dir, file);
  console.log("Reading:", file);

  // Load and parse the Norwegian JSON file
  const nbJson = JSON.parse(fs.readFileSync(fullPath, "utf8"));

  // Create empty Danish template with same keys
  const daJson = {};

  // Copy all translation keys but set values to empty strings
  // This preserves the structure and key order from the original file
  for (const key of Object.keys(nbJson)) {
    daJson[key] = ""; // Empty value ready for Danish translation
  }

  // Generate appropriate Danish filename using intelligent naming:
  // Strategy 1: Replace "Bokmål" with "Dansk" if present
  // Example: "Barnehage Bokmål.json" → "Barnehage Dansk.json"
  let outName = file.replace(/Bokmål/i, "Dansk");

  // Strategy 2: If "Bokmål" not found, append ".da.json" suffix
  // Example: "translations.json" → "translations.da.json"
  if (outName === file) {
    outName = file.replace(/\.json$/i, ".da.json");
  }

  // Write the empty Danish template file
  const outPath = path.join(dir, outName);
  fs.writeFileSync(outPath, JSON.stringify(daJson, null, 2), "utf8");
  console.log("  → wrote:", outName);
}

console.log("\n✅ Processing complete! All Danish template files created.");
