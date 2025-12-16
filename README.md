# Translation Management Scripts

A collection of Node.js scripts for managing Norwegian Bokmål to Danish translation workflows, designed to work with JSON translation files and CSV data exchanges.

## 📁 Project Structure

```
scripts/
├── README.md                     # This file
├── extractnb.js                  # Extract Norwegian translations to CSV
├── extractTranslationStrings.js  # Create empty Danish templates
├── fillTranslationStrings.js     # Fill Danish templates from CSV
└── make-empty-danish.js.js       # Legacy: Create empty Danish templates
```

## 🔄 Translation Workflow

The scripts support a complete translation workflow from Norwegian Bokmål to Danish:

1. **Extract** → Convert Norwegian JSON to CSV for translation
2. **Translate** → External translation process (manual or automated)
3. **Template** → Create empty Danish JSON structure
4. **Fill** → Import translated CSV back into JSON format

## 📋 Script Documentation

### 🇳🇴 extractnb.js - Norwegian to CSV Exporter

**Purpose**: Extract Norwegian Bokmål translations from JSON files and export to CSV format for translation services.

**Features**:

- Processes all `.json` files in the current directory
- Exports only Norwegian text values (preserves order)
- UTF-8 BOM encoding for Excel compatibility with Norwegian characters (øæå)
- Semicolon-separated CSV for European locale compatibility

**Usage**:

```bash
node extractnb.js
```

**Input**: JSON files with Norwegian translations

```json
{
  "welcome": "Velkommen",
  "goodbye": "Ha det bra"
}
```

**Output**: `[filename] - nb-only.csv`

```csv
nb
"Velkommen"
"Ha det bra"
```

---

### 📝 extractTranslationStrings.js - Danish Template Creator

**Purpose**: Create empty Danish translation templates from Norwegian Bokmål JSON files.

**Features**:

- Preserves translation key structure and order
- Smart filename generation (Bokmål → Dansk or adds `.da.json` suffix)
- Maintains JSON formatting with 2-space indentation
- Prepares templates for translation workflow

**Usage**:

```bash
node extractTranslationStrings.js
```

**Input**: `Barnehage Bokmål.json`

```json
{
  "welcome": "Velkommen",
  "goodbye": "Ha det bra"
}
```

**Output**: `Barnehage Dansk.json`

```json
{
  "welcome": "",
  "goodbye": ""
}
```

---

### 🇩🇰 fillTranslationStrings.js - CSV to Danish JSON Importer

**Purpose**: Fill Danish translation templates with translated text from CSV files.

**Features**:

- Robust CSV parsing with quote and newline handling
- UTF-8 BOM support for Excel exports
- Configurable header row skipping
- Debug window for translation verification
- Data integrity validation

**Configuration** (edit the constants in the file):

```javascript
const JSON_INPUT = "nb.json.da.json"; // Empty Danish template
const CSV_INPUT = "dk-translations.csv"; // Danish translations
const JSON_OUTPUT = "da.json"; // Final Danish JSON
const SKIP_LINES = 2; // CSV header rows to skip
const DEBUG_FROM = 550; // Debug window start
const DEBUG_TO = 570; // Debug window end
```

**Usage**:

```bash
node fillTranslationStrings.js
```

**Input CSV**: `dk-translations.csv`

```csv
Column1
Oversættelse DK:
"Velkommen"
"Farvel"
```

**Output**: `da.json`

```json
{
  "welcome": "Velkommen",
  "goodbye": "Farvel"
}
```

---

### 🗂️ make-empty-danish.js.js - Legacy Template Creator

**Purpose**: Legacy version of the Danish template creator (superseded by `extractTranslationStrings.js`).

## ⚙️ Prerequisites

- **Node.js** (version 12 or higher)
- **File System Access** to the directory containing translation files

## 🚀 Quick Start

1. **Place your Norwegian JSON files** in the same directory as the scripts
2. **Extract to CSV** for translation:
   ```bash
   node extractnb.js
   ```
3. **Create Danish templates**:
   ```bash
   node extractTranslationStrings.js
   ```
4. **Get your CSV translated** (externally)
5. **Configure and fill** the Danish JSON:
   ```bash
   # Edit configuration in fillTranslationStrings.js
   node fillTranslationStrings.js
   ```

## 📝 File Naming Conventions

| Input File              | Script                       | Output File                      |
| ----------------------- | ---------------------------- | -------------------------------- |
| `Barnehage Bokmål.json` | extractnb.js                 | `Barnehage Bokmål - nb-only.csv` |
| `Barnehage Bokmål.json` | extractTranslationStrings.js | `Barnehage Dansk.json`           |
| `translations.json`     | extractTranslationStrings.js | `translations.da.json`           |

## 🔧 Configuration Options

### CSV Format Settings

- **Encoding**: UTF-8 with BOM for Excel compatibility
- **Separator**: Semicolon (`;`) for European Excel
- **Quote Handling**: Standard CSV escaping (`""` for literal quotes)

### Debug Features

- **Data validation**: Warns about key/translation count mismatches
- **Debug window**: Displays sample translations for verification
- **Console output**: Progress tracking and file operation confirmations

## 🌍 Localization Support

- **Norwegian Characters**: Full support for øæå characters
- **UTF-8 Encoding**: Proper handling of Unicode characters
- **Excel Compatibility**: BOM encoding ensures proper character display

## 🔍 Troubleshooting

### Common Issues

**CSV Import Problems**:

- Check CSV encoding (should be UTF-8)
- Verify header row count matches `SKIP_LINES` setting
- Ensure no extra columns in CSV

**Missing Translations**:

- Use debug window to inspect specific ranges
- Check for key/value count mismatches in console output
- Verify JSON file structure

**File Not Found Errors**:

- Ensure all scripts run from the same directory as your JSON files
- Check file naming conventions match configuration

## 👨‍💻 Author

**Thomas Severinsen**  
Version: 1.0-2.0  
Date: December 16, 2025

## 📄 License

These scripts are provided as-is for translation workflow management. Feel free to modify and adapt for your specific needs.
