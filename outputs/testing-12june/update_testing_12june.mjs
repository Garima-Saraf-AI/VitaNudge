import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath =
  "/Users/uditgupta/Documents/Nutrient project/nutritrack/documents/TestCase_VitaNudge_Updated-doc.xlsx";
const sheetName = "testing_12June";
const testingDate = "12-Jun-2026";
const environment =
  "Production Render | Chromium mobile 390x844 | API HTTPS";

const workbook = await SpreadsheetFile.importXlsx(
  await FileBlob.load(workbookPath),
);
const sourceSheet = workbook.worksheets.getItem("testcases");
const sourceRows = sourceSheet.getRange("A3:G237").values;

const results = new Map();
const set = (row, status, actual) => results.set(row, { status, actual });

const apiPasses = [
  7, 8, 11, 13, 15, 16, 17, 35, 36, 37, 38, 39, 40, 41, 42, 44, 52,
  54, 55, 56, 57, 58, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71,
  72, 103, 105, 106, 109, 111, 124, 125, 126, 128, 132, 133, 134, 135,
  137, 139, 142, 173, 174, 175, 176, 177, 179, 180, 181, 182, 183, 184,
  185, 192, 193, 194, 214, 224, 225, 226, 227, 228, 231,
];
for (const row of apiPasses) {
  set(
    row,
    "Pass",
    "Production API retest completed successfully; response, validation, persistence, or isolation matched the expected result.",
  );
}

set(3, "Pass", "Created a new production QA account and reached first-time Goals setup.");
set(
  5,
  "Blocked",
  "The production login limiter was already active and showed the controlled 15-minute wait message, so the account-not-found guidance could not be isolated in this round.",
);
set(
  6,
  "Blocked",
  "The production login limiter was already active and showed the controlled 15-minute wait message, so wrong-password messaging could not be isolated in this round.",
);
set(
  10,
  "Pass",
  "A valid password containing letters, a number, and more than six characters was accepted during registration.",
);
set(
  12,
  "Fail",
  "Uppercase email authenticated, but the same valid email with leading/trailing spaces returned 401 instead of being trimmed.",
);
set(
  14,
  "Pass",
  "At 390x844 the Register login link remained fully visible after validation; no horizontal overflow was present.",
);
set(18, "Pass", "Logout returned the browser to /login and removed access to the authenticated dashboard.");
set(
  19,
  "Pass",
  "Production mobile smoke opened Today, Add Food, Coach, Reports, and Tools-related routes without application errors.",
);
set(
  20,
  "Pass",
  "Body, Clinical, Medications, Library, Recipes, Templates, Profile, Goals, and My Recipes routes opened or showed the correct tier gate.",
);
set(
  21,
  "Pass",
  "The username menu displayed separate Profile, Goals, and My saved recipes entries with the expected destinations.",
);
set(
  27,
  "Pass",
  "A Core QA account opened Today, Add Food, Food Library, Body, Profile, Goals, Recipes, and Reports.",
);
set(
  28,
  "Pass",
  "Core access to Medications, Templates, and Clinical functionality showed a visible paid-tier prompt without exposing paid data.",
);

for (const row of [29, 30, 31, 32, 33]) {
  set(
    row,
    "Blocked",
    "No eligible Pro/Clinical production QA account or safely adjustable subscription/quota state was available.",
  );
}

set(
  34,
  "Pass",
  "A fresh account loaded Today with zero meals and readable empty-state guidance.",
);
set(
  43,
  "Fail",
  "Meal edit accepted quantity 0 and non-numeric text with HTTP 200 while retaining the prior quantity; negative quantity correctly returned 400.",
);
set(
  53,
  "Pass",
  "Unique saved goal targets were returned consistently by Goals, Today summary, and Reports APIs.",
);
set(
  59,
  "Needs Change",
  "Repeating Copy Yesterday created another copy with no duplicate warning or confirmation.",
);
set(
  102,
  "Pass",
  "Food Library loaded successfully in production mobile Chromium with no page error or horizontal clipping.",
);
set(
  104,
  "Fail",
  "Uppercase food search worked, but the same query with leading/trailing spaces returned zero matches.",
);
set(
  113,
  "Pass",
  "A new account with an incomplete profile opened the onboarding Goal flow and displayed Complete profile guidance.",
);
set(
  114,
  "Pass",
  "The first Goal step kept Next disabled until the required profile information was available.",
);
set(
  130,
  "Pass",
  "Profile age 35, weight 75kg, and height 175cm saved successfully; the confirmation toast stayed visible at the top of the viewport while scrolled.",
);
set(
  140,
  "Fail",
  "Authenticated GET /api/auth/export-data returned HTTP 500 instead of exporting account data.",
);
set(
  141,
  "Fail",
  "Account deletion returned HTTP 200 and deleted the account even when incorrect confirmation credentials were supplied.",
);
set(
  161,
  "Pass",
  "Core recipe Add to library opened the upgrade modal at top 8px/bottom 828px inside a 390x844 viewport, even with the page scrolled.",
);
for (const row of [143, 144, 145, 146, 147, 148, 149, 150]) {
  set(
    row,
    "Blocked",
    "Positive Coach behavior requires a Pro production QA account; the Core route/page was available but paid responses were not executed.",
  );
}
for (const row of [165, 166, 167, 168, 169, 170]) {
  set(
    row,
    "Blocked",
    "Production currently gates Meal Templates as Pro; no Pro QA account was available for the workflow.",
  );
}
for (const row of [171, 172]) {
  set(
    row,
    "Needs Change",
    "The test case expects a Core template limit, but production presents the entire Templates feature as Pro-only. Product rules and test expectations should be aligned.",
  );
}
set(
  178,
  "Needs Change",
  "The production API accepted both 0.01ml and 1,000,000,000ml; practical hydration limits are not enforced.",
);
set(
  186,
  "Fail",
  "Glucose values 0, negative, 39, and 601 were rejected, but non-numeric value 'abc' was accepted with HTTP 201.",
);
for (const row of [187, 188, 189, 190, 191]) {
  set(
    row,
    "Blocked",
    "The paid Clinical/Pro UI workflow could not be executed without an eligible production QA account.",
  );
}
for (const row of [195, 196, 197, 198, 199, 200, 201]) {
  set(
    row,
    "Blocked",
    "Medication workflows require a Pro production QA account; the Core account correctly displayed the upgrade gate.",
  );
}
set(
  202,
  "Pass",
  "A Core account opening Medications saw a clear Pro feature message and no paid medication data.",
);
set(
  215,
  "Fail",
  "Fourteen primary routes showed no horizontal overflow at 390x844, but first-time Goals setup overflowed horizontally.",
);
set(
  216,
  "Blocked",
  "Physical/device orientation rotation was unavailable in the in-app production browser.",
);
set(
  218,
  "Blocked",
  "The available browser viewport was 390x844; a true 320px viewport could not be set in this round.",
);
set(
  219,
  "Blocked",
  "Chromium registration, navigation, profile save, tier gates, and responsive route smoke passed; the full meal/goal/report journey was not rerun end to end.",
);
for (const row of [220, 221]) {
  set(
    row,
    "Blocked",
    "A real iPhone Safari or Android Chrome device/session was not available in this environment.",
  );
}
set(
  222,
  "Blocked",
  "The linked /manifest.json, icons, start URL, theme, standalone mode, and /sw.js response were verified, but the install prompt/installed launch could not be exercised.",
);
set(
  223,
  "Blocked",
  "Offline installed-PWA launch requires an installed browser/device session and was not available.",
);
set(
  229,
  "Pass",
  "Frontend and API used HTTPS. API responses included HSTS, CSP, frame denial, nosniff, strict referrer policy, and a fixed allowed CORS origin.",
);
set(
  230,
  "Pass",
  "Repeated login attempts produced the controlled 15-minute rate-limit message without exposing credentials or crashing the page.",
);
for (const row of [232, 233, 234]) {
  set(
    row,
    "Blocked",
    "This destructive network/concurrency recovery scenario was not forced against the live production service.",
  );
}
set(
  235,
  "Pass",
  "Warm production checks measured about 0.19s for frontend HTML and 0.13s for API ping; browser route loads completed without blank screens.",
);
set(
  236,
  "Blocked",
  "Representative image fixtures and repeated paid/AI quota-safe runs were not available for this production round.",
);
set(
  237,
  "Blocked",
  "A safe 20-request concurrent unauthenticated ping smoke returned 20/20 HTTP 200 responses (about 0.08-0.39s), but the specified 10/25/50+ authenticated load test was not run against production.",
);

for (const row of [81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91]) {
  set(
    row,
    "Blocked",
    "Camera/file fixtures and quota-safe label-scanner execution were unavailable in this production browser round.",
  );
}
for (const row of [92, 93, 94, 95, 96, 97, 98, 99, 100, 101]) {
  set(
    row,
    "Blocked",
    "Representative plate images and quota-safe AI scan execution were unavailable in this production browser round.",
  );
}

const outputRows = sourceRows.map((source, index) => {
  const workbookRow = index + 3;
  const module = source[0] || "";
  const rawCase = source[1] || "";
  const match = rawCase.match(/^\[([^\]]+)\]\s*(.*)$/);
  const scenario = match?.[1] || "";
  const testCase = match?.[2] || rawCase;
  const result = results.get(workbookRow) || {
    status: "Not Tested",
    actual: "Not rerun in this production pass.",
  };
  return [
    `TC-${String(workbookRow - 2).padStart(3, "0")}`,
    module,
    scenario,
    testCase,
    source[5] || "",
    source[3] || "",
    result.actual,
    result.status,
    testingDate,
    environment,
  ];
});

const existing = workbook.worksheets.items.find((item) => item.name === sheetName);
if (existing) {
  throw new Error(`Sheet ${sheetName} already exists; refusing to overwrite it.`);
}
const sheet = workbook.worksheets.add(sheetName);
const firstDataRow = 8;
const lastDataRow = firstDataRow + outputRows.length - 1;

sheet.mergeCells("A1:J1");
sheet.getRange("A1").values = [["VitaNudge Production Retest - 12 June 2026"]];
sheet.getRange("A1:J1").format.fill = "#163A2B";
sheet.getRange("A1:J1").format.font = {
  bold: true,
  color: "#FFFFFF",
  size: 18,
};
sheet.getRange("A1:J1").format.horizontalAlignment = "left";
sheet.getRange("A1:J1").format.verticalAlignment = "center";
sheet.getRange("A1:J1").format.rowHeight = 38;

sheet.mergeCells("A2:J2");
sheet.getRange("A2").values = [[
  "Fresh production verification after redeployment. Existing workbook sheets remain unchanged. Application code was not modified.",
]];
sheet.getRange("A2:J2").format.fill = "#E8F1EC";
sheet.getRange("A2:J2").format.font = { color: "#244A38", italic: true };
sheet.getRange("A2:J2").format.wrapText = true;
sheet.getRange("A2:J2").format.rowHeight = 32;

sheet.getRange("A4:J4").values = [[
  "Total",
  "",
  "Pass",
  "",
  "Fail",
  "",
  "Blocked",
  "",
  "Needs Change",
  "",
]];
sheet.getRange("A5:D5").values = [["Not Tested", "", "Environment", ""]];
sheet.mergeCells("D5:J5");
sheet.getRange("D5").values = [[
  "Frontend: https://vitanudge.onrender.com | API: https://vitanudge-api.onrender.com",
]];
sheet.getRange("B4").formulas = [[`=COUNTA(A${firstDataRow}:A${lastDataRow})`]];
sheet.getRange("D4").formulas = [[`=COUNTIF(H${firstDataRow}:H${lastDataRow},"Pass")`]];
sheet.getRange("F4").formulas = [[`=COUNTIF(H${firstDataRow}:H${lastDataRow},"Fail")`]];
sheet.getRange("H4").formulas = [[`=COUNTIF(H${firstDataRow}:H${lastDataRow},"Blocked")`]];
sheet.getRange("J4").formulas = [[`=COUNTIF(H${firstDataRow}:H${lastDataRow},"Needs Change")`]];
sheet.getRange("B5").formulas = [[`=COUNTIF(H${firstDataRow}:H${lastDataRow},"Not Tested")`]];
sheet.getRange("A4:J5").format.fill = "#F4F7F5";
sheet.getRange("A4:J5").format.borders = {
  top: { color: "#CBD5CE", style: "continuous" },
  bottom: { color: "#CBD5CE", style: "continuous" },
  left: { color: "#CBD5CE", style: "continuous" },
  right: { color: "#CBD5CE", style: "continuous" },
};
for (const labelCell of ["A4", "C4", "E4", "G4", "I4", "A5", "C5"]) {
  sheet.getRange(labelCell).format.font = { bold: true, color: "#365A48" };
}
for (const valueCell of ["B4", "D4", "F4", "H4", "J4", "B5"]) {
  sheet.getRange(valueCell).format.font = { bold: true, color: "#111827", size: 13 };
  sheet.getRange(valueCell).format.horizontalAlignment = "center";
}

const headers = [
  "Test ID",
  "Module",
  "Scenario",
  "Test case",
  "How tested",
  "Expected result",
  "Actual result",
  "Status",
  "Testing date",
  "Environment",
];
sheet.getRange("A7:J7").values = [headers];
sheet.getRange("A7:J7").format.fill = "#2F6B4F";
sheet.getRange("A7:J7").format.font = { bold: true, color: "#FFFFFF" };
sheet.getRange("A7:J7").format.horizontalAlignment = "center";
sheet.getRange("A7:J7").format.verticalAlignment = "center";
sheet.getRange("A7:J7").format.rowHeight = 34;

sheet.getRange(`A${firstDataRow}:J${lastDataRow}`).values = outputRows;
sheet.getRange(`A${firstDataRow}:J${lastDataRow}`).format.wrapText = true;
sheet.getRange(`A${firstDataRow}:J${lastDataRow}`).format.verticalAlignment = "top";
sheet.getRange(`A${firstDataRow}:J${lastDataRow}`).format.borders = {
  top: { color: "#E1E7E3", style: "continuous" },
  bottom: { color: "#E1E7E3", style: "continuous" },
  left: { color: "#E1E7E3", style: "continuous" },
  right: { color: "#E1E7E3", style: "continuous" },
};
sheet.getRange(`A${firstDataRow}:A${lastDataRow}`).format.horizontalAlignment = "center";
sheet.getRange(`C${firstDataRow}:C${lastDataRow}`).format.horizontalAlignment = "center";
sheet.getRange(`H${firstDataRow}:I${lastDataRow}`).format.horizontalAlignment = "center";

const statusRange = sheet.getRange(`H${firstDataRow}:H${lastDataRow}`);
statusRange.conditionalFormats.add("containsText", {
  text: "Pass",
  format: { fill: "#DCFCE7", font: { color: "#166534", bold: true } },
});
statusRange.conditionalFormats.add("containsText", {
  text: "Fail",
  format: { fill: "#FEE2E2", font: { color: "#991B1B", bold: true } },
});
statusRange.conditionalFormats.add("containsText", {
  text: "Blocked",
  format: { fill: "#FEF3C7", font: { color: "#92400E", bold: true } },
});
statusRange.conditionalFormats.add("containsText", {
  text: "Needs Change",
  format: { fill: "#FFEDD5", font: { color: "#9A3412", bold: true } },
});
statusRange.conditionalFormats.add("containsText", {
  text: "Not Tested",
  format: { fill: "#E5E7EB", font: { color: "#374151", bold: true } },
});

const widths = [74, 145, 92, 290, 305, 285, 345, 105, 115, 190];
for (let column = 0; column < widths.length; column += 1) {
  sheet
    .getRangeByIndexes(0, column, lastDataRow, 1)
    .format.columnWidthPx = widths[column];
}
sheet.freezePanes.freezeRows(7);
sheet.showGridlines = false;

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookPath);

const counts = outputRows.reduce((summary, row) => {
  summary[row[7]] = (summary[row[7]] || 0) + 1;
  return summary;
}, {});
console.log(
  JSON.stringify(
    {
      workbookPath,
      sheetName,
      cases: outputRows.length,
      firstDataRow,
      lastDataRow,
      counts,
    },
    null,
    2,
  ),
);
