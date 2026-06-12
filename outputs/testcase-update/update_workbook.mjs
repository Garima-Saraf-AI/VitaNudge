import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(workDir, "source.xlsx");
const outputPath = path.join(workDir, "TestCase_VitaNudge.xlsx");
const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);

const COLORS = {
  green: "#2F7A42",
  greenDark: "#1F5D31",
  greenLight: "#EAF4EC",
  blueLight: "#D9E8F5",
  blue: "#3A6F9C",
  navy: "#1F3B4D",
  body: "#FAFCFA",
  white: "#FFFFFF",
  border: "#CAD6CC",
  muted: "#5F6F63",
  red: "#B42318",
  redLight: "#FDE8E7",
  amber: "#9A6700",
  amberLight: "#FFF4CE",
  gray: "#667085",
  grayLight: "#F2F4F7",
};

function cleanSheet(sheet, range) {
  for (const table of sheet.tables.items) table.delete();
  sheet.getRange(range).unmerge();
  sheet.getRange(range).clear({ applyTo: "all" });
  sheet.showGridLines = false;
}

function addStatusFormatting(range, statusColumnLetter, startRow, endRow) {
  const statusRange = range.getRangeByIndexes(
    startRow - range.getUsedRange().rowIndex,
    statusColumnLetter.charCodeAt(0) - 65,
    endRow - startRow + 1,
    1,
  );
  statusRange.conditionalFormats.deleteAll();
  statusRange.conditionalFormats.add("containsText", {
    text: "Pass",
    format: { fill: COLORS.greenLight, font: { bold: true, color: COLORS.greenDark } },
  });
  statusRange.conditionalFormats.add("containsText", {
    text: "Fail",
    format: { fill: COLORS.redLight, font: { bold: true, color: COLORS.red } },
  });
  statusRange.conditionalFormats.add("containsText", {
    text: "Open",
    format: { fill: COLORS.redLight, font: { bold: true, color: COLORS.red } },
  });
  statusRange.conditionalFormats.add("containsText", {
    text: "Not Tested",
    format: { fill: COLORS.grayLight, font: { color: COLORS.gray } },
  });
  statusRange.conditionalFormats.add("containsText", {
    text: "Blocked",
    format: { fill: COLORS.amberLight, font: { bold: true, color: COLORS.amber } },
  });
}

function tc(module, type, testCase, expected, flow, actual = "Not executed in this QA round.", status = "Not Tested") {
  return [module, `[${type}] ${testCase}`, actual, expected, status, flow];
}

const testCases = [
  tc(
    "Login & Registration",
    "Positive",
    "Create temporary QA account",
    "Account is created successfully and the user is signed in.",
    "Open Register > enter a valid name, unique email, and password > select Create account.",
    "Account created successfully.",
    "Pass",
  ),
  tc(
    "Login & Registration",
    "Positive",
    "Log in using valid registered credentials",
    "User is authenticated and redirected to the Today dashboard.",
    "Open Login > enter valid registered email and password > select Continue to dashboard.",
    "Fresh QA user logged in and reached Today.",
    "Pass",
  ),
  tc(
    "Login & Registration",
    "Negative",
    "Log in with an email that has no account",
    "A privacy-safe incorrect email/password message is shown and Create free account remains visible.",
    "Open Login > enter an unregistered email and any password > submit.",
    "Generic incorrect email/password message displayed; Create free account remained visible.",
    "Pass",
  ),
  tc("Login & Registration", "Negative", "Log in with a valid email and incorrect password", "Login is rejected without revealing whether the email exists.", "Enter a registered email with an incorrect password > submit."),
  tc("Login & Registration", "Negative", "Submit login with empty email and password", "Required-field validation prevents submission.", "Open Login > leave both fields empty > submit."),
  tc("Login & Registration", "Negative", "Register using an invalid email format", "Email format validation prevents account creation.", "Open Register > enter name, invalid email text, and valid password > submit."),
  tc("Login & Registration", "Boundary", "Register with a 5-character password", "Registration is blocked because the minimum length is 6 characters.", "Open Register > enter valid name/email > enter 5-character password > submit."),
  tc("Login & Registration", "Boundary", "Register with exactly a 6-character password", "Registration succeeds when all other values are valid.", "Open Register > enter valid name and unique email > enter exactly 6 characters > submit."),
  tc("Login & Registration", "Negative", "Register using an email that already exists", "Duplicate account is rejected with a clear message and no duplicate user is created.", "Open Register > enter an existing email with valid name/password > submit."),
  tc("Login & Registration", "Edge", "Use leading/trailing spaces and uppercase letters in email", "Email is normalized consistently and authentication behaves predictably.", "Register or log in using spaces around an uppercase email address."),
  tc("Login & Registration", "Boundary", "Enter maximum practical name and email lengths", "The form remains usable and the API applies documented length validation.", "Paste long but valid name/email values near accepted limits > submit."),
  tc(
    "Login & Registration",
    "Edge",
    "Verify Register page login link on a 390px mobile viewport",
    "Already have an account? Log in is fully visible without scrolling or clipping.",
    "Open Register on a 390x844 viewport > inspect the bottom of the form.",
    "Log in link was visible and usable.",
    "Pass",
  ),
  tc("Login & Registration", "Positive", "Request password reset for a registered email", "A neutral confirmation is displayed and reset instructions are sent when configured.", "Open Forgot password > enter registered email > submit."),
  tc("Login & Registration", "Negative", "Request password reset for an unknown email", "The same neutral confirmation is displayed to prevent account enumeration.", "Open Forgot password > enter unknown email > submit."),
  tc("Login & Registration", "Negative", "Open a protected page while logged out", "User is redirected to Login and protected data is not shown.", "Log out > directly open /goals, /profile, or /report."),
  tc("Login & Registration", "Positive", "Log out from the profile menu", "Session token is cleared and the user returns to Login.", "Open username menu > select Log out > revisit a protected URL."),

  tc("Navigation & Access", "Positive", "Navigate through Today, Add Food, Coach, Reports, and Tools", "Each destination opens and only the correct navigation item is active.", "Log in > select each primary navigation item in sequence."),
  tc("Navigation & Access", "Positive", "Open a Tools subpage", "Tools remains highlighted for Body, Clinical, Medications, Food Library, Recipes, and Templates.", "Open Tools > select each available tool."),
  tc("Navigation & Access", "Positive", "Open Profile, Goals, and My saved recipes from username menu", "Each item opens its own correct page.", "Open username menu > select each menu item."),
  tc("Navigation & Access", "Edge", "Close username menu by clicking outside", "Menu closes without navigating or changing data.", "Open username menu > click outside the menu."),
  tc("Navigation & Access", "Edge", "Close username menu using Escape", "Menu closes and keyboard focus remains usable.", "Open username menu > press Escape."),
  tc("Navigation & Access", "Positive", "Verify legacy URLs redirect correctly", "/barcode, /water, /weight, /glucose, /vitals, and /weekly redirect to their current pages.", "Open each legacy URL directly while signed in."),
  tc("Navigation & Access", "Negative", "Open an unknown application route", "User is safely redirected to Today without a blank screen.", "Open a random unsupported path after the domain."),
  tc("Navigation & Access", "Edge", "Refresh every protected route", "The page restores the authenticated session and current route without redirect loops.", "Open each major page > refresh the browser."),

  tc("Subscription & Tier Access", "Positive", "Core user opens included features", "Core features load without an upgrade prompt.", "Use Today, Body, Clinical basic logs, Food Library, profile, goals, and allowed scan quotas."),
  tc("Subscription & Tier Access", "Negative", "Core user opens a Pro-only feature", "A visible upgrade dialog explains the required plan and can be closed.", "Using a Core account, open Medications, Recipes save, Templates, or another gated action."),
  tc("Subscription & Tier Access", "Positive", "Pro user opens all Pro features", "Pro features work without an upgrade prompt.", "Sign in as Pro > use recipes, templates, medications, advanced coach, scans, and exports."),
  tc("Subscription & Tier Access", "Positive", "Clinical user opens Clinical-only functionality", "Clinical-specific features open and all lower-tier features remain available.", "Sign in as Clinical > open Clinical functionality and Pro/Core features."),
  tc("Subscription & Tier Access", "Boundary", "Use the last free label scan and barcode lookup", "The final included use succeeds and the counter reaches its exact limit.", "Set counters to one below the limit > complete one successful lookup/scan."),
  tc("Subscription & Tier Access", "Boundary", "Attempt one scan or barcode lookup beyond the free quota", "Operation is blocked before paid usage and the upgrade dialog is shown.", "Exhaust the free quota > attempt one additional successful operation."),
  tc("Subscription & Tier Access", "Edge", "Subscription expires during an authenticated session", "The next protected request re-evaluates access and shows a clear upgrade message.", "Use an expired paid QA account > refresh or call a gated feature."),

  tc("Today Dashboard", "Positive", "Load Today with no meal logs", "Zero-state summary, current date, macro targets, and suggested first action are displayed.", "Sign in with a clean account > open Today."),
  tc("Today Dashboard", "Positive", "Add a food to Breakfast", "Meal, calories, protein, fibre, and carbs update immediately.", "Search Breakfast > choose a food > set quantity/unit > Add."),
  tc("Today Dashboard", "Positive", "Add foods to Lunch, Dinner, and Snack", "Each food appears only in the selected meal and totals include all meals.", "Repeat food add in Lunch, Dinner, and Snack."),
  tc("Today Dashboard", "Negative", "Try to add food without selecting a search result", "No meal entry is created.", "Type unmatched text in a meal search without selecting a food > attempt Add."),
  tc("Today Dashboard", "Boundary", "Add the minimum allowed positive quantity", "A small positive quantity is accepted and macros scale correctly.", "Select food > enter minimum supported quantity > Add."),
  tc("Today Dashboard", "Boundary", "Enter zero quantity", "Entry is blocked and no zero-value meal is created.", "Select food > set quantity to 0 > attempt Add."),
  tc("Today Dashboard", "Negative", "Enter a negative quantity", "Validation rejects the value and no entry is created.", "Select food > enter a negative quantity > attempt Add."),
  tc("Today Dashboard", "Edge", "Enter a very large quantity", "The app either validates the maximum or saves without overflow/NaN values.", "Select food > enter an unusually large numeric quantity > Add."),
  tc("Today Dashboard", "Positive", "Edit quantity and unit of a logged meal", "The entry and dashboard totals recalculate and persist after refresh.", "Log food > select Edit > change quantity/unit > Save > refresh."),
  tc("Today Dashboard", "Negative", "Edit a logged meal with zero or invalid quantity", "Save is blocked and the original log remains unchanged.", "Edit a meal > enter zero, negative, or non-numeric quantity > Save."),
  tc("Today Dashboard", "Positive", "Delete a logged meal entry", "Entry is removed and all summary values recalculate.", "Log a food > select Delete > confirm if prompted."),
  tc("Today Dashboard", "Positive", "Navigate to a previous date", "The selected date and only that date's meal logs are displayed.", "Select the previous-day arrow on Today."),
  tc("Today Dashboard", "Boundary", "Attempt to navigate beyond today", "Next-day arrow is disabled and future dates cannot be selected.", "Open Today > inspect/select the forward arrow."),
  tc("Today Dashboard", "Edge", "Refresh after selecting a historical date", "App returns to its documented default date without corrupting logs.", "Open a previous date > refresh."),
  tc(
    "Today Dashboard",
    "Positive",
    "Show incomplete-profile reminder after the first food is added",
    "A centered, fully visible profile reminder opens above every sticky header.",
    "Use an incomplete profile > add the first food on Today.",
    "The modal opened, but the header and sticky summary covered the dialog.",
    "Fail",
  ),
  tc("Today Dashboard", "Edge", "Dismiss the profile reminder with Maybe later", "Reminder closes and the newly logged food remains saved.", "Trigger reminder > select Maybe later."),
  tc("Today Dashboard", "Positive", "Open Complete profile now from the reminder", "Reminder closes and Profile opens.", "Trigger reminder > select Complete profile now."),
  tc(
    "Today Dashboard",
    "Positive",
    "Open Coach from the suggested next action",
    "Coach opens with the recommendation question prefilled from current macro gaps.",
    "Create a macro gap on Today > select Find options or Ask coach.",
    "Coach opened with a protein-gap question prefilled.",
    "Pass",
  ),
  tc("Today Dashboard", "Edge", "Dashboard totals exceed a target", "Progress remains readable, over-target messaging appears, and values do not cap incorrectly.", "Log enough food to exceed calories or carbs > inspect summary."),
  tc("Today Dashboard", "Data Integrity", "Saved goal targets appear on Today", "Today uses the latest saved calories, protein, fibre, and carbs targets.", "Save a goal plan > return to Today > compare all targets."),

  tc("Copy Yesterday", "Positive", "Open Copy yesterday when yesterday has logs", "Review dialog lists yesterday's meals and items.", "Create yesterday logs > return to Today > select Copy yesterday."),
  tc(
    "Copy Yesterday",
    "Positive",
    "Change an item's destination meal before copying",
    "Each selected item can be assigned to Breakfast, Lunch, Dinner, or Snack.",
    "Open Copy yesterday > change a Dinner item destination to Lunch.",
    "Destination dropdown offered all four meals and accepted Lunch.",
    "Pass",
  ),
  tc("Copy Yesterday", "Positive", "Copy only selected food items", "Only checked items are copied and unselected items remain absent.", "Open review > clear/select individual items > confirm copy."),
  tc("Copy Yesterday", "Negative", "Confirm copy with no selected items", "Confirm action is disabled or a clear validation message is shown.", "Open review > Clear > attempt confirm."),
  tc("Copy Yesterday", "Edge", "Copy when yesterday has no meals", "A clear no-meals message is shown and no duplicate data is created.", "Use an account with no previous-day logs > select Copy yesterday."),
  tc("Copy Yesterday", "Edge", "Attempt to copy the same items twice", "App warns about duplicates or performs the documented behavior consistently.", "Copy yesterday once > open Copy yesterday again > copy the same item."),

  tc("Add Food - Manual", "Positive", "Save a manually entered food with complete nutrition", "Food is saved once, confirmation appears, and form values clear.", "Open Add Food > Manual add > enter name and all nutrition fields > Save."),
  tc("Add Food - Manual", "Negative", "Save manual food with name only", "Save is blocked with guidance to add nutrition or use AI estimate.", "Manual add > enter only food name > Save."),
  tc("Add Food - Manual", "Negative", "Save manual food without a name", "Save is blocked with Food name is required.", "Manual add > fill nutrition but leave name empty > Save."),
  tc("Add Food - Manual", "Boundary", "Save nutrition values equal to zero", "Zero is accepted where nutritionally valid and values persist as zero.", "Enter complete food with one or more valid zero nutrient values > Save."),
  tc("Add Food - Manual", "Negative", "Enter negative nutrition values", "Validation rejects negative calories or macros.", "Enter a negative value in each nutrition field > Save."),
  tc("Add Food - Manual", "Edge", "Enter decimal nutrition values", "Decimals save and display without unwanted rounding or precision errors.", "Enter decimal calories/macros > Save > inspect Library."),
  tc("Add Food - Manual", "Edge", "Enter a duplicate manual food name", "Duplicate is prevented or clearly identified without creating a second record.", "Save a food > repeat with the same normalized name."),

  tc("Add Food - AI Estimate", "Positive", "Estimate nutrition using food name", "Estimated serving and complete nutrition are shown for review.", "Open AI estimate > enter a recognizable food and portion hint > Extract nutrition."),
  tc("Add Food - AI Estimate", "Negative", "Estimate with an empty food name", "Request is blocked with Enter a food name first.", "Open AI estimate > leave name empty > Extract nutrition."),
  tc("Add Food - AI Estimate", "Edge", "Estimate an uncommon or misspelled food", "App returns a cautious estimate or clear failure without fabricating certainty.", "Enter an uncommon/misspelled food > Extract nutrition."),
  tc("Add Food - AI Estimate", "Positive", "Edit estimated values before saving", "Manual edit opens with the estimated values populated.", "Generate estimate > select Edit values > change values."),
  tc("Add Food - AI Estimate", "Positive", "Save estimated food", "Food saves once, the form clears, and the estimate button resets.", "Generate estimate > review > Save to library."),
  tc("Add Food - AI Estimate", "Negative", "Save an estimated duplicate food", "Only the duplicate message is shown and no duplicate row is created.", "Estimate a food already in Library > Save."),

  tc("Barcode", "Positive", "Look up a valid supported barcode", "Product name, serving, and nutrition values are displayed.", "Open Add Food > Barcode > enter 3017620422003 > Look up."),
  tc("Barcode", "Negative", "Look up an empty barcode", "No request is sent or a clear barcode-required validation appears.", "Leave Barcode number empty > Look up."),
  tc("Barcode", "Negative", "Look up an invalid or unknown barcode", "Product-not-found message appears without stale product data.", "Enter an invalid numeric barcode > Look up."),
  tc("Barcode", "Edge", "Paste barcode containing spaces or non-digits", "Input is normalized to digits or rejected clearly.", "Paste a formatted barcode string > Look up."),
  tc(
    "Barcode",
    "Positive",
    "Review and edit barcode nutrition before saving",
    "An Edit values action is available before Save to library.",
    "Look up a valid barcode > inspect product actions.",
    "Product displayed Save to library only; no Edit values action was available.",
    "Fail",
  ),
  tc("Barcode", "Positive", "Save a new barcode product", "One food is created, success appears, and barcode/result fields clear.", "Look up a new barcode > Save to library."),
  tc(
    "Barcode",
    "Negative",
    "Save a barcode product already in Library",
    "Only the duplicate message appears; the previous success message is cleared.",
    "Save a barcode product > look up the same barcode > Save again.",
    "Both Saved to library! and This food is already in your library were displayed.",
    "Fail",
  ),
  tc("Barcode", "Boundary", "Use the final free barcode lookup", "Lookup succeeds and usage counter increments exactly once on success.", "Set free counter to 9/10 > perform one successful lookup."),
  tc("Barcode", "Edge", "Scan barcode photo in a browser without BarcodeDetector", "Fallback message instructs the user to type the barcode.", "Use an unsupported browser > select Scan photo > choose barcode image."),

  tc("Label Scanner", "Positive", "Upload a clear nutrition label image", "Image is read and extracted values are displayed.", "Open Add Food > Label > Choose photo > select a clear label image."),
  tc("Label Scanner", "Positive", "Take a nutrition label photo on mobile", "Camera input opens and the captured label is processed.", "Open Label on a phone > Take photo > capture a clear label."),
  tc("Label Scanner", "Negative", "Upload a non-image file", "File is rejected with Please choose a valid image file.", "Choose photo > select a non-image file."),
  tc("Label Scanner", "Negative", "Upload a plate or non-label image", "App reports that the image is not a nutrition label and does not create a food.", "Choose photo > upload a meal/plate image."),
  tc("Label Scanner", "Edge", "Upload a blurry or partially cropped label", "Low-confidence/missing fields are identified for review instead of silently saved.", "Upload a blurry or cropped label image."),
  tc(
    "Label Scanner",
    "Positive",
    "Edit extracted label values before saving",
    "Edit values is available and opens all extracted fields.",
    "Scan a valid label > inspect extracted nutrition actions.",
    "Extracted nutrition offered Save to library only; Edit values was missing.",
    "Fail",
  ),
  tc("Label Scanner", "Negative", "Save a scan where product name was not detected", "Save is blocked and only Food name is required is shown.", "Scan a label with no product name > Save."),
  tc(
    "Label Scanner",
    "Negative",
    "Prevent simultaneous success and validation messages",
    "Only the message matching the current save attempt is visible.",
    "Complete a save > scan/save an invalid result immediately afterward.",
    "Code path can retain Saved to library! while showing Food name is required.",
    "Fail",
  ),
  tc("Label Scanner", "Positive", "Save reviewed label result", "Food saves once and image/result/form state clears.", "Scan label > review values > Save to library."),
  tc("Label Scanner", "Boundary", "Use final free label scan", "Final included scan succeeds and counter reaches 5/5.", "Set scan usage to 4/5 > process one valid label."),

  tc("Plate Scan", "Positive", "Upload a clear meal photo", "Foods and estimated quantities are identified without logging automatically.", "Open Scan > Plate scan > choose a clear meal image > Identify."),
  tc("Plate Scan", "Negative", "Upload a nutrition label in Plate scan", "App rejects or redirects the image as the wrong scan type.", "Plate scan > upload a nutrition facts image."),
  tc("Plate Scan", "Negative", "Upload a non-image or corrupted file", "Upload is rejected and the page remains usable.", "Choose an unsupported/corrupt file."),
  tc("Plate Scan", "Edge", "Scan a plate containing many foods", "Response remains readable and all supported items are listed without parser failure.", "Upload a complex plate containing 8-10 visible foods."),
  tc("Plate Scan", "Edge", "Scan an unfamiliar food not present in Library", "Food remains editable and receives an estimate or clear unmatched status.", "Upload a plate containing an uncommon food."),
  tc("Plate Scan", "Positive", "Edit detected food name", "Nutrition is recalculated or clearly marked for re-estimation.", "Identify plate > edit a detected food name."),
  tc("Plate Scan", "Positive", "Edit detected quantity", "Calories and macros update for the edited quantity.", "Identify plate > change quantity/unit for one detected item."),
  tc("Plate Scan", "Positive", "Remove an incorrect detected food", "Removed item is excluded from saved meal totals.", "Identify plate > remove one food > save."),
  tc("Plate Scan", "Positive", "Choose meal destination and save identified foods", "Selected foods are logged once to the selected meal.", "Identify plate > review/edit > select meal > Save."),
  tc("Plate Scan", "Negative", "Save with no selected detected foods", "Save is disabled or validation explains that at least one item is required.", "Identify plate > deselect/remove every item > Save."),

  tc("Food Library", "Positive", "Load default and user-created foods", "Library displays searchable foods with nutrition and serving information.", "Open Tools > Food Library."),
  tc("Food Library", "Positive", "Search by full and partial food name", "Matching foods are filtered without losing data.", "Enter full and partial names in Search foods."),
  tc("Food Library", "Edge", "Search using different letter case and surrounding spaces", "Search is case-insensitive and handles whitespace.", "Search for an existing food using uppercase and spaces."),
  tc("Food Library", "Positive", "Sort foods by name, calories, protein, and fibre", "Rows reorder correctly for every sort option.", "Select each sort option and inspect order."),
  tc("Food Library", "Positive", "Filter by each category", "Only foods in the selected category are shown.", "Select protein, dairy, legume, grain, veg, fruit, snack, beverage, recipe, and custom filters."),
  tc(
    "Food Library",
    "Positive",
    "Open Add food from Library",
    "The app opens /add-food rather than Plate scan.",
    "Open Food Library > select + Add food.",
    "The app opened /add-food.",
    "Pass",
  ),
  tc("Food Library", "Positive", "Edit a user-created food", "Manual edit opens with saved values and Update persists changes.", "Find a custom food > Edit > change nutrition > Update."),
  tc("Food Library", "Negative", "Attempt to edit or delete a protected default food", "Controls are consistently disabled or an explanatory message is shown.", "Inspect a seeded food > attempt Edit/Delete."),
  tc("Food Library", "Positive", "Delete a user-created food", "Food is removed without deleting unrelated meal history.", "Create custom food > Library > Delete > verify logs and list."),
  tc("Food Library", "Data Integrity", "Prevent duplicate foods from manual, AI, barcode, and label sources", "Normalized duplicate detection behaves consistently across all add methods.", "Try saving the same name through each Add Food tab."),

  tc("Goals", "Positive", "Complete the seven-step goal wizard", "User can select Goal, Stats, Activity, Pace, Carbs, Diabetes, preview, and save.", "Open Goals with completed profile > progress through all steps."),
  tc("Goals", "Negative", "Open Goals with incomplete profile", "The app clearly directs the user to Profile and prevents invalid recommendations.", "Use a new account without age/weight/height > open Goals."),
  tc(
    "Goals",
    "Negative",
    "Try to continue from Stats with incomplete profile",
    "Next is disabled and a visible Complete profile action is provided.",
    "Use incomplete profile > Goals > move to Stats.",
    "Next was disabled, but the page referenced a form below that was not present and provided no Profile action.",
    "Fail",
  ),
  tc("Goals", "Boundary", "Enter minimum supported age, weight, and height", "Values at the documented minimum are accepted and produce finite recommendations.", "At Stats, enter minimum valid values > continue."),
  tc("Goals", "Boundary", "Enter maximum supported age, weight, and height", "Values at the documented maximum are accepted without overflow.", "At Stats, enter maximum valid values > continue."),
  tc("Goals", "Negative", "Enter values below or above allowed profile ranges", "Next/save is blocked with field-specific validation.", "Enter out-of-range age, weight, or height."),
  tc("Goals", "Positive", "Preview fat-loss recommendation", "Calories use BMR/TDEE deficit; target weight/date and macros are visible.", "Choose Reduce weight > complete wizard > Preview."),
  tc("Goals", "Positive", "Preview muscle-build recommendation", "Calorie surplus, protein, lean-mass target, and timeline are non-zero and sensible.", "Choose Build muscle > complete wizard > Preview."),
  tc("Goals", "Positive", "Preview weight-gain, maintenance, and glucose-control plans", "Each goal applies its documented adjustment and displays a complete plan.", "Repeat the wizard for each remaining goal type."),
  tc("Goals", "Edge", "Choose aggressive pace with diabetes-focused goal", "A glucose safety warning appears and Steady is recommended.", "Choose Improve glucose control + aggressive pace + diabetic status."),
  tc("Goals", "Positive", "Edit recommended target values in Preview", "Editable targets accept valid values and show contextual guidance.", "Preview plan > change calories, macros, water, date, or target weight."),
  tc("Goals", "Negative", "Enter zero, negative, or unrealistic edited targets", "Save is blocked or a clear warning explains the acceptable range.", "Preview plan > enter invalid target values > Save."),
  tc("Goals", "Positive", "Save a goal plan", "Goal collapses to a saved summary and Today immediately uses saved targets.", "Preview plan > Save changes > open Today."),
  tc(
    "Goals",
    "Positive",
    "Modify an existing saved goal",
    "Modify goal opens Preview with editable saved values and Save changes persists updates.",
    "Save a plan > return to Goals > select Modify goal.",
    "Modify goal opened editable recommended targets.",
    "Pass",
  ),
  tc("Goals", "Positive", "Delete an existing goal", "Confirmation appears and the goal is removed without deleting health logs.", "Save a goal > Delete goal > confirm."),
  tc("Goals", "Edge", "Trigger recalculation after weight changes by 2kg or more", "A recalculation prompt appears and can apply the latest weight.", "Save goal > log weight differing by at least 2kg > open Goals."),
  tc("Goals", "Data Integrity", "Compare saved goal targets across Goals, Today, Coach, and Reports", "Every page uses the same latest target values.", "Save unique targets > inspect all consuming pages."),

  tc("Profile", "Positive", "Load saved profile values", "Name, locked login email, age, gender, weight, height, preference, location, timezone, and notes display correctly.", "Open Profile after saving profile data."),
  tc("Profile", "Positive", "Save valid profile changes", "Profile updates once and a visible confirmation appears without page jumping.", "Edit profile fields > Save profile."),
  tc("Profile", "Negative", "Attempt to edit login email", "Login email remains disabled and cannot be changed in the form.", "Open Profile > try typing into Login email."),
  tc("Profile", "Negative", "Save invalid name characters", "Name validation rejects unsupported characters with clear guidance.", "Enter numbers/symbols outside the supported pattern > Save."),
  tc("Profile", "Boundary", "Save minimum and maximum age, weight, and height", "Boundary values are handled consistently with Goals validation.", "Enter documented minimums, save; repeat with maximums."),
  tc("Profile", "Negative", "Save out-of-range age, weight, or height", "Save is blocked and existing profile data remains unchanged.", "Enter below-minimum/above-maximum values > Save."),
  tc("Profile", "Positive", "Select Vegan, Vegetarian, and Non-vegetarian preferences", "Selected preference persists and recipe suggestions filter accordingly.", "Save each food preference > open Recipes."),
  tc("Profile", "Positive", "Select country, then state, then city", "State options depend on country; city options depend on state; placeholders update correctly.", "Choose a country > state > city > Save > reload."),
  tc("Profile", "Edge", "Change country after choosing state and city", "Incompatible state and city values reset.", "Select full location > change country."),
  tc("Profile", "Positive", "Save timezone and verify Today date", "Header and Today date use the saved timezone.", "Change timezone > Save > compare with local time around midnight."),
  tc("Profile", "Positive", "Enable Sunday health summary", "Preference persists and uses the profile email.", "Check Get a health summary delivered every Sunday > Save > reload."),
  tc("Profile", "Positive", "Export account data", "Authorized JSON/CSV export downloads only the current user's data.", "Open Profile > Export JSON and Export meals CSV."),
  tc("Profile", "Negative", "Delete account with incorrect confirmation credentials", "Deletion is blocked and account/data remain accessible.", "Open Delete Account > enter invalid confirmation > submit."),
  tc("Profile", "Positive", "Delete a disposable QA account", "Account and owned data are deleted and future login fails.", "Create disposable account > Delete Account > confirm > try login."),

  tc("Coach", "Negative", "Submit Coach with no question", "A prompt asks the user to enter a question and no empty request is sent.", "Open Coach > leave question blank > Ask coach."),
  tc("Coach", "Positive", "Ask a general nutrition question", "Coach returns a useful answer with appropriate non-medical framing.", "Enter a general question > Ask coach."),
  tc("Coach", "Positive", "Ask about current meal logs", "Response references the user's actual meal/macro context.", "Create distinctive logs > ask what to improve today."),
  tc("Coach", "Positive", "Open Coach from Today recommendation", "Prefilled question and source context are preserved.", "Select Today recommendation CTA."),
  tc("Coach", "Positive", "Open Coach from saved goal context", "Question contains the saved goal and relevant targets.", "Save a goal > Today > Ask coach."),
  tc("Coach", "Negative", "Ask for diagnosis or medication changes", "Coach avoids diagnosis/prescribing and advises professional care.", "Ask a high-risk medical question."),
  tc("Coach", "Edge", "Submit a very long question", "Input is validated or processed without layout/API failure.", "Paste a long multi-paragraph question near the allowed limit."),
  tc("Coach", "Error Handling", "AI provider is unavailable", "A clear retry/fallback message appears and the page remains usable.", "Simulate provider timeout/failure > submit question."),

  tc("Recipes", "Positive", "Calculate recipe nutrition from ingredients and quantities", "Total and per-serving macros recalculate correctly.", "Open Recipes > name recipe > add ingredients/quantities > set servings."),
  tc("Recipes", "Negative", "Add ingredient without choosing an ingredient or quantity", "Add ingredient remains disabled or validation is shown.", "Leave default ingredient/quantity > attempt Add ingredient."),
  tc("Recipes", "Boundary", "Use one serving", "Per-serving macros equal total recipe macros.", "Build recipe > set Servings to 1."),
  tc("Recipes", "Boundary", "Use a large serving count", "Per-serving values remain finite and correctly divided.", "Build recipe > enter a large valid serving count."),
  tc("Recipes", "Negative", "Use zero or negative servings/ingredient quantity", "Save/calculation is blocked and no invalid recipe is created.", "Enter zero/negative serving or quantity."),
  tc("Recipes", "Positive", "Add Other / add new ingredient manually", "Modal blocks the background, saves the ingredient, and returns it to the ingredient selector.", "Ingredient dropdown > Other > Manual > complete nutrition > Save."),
  tc("Recipes", "Positive", "Add Other ingredient using scan", "Scan result can be reviewed and saved as an ingredient.", "Ingredient dropdown > Other > Scan > process label > review/save."),
  tc("Recipes", "Positive", "Save a complete recipe", "Recipe appears in My saved recipes and can be followed later.", "Complete recipe name, ingredients, servings, times, and method > Save recipe."),
  tc("Recipes", "Negative", "Save an incomplete recipe", "Missing name/ingredients/method validation is clear and no partial recipe is saved.", "Leave required recipe data empty > Save recipe."),
  tc("Recipes", "Negative", "Save a duplicate recipe", "Duplicate is prevented or marked Already in library.", "Save a recipe > attempt to save the same recipe again."),
  tc(
    "Recipes",
    "Negative",
    "Core user selects Add to library for a suggested recipe",
    "Upgrade dialog is centered and fully visible above sticky navigation.",
    "Use Core account > Recipes > select Add to library on a suggestion.",
    "Overlay appeared, but the upgrade dialog was hidden behind the page header/navigation.",
    "Fail",
  ),
  tc("Recipes", "Positive", "Filter suggested recipes by All, Vegan, Veg, and Non-veg", "Cards match the selected filter and profile preference.", "Select each recipe diet filter."),
  tc("Recipes", "Positive", "Open a saved recipe in My saved recipes", "Ingredients, quantities, timing, method, and nutrition are visible.", "Save a recipe > username menu > My saved recipes > open recipe."),
  tc("Recipes", "Data Integrity", "Saved recipes do not appear in the ingredient list", "Only ingredients/foods appear in ingredient selection.", "Save a recipe > open new recipe > inspect ingredient dropdown."),

  tc("Meal Templates", "Positive", "Create a template from multiple foods", "Template saves with all selected foods and quantities.", "Open Templates > create template > add foods > Save."),
  tc("Meal Templates", "Negative", "Save template without a name or items", "Validation blocks incomplete template.", "Leave name/items empty > Save template."),
  tc("Meal Templates", "Positive", "Log a saved template", "All template items are logged once to the selected meal/date.", "Open Templates > select template > Log."),
  tc("Meal Templates", "Data Integrity", "Template logging preserves quantities and macros", "Logged values match the saved template.", "Save distinctive quantities > log template > compare Today."),
  tc("Meal Templates", "Positive", "Edit a template", "Changes persist without duplicating the template.", "Open existing template > edit foods/quantities > Save."),
  tc("Meal Templates", "Positive", "Delete a template", "Template is removed and previous meal logs remain.", "Delete a saved template."),
  tc("Meal Templates", "Boundary", "Reach the Core template limit", "Allowed templates can be created up to the exact configured limit.", "Create templates until the Core limit is reached."),
  tc("Meal Templates", "Boundary", "Create one template beyond the Core limit", "Upgrade dialog appears and no extra template is saved.", "At the Core limit > create another template."),

  tc("Body Tracking", "Positive", "Log daily weight", "Weight is saved for the selected date and trend/BMI update.", "Tools > Body > Weight > enter valid weight/date > Save."),
  tc("Body Tracking", "Positive", "Edit weight logged for the same date", "Documented replace/update behavior occurs without duplicate daily points.", "Log weight for a date > log a different value for the same date."),
  tc("Body Tracking", "Boundary", "Log minimum and maximum allowed weight", "Boundary weights save and chart correctly.", "Enter documented minimum; repeat with maximum."),
  tc("Body Tracking", "Negative", "Log zero, negative, or non-numeric weight", "Validation blocks save and chart remains unchanged.", "Enter invalid weight > Save."),
  tc("Body Tracking", "Positive", "Log water intake", "Daily hydration total and progress update.", "Body > Water > enter valid amount > Save."),
  tc("Body Tracking", "Boundary", "Log very small and large water amounts", "Values follow allowed boundaries without overflow.", "Enter boundary hydration amounts."),
  tc("Body Tracking", "Positive", "Log daily steps", "Steps save for the selected date and summary updates.", "Body > Steps > enter valid steps > Save."),
  tc("Body Tracking", "Negative", "Log negative steps", "Validation blocks negative steps.", "Enter negative steps > Save."),
  tc("Body Tracking", "Positive", "View weight, water, and steps trends", "Charts match stored range data and dates.", "Create several dated logs > inspect charts."),
  tc("Body Tracking", "Edge", "View Body with no historical data", "Useful empty state appears and charts do not break.", "Open Body with a fresh account."),

  tc("Clinical Tracking", "Positive", "Log fasting glucose", "Value, context, date/time, and trend save correctly.", "Tools > Clinical > Glucose > enter valid fasting result > Save."),
  tc("Clinical Tracking", "Positive", "Log post-meal glucose", "Meal timing/context is preserved and chart updates.", "Log glucose with post-meal context."),
  tc("Clinical Tracking", "Boundary", "Log glucose at allowed minimum and maximum", "Boundary values save and display without clipping.", "Enter minimum; repeat with maximum."),
  tc("Clinical Tracking", "Negative", "Log zero, negative, or non-numeric glucose", "Validation prevents save.", "Enter invalid glucose > Save."),
  tc("Clinical Tracking", "Positive", "Log blood pressure and pulse", "Systolic, diastolic, pulse, date, and chart update.", "Clinical > Blood pressure > enter valid values > Save."),
  tc("Clinical Tracking", "Negative", "Log diastolic greater than or equal to systolic", "App warns or blocks physiologically invalid input.", "Enter systolic lower than/equal to diastolic > Save."),
  tc("Clinical Tracking", "Boundary", "Log BP/pulse at allowed boundaries", "Boundary values behave according to validation rules.", "Enter documented min/max systolic, diastolic, and pulse."),
  tc("Clinical Tracking", "Positive", "Log HbA1c", "Quarterly value and trend save correctly.", "Clinical > HbA1c > enter valid percentage/date > Save."),
  tc("Clinical Tracking", "Negative", "Log invalid HbA1c percentage", "Out-of-range/negative input is rejected.", "Enter invalid HbA1c > Save."),
  tc("Clinical Tracking", "Positive", "Log wellbeing or notes", "Entry persists for the selected date.", "Clinical > Wellbeing > enter allowed value/notes > Save."),
  tc("Clinical Tracking", "Data Integrity", "Clinical charts use only current user's records", "No other user's data appears.", "Compare two QA accounts with distinctive clinical logs."),
  tc("Clinical Tracking", "Edge", "Open Clinical with no data", "Empty states render without chart errors.", "Use fresh account > open Clinical."),

  tc("Medications", "Positive", "Create a medication", "Medication name, dose, schedule, and start information save.", "Tools > Medications > add valid medication details > Save."),
  tc("Medications", "Negative", "Save medication without required fields", "Validation blocks incomplete medication.", "Leave medication name/dose/schedule empty > Save."),
  tc("Medications", "Positive", "Mark medication taken for today", "Daily adherence and streak update once.", "Open medication > mark Taken."),
  tc("Medications", "Edge", "Mark the same medication taken twice", "Duplicate daily adherence is prevented.", "Mark Taken > repeat the same action."),
  tc("Medications", "Positive", "Undo or correct today's medication status", "Documented correction updates adherence consistently.", "Mark medication > use available correction action."),
  tc("Medications", "Positive", "Edit a medication", "Updated medication details persist.", "Open medication > Edit > Save."),
  tc("Medications", "Positive", "Delete a medication", "Medication is removed with clear handling of historical adherence.", "Delete medication > confirm."),
  tc("Medications", "Negative", "Core user opens medication logging", "Visible upgrade prompt appears without exposing paid data.", "Use Core account > Tools > Medications."),

  tc("Reports", "Positive", "Generate a weekly report for a selected week", "Report reflects exactly the selected week's meals and health logs.", "Open Reports > Weekly > choose a week."),
  tc("Reports", "Positive", "Generate a monthly report for a selected month", "Report reflects exactly the selected month and labels it monthly.", "Reports > Monthly > choose month."),
  tc("Reports", "Positive", "Generate a custom-date report", "Only records inside the inclusive date range are summarized.", "Reports > Custom > choose From and To dates."),
  tc("Reports", "Negative", "Choose a custom From date after To date", "Generate is blocked with date-range validation.", "Set From later than To > Generate."),
  tc("Reports", "Boundary", "Generate a one-day custom report", "The selected day is included once and totals are correct.", "Set From and To to the same date."),
  tc("Reports", "Edge", "Generate a report with no data", "Report shows a clear no-data state and no NaN/empty chart errors.", "Select a period with no logs."),
  tc("Reports", "Data Integrity", "Compare report totals with source logs", "Meal, glucose, weight, BP, hydration, medication, and adherence totals reconcile.", "Create known data > generate matching report > compare."),
  tc("Reports", "Positive", "Download doctor-ready PDF", "A readable PDF downloads with the selected period and current user data.", "Generate report > Download PDF > open file."),
  tc("Reports", "Positive", "Send test/weekly summary when email provider is configured", "Email is delivered to the profile email with correct report period.", "Enable Sunday summary > trigger configured send/test process."),
  tc("Reports", "Negative", "Send email without provider configuration", "Clear configuration error appears without losing the report.", "Remove/omit RESEND_API_KEY > attempt send."),
  tc("Reports", "Edge", "Switch from weekly to monthly mode", "All headings and email/report labels change to monthly; no stale weekly text remains.", "Select Weekly > switch to Monthly > inspect page."),
  tc("Reports", "Security", "Open export/report URL without authentication", "Request is rejected and no health data is returned.", "Sign out > call report/export endpoint directly."),

  tc("Mobile & Responsive UI", "Positive", "Use all main pages at 390x844", "No controls, headings, buttons, dialogs, or navigation overlap or clip.", "Set mobile viewport > inspect Today, Add Food, Coach, Reports, Tools, Profile, Goals."),
  tc("Mobile & Responsive UI", "Edge", "Rotate between portrait and landscape", "Layout reflows without losing entered form data.", "Begin entering data > rotate viewport > continue."),
  tc("Mobile & Responsive UI", "Positive", "Use touch targets for tabs, icons, and buttons", "Controls are consistently sized and easy to tap.", "Inspect/tap all primary and scan controls on mobile."),
  tc("Mobile & Responsive UI", "Edge", "Open on narrow 320px viewport", "Longest words and buttons remain inside their containers.", "Set viewport to 320px width > inspect critical pages."),
  tc("Browser Compatibility", "Positive", "Run core journey in Chrome/Chromium", "Registration, login, meal logging, goals, and reports work.", "Execute smoke journey in current Chrome/Chromium."),
  tc("Browser Compatibility", "Positive", "Run core journey in iPhone Safari", "Core journey works; camera/file controls use supported fallback.", "Execute smoke journey on iPhone Safari."),
  tc("Browser Compatibility", "Positive", "Run core journey in Android Chrome", "Core journey and responsive navigation work.", "Execute smoke journey on Android Chrome."),
  tc("PWA", "Positive", "Install app from browser", "Manifest, icons, name, start URL, theme, and standalone display are correct.", "Open install-capable browser > install VitaNudge > launch."),
  tc("PWA", "Edge", "Launch installed PWA while offline", "App shows documented offline behavior rather than a blank page.", "Install PWA > disconnect network > launch."),

  tc("Security & Data Protection", "Security", "Reject API request without token", "Protected endpoint returns 401 and no data.", "Call meals/goals/profile endpoint without Authorization."),
  tc("Security & Data Protection", "Security", "Reject malformed or expired token", "Request returns 401 without server crash.", "Call protected endpoint with malformed/expired JWT."),
  tc("Security & Data Protection", "Security", "Prevent cross-user record access", "A user cannot read, edit, or delete another user's records by ID.", "Create data in Account A > attempt access using Account B."),
  tc("Security & Data Protection", "Security", "Sanitize script content in names and notes", "Content is stored/rendered as text and no script executes.", "Enter HTML/script payload in allowed text fields > save/view."),
  tc("Security & Data Protection", "Security", "Verify password is never returned by API", "Auth/profile responses contain no password or hash.", "Inspect register, login, and /auth/me responses."),
  tc("Security & Data Protection", "Security", "Verify HTTPS and security headers", "Frontend/API use HTTPS and appropriate Helmet/security headers.", "Inspect production network responses."),
  tc("Security & Data Protection", "Boundary", "Trigger authentication/API rate limit", "Excess attempts receive controlled 429 responses and recover after window.", "Send repeated invalid login or scan requests to the configured limit."),
  tc("Integration & Recovery", "Integration", "Frontend changes persist after refresh and new session", "Saved profile, goals, foods, logs, and settings reload from API.", "Create data > refresh > log out/in > verify."),
  tc("Integration & Recovery", "Error Handling", "Backend is temporarily unavailable", "User sees a clear recoverable error; current form data is not unexpectedly lost.", "Stop/block API > perform save/load > restore API > retry."),
  tc("Integration & Recovery", "Error Handling", "Request times out or network disconnects during save", "App avoids duplicate saves and allows retry.", "Throttle/drop network during a create request > retry."),
  tc("Integration & Recovery", "Data Integrity", "Concurrent saves do not create unintended duplicates", "Idempotent/duplicate controls preserve one intended record.", "Submit the same save rapidly from two tabs."),
  tc("Performance", "Performance", "Measure initial production page load", "Critical UI becomes usable within the agreed launch target on normal mobile network.", "Cold-load production with cache disabled > record timings."),
  tc("Performance", "Performance", "Measure plate/label/AI response time", "Progress state appears immediately and response completes within agreed service target.", "Run repeated scans/estimates with representative images/foods."),
  tc("Performance", "Load", "Run concurrent authenticated users", "API stays available, data remains isolated, and error rate stays within target.", "Execute staged load test against QA/staging with 10, 25, 50+ virtual users."),
];

// Rebuild the TestCases sheet as a row-level, filterable regression matrix.
const testSheet = workbook.worksheets.getItem("testcases");
cleanSheet(testSheet, "A1:F400");
testSheet.getRange("A1:F1").merge();
testSheet.getRange("A1").values = [["VitaNudge Regression Test Cases"]];
testSheet.getRange("A1:F1").format = {
  fill: COLORS.greenDark,
  font: { bold: true, color: COLORS.white, size: 16 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
testSheet.getRange("A1:F1").format.rowHeight = 30;

const testHeaders = [["Functionality", "Test cases", "Actual result", "Expected result", "Status", "Flow"]];
testSheet.getRange("A2:F2").values = testHeaders;
testSheet.getRange("A2:F2").format = {
  fill: COLORS.blueLight,
  font: { bold: true, color: COLORS.navy },
  borders: { preset: "all", style: "thin", color: COLORS.border },
  verticalAlignment: "center",
};
testSheet.getRange("A2:F2").format.rowHeight = 28;

const testEndRow = testCases.length + 2;
testSheet.getRange(`A3:F${testEndRow}`).values = testCases;
testSheet.getRange(`A3:F${testEndRow}`).format = {
  fill: COLORS.body,
  font: { color: "#1F2922", size: 10 },
  borders: { preset: "all", style: "thin", color: "#D9E2DB" },
  verticalAlignment: "top",
  wrapText: true,
};
testSheet.getRange(`A3:A${testEndRow}`).format.font = { bold: true, color: COLORS.greenDark, size: 10 };
testSheet.getRange(`E3:E${testEndRow}`).format.horizontalAlignment = "center";
testSheet.getRange(`A3:F${testEndRow}`).format.rowHeight = 52;
testSheet.getRange("A:A").format.columnWidthPx = 155;
testSheet.getRange("B:B").format.columnWidthPx = 330;
testSheet.getRange("C:C").format.columnWidthPx = 285;
testSheet.getRange("D:D").format.columnWidthPx = 310;
testSheet.getRange("E:E").format.columnWidthPx = 105;
testSheet.getRange("F:F").format.columnWidthPx = 360;
testSheet.freezePanes.freezeRows(2);
testSheet.getRange(`E3:E${testEndRow}`).dataValidation = {
  rule: { type: "list", values: ["Pass", "Fail", "Not Tested", "Blocked", "Needs Change"] },
};
const testTable = testSheet.tables.add(`A2:F${testEndRow}`, true, "VitaNudgeRegressionTests");
testTable.style = "TableStyleMedium2";
testTable.showBandedRows = true;
testTable.showFilterButton = true;
testSheet.getRange(`E3:E${testEndRow}`).conditionalFormats.add("containsText", {
  text: "Pass",
  format: { fill: COLORS.greenLight, font: { bold: true, color: COLORS.greenDark } },
});
testSheet.getRange(`E3:E${testEndRow}`).conditionalFormats.add("containsText", {
  text: "Fail",
  format: { fill: COLORS.redLight, font: { bold: true, color: COLORS.red } },
});
testSheet.getRange(`E3:E${testEndRow}`).conditionalFormats.add("containsText", {
  text: "Not Tested",
  format: { fill: COLORS.grayLight, font: { color: COLORS.gray } },
});
testSheet.getRange(`E3:E${testEndRow}`).conditionalFormats.add("containsText", {
  text: "Blocked",
  format: { fill: COLORS.amberLight, font: { bold: true, color: COLORS.amber } },
});

// Add a dated bug verification sheet without removing the user's original issues tab.
const bugSheetName = "11-Jun-2026";
const bugSheet = workbook.worksheets.add(bugSheetName);
bugSheet.showGridLines = false;
bugSheet.getRange("A1:J1").merge();
bugSheet.getRange("A1").values = [["VitaNudge Bug Verification - 11 Jun 2026"]];
bugSheet.getRange("A1:J1").format = {
  fill: COLORS.greenDark,
  font: { bold: true, color: COLORS.white, size: 16 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
bugSheet.getRange("A1:J1").format.rowHeight = 30;
bugSheet.getRange("A2:J2").merge();
bugSheet.getRange("A2").values = [[
  "Environment: Production Render | Frontend: https://vitanudge.onrender.com | API: https://vitanudge-api.onrender.com | No application files changed during this verification."
]];
bugSheet.getRange("A2:J2").format = {
  fill: COLORS.greenLight,
  font: { italic: true, color: COLORS.greenDark, size: 10 },
  wrapText: true,
  verticalAlignment: "center",
};
bugSheet.getRange("A2:J2").format.rowHeight = 32;

const bugHeaders = [[
  "Bug ID", "Module", "Issue / Test", "Steps to reproduce", "Expected result",
  "Actual result", "QA result", "Bug status", "Severity", "Recommendation"
]];
bugSheet.getRange("A4:J4").values = bugHeaders;
bugSheet.getRange("A4:J4").format = {
  fill: COLORS.blueLight,
  font: { bold: true, color: COLORS.navy },
  borders: { preset: "all", style: "thin", color: COLORS.border },
  verticalAlignment: "center",
  wrapText: true,
};
bugSheet.getRange("A4:J4").format.rowHeight = 34;

const bugs = [
  [
    "BUG-001", "Today / Profile",
    "Profile-completion notification is not visible after adding the first food.",
    "Use an incomplete profile > Today > add the first food.",
    "A centered profile reminder should appear above all page content.",
    "The overlay opens, but sticky header/summary layers cover the dialog.",
    "Fail", "Open", "High",
    "Raise the modal overlay above every sticky/header layer and verify desktop/mobile.",
  ],
  [
    "BUG-002", "Goals",
    "User could not find the edit-goal functionality.",
    "Complete profile > create and save a recommended goal > return to Goals.",
    "A clear edit action should open saved targets for modification.",
    "Modify goal is visible and opens editable target fields.",
    "Pass", "Verified", "N/A",
    "No correction required; retain Modify goal regression coverage.",
  ],
  [
    "BUG-003", "Today / Copy Yesterday",
    "Copied foods need a selectable destination meal instead of always using the source meal.",
    "Create a Dinner item yesterday > Today > Copy yesterday > review the item.",
    "Each copied item should allow Breakfast, Lunch, Dinner, or Snack destination.",
    "Destination dropdown provided all four meals and accepted a changed destination.",
    "Pass", "Verified", "N/A",
    "No correction required; retain per-item destination regression test.",
  ],
  [
    "BUG-004", "Today / Coach",
    "Coach action and selected recommendation question should transfer from Today.",
    "Create a macro gap > select Find options/Ask coach on Today.",
    "Coach should open with the relevant question prefilled.",
    "Coach opened and the protein-gap question was prefilled automatically.",
    "Pass", "Verified", "N/A",
    "No correction required; keep testing each recommendation type.",
  ],
  [
    "BUG-005", "Add Food / Barcode",
    "Barcode result has no Edit values action, and duplicate save shows success plus duplicate messages.",
    "Look up 3017620422003 > inspect actions > save > look up and save it again.",
    "User can edit before save; duplicate attempt shows only the duplicate message.",
    "Only Save to library was available; duplicate attempt showed both Saved to library! and already-in-library messages.",
    "Fail", "Open", "High",
    "Add Edit values and clear all stale success/error messages before lookup/save.",
  ],
  [
    "BUG-006", "Add Food / Label",
    "Label scan result has no Edit values action and can show conflicting validation/success states.",
    "Scan a nutrition label > inspect extracted result > save valid/invalid results sequentially.",
    "Extracted values are editable; only the current operation message is visible.",
    "Only Save to library was available; conflicting Saved to library and Food name is required states remain possible.",
    "Fail", "Open", "High",
    "Add reviewed edit flow and reset message state before every scan and save.",
  ],
  [
    "BUG-007", "Food Library",
    "Library Add food previously opened Plate Scan.",
    "Open Tools > Food Library > select + Add food.",
    "The Add Food workspace should open.",
    "The app opened /add-food.",
    "Pass", "Verified", "N/A",
    "No correction required; keep route test.",
  ],
  [
    "BUG-008", "Recipes / Subscription",
    "Upgrade to Pro dialog is hidden below page chrome.",
    "Use Core account > Recipes > select Add to library on a suggested recipe.",
    "Upgrade dialog should be centered and fully visible immediately.",
    "Dark overlay appeared, but the dialog was covered by header/navigation layers.",
    "Fail", "Open", "High",
    "Use the same modal-layering correction as BUG-001 and remove scroll-to-top dependency.",
  ],
  [
    "BUG-009", "Login / Registration",
    "First-time user needs visible account-creation access after an unsuccessful login.",
    "On mobile Login, submit an unknown email/password and inspect the bottom action.",
    "Privacy-safe error appears and Create free account remains visible and tappable.",
    "Generic incorrect email/password message and Create free account were visible.",
    "Pass", "Verified", "N/A",
    "Keep the generic message to avoid account enumeration.",
  ],
  [
    "BUG-010", "Goals / Onboarding",
    "Incomplete-profile Goals flow disables Next but provides no direct Profile action.",
    "Create account without age/weight/height > open Goals > move to Stats.",
    "Next is disabled and a clear Complete profile button opens Profile.",
    "Next was disabled, but text referenced a form below that was not present and no Profile action was provided.",
    "Fail", "Open", "Medium",
    "Replace the incorrect form instruction with a visible Complete profile button.",
  ],
];

bugSheet.getRange(`A5:J${bugs.length + 4}`).values = bugs;
bugSheet.getRange(`A5:J${bugs.length + 4}`).format = {
  fill: COLORS.body,
  font: { color: "#1F2922", size: 10 },
  borders: { preset: "all", style: "thin", color: "#D9E2DB" },
  verticalAlignment: "top",
  wrapText: true,
};
bugSheet.getRange(`A5:J${bugs.length + 4}`).format.rowHeight = 78;
bugSheet.getRange(`A5:A${bugs.length + 4}`).format.font = { bold: true, color: COLORS.greenDark };
bugSheet.getRange(`G5:I${bugs.length + 4}`).format.horizontalAlignment = "center";
bugSheet.getRange("A:A").format.columnWidthPx = 80;
bugSheet.getRange("B:B").format.columnWidthPx = 150;
bugSheet.getRange("C:C").format.columnWidthPx = 310;
bugSheet.getRange("D:D").format.columnWidthPx = 300;
bugSheet.getRange("E:E").format.columnWidthPx = 300;
bugSheet.getRange("F:F").format.columnWidthPx = 330;
bugSheet.getRange("G:G").format.columnWidthPx = 90;
bugSheet.getRange("H:H").format.columnWidthPx = 100;
bugSheet.getRange("I:I").format.columnWidthPx = 90;
bugSheet.getRange("J:J").format.columnWidthPx = 300;
bugSheet.freezePanes.freezeRows(4);
bugSheet.getRange(`G5:G${bugs.length + 4}`).dataValidation = {
  rule: { type: "list", values: ["Pass", "Fail", "Blocked", "Not Tested"] },
};
bugSheet.getRange(`H5:H${bugs.length + 4}`).dataValidation = {
  rule: { type: "list", values: ["Open", "Verified", "Fixed - Retest", "Closed", "Deferred"] },
};
const bugTable = bugSheet.tables.add(`A4:J${bugs.length + 4}`, true, "BugVerification_20260611");
bugTable.style = "TableStyleMedium2";
bugTable.showBandedRows = true;
bugTable.showFilterButton = true;
for (const address of [`G5:G${bugs.length + 4}`, `H5:H${bugs.length + 4}`]) {
  const range = bugSheet.getRange(address);
  range.conditionalFormats.add("containsText", {
    text: "Pass",
    format: { fill: COLORS.greenLight, font: { bold: true, color: COLORS.greenDark } },
  });
  range.conditionalFormats.add("containsText", {
    text: "Verified",
    format: { fill: COLORS.greenLight, font: { bold: true, color: COLORS.greenDark } },
  });
  range.conditionalFormats.add("containsText", {
    text: "Fail",
    format: { fill: COLORS.redLight, font: { bold: true, color: COLORS.red } },
  });
  range.conditionalFormats.add("containsText", {
    text: "Open",
    format: { fill: COLORS.redLight, font: { bold: true, color: COLORS.red } },
  });
}

// Lightly clean the original issues tab without changing its content.
const legacyIssues = workbook.worksheets.getItem("issues");
legacyIssues.showGridLines = false;
legacyIssues.getRange("A1:B20").format.wrapText = true;
legacyIssues.getRange("A:A").format.columnWidthPx = 900;
legacyIssues.getRange("B:B").format.columnWidthPx = 170;

const testInspect = await workbook.inspect({
  kind: "table",
  range: `testcases!A1:F18`,
  include: "values,formulas",
  tableMaxRows: 18,
  tableMaxCols: 6,
  maxChars: 12000,
});
console.log(testInspect.ndjson);

const bugInspect = await workbook.inspect({
  kind: "table",
  range: `${bugSheetName}!A1:J14`,
  include: "values,formulas",
  tableMaxRows: 14,
  tableMaxCols: 10,
  maxChars: 16000,
});
console.log(bugInspect.ndjson);

const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(formulaErrors.ndjson);

const previews = [
  ["issues", "A1:B20", "issues-after.png"],
  ["testcases", "A1:F32", "testcases-after-top.png"],
  ["testcases", `A${Math.max(3, testEndRow - 24)}:F${testEndRow}`, "testcases-after-bottom.png"],
  [bugSheetName, "A1:J14", "bugs-after.png"],
];
for (const [sheetName, range, fileName] of previews) {
  const preview = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(path.join(workDir, fileName), new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(JSON.stringify({ outputPath, testCaseCount: testCases.length, bugCount: bugs.length, sheets: 3 }));
