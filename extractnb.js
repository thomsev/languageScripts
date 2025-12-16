/**
 * Extract Norwegian Bokmål (nb) translations from JSON files and export to CSV format
 *
 * This script processes all JSON files in the current directory containing translation data,
 * extracts only the Norwegian Bokmål values, and creates CSV files with UTF-8 BOM encoding
 * for proper Excel compatibility with special characters (øæå).
 *
 * Input: JSON files with translation key-value pairs
 * Output: CSV files with format "[filename] - nb-only.csv"
 *
 * @author YThomas Severinsen
 * @version 1.0
 * @since 2025-12-16
 */

const fs = require("fs");
const path = require("path");

// Configuration
const dir = __dirname; // Current script directory
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")); // Find all JSON files

/**
 * Escape a cell value for CSV format by wrapping in quotes and escaping internal quotes
 *
 * @param {string|null|undefined} cell - The cell value to escape
 * @returns {string} The escaped cell value wrapped in quotes, or empty quoted string if null/undefined
 *
 * @example
 * escapeCell('Hello "World"') // Returns '"Hello ""World"""'
 * escapeCell(null) // Returns '""'
 * escapeCell('Simple text') // Returns '"Simple text"'
 */
function escapeCell(cell) {
  if (cell == null) return '""';
  // Wrap in quotes and escape internal quotes by doubling them (CSV standard)
  return `"${String(cell).replace(/"/g, '""')}"`;
}

// Process each JSON file found in the directory
for (const file of files) {
  const fullPath = path.join(dir, file);

  // Read and parse JSON file (UTF-8 encoding preserves Norwegian characters øæå)
  const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));

  // Build CSV data structure
  const rows = [];

  // Add header row identifying the language column
  rows.push(["nb"]); // nb = Norwegian Bokmål

  // Extract all translation values in the order they appear in the JSON
  // This preserves the original key ordering from the source file
  for (const value of Object.values(data)) {
    rows.push([value]);
  }

  // Convert rows to CSV format with semicolon separator
  // Note: Using semicolon (;) instead of comma for European Excel compatibility
  const csvBody = rows.map((row) => row.map(escapeCell).join(";")).join("\n");

  // Add UTF-8 BOM (Byte Order Mark) for Windows Excel compatibility
  // This ensures proper rendering of Norwegian characters (øæå) in Excel
  const csvWithBom = "\uFEFF" + csvBody;

  // Generate output filename by replacing .json extension with descriptive suffix
  const outName = file.replace(/\.json$/i, "") + " - nb-only.csv";
  const outPath = path.join(dir, outName);

  // Write the CSV file with UTF-8 encoding
  fs.writeFileSync(outPath, csvWithBom, "utf8");

  console.log("Wrote:", outName);
}

console.log("Done.");
