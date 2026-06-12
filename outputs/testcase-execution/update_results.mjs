import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const dir = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.join(dir, "source.xlsx");
const outputPath = path.join(dir, "TestCase_VitaNudge_Updated.xlsx");
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const sheet = workbook.worksheets.getItem("testcases");
const testingDate = "12-Jun-2026";

const rows = sheet.getRange("A1:G237").values;
rows[1][6] = "Testing date";

const results = new Map();
const setResult = (row, status, actual) => results.set(row, { status, actual });

for (let row = 3; row <= 237; row += 1) {
  setResult(row, "Not Tested", "Not executed in this production QA round.");
}

const blocked = {
  29: "Blocked: no Pro QA account was available to verify unrestricted Pro access.",
  30: "Blocked: no Clinical QA account was available to verify Clinical-only access.",
  31: "Blocked: production quota counters were not manipulated to the final-use boundary.",
  32: "Blocked: production quota counters were not exhausted to avoid consuming live allowances.",
  33: "Blocked: no expired paid QA subscription was available.",
  48: "Blocked by the failed Today meal-add workflow; the first-food reminder could not be triggered.",
  49: "Blocked by the failed Today meal-add workflow; the reminder could not be triggered.",
  50: "Blocked by the failed Today meal-add workflow; the reminder could not be triggered.",
  80: "Blocked: production barcode quota was not moved to 9/10.",
  81: "Blocked: an unsupported BarcodeDetector browser and barcode image were not available.",
  82: "Blocked: no approved nutrition-label image was supplied for production upload.",
  83: "Blocked: physical mobile camera access was unavailable.",
  84: "Blocked: file upload automation was unavailable in the in-app production browser.",
  85: "Blocked: no approved non-label image was supplied for production upload.",
  86: "Blocked: no approved blurry/cropped nutrition-label image was supplied.",
  87: "Blocked: a successful label extraction was required before edit controls could be tested.",
  88: "Blocked: a successful label extraction was required before missing-name validation could be tested.",
  89: "Blocked: a successful label extraction was required before message-state validation could be tested.",
  90: "Blocked: a successful label extraction was required before save could be tested.",
  91: "Blocked: production label quota was not moved to its final free scan.",
  92: "Blocked: no approved meal photo was supplied for production upload.",
  93: "Blocked: no approved nutrition-label image was supplied to Plate Scan.",
  94: "Blocked: file upload automation was unavailable in the in-app production browser.",
  95: "Blocked: no approved many-food plate image was supplied.",
  96: "Blocked: no approved unfamiliar-food plate image was supplied.",
  97: "Blocked: a successful Plate Scan result was required before editing the food name.",
  98: "Blocked: a successful Plate Scan result was required before editing quantity.",
  99: "Blocked: a successful Plate Scan result was required before removing a detected food.",
  100: "Blocked: a successful Plate Scan result was required before saving identified foods.",
  101: "Blocked: a successful Plate Scan result was required before testing empty selection.",
  143: "Blocked: the Core account shows the Pro upgrade dialog before Coach question validation.",
  144: "Blocked: AI Coach is Pro-only and no Pro QA account was available.",
  145: "Blocked: AI Coach is Pro-only and no Pro QA account was available.",
  147: "Blocked: AI Coach is Pro-only and no Pro QA account was available.",
  148: "Blocked: AI Coach is Pro-only and no Pro QA account was available.",
  149: "Blocked: AI Coach is Pro-only and no Pro QA account was available.",
  150: "Blocked: provider-failure simulation was not performed against production.",
  151: "Blocked: recipe calculation is gated for the Core QA account.",
  152: "Blocked: recipe calculation is gated for the Core QA account.",
  153: "Blocked: recipe calculation is gated for the Core QA account.",
  154: "Blocked: recipe calculation is gated for the Core QA account.",
  155: "Blocked: recipe calculation is gated for the Core QA account.",
  156: "Blocked: recipe calculation is gated for the Core QA account.",
  157: "Blocked: recipe scanning requires paid access and an approved image.",
  158: "Blocked: recipe saving is gated for the Core QA account.",
  159: "Blocked: recipe saving is gated for the Core QA account.",
  160: "Blocked: recipe saving is gated for the Core QA account.",
  161: "Blocked: the recipe suggestion workflow was not reachable with the Core QA account.",
  162: "Blocked: recipe suggestions are gated for the Core QA account.",
  163: "Blocked: no paid saved recipe could be created for this workflow.",
  164: "Blocked: no paid saved recipe could be created for this integrity check.",
  165: "Blocked: Meal Templates are paid and no Pro QA account was available.",
  166: "Blocked: Meal Templates are paid and no Pro QA account was available.",
  167: "Blocked: Meal Templates are paid and no Pro QA account was available.",
  168: "Blocked: Meal Templates are paid and no Pro QA account was available.",
  169: "Blocked: Meal Templates are paid and no Pro QA account was available.",
  170: "Blocked: Meal Templates are paid and no Pro QA account was available.",
  171: "Blocked: Core template-limit state was not available.",
  172: "Blocked: Core template-limit state was not available.",
  195: "Blocked: medication management is Pro-only for the available QA account.",
  196: "Blocked: medication management is Pro-only for the available QA account.",
  197: "Blocked: medication management is Pro-only for the available QA account.",
  198: "Blocked: medication management is Pro-only for the available QA account.",
  199: "Blocked: medication management is Pro-only for the available QA account.",
  200: "Blocked: medication management is Pro-only for the available QA account.",
  201: "Blocked: medication management is Pro-only for the available QA account.",
  210: "Blocked: production browser download verification was not available for the PDF.",
  211: "Blocked: an external email was not sent during this QA round.",
  212: "Blocked: production email configuration was not removed for a negative test.",
  216: "Blocked: physical device rotation was unavailable.",
  220: "Blocked: no physical or remote iPhone Safari environment was available.",
  221: "Blocked: no physical or remote Android Chrome environment was available.",
  222: "Blocked: the in-app browser does not expose the operating-system PWA install flow.",
  223: "Blocked: an installed PWA and offline device mode were unavailable.",
  230: "Blocked: production authentication rate limits were not deliberately stressed.",
  232: "Blocked: the production backend was not intentionally disabled.",
  233: "Blocked: production requests were not intentionally disconnected mid-save.",
  234: "Blocked: simultaneous production writes were not generated without an idempotency test fixture.",
  236: "Blocked: approved representative scan images were not available.",
  237: "Blocked: production load/stress testing requires an approved window and load limits."
};

for (const [row, actual] of Object.entries(blocked)) {
  setResult(Number(row), "Blocked", actual);
}

setResult(3, "Pass", "Production: a unique QA account was created and redirected to first-time Goals setup.");
setResult(4, "Pass", "Automated backend regression: registered credentials authenticated successfully and returned a valid session.");
setResult(5, "Pass", "Production: an unregistered email showed a privacy-safe incorrect email/password message and kept Create free account visible.");
setResult(6, "Pass", "Automated backend regression: incorrect credentials were rejected without returning account data.");
setResult(9, "Pass", "Production: a 5-character password was rejected with 'Password must be at least 6 characters'.");
setResult(10, "Pass", "Production: an exact 6-character password was accepted and the account was created.");
setResult(14, "Pass", "Production at 390x844: the Register-page Log in link was fully visible at 663-678px in an 844px viewport.");
setResult(19, "Pass", "Production: Today, Add Food, Coach, Reports, and Tools opened; active states were visible for routed pages.");
setResult(20, "Pass", "Production: Tools opened its drawer and the Core Body subpage loaded successfully.");
setResult(25, "Pass", "Production: an unknown authenticated route redirected safely to Today.");
setResult(27, "Pass", "Production Core account opened Today, Add Food, Body, Profile, Goals, and Reports without an inappropriate paywall.");
setResult(28, "Pass", "Production Core account opened Medications and received a visible Pro explanation/upgrade screen.");
setResult(34, "Pass", "Production fresh account showed current date, zero meals, default macro targets, and a first-action suggestion.");
setResult(35, "Fail", "Production: Green apple was selected for Breakfast, but '+ Add' did not create the meal or update dashboard totals after repeated attempts.");
setResult(53, "Fail", "Production: Goals saved 2300 kcal / 145g protein / 110g carbs, but Today still showed 1700 / 110g / 150g.");
setResult(73, "Pass", "Production: barcode 3017620422003 returned Nutella with serving and nutrition values.");
setResult(77, "Fail", "Production: barcode result offered only Save to library; no Edit values action was available.");
setResult(78, "Pass", "Production: a new barcode product saved once, showed confirmation, and cleared the barcode/result fields.");
setResult(79, "Fail", "Production duplicate save displayed both 'Saved to library!' and 'This food is already in your library'.");
setResult(102, "Pass", "Automated backend regression: default foods loaded and a user-created food was created and listed.");
setResult(108, "Pass", "Automated backend regression: a user-created food was updated and the change persisted.");
setResult(110, "Pass", "Automated backend regression: a user-created food was deleted successfully.");
setResult(112, "Pass", "Production: completed Goal, Stats, Activity, Pace, Carbs, Diabetes, Preview, and Save across all seven steps.");
setResult(113, "Pass", "Production: an incomplete profile showed Profile Required, prevented invalid setup, and displayed Complete your profile.");
setResult(114, "Pass", "Production: incomplete-profile Goals now provides a visible Complete your profile action instead of a dead-end Stats step.");
setResult(118, "Pass", "Automated frontend goal test: fat-loss BMR/TDEE deficit, macros, target weight, and date calculations passed.");
setResult(119, "Pass", "Automated frontend goal test: muscle-build surplus, protein, lean-mass target, and timeline calculations passed.");
setResult(120, "Pass", "Automated frontend goal tests passed weight-gain, maintenance, and glucose-control calculations; glucose-control preview was also verified live.");
setResult(121, "Pass", "Production: Improve glucose control plus Aggressive pace displayed the glucose-safety warning.");
setResult(124, "Fail", "Production: the plan saved and collapsed to a summary, but Today did not use the newly saved targets.");
setResult(129, "Pass", "Production: saved name, locked email, age, gender, weight, height, preference, location, and timezone loaded correctly.");
setResult(130, "Pass", "Production: valid profile changes saved once and a visible Profile updated confirmation appeared.");
setResult(131, "Pass", "Production: Login email was disabled and could not be edited.");
setResult(136, "Pass", "Production: United States loaded state options; Illinois loaded city options; Chicago saved successfully.");
setResult(138, "Pass", "Production: Central Time was saved and the header used the correct Chicago-local date during the test.");
setResult(202, "Pass", "Production Core account was denied medication logging and shown a clear Pro feature explanation.");
setResult(203, "Pass", "Production: Weekly report loaded the selected current week; backend regression verified weekly aggregation.");
setResult(204, "Pass", "Production: Monthly selection changed the month picker, heading, and range; backend regression verified monthly aggregation.");
setResult(205, "Fail", "Production: editing Custom From/To dates did not refresh the generated report range, which remained at the previous 30-day range.");
setResult(206, "Fail", "Production: From later than To showed no clear validation message and retained the old generated report.");
setResult(207, "Fail", "Production: setting From and To to the same date did not update the generated report to that day.");
setResult(208, "Pass", "Production: a report with no health logs rendered zero/not-logged states without NaN or broken chart headings.");
setResult(209, "Pass", "Automated backend regression verified weekly, monthly, and custom report aggregation against seeded source logs.");
setResult(213, "Pass", "Production: switching Weekly to Monthly updated the picker, 'month' summary label, heading, and date range without stale weekly text.");
setResult(218, "Not Tested", "Partial production check only: Login at 320x700 had no horizontal overflow; other critical pages were not fully inspected.");
setResult(219, "Fail", "Production Chromium core journey exposed two blockers: Today meal add did not complete and saved Goals did not synchronize to Today.");
setResult(224, "Pass", "Production API: GET /api/auth/me without Authorization returned 401 and 'No token provided'.");
setResult(225, "Pass", "Production API: a malformed bearer token returned 401 and 'Invalid or expired token'.");
setResult(229, "Pass", "Production uses HTTPS and returned CSP, HSTS, X-Frame-Options DENY, nosniff, referrer policy, and related security headers.");
setResult(235, "Needs Change", "Frontend build passed, but the main JavaScript chunk was 8.62 MB (2.32 MB gzip); mobile load optimization is recommended before broad launch.");

const partialApiRows = new Set([
  42, 44, 60, 66, 111, 173, 174, 177, 181, 183, 184, 187, 190, 195,
  197, 199, 201, 165, 167, 170, 231
]);
for (const row of partialApiRows) {
  if (results.get(row)?.status === "Not Tested") {
    setResult(row, "Not Tested", "Automated backend CRUD/integration coverage passed, but this complete browser/UI scenario was not executed.");
  }
}

for (let row = 3; row <= 237; row += 1) {
  const result = results.get(row);
  rows[row - 1][2] = result.actual;
  rows[row - 1][4] = result.status;
  rows[row - 1][6] = testingDate;
}

sheet.getRange("A1:G237").values = rows;
sheet.getRange("E2:E237").format.columnWidthPx = 108;
sheet.getRange("G2:G237").format.columnWidthPx = 132;
sheet.getRange("G2:G237").format.horizontalAlignment = "center";
sheet.getRange("G2:G237").format.verticalAlignment = "center";
sheet.getRange("G2").format.font = { bold: true, color: "#FFFFFF" };
sheet.getRange("G2").format.fill = "#166534";

const counts = {};
for (let row = 3; row <= 237; row += 1) {
  const status = results.get(row).status;
  counts[status] = (counts[status] || 0) + 1;
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

const inspect = await workbook.inspect({
  kind: "table",
  range: "testcases!A1:G18",
  include: "values,formulas",
  tableMaxRows: 18,
  tableMaxCols: 7,
  maxChars: 14000
});
await fs.writeFile(path.join(dir, "updated-inspect.ndjson"), inspect.ndjson);
await fs.writeFile(path.join(dir, "status-counts.json"), JSON.stringify(counts, null, 2));
console.log(JSON.stringify({ outputPath, counts }));
