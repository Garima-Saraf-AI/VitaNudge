import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const dir = path.dirname(fileURLToPath(import.meta.url));
const workbook = await SpreadsheetFile.importXlsx(
  await FileBlob.load(path.join(dir, "TestCase_VitaNudge_Updated.xlsx"))
);

const keyRanges = [
  ["testcases", "A1:G22", "updated-top.png"],
  ["testcases", "A108:G140", "updated-goals-profile.png"],
  ["testcases", "A198:G237", "updated-bottom.png"],
  ["issues", "A1:E14", "updated-issues.png"],
  ["11-Jun-2026", "A1:E14", "updated-date-sheet.png"]
];

for (const [sheetName, range, filename] of keyRanges) {
  const rendered = await workbook.render({ sheetName, range, scale: 1.25, format: "png" });
  await fs.writeFile(path.join(dir, filename), new Uint8Array(await rendered.arrayBuffer()));
}

const check = await workbook.inspect({
  kind: "table",
  range: "testcases!A226:G237",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 7,
  maxChars: 12000
});
console.log(check.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan"
});
console.log(errors.ndjson);
