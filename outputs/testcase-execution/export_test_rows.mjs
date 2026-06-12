import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const source = process.argv[2] || "/private/tmp/TestCase_VitaNudge_Updated_current.xlsx";
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(source));
const result = await workbook.inspect({
  kind: "table",
  range: "testcases!A1:G237",
  include: "values,formulas",
  tableMaxRows: 237,
  tableMaxCols: 7,
  tableMaxCellChars: 1000,
  maxChars: 1000000,
});

const payload = JSON.parse(result.ndjson);
const rows = payload.values.map((values, index) => ({
  row: index + 1,
  functionality: values[0] ?? "",
  testCase: values[1] ?? "",
  actual: values[2] ?? "",
  expected: values[3] ?? "",
  status: values[4] ?? "",
  flow: values[5] ?? "",
  testingDate: values[6] ?? "",
}));

await fs.writeFile(
  "outputs/testcase-execution/test-rows.json",
  JSON.stringify(rows, null, 2)
);
console.log(`Exported ${rows.length} rows.`);
