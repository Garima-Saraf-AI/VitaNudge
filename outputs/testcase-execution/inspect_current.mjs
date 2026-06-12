import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbook = await SpreadsheetFile.importXlsx(
  await FileBlob.load("/private/tmp/TestCase_VitaNudge_Updated_current.xlsx")
);

const overview = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 16000,
  tableMaxRows: 8,
  tableMaxCols: 8,
  tableMaxCellChars: 160,
});
console.log(overview.ndjson);

const tests = await workbook.inspect({
  kind: "table",
  range: "testcases!A1:H300",
  include: "values,formulas",
  tableMaxRows: 300,
  tableMaxCols: 8,
  tableMaxCellChars: 300,
  maxChars: 260000,
});
await fs.writeFile("current-testcases.ndjson", tests.ndjson);

const failures = await workbook.inspect({
  kind: "match",
  searchTerm: "^Fail$|^Not Tested$|^Blocked$|^Needs Change$",
  options: { useRegex: true, maxResults: 500 },
  summary: "current non-pass statuses",
});
await fs.writeFile("current-nonpass.ndjson", failures.ndjson);
console.log(failures.ndjson);
