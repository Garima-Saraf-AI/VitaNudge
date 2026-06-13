import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool'

const source = '/Users/uditgupta/Documents/Nutrient project/nutritrack/documents/TestCase_VitaNudge_Updated-doc.xlsx'
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(source))

const sheets = await workbook.inspect({
  kind: 'sheet',
  include: 'id,name',
  maxChars: 5000,
})
console.log(sheets.ndjson)

for (const name of ['TestCases', 'testcases', 'User Test Cases', 'Menu Test Matrix']) {
  try {
    const result = await workbook.inspect({
      kind: 'table',
      range: `${name}!A1:K12`,
      include: 'values,formulas',
      tableMaxRows: 12,
      tableMaxCols: 11,
      maxChars: 12000,
    })
    console.log(`\n--- ${name} ---\n${result.ndjson}`)
  } catch {
    // Sheet name may not exist.
  }
}
