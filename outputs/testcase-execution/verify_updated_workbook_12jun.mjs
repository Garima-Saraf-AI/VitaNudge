import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "/Users/uditgupta/Documents/TestCase_VitaNudge_Updated.xlsx";
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));

for (const [sheetName, range, filename] of [
  ["testcases", "A1:G80", "final-testcases-top.png"],
  ["testcases", "A100:G150", "final-testcases-middle.png"],
  ["testcases", "A200:G237", "final-testcases-bottom.png"],
  ["12-Jun-2026", "A1:G29", "final-bug-sheet.png"],
]) {
  const rendered = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(
    `outputs/testcase-execution/${filename}`,
    new Uint8Array(await rendered.arrayBuffer())
  );
}

const keyRows = await workbook.inspect({
  kind: "table",
  range: "testcases!A1:G237",
  include: "values,formulas",
  tableMaxRows: 237,
  tableMaxCols: 7,
  tableMaxCellChars: 500,
  maxChars: 600000,
});

const parsed = JSON.parse(keyRows.ndjson);
const wanted = new Set([
  7, 12, 18, 24, 35, 42, 44, 53, 54, 55, 56, 57, 60, 62, 67, 72, 77, 79,
  104, 117, 124, 140, 141, 151, 161, 178, 186, 205, 206, 207, 215, 217, 218,
  219, 226, 231,
]);
const selected = parsed.values
  .map((values, index) => ({ row: index + 1, values }))
  .filter(({ row }) => wanted.has(row));
console.log(JSON.stringify(selected, null, 2));

const bugs = await workbook.inspect({
  kind: "table",
  range: "'12-Jun-2026'!A1:G29",
  include: "values,formulas",
  tableMaxRows: 29,
  tableMaxCols: 7,
  tableMaxCellChars: 800,
  maxChars: 120000,
});
console.log(bugs.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 500 },
  summary: "formula error scan",
});
console.log(errors.ndjson);
