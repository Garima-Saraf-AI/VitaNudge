import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath =
  "/Users/uditgupta/Documents/Nutrient project/nutritrack/documents/TestCase_VitaNudge_Updated-doc.xlsx";
const workbook = await SpreadsheetFile.importXlsx(
  await FileBlob.load(workbookPath),
);
const result = await workbook.inspect({
  kind: "table",
  range: "testing_12June!A8:J242",
  include: "values",
  tableMaxRows: 235,
  tableMaxCols: 10,
  tableMaxCellChars: 600,
  maxChars: 800000,
});
const rows = JSON.parse(result.ndjson).values;
for (let index = 0; index < rows.length; index += 1) {
  if (rows[index][7] !== "Not Tested") continue;
  console.log(
    JSON.stringify({
      sheetRow: index + 8,
      id: rows[index][0],
      module: rows[index][1],
      scenario: rows[index][2],
      testCase: rows[index][3],
      howTested: rows[index][4],
      expected: rows[index][5],
    }),
  );
}
