import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath =
  "/Users/uditgupta/Documents/Nutrient project/nutritrack/documents/TestCase_VitaNudge_Updated-doc.xlsx";
const workbook = await SpreadsheetFile.importXlsx(
  await FileBlob.load(workbookPath),
);

const sheets = await workbook.inspect({
  kind: "sheet",
  include: "id,name",
  maxChars: 10000,
});
console.log(sheets.ndjson);

const top = await workbook.inspect({
  kind: "table",
  range: "testing_12June!A1:J18",
  include: "values,formulas",
  tableMaxRows: 18,
  tableMaxCols: 10,
  tableMaxCellChars: 500,
  maxChars: 80000,
});
console.log(top.ndjson);

const allRows = await workbook.inspect({
  kind: "table",
  range: "testing_12June!A8:J242",
  include: "values,formulas",
  tableMaxRows: 235,
  tableMaxCols: 10,
  tableMaxCellChars: 600,
  maxChars: 800000,
});
const parsed = JSON.parse(allRows.ndjson);
const counts = {};
const important = [];
for (const row of parsed.values) {
  counts[row[7]] = (counts[row[7]] || 0) + 1;
  if (["Fail", "Needs Change"].includes(row[7])) important.push(row);
}
console.log(JSON.stringify({ counts, important }, null, 2));

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 500 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

for (const [range, filename] of [
  ["A1:J18", "testing-12June-top.png"],
  ["A45:J58", "testing-12June-results.png"],
  ["A220:J242", "testing-12June-final.png"],
]) {
  const rendered = await workbook.render({
    sheetName: "testing_12June",
    range,
    scale: 0.75,
    format: "png",
  });
  await fs.writeFile(
    `outputs/testing-12june/${filename}`,
    new Uint8Array(await rendered.arrayBuffer()),
  );
}
