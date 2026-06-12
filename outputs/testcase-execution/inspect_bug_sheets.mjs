import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbook = await SpreadsheetFile.importXlsx(
  await FileBlob.load("/Users/uditgupta/Documents/TestCase_VitaNudge_Updated.xlsx")
);

for (const range of ["issues!A1:G40", "'12-Jun-2026'!A1:G40"]) {
  const result = await workbook.inspect({
    kind: "table",
    range,
    include: "values,formulas",
    tableMaxRows: 40,
    tableMaxCols: 7,
    tableMaxCellChars: 1000,
    maxChars: 100000,
  });
  console.log(result.ndjson);
}
