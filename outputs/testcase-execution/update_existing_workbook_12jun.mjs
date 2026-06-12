import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "/Users/uditgupta/Documents/TestCase_VitaNudge_Updated.xlsx";
const testingDate = "12-Jun-2026";
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));
const testSheet = workbook.worksheets.getItem("testcases");
const rows = testSheet.getRange("A1:G237").values;

const updates = new Map();
const set = (row, status, actual) => updates.set(row, { status, actual });

set(7, "Pass", "Production API: empty email/password returned 400 with required-field validation.");
set(8, "Pass", "Production: invalid email format was blocked; API returned 400 'Invalid email format'.");
set(11, "Pass", "Production API: duplicate registration returned 409 'Email already registered' and created no second account.");
set(12, "Fail", "Production: uppercase email authenticated, but the same email with leading/trailing spaces returned 401 instead of being normalized.");
set(13, "Pass", "Production API accepted a 100-character valid name and a long valid email without truncating the form flow.");
set(15, "Pass", "Production API returned the neutral password-reset confirmation for a registered email.");
set(16, "Pass", "Production API returned the same neutral password-reset confirmation for an unknown email.");
set(17, "Pass", "Production browser: opening /profile while logged out redirected to /login and exposed no protected data.");
set(18, "Pass", "Production browser: Logout returned to /login; revisiting a protected URL stayed on Login.");
set(21, "Pass", "Production browser: Profile, Goals, and My saved recipes each opened their correct route from the username menu.");
set(22, "Pass", "Production browser: clicking outside the username menu closed it without navigation.");
set(23, "Pass", "Production browser: Escape closed the username menu and the page remained usable.");
set(24, "Pass", "Production browser: /barcode, /water, /weight, /glucose, /vitals, and /weekly redirected to their current routes.");
set(26, "Pass", "Production browser: Today, Add Food, Coach, Reports, Body, Clinical, Profile, Goals, and My Recipes restored without redirect loops after refresh.");

set(35, "Fail", "Production browser, fresh account: selecting Green apple and clicking '+ Add' left totals at 0 and kept the unsaved form open.");
set(36, "Blocked", "Production API created Lunch, Dinner, and Snack correctly, but browser verification is blocked by the shared Today '+ Add' action failure.");
set(37, "Pass", "Production API rejected a meal with no selected food/name with 400; the UI exposes no add action until a result is selected.");
set(38, "Blocked", "Production API accepted quantity 0.01, but browser save verification is blocked by the Today '+ Add' failure.");
set(39, "Pass", "Production API rejected zero quantity with 400 and created no meal.");
set(40, "Pass", "Production API rejected negative quantity with 400 and created no meal.");
set(41, "Pass", "Production API accepted a very large quantity without NaN/overflow; the calculated calories remained numeric.");
set(42, "Fail", "Production browser: the edit icon on a copied meal did not open an editor or change the entry. API edit/recalculation passed.");
set(43, "Blocked", "Browser invalid-edit validation could not be reached because the meal edit icon did not open. API also incorrectly accepted 0/non-numeric edits by retaining the old quantity.");
set(44, "Fail", "Production browser: clicking the meal delete icon did not remove the entry or update totals. API delete passed.");
set(45, "Pass", "Production browser: the previous-day arrow opened Thu, 11 Jun and showed only that date.");
set(46, "Pass", "Production browser: the forward arrow was disabled on Fri, 12 Jun, preventing future-date navigation.");
set(47, "Pass", "Production browser: refreshing from a historical date returned safely to the documented Today view.");
set(51, "Pass", "Production browser: Today opened Coach with the active goal and current macro gap prefilled in the question.");
set(52, "Pass", "Production API exceeded the calorie target with a very large meal while totals stayed readable numeric values without NaN.");
set(53, "Pass", "Production retest: saved Goals targets 3100 kcal / 170g protein / 260g carbs appeared exactly on Today.");

set(54, "Pass", "Production browser: Copy yesterday opened a review dialog listing separate Lunch and Dinner items from Thu, 11 Jun.");
set(55, "Pass", "Production browser: an item's destination changed from Lunch to Breakfast before copying.");
set(56, "Pass", "Production browser: after clearing all, one selected item copied alone and the unselected item remained absent.");
set(57, "Pass", "Production browser: Clear changed the action to 'Copy 0 items' and disabled confirmation.");
set(58, "Pass", "Production API returned a clear 404 'No meals found on previous day' and created no data.");
set(59, "Needs Change", "Production API permits copying the same source item repeatedly with no duplicate warning; behavior is consistent but not explained to the user.");

set(60, "Pass", "Production browser: a complete manual food saved once, showed confirmation, and cleared all form values.");
set(61, "Pass", "Production browser: name-only manual food was blocked with guidance to add nutrition or use AI estimate.");
set(62, "Pass", "Production browser: nutrition without a food name was blocked with 'Food name is required'.");
set(63, "Pass", "Production browser/API accepted complete nutrition fields containing valid zero values.");
set(64, "Pass", "Production browser/API rejected negative nutrition and did not save the food.");
set(65, "Pass", "Production API preserved decimal calories and macros (123.4 kcal and 20.75g carbs).");
set(66, "Needs Change", "Production prevented the normalized duplicate, but the UI could retain an earlier 'Saved to library!' message beside the duplicate error.");
set(67, "Pass", "Production browser/API generated a serving and complete nutrition for recognizable food names.");
set(68, "Pass", "Production browser: empty AI estimate showed 'Enter a food name first' and made no request result.");
set(69, "Pass", "Production AI returned a low-confidence, reviewable estimate for an uncommon food instead of crashing.");
set(70, "Pass", "Production browser: Edit values opened the estimated food in a prefilled editable form.");
set(71, "Pass", "Production browser: estimated food saved once, confirmed success, and cleared the estimate/form.");
set(72, "Pass", "Production browser: duplicate AI-estimated food showed only the already-in-library message and created no duplicate.");

set(74, "Pass", "Production browser: empty barcode lookup sent no visible result and retained a clean input state.");
set(75, "Pass", "Production browser: unknown barcode 0000000000000 showed 'Product not found' without stale product data.");
set(76, "Pass", "Production browser normalized '3017 6204-22003' to digits and returned the supported Nutella product.");
set(77, "Fail", "Production retest: barcode result still offered only Save to library; no Edit values action was available.");
set(79, "Fail", "Production retest: duplicate barcode save still showed both 'Saved to library!' and 'This food is already in your library'.");

set(103, "Pass", "Production browser: full and partial Food Library searches returned the matching custom food.");
set(104, "Fail", "Production browser: uppercase search worked only without surrounding spaces; spaced search returned 0 foods.");
set(105, "Pass", "Production browser: Name sorted alphabetically; Calories, Protein, and Fibre sorted descending by their values.");
set(106, "Pass", "Production browser/API: every category filter returned only matching foods; Recipe correctly showed an empty result when none existed.");
set(107, "Pass", "Production browser: Food Library '+ Add food' opened /add-food.");
set(109, "Pass", "Production browser/API: protected default foods displayed disabled edit/delete actions and returned 403 when called directly.");
set(111, "Pass", "Production API prevented normalized duplicates against both default and user-created foods.");

set(115, "Pass", "Production Goals accepted supported minimum Stats values and allowed progression.");
set(116, "Pass", "Production Goals accepted supported maximum Stats values and allowed progression.");
set(117, "Fail", "Production browser: out-of-range Stats values such as 19kg and 401kg could advance to the next step without a field error.");
set(122, "Pass", "Production browser: recommended calories and protein were editable in Preview and valid changes were saved.");
set(123, "Pass", "Production browser: a 0-calorie edited target was blocked by minimum validation; contextual target guidance remained visible.");
set(124, "Pass", "Production retest: goal save succeeded, collapsed to the saved summary, and Today used the new targets.");
set(125, "Pass", "Production API: modifying a saved goal persisted the updated calorie target after reload.");
set(126, "Pass", "Production API: deleting the goal succeeded and reload returned documented default targets.");
set(128, "Blocked", "Goals, Today, and Reports returned the same unique saved targets. Coach comparison remains blocked because Coach is Pro-only.");

set(132, "Pass", "Production API rejected unsupported profile name characters with a clear 400 validation message.");
set(133, "Pass", "Production API accepted exact profile minimums and maximums for age, weight, and height.");
set(134, "Pass", "Production API rejected below-minimum and above-maximum age, weight, and height.");
set(135, "Pass", "Production API saved Vegan, Vegetarian, and Non-vegetarian preferences successfully.");
set(137, "Pass", "Production API: changing country cleared the previously selected state and city.");
set(139, "Pass", "Production API: Sunday health-summary preference persisted as enabled after reload.");
set(140, "Fail", "Production API: /api/auth/export-data returned 500 for a valid authenticated Core account, so JSON export could not complete.");
set(141, "Fail", "Production API deleted the account even when incorrect confirmation credentials were supplied; credentials are not verified.");
set(142, "Pass", "Production: a disposable QA account was deleted and subsequent login returned 401.");

set(146, "Pass", "Production browser: Today recommendation opened Coach with goal and macro context already selected.");
set(151, "Pass", "Production browser: adding 100g Tofu calculated 80 kcal, 9g protein, 0.3g fibre, 2g carbs, and 4g fat per serving.");
set(161, "Fail", "Production browser: Core recipe Add to library opened the upgrade dialog at top 729px in a 720px viewport, entirely below the visible screen.");
set(162, "Pass", "Production browser: All, Vegan, Veg, and Non-veg filters returned only the expected recipe groups.");

set(173, "Pass", "Production browser/API: a valid daily weight saved and appeared in the latest/recent-log views.");
set(174, "Pass", "Production browser/API: saving a second value for the same date updated the existing weight to 76kg.");
set(175, "Pass", "Production API accepted exact weight boundaries of 20kg and 400kg.");
set(176, "Pass", "Production API rejected 0, negative, non-numeric, below-minimum, and above-maximum weights.");
set(177, "Pass", "Production browser: +250ml updated today's hydration total and log.");
set(178, "Needs Change", "Production accepted both 0.01ml and 1,000,000,000ml; there is no practical hydration maximum.");
set(179, "Pass", "Production browser/API: 8,000 steps saved for the selected date and updated the summary.");
set(180, "Pass", "Production browser/API rejected negative steps.");
set(181, "Pass", "Production APIs returned dated weight, water, and steps trend points matching stored logs.");
set(182, "Pass", "Production fresh account rendered useful no-data Body states without chart errors.");

set(183, "Blocked", "Fasting glucose API save passed, but the production Core account shows a Clinical-tier paywall before the UI form.");
set(184, "Blocked", "Post-meal glucose API save passed, but the production Core account shows a Clinical-tier paywall before the UI form.");
set(185, "Blocked", "Glucose API accepted exact 40 and 600 mg/dL boundaries; paid Clinical UI verification remains unavailable.");
set(186, "Fail", "Production API rejected 0, negative, 39, and 601, but accepted non-numeric 'abc' as a glucose value.");
set(187, "Blocked", "Blood-pressure logging requires paid Clinical/Pro access; no eligible production QA account was available.");
set(188, "Blocked", "Diastolic-versus-systolic API validation exists, but paid production UI verification was unavailable.");
set(189, "Blocked", "BP/pulse boundary verification requires paid Clinical/Pro access; no eligible production QA account was available.");
set(190, "Blocked", "HbA1c logging requires paid Clinical/Pro access; no eligible production QA account was available.");
set(191, "Blocked", "HbA1c invalid-value verification requires paid Clinical/Pro access; no eligible production QA account was available.");
set(192, "Blocked", "Wellbeing API persisted notes, but the production Core account cannot reach the Clinical UI form.");
set(193, "Pass", "Production cross-account checks kept distinctive clinical/health records isolated; Account B received no Account A range data.");
set(194, "Blocked", "Clinical empty-range API returned safely, but the production Core UI displays a tier paywall instead of the Clinical empty state.");

set(205, "Fail", "Production retest: changing Custom From/To dates did not refresh the report, which stayed on the prior 30-day range.");
set(206, "Fail", "Production retest: From later than To showed no clear validation and retained the stale report.");
set(207, "Fail", "Production retest: equal From/To dates did not update the report to the selected one-day range.");
set(214, "Pass", "Production API: unauthenticated report and export requests both returned 401 with no health data.");
set(215, "Fail", "Production at 390x844: Goals overflowed horizontally to 450px; the other primary pages tested had no horizontal clipping.");
set(217, "Fail", "Production mobile: several Today, Coach, and Body controls were only 32-34px high, below a comfortable touch target.");
set(218, "Fail", "Production at 320x700: Today macro cards, Reports charts, and Goals content overflowed horizontally.");
set(219, "Fail", "Production Chromium journey: registration/login, goal save/sync, reports, and Copy Yesterday worked; direct meal add/edit/delete and custom reports still failed.");

set(226, "Pass", "Production API: Account B could not mutate Account A meal, food, or weight records; each request returned 403.");
set(227, "Pass", "Production rejected script-like profile names and returned allowed notes as literal text; no script execution occurred in tested views.");
set(228, "Pass", "Production register, login, and /auth/me responses contained no password or password-hash field.");
set(231, "Pass", "Production: profile, modified goals, and custom food persisted through a new authenticated session.");

for (const [row, result] of updates) {
  rows[row - 1][2] = result.actual;
  rows[row - 1][4] = result.status;
  rows[row - 1][6] = testingDate;
}

rows[1][6] = "Testing date";
testSheet.getRange("A1:G237").values = rows;
testSheet.getRange("E2:E237").format.columnWidthPx = 112;
testSheet.getRange("G2:G237").format.columnWidthPx = 132;
testSheet.getRange("G2:G237").format.horizontalAlignment = "center";
testSheet.getRange("G2:G237").format.verticalAlignment = "center";
testSheet.getRange("G2").format.font = { bold: true, color: "#FFFFFF" };
testSheet.getRange("G2").format.fill = "#166534";

const statusStyle = {
  Pass: { fill: "#DCFCE7", color: "#166534" },
  Fail: { fill: "#FEE2E2", color: "#991B1B" },
  Blocked: { fill: "#FEF3C7", color: "#92400E" },
  "Not Tested": { fill: "#E5E7EB", color: "#374151" },
  "Needs Change": { fill: "#FFEDD5", color: "#9A3412" },
};
for (let row = 3; row <= 237; row += 1) {
  const status = rows[row - 1][4];
  const style = statusStyle[status];
  if (!style) continue;
  const cell = testSheet.getRange(`E${row}`);
  cell.format.fill = style.fill;
  cell.format.font = { bold: true, color: style.color };
  cell.format.horizontalAlignment = "center";
  cell.format.verticalAlignment = "center";
}

const bugSheet = workbook.worksheets.getItem("12-Jun-2026");
bugSheet.getRange("A1").values = [["VitaNudge Bug Verification - 12 Jun 2026"]];
bugSheet.getRange("A2").values = [[
  "Environment: Production Render | Frontend: https://vitanudge.onrender.com | API: https://vitanudge-api.onrender.com | Retested positive, negative, boundary, edge, mobile, security, and integration scenarios. No application files changed."
]];

const existingBugUpdates = {
  5: ["Direct Today + Add still does not create the first meal, so the profile reminder cannot trigger.", "Fail"],
  6: ["Modify goal remains visible and editable; goal save now synchronizes to Today.", "Pass"],
  7: ["Destination dropdown offered all four meals; selective copy and changed destination both worked.", "Pass"],
  8: ["Today opened Coach with the active goal and macro-gap question prefilled.", "Pass"],
  9: ["No barcode Edit values action; duplicate save still showed both success and duplicate messages.", "Fail"],
  10: ["Deployed source contains Edit values, but image upload/extraction could not be rerun without an approved label fixture.", "Blocked"],
  11: ["Food Library + Add food opened /add-food.", "Pass"],
  12: ["Upgrade dialog top was 729px in a 720px viewport, so it opened below the visible screen.", "Fail"],
  13: ["Privacy-safe login error and Create free account remained visible on mobile.", "Pass"],
  14: ["Next is disabled on Step 1 and Complete your profile opens Profile.", "Pass"],
};
for (const [row, [actual, result]] of Object.entries(existingBugUpdates)) {
  bugSheet.getRange(`F${row}`).values = [[actual]];
  bugSheet.getRange(`G${row}`).values = [[result]];
}

const newBugs = [
  ["BUG-011", "Today / Meals", "Direct Add, Edit, and Delete controls do not complete in the browser.", "Today > select food > + Add; or use a copied entry > Edit/Delete.", "Meal should save/edit/delete and dashboard totals should update.", "Copy Yesterday can create a meal, but direct + Add, edit icon, and delete icon produced no change.", "Fail"],
  ["BUG-012", "Reports", "Custom date fields do not regenerate the selected report range.", "Reports > Custom > change From/To, including inverted and one-day ranges.", "Report refreshes to the inclusive range; inverted range is blocked.", "Report remained on the previous 30-day range and showed no inverted-range error.", "Fail"],
  ["BUG-013", "Goals", "Out-of-range Stats values can advance.", "Goals > Stats > enter 19kg or 401kg > Next.", "Next is blocked with a clear range validation.", "The wizard advanced to Activity without a field error.", "Fail"],
  ["BUG-014", "Authentication", "Email whitespace is not normalized.", "Log in with spaces around a valid uppercase email.", "Spaces are trimmed and authentication behaves like the normalized email.", "Uppercase email passed; the same email with surrounding spaces returned 401.", "Fail"],
  ["BUG-015", "Food Library", "Search does not trim surrounding spaces.", "Search for an existing food using uppercase plus leading/trailing spaces.", "Normalized search returns the existing food.", "The unspaced uppercase query matched; surrounding spaces returned 0 foods.", "Fail"],
  ["BUG-016", "Meals API", "Invalid edit quantity can silently retain the previous quantity.", "PUT a meal quantity as 0 or non-numeric text.", "Request is rejected with 400 and no ambiguous success.", "0 and non-numeric values returned 200 and retained the old quantity; negative returned 400.", "Fail"],
  ["BUG-017", "Clinical API", "Non-numeric glucose can be stored.", "POST glucose with value_mgdl='abc'.", "Request is rejected as non-numeric.", "API returned 201 while other out-of-range values were rejected.", "Fail"],
  ["BUG-018", "Profile / Export", "Authenticated JSON data export returns 500.", "Profile > Export JSON or GET /api/auth/export-data.", "Complete account JSON downloads/returns successfully.", "Valid authenticated export returned HTTP 500.", "Fail"],
  ["BUG-019", "Account Deletion", "Delete account does not verify confirmation credentials.", "Submit account deletion with incorrect email/password.", "Deletion is rejected and the account remains active.", "API returned 200, deleted the account, and subsequent login returned 401.", "Fail"],
  ["BUG-020", "Mobile UI", "Goals, Today, and Reports overflow at narrow widths; some touch targets are too short.", "Inspect at 390x844 and 320x700.", "No horizontal overflow; primary controls are comfortably tappable.", "Goals overflowed at 390px; Today/Reports/Goals overflowed at 320px; several controls were 32-34px high.", "Fail"],
  ["BUG-021", "Body / Hydration", "Hydration accepts impractical extreme values.", "POST 0.01ml and 1,000,000,000ml.", "Practical documented minimum/maximum validation is applied.", "Both values were accepted; no practical maximum exists.", "Needs Change"],
];
bugSheet.getRange(`A19:G${18 + newBugs.length}`).values = newBugs;
bugSheet.getRange(`A19:G${18 + newBugs.length}`).format.wrapText = true;
bugSheet.getRange(`A19:G${18 + newBugs.length}`).format.verticalAlignment = "top";
bugSheet.getRange(`A19:G${18 + newBugs.length}`).format.borders = {
  top: { color: "#D1D5DB", style: "continuous" },
  bottom: { color: "#D1D5DB", style: "continuous" },
  left: { color: "#D1D5DB", style: "continuous" },
  right: { color: "#D1D5DB", style: "continuous" },
};
for (let row = 5; row <= 18 + newBugs.length; row += 1) {
  const status = bugSheet.getRange(`G${row}`).values?.[0]?.[0];
  const style = statusStyle[status];
  if (!style) continue;
  bugSheet.getRange(`G${row}`).format.fill = style.fill;
  bugSheet.getRange(`G${row}`).format.font = { bold: true, color: style.color };
  bugSheet.getRange(`G${row}`).format.horizontalAlignment = "center";
}

const issues = workbook.worksheets.getItem("issues");
issues.getRange("B1").values = [["fail - direct Today add still prevents the reminder"]];
issues.getRange("B9").values = [["fail"]];
issues.getRange("B11").values = [["blocked - label image extraction was not rerun"]];
issues.getRange("B16").values = [["fail - upgrade dialog opens below viewport"]];
issues.getRange("B18").values = [["pass"]];
issues.getRange("B20").values = [["pass"]];

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookPath);

const counts = {};
for (let row = 3; row <= 237; row += 1) {
  const status = rows[row - 1][4];
  counts[status] = (counts[status] || 0) + 1;
}
await fs.writeFile(
  path.join("outputs", "testcase-execution", "final-status-counts.json"),
  JSON.stringify(counts, null, 2)
);
console.log(JSON.stringify({ workbookPath, updatedRows: updates.size, counts }, null, 2));
