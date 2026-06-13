import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath =
  "/Users/uditgupta/Documents/Nutrient project/nutritrack/documents/TestCase_VitaNudge_Updated-doc.xlsx";
const backupPath =
  "/Users/uditgupta/Documents/Nutrient project/nutritrack/outputs/testing-12june/TestCase_VitaNudge_before_compatibility_repair.xlsx";

await fs.copyFile(workbookPath, backupPath);

const workbook = await SpreadsheetFile.importXlsx(
  await FileBlob.load(workbookPath),
);

const styles = {
  Pass: { fill: "#DCFCE7", color: "#166534" },
  Fail: { fill: "#FEE2E2", color: "#991B1B" },
  Blocked: { fill: "#FEF3C7", color: "#92400E" },
  "Needs Change": { fill: "#FFEDD5", color: "#9A3412" },
  "Not Tested": { fill: "#E5E7EB", color: "#374151" },
  Open: { fill: "#FEF3C7", color: "#92400E" },
  Verified: { fill: "#DBEAFE", color: "#1D4ED8" },
  "Fixed - Retest": { fill: "#E0E7FF", color: "#4338CA" },
  Closed: { fill: "#DCFCE7", color: "#166534" },
  Deferred: { fill: "#E5E7EB", color: "#374151" },
};

const applyStaticStyles = (sheet, rangeAddress) => {
  const range = sheet.getRange(rangeAddress);
  range.conditionalFormats.deleteAll();
  const values = range.values;
  const start = rangeAddress.match(/^([A-Z]+)(\d+)/);
  if (!start) throw new Error(`Unsupported range: ${rangeAddress}`);
  const column = start[1];
  const firstRow = Number(start[2]);
  for (let index = 0; index < values.length; index += 1) {
    const value = String(values[index]?.[0] ?? "").trim();
    const style = styles[value];
    if (!style) continue;
    const cell = sheet.getRange(`${column}${firstRow + index}`);
    cell.format.fill = style.fill;
    cell.format.font = { bold: true, color: style.color };
    cell.format.horizontalAlignment = "center";
    cell.format.verticalAlignment = "center";
  }
};

const testCases = workbook.worksheets.getItem("testcases");
applyStaticStyles(testCases, "E3:E237");

const datedBugs = workbook.worksheets.getItem("11-Jun-2026");
applyStaticStyles(datedBugs, "G5:G14");
applyStaticStyles(datedBugs, "H5:H14");

const juneTesting = workbook.worksheets.getItem("testing_12June");
applyStaticStyles(juneTesting, "H8:H242");

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookPath);

console.log(
  JSON.stringify(
    {
      workbookPath,
      backupPath,
      repairedRanges: [
        "testcases!E3:E237",
        "11-Jun-2026!G5:G14",
        "11-Jun-2026!H5:H14",
        "testing_12June!H8:H242",
      ],
    },
    null,
    2,
  ),
);
