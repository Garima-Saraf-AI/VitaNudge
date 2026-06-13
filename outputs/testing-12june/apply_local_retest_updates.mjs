import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath =
  "/Users/uditgupta/Documents/Nutrient project/nutritrack/documents/TestCase_VitaNudge_Updated-doc.xlsx";
const sheetName = "testing_12June";
const testingDate = "12-Jun-2026";
const localUi = "Local 3010/5001 | In-app Chromium desktop";
const localApi = "Local 5001 | Automated API and regression tests";
const mixed = "Local 3010/5001 | In-app Chromium + automated tests";

const results = new Map();
const set = (id, status, actual, environment = mixed) =>
  results.set(id, { status, actual, environment });

set("TC-002", "Pass", "Valid QA credentials authenticated successfully and redirected to Today.", localUi);
set("TC-007", "Pass", "A five-character password was blocked with the six-character letter-and-number guidance.", localUi);
set("TC-020", "Pass", "Clicking outside the username menu closed it without navigation.", localUi);
set("TC-021", "Pass", "Escape closed the username menu and keyboard focus remained on the menu button.", localUi);
set("TC-022", "Pass", "All six legacy paths redirected to their current supported routes.", localUi);
set("TC-023", "Pass", "An unsupported route redirected safely to Today.", localUi);
set("TC-024", "Pass", "Eight protected routes restored the authenticated session and route after direct navigation/refresh.", localUi);

set("TC-043", "Pass", "The previous-day arrow selected the historical date and displayed that day's empty meal state.", localUi);
set("TC-044", "Pass", "The forward arrow was disabled on the current date.", localUi);
set("TC-045", "Pass", "Refreshing after a historical selection returned to Today without changing logs.", localUi);
set("TC-046", "Fail", "The first-food Add action did not submit a meal request, so the incomplete-profile reminder never opened.", localUi);
set("TC-047", "Blocked", "The reminder could not be triggered because the first-food Add action did not submit.", localUi);
set("TC-048", "Blocked", "The reminder could not be triggered because the first-food Add action did not submit.", localUi);
set("TC-049", "Blocked", "A macro-gap coach action could not be created because the Today food Add action did not submit.", localUi);

set("TC-071", "Pass", "Barcode 3017620422003, including a spaced format, resolved to Nutella with nutrition details.", localUi);
set("TC-072", "Pass", "Empty barcode submission produced no lookup request or stale result.", localUi);
set("TC-073", "Pass", "Unknown barcode 0000000000000 showed Product not found without stale product data.", localUi);
set("TC-074", "Pass", "A barcode containing spaces was normalized and resolved successfully.", localUi);
set("TC-075", "Fail", "The barcode result provided Save to library but no Edit values action.", localUi);
set("TC-076", "Pass", "A new barcode product saved once, showed success, and cleared the input/result.", localUi);
set("TC-077", "Fail", "A duplicate lookup displayed both Saved to library and already-in-library messages.", localUi);
set("TC-078", "Blocked", "A disposable account at exactly 9 of 10 free barcode lookups was not available.", localUi);

set("TC-105", "Pass", "Food Library + Add food opened /add-food.", localUi);
set("TC-106", "Fail", "Edit on a user-created food navigated to /scan instead of the manual editor at /add-food.", localUi);
set("TC-108", "Pass", "A disposable custom ingredient was deleted from Library and disappeared from search; API regression also passed delete isolation.", mixed);

set("TC-110", "Pass", "Completed all seven goal steps, previewed the plan, saved it, and verified Today used the saved targets.", localUi);
set("TC-113", "Blocked", "Exact minimum Stats values were not entered because the browser input harness failed during the boundary retest.", localUi);
set("TC-114", "Blocked", "Exact maximum Stats values were not entered because the browser input harness failed during the boundary retest.", localUi);
set("TC-115", "Fail", "Stats navigation checks only whether values are present; out-of-range values are not guarded by field-specific step validation.", mixed);
set("TC-116", "Pass", "Automated goal tests produced finite fat-loss calories, macros, target weight, and timeline.", localApi);
set("TC-117", "Pass", "Build muscle preview showed a calorie surplus, 165g protein, 2.4kg lean target, and a 13-week timeline.", mixed);
set("TC-118", "Pass", "Automated goal scenarios passed for gain, maintain, and glucose-control plans.", localApi);
set("TC-119", "Pass", "Automated glucose-control scenario verified the aggressive-pace safety handling.", localApi);
set("TC-120", "Pass", "A valid calorie edit to 3000 saved and synchronized to the Goal summary and Today.", localUi);
set("TC-121", "Pass", "A 0 kcal edit was blocked with the specific message Calorie goal cannot be 0.", localUi);
set("TC-125", "Pass", "Logging 78kg against a 75kg profile showed the 2kg+ recalculation prompt and Use latest weight action.", localUi);

set("TC-127", "Pass", "Saved profile values, location, timezone, and locked email persisted after reload.", localUi);
set("TC-129", "Pass", "Login email remained disabled and could not be edited.", localUi);
set("TC-134", "Pass", "United States loaded dependent states; Texas loaded dependent cities; Austin persisted after save/reload.", localUi);
set("TC-136", "Blocked", "Timezone persisted, but the near-midnight date-boundary behavior was not safely reproducible in this session.", localUi);
set(
  "TC-138",
  "Pass",
  "Core export controls were disabled and the API returned 402. Pro returned valid JSON and CSV attachments; Clinical inherited JSON export access. The QA account was restored to Core.",
  mixed,
);

set("TC-149", "Pass", "100g tofu calculated 80 kcal, 9g protein, 0.3g fibre, 2g carbs, and 4g fat per serving.", localUi);
set("TC-150", "Fail", "Add ingredient remained active and added another blank ingredient row without an ingredient or quantity.", localUi);
set("TC-151", "Pass", "At one serving, per-serving nutrition equaled the total recipe nutrition.", localUi);
set("TC-152", "Pass", "At 1000 servings, values remained finite and divided to 0.1 kcal per serving.", localUi);
set("TC-153", "Fail", "Servings accepted 0 and silently calculated as one serving instead of blocking the invalid value.", localUi);
set("TC-154", "Pass", "Other opened a modal that blocked the page; a manual custom ingredient saved and returned selected in the recipe.", localUi);
set("TC-155", "Blocked", "The Scan label mode was present, but a representative label image was not processed in this round.", localUi);
set("TC-156", "Blocked", "Saving a complete recipe is Pro-gated and the disposable QA account was restored to Core.", localUi);
set("TC-157", "Blocked", "Core tier opened the upgrade modal before incomplete-recipe validation could be evaluated.", localUi);
set("TC-158", "Blocked", "Duplicate recipe saving requires Pro recipe access.", localUi);
set("TC-160", "Pass", "All, Vegan, Veg, and Non-veg filters returned only the expected recipe categories.", localUi);
set("TC-161", "Blocked", "Opening a saved recipe requires first saving a Pro recipe.", localUi);
set("TC-162", "Blocked", "No saved Pro recipe was available to verify exclusion from the ingredient dropdown.", localUi);

set("TC-201", "Pass", "Selecting Jun 1-7 updated the weekly report to exactly 2026-06-01 through 2026-06-07.", localUi);
set("TC-202", "Pass", "Selecting May 2026 updated the report to 2026-05-01 through 2026-05-31 and labeled it monthly.", localUi);
set("TC-203", "Fail", "Custom From/To inputs changed, but the displayed report stayed on the previous 30-day period.", localUi);
set("TC-204", "Fail", "A From date later than To did not show a date-range validation message; the old report remained displayed.", localUi);
set("TC-205", "Pass", "The backend regression suite passed inclusive custom report window handling, including a single-day range.", localApi);
set("TC-206", "Pass", "A no-data report displayed zero/not logged states with no NaN or chart error.", localUi);
set("TC-207", "Pass", "Automated report regression reconciled weekly, monthly, and custom-window source data.", localApi);
set("TC-208", "Blocked", "The browser print/save dialog and downloaded PDF could not be inspected by the in-app browser.", localUi);
set("TC-209", "Blocked", "No test email was sent from the local disposable account during this round.", localApi);
set("TC-210", "Blocked", "The local environment was not changed to remove its configured email provider.", localApi);
set("TC-211", "Pass", "Switching Weekly to Monthly changed the selector, summary label, heading, and date window with no stale weekly email label.", localUi);

set("TC-215", "Blocked", "The in-app browser session did not expose a controllable mobile viewport for touch-target measurement.", localUi);

const styles = {
  Pass: { fill: "#DCFCE7", color: "#166534" },
  Fail: { fill: "#FEE2E2", color: "#991B1B" },
  Blocked: { fill: "#FEF3C7", color: "#92400E" },
  "Needs Change": { fill: "#FFEDD5", color: "#9A3412" },
  "Not Tested": { fill: "#E5E7EB", color: "#374151" },
};

const workbook = await SpreadsheetFile.importXlsx(
  await FileBlob.load(workbookPath),
);
const sheet = workbook.worksheets.getItem(sheetName);
sheet.getRange("A1").values = [["VitaNudge Consolidated Retest - 12 June 2026"]];
sheet.getRange("A2").values = [[
  "Production baseline plus focused local retesting after the requested dashboard, profile, export-access, and notification changes.",
]];
sheet.getRange("D5").values = [[
  "Production Render baseline | Local frontend 3010 | Local API 5001",
]];
const dataRange = sheet.getRange("A8:J242");
const rows = dataRange.values;

for (const row of rows) {
  const update = results.get(String(row[0] || ""));
  if (!update) continue;
  row[6] = update.actual;
  row[7] = update.status;
  row[8] = testingDate;
  row[9] = update.environment;
}

dataRange.values = rows;
sheet.getRange("H8:H242").conditionalFormats.deleteAll();

for (let index = 0; index < rows.length; index += 1) {
  const status = String(rows[index][7] || "");
  const style = styles[status];
  if (!style) continue;
  const cell = sheet.getRange(`H${index + 8}`);
  cell.format.fill = style.fill;
  cell.format.font = { bold: true, color: style.color };
  cell.format.horizontalAlignment = "center";
  cell.format.verticalAlignment = "center";
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookPath);

const counts = rows.reduce((summary, row) => {
  const status = String(row[7] || "");
  summary[status] = (summary[status] || 0) + 1;
  return summary;
}, {});

console.log(JSON.stringify({ workbookPath, updated: results.size, counts }, null, 2));
