import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const dir = path.dirname(fileURLToPath(import.meta.url));
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(path.join(dir, "source.xlsx")));

const overview = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 18000,
  tableMaxRows: 12,
  tableMaxCols: 10,
  tableMaxCellChars: 140,
});
console.log(overview.ndjson);

const tests = await workbook.inspect({
  kind: "table",
  range: "testcases!A1:H260",
  include: "values,formulas",
  tableMaxRows: 260,
  tableMaxCols: 8,
  tableMaxCellChars: 180,
  maxChars: 160000,
});
await fs.writeFile(path.join(dir, "testcases-inspect.ndjson"), tests.ndjson);
console.log(tests.ndjson.slice(0, 12000));

for (const [name, range, file] of [
  ["testcases", "A1:H32", "testcases-current-top.png"],
  ["testcases", "A210:H240", "testcases-current-bottom.png"],
]) {
  const preview = await workbook.render({ sheetName: name, range, scale: 1, format: "png" });
  await fs.writeFile(path.join(dir, file), new Uint8Array(await preview.arrayBuffer()));
}
