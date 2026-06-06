import fs from 'node:fs/promises';
import path from 'node:path';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const root = '/Users/uditgupta/Documents/Nutrient project/nutritrack';
const outputDir = path.join(root, 'outputs/production-qa');
const outputPath = path.join(outputDir, 'VitaNudge_Production_QA_Report.xlsx');
const today = '2026-06-03';

function inferModule(text) {
  const t = text.toLowerCase();
  if (t.includes('auth') || t.includes('login') || t.includes('register')) return 'Auth & Onboarding';
  if (t.includes('profile') || t.includes('timezone') || t.includes('country')) return 'Profile';
  if (t.includes('goal')) return 'Goals';
  if (t.includes('meal template') || t.includes('template')) return 'Meal Templates';
  if (t.includes('recipe')) return 'Recipes';
  if (t.includes('food library') || t.includes('food list') || t.includes('food name') || t.includes('estimate')) return 'Food Library';
  if (t.includes('meal') || t.includes('copy yesterday') || t.includes('qty')) return 'Today / Meal Logs';
  if (t.includes('water') || t.includes('hydration')) return 'Body / Hydration';
  if (t.includes('weight') || t.includes('bmi')) return 'Body / Weight';
  if (t.includes('glucose') || t.includes('hba1c')) return 'Clinical / Glucose';
  if (t.includes('bp') || t.includes('blood pressure') || t.includes('vitals')) return 'Clinical / Vitals';
  if (t.includes('medication')) return 'Medications';
  if (t.includes('report') || t.includes('email')) return 'Reports';
  if (t.includes('coach')) return 'AI Coach';
  if (t.includes('barcode')) return 'Barcode';
  if (t.includes('scan') || t.includes('plate') || t.includes('label')) return 'Scan';
  if (t.includes('billing') || t.includes('stripe') || t.includes('subscription')) return 'Billing';
  if (t.includes('pwa') || t.includes('manifest') || t.includes('service worker')) return 'PWA';
  if (t.includes('build') || t.includes('bundle')) return 'Build';
  if (t.includes('workflow')) return 'End-to-end Workflow';
  if (t.includes('bug regression')) return 'Bug Regression';
  return 'General';
}

function inferType(text) {
  const t = text.toLowerCase();
  if (t.includes('positive')) return 'Positive';
  if (t.includes('negative')) return 'Negative';
  if (t.includes('boundary')) return 'Boundary';
  if (t.includes('edge')) return 'Edge';
  if (t.includes('bug regression') || t.includes('regression')) return 'Regression';
  if (t.includes('workflow')) return 'End-to-end';
  if (t.includes('build')) return 'Build';
  if (t.includes('ui')) return 'UI Smoke';
  if (t.includes('integration')) return 'Integration';
  if (t.includes('manual')) return 'Manual';
  return 'Functional';
}

function parseSubtests(file, suite, evidence) {
  const text = fsSyncRead(file);
  const rows = [];
  let current = '';
  for (const line of text.split(/\r?\n/)) {
    const top = line.match(/^test\('([^']+)'/);
    if (top) {
      current = top[1];
      if (!line.includes('async t')) {
        rows.push(makeRow(suite, current, current, evidence));
      }
      continue;
    }
    const sub = line.match(/await t\.test\('([^']+)'/);
    if (sub) rows.push(makeRow(suite, current, sub[1], evidence));
  }
  return rows;
}

function fsSyncRead(file) {
  return globalThis.__fsCache?.[file] || '';
}

function makeRow(suite, parent, scenario, evidence) {
  const full = `${parent} ${scenario}`;
  return {
    module: inferModule(full),
    area: suite,
    type: inferType(full),
    scenario,
    expected: 'Expected response/status/data is returned, validation is enforced, and no server crash occurs.',
    actual: 'Passed in automated run.',
    status: 'PASS',
    notes: evidence,
  };
}

const fsCache = {};
for (const rel of [
  'backend/tests/actual_comprehensive.test.js',
  'backend/tests/regression.test.js',
  'backend/tests/goal-scenarios.test.js',
  'frontend/tests/goalRecommendation.test.mjs',
]) {
  fsCache[path.join(root, rel)] = await fs.readFile(path.join(root, rel), 'utf8');
}
globalThis.__fsCache = fsCache;

const rows = [];
function add(module, area, type, scenario, expected, actual, status = 'PASS', notes = '') {
  rows.push({ module, area, type, scenario, expected, actual, status, notes });
}

add('Build', 'Frontend', 'Build', 'Production Vite build', 'Build completes without compilation errors.', 'PASS. Build completed after latest Scan copy fix.', 'PASS', 'npm --prefix frontend run test:build');
add('Build', 'Frontend', 'Performance', 'Production bundle size', 'No oversized production chunk or acceptable documented reason.', 'Build passed but emitted large chunk warning; largest JS asset is 8.3 MB.', 'WARNING', 'Code splitting/manualChunks recommended before public launch.');
add('PWA', 'Manifest', 'PWA', 'Manifest is present with app name, tagline, standalone display, theme color', 'Manifest exists and includes VitaNudge description/tagline.', 'PASS. manifest.webmanifest present in public and dist.', 'PASS', 'frontend/public/manifest.webmanifest');
add('PWA', 'Service worker', 'PWA', 'Service worker registration is production-only', 'Service worker registers in production and unregisters during dev.', 'PASS. main.jsx gates registration on import.meta.env.PROD.', 'PASS', 'frontend/src/main.jsx');
add('PWA', 'Icons', 'PWA', 'Install icons for mobile app stores/home screen', 'Manifest should include PNG icons such as 192x192 and 512x512 maskable.', 'Only SVG icon is present.', 'WARNING', 'Needed for stronger Android/iOS install polish.');

rows.push(...parseSubtests(path.join(root, 'backend/tests/actual_comprehensive.test.js'), 'Backend comprehensive API', 'node --test tests/actual_comprehensive.test.js: 156/156 passed'));
rows.push(...parseSubtests(path.join(root, 'backend/tests/regression.test.js'), 'Backend regression API', 'npm --prefix backend run test:regression: 15/15 passed'));
rows.push(...parseSubtests(path.join(root, 'frontend/tests/goalRecommendation.test.mjs'), 'Frontend goal logic', 'npm --prefix frontend run test:goals: 5/5 passed'));

for (const name of ['glucose control', 'fat loss', 'muscle gain', 'weight gain']) {
  add('Goals', 'Backend goal scenarios', 'Functional', `Goal setup persists scenario: ${name}`, 'Saved quantitative target is persisted and can be read back.', 'PASS. Scenario passed in backend goal suite.', 'PASS', 'npm --prefix backend run test:goals');
}
add('Goals', 'Backend goal scenarios', 'Functional', 'Goal tracker source data includes latest weight range and saved targets', 'Weight range and saved goals are reflected in health report/tracker source data.', 'PASS.', 'PASS', 'npm --prefix backend run test:goals');
add('Today / Meal Logs', 'Bug regression', 'Regression', 'Valid meal types breakfast/lunch/dinner/snack are accepted; invalid meal types are rejected', 'Invalid values return 400 and valid values return 201.', 'PASS.', 'PASS', 'backend/tests/actual_comprehensive.test.js dynamic meal_type loop');

const uiRoutes = [
  ['Auth & Onboarding', 'Login page renders premium desktop UI', 'Login page visible with product overview, email/password fields, CTA, and preview link.', 'PASS. Screenshot saved.'],
  ['Auth & Onboarding', 'Register page creates QA user and redirects to goal setup', 'Registration form accepts valid input and sends new user to onboarding.', 'PASS. Redirected to /goals?setup=1.'],
  ['Today / Dashboard', 'Today dashboard route renders', 'Dashboard, summary cards, suggested next step, and nav are visible.', 'PASS. Screenshot saved.'],
  ['Add Food', 'Add Food route renders all tabs', 'Barcode, Label, AI estimate, and Manual add tabs render.', 'PASS.'],
  ['Scan', 'Plate scan route renders review-first copy and controls', 'Scan page shows choose/take photo controls and review-before-save copy.', 'PASS. Copy corrected during QA.'],
  ['AI Coach', 'Coach route renders', 'Ask coach interface is visible.', 'PASS.'],
  ['Reports', 'Reports route renders weekly report controls and summary', 'Weekly/monthly/custom report selector and report output render.', 'PASS. Screenshot saved.'],
  ['Body / Weight', 'Body route renders weight/hydration/steps tabs', 'Body page renders and can switch habit areas.', 'PASS.'],
  ['Clinical / Vitals', 'Clinical route renders glucose, BP, HbA1c areas', 'Clinical page loads with expected modules.', 'PASS.'],
  ['Medications', 'Medications route renders', 'Medication tracker loads.', 'PASS.'],
  ['Food Library', 'Food Library route renders', 'Food search/library management loads.', 'PASS.'],
  ['Recipes', 'Recipes route renders', 'Recipe calculator/suggestions load.', 'PASS.'],
  ['Meal Templates', 'Templates route renders', 'Meal template page loads.', 'PASS.'],
  ['Recipes', 'My saved recipes route renders', 'Saved recipe library loads empty state/search/create button.', 'PASS.'],
  ['Profile', 'Profile route renders with disabled login email and weekly summary checkbox', 'Profile fields, disabled email, location dropdowns, and email preference render.', 'PASS. Country list loads after async location library.'],
  ['Goals', 'Goals route renders', 'Goal setup/tracker page loads.', 'PASS.'],
  ['Barcode', '/barcode legacy route redirects to Add Food barcode tab', 'Old barcode URL should land on active Add Food flow.', 'PASS. /barcode redirected to /add-food.'],
  ['Navigation', 'Tools drawer opens and lists tool links', 'Tools contains Body/Clinical/Meds/Food Library/Recipes/Templates.', 'PASS.'],
  ['Navigation', 'Profile menu opens and lists Profile, Goals, My saved recipes, Logout', 'Username menu exposes account destinations.', 'PASS.'],
];
for (const [module, scenario, expected, actual] of uiRoutes) {
  add(module, 'Browser UI smoke', 'UI Smoke', scenario, expected, actual, 'PASS', 'Browser smoke run on http://127.0.0.1:3000');
}

add('Barcode', 'External integration', 'Integration', 'Open Food Facts lookup for barcode 3017620422003', 'Lookup returns product and nutrition data.', 'PASS. Returned Nutella, 539 calories.', 'PASS', 'One-off live integration check');
add('AI Estimate', 'External integration', 'Integration', 'AI nutrition estimate uses Gemini when configured', 'Endpoint returns estimated food with Gemini provider.', 'PASS. provider=gemini, confidence=high, grilled chicken breast 165 kcal.', 'PASS', 'One-off live integration check');
add('AI Coach', 'External integration', 'Integration', 'AI coach uses Gemini when configured', 'Coach answers health/nutrition question with provider=gemini.', 'PASS. Gemini answer returned.', 'PASS', 'One-off live integration check');
add('Scan', 'External integration', 'Integration', 'Scan provider info confirms Gemini image provider', 'Scan info returns active provider and key status.', 'PASS. active_provider=gemini, gemini_key_set=true.', 'PASS', '/api/scan/info');
add('Scan', 'Image scan manual', 'Manual', 'Nutrition label scan with real label image', 'Upload/take a label photo, extract values, edit, save to library, duplicate blocked.', 'Not run in this pass because no real label image was provided.', 'NOT RUN', 'Manual production check needed with 2-3 real labels.');
add('Scan', 'Image scan manual', 'Manual', 'Plate scan with real meal image', 'Upload/take a plate photo, identify foods, edit quantities/names, save reviewed items.', 'Not run in this pass because no real plate image was provided.', 'NOT RUN', 'Manual production check needed with breakfast/lunch/dinner examples.');
add('Reports', 'Email', 'Functional', 'Weekly email preferences save under Profile', 'Checkbox preference saves user email for Sunday summary.', 'PASS via backend regression and Profile UI smoke.', 'PASS', 'Live email send intentionally not triggered.');
add('Reports', 'Email', 'Manual', 'Live Resend email delivery', 'A verified recipient receives a Sunday summary/test summary.', 'Not run to avoid sending an unsolicited email.', 'NOT RUN', 'RESEND_API_KEY is configured locally; perform deliberate send test before launch.');
add('Billing', 'Stripe', 'Configuration', 'Billing status/free usage display', 'Free plan and scan/barcode usage are visible.', 'PASS in Profile UI smoke.', 'PASS', 'Profile shows Free Plan and scan/barcode usage.');
add('Billing', 'Stripe', 'Configuration', 'Stripe checkout and webhook', 'Stripe keys, price IDs, and webhook secret configured; checkout can create session; webhook updates tier.', 'Stripe env vars are not configured locally.', 'WARNING', 'Required before paid monetization launch.');
add('Deployment', 'Hosting', 'Manual', 'Frontend deployed on HTTPS', 'Netlify or equivalent production URL serves current build over HTTPS.', 'Not run locally.', 'NOT RUN', 'Required for production.');
add('Deployment', 'Hosting', 'Manual', 'Backend deployed on HTTPS with production env', 'Backend API deployed with JWT_SECRET, FRONTEND_URL, GEMINI, RESEND, database, and CORS.', 'Not run locally.', 'NOT RUN', 'Required for production.');
add('Deployment', 'Database', 'Manual', 'Production database migration/seed', 'Production DB initializes schema and seed foods once.', 'Not run against production DB.', 'NOT RUN', 'SQLite local passed; hosted DB plan still needs final decision.');
add('Mobile', 'Compatibility', 'Manual', 'iPhone Safari mobile web smoke', 'Login, register, Today, Add Food, Scan, Profile, Reports usable on iPhone Safari.', 'Not run in this desktop pass.', 'NOT RUN', 'Required before App Store/PWA promotion.');
add('Mobile', 'Compatibility', 'Manual', 'Android Chrome mobile web smoke', 'Same core flows usable on Android Chrome.', 'Not run in this desktop pass.', 'NOT RUN', 'Required before public launch.');
add('Legal', 'Compliance', 'Manual', 'Privacy policy, terms, and medical disclaimer', 'Legal pages are published and linked before collecting health data.', 'Not verified in current app routes.', 'WARNING', 'Required before production launch.');
add('Security', 'Production env', 'Configuration', 'JWT secret configured', 'Production must not use insecure default JWT secret.', 'PASS locally: JWT_SECRET exists.', 'PASS', 'Also set in hosted backend env.');
add('Security', 'CORS', 'Configuration', 'Production FRONTEND_URL configured', 'Backend CORS origin must match hosted frontend URL.', 'Local FRONTEND_URL is http://localhost:3000.', 'WARNING', 'Update when deploying.');

const headers = ['Test ID', 'Module', 'Area', 'Type', 'Scenario / Steps', 'Expected Result', 'Actual Result', 'Status', 'Evidence / Notes'];
const statusOrder = ['PASS', 'WARNING', 'NOT RUN', 'NEEDS MANUAL', 'BLOCKED', 'FAIL'];
const matrix = rows.map((r, i) => [
  `QA-${String(i + 1).padStart(3, '0')}`,
  r.module,
  r.area,
  r.type,
  r.scenario,
  r.expected,
  r.actual,
  r.status,
  r.notes,
]);

const workbook = Workbook.create();
const summary = workbook.worksheets.add('Summary');
const matrixSheet = workbook.worksheets.add('Scenario Matrix');
const gapsSheet = workbook.worksheets.add('Launch Gaps');
for (const sheet of [summary, matrixSheet, gapsSheet]) sheet.showGridLines = false;

summary.getRange('A1:H1').merge();
summary.getRange('A1').values = [['VitaNudge Production QA Summary']];
summary.getRange('A2:H2').merge();
summary.getRange('A2').values = [[`QA pass date: ${today} | Local desktop + API automation | Production deployment not yet executed`]];
summary.getRange('A1:H2').format = { fill: '#0F3D2E', font: { color: '#FFFFFF', bold: true }, wrapText: true };

summary.getRange('A4:B10').values = [
  ['Metric', 'Result'],
  ['Automated backend comprehensive', '156/156 PASS'],
  ['Backend regression suite', '15/15 PASS'],
  ['Backend goal scenario suite', '6/6 PASS'],
  ['Frontend goal logic', '5/5 PASS'],
  ['Frontend production build', 'PASS with bundle-size warning'],
  ['Browser UI smoke', 'PASS on core desktop routes'],
];
summary.getRange('D4:E10').values = [
  ['Status', 'Count'],
  ['PASS', null],
  ['WARNING', null],
  ['NOT RUN', null],
  ['NEEDS MANUAL', null],
  ['BLOCKED', null],
  ['FAIL', null],
];
summary.getRange('E5:E10').formulas = statusOrder.map(status => [`=COUNTIF('Scenario Matrix'!H2:H500,"${status}")`]);
summary.getRange('A4:B4').format = summary.getRange('D4:E4').format = { fill: '#E8F3EA', font: { bold: true, color: '#123B2A' } };
summary.getRange('A12:H17').values = [
  ['Top Launch Notes', '', '', '', '', '', '', ''],
  ['1', 'Core backend workflows passed broad positive/negative/edge/boundary coverage.', '', '', '', '', '', ''],
  ['2', 'Desktop UI smoke passed after fixing stale Scan page copy.', '', '', '', '', '', ''],
  ['3', 'Barcode, AI estimate, and AI coach live integrations passed.', '', '', '', '', '', ''],
  ['4', 'Before monetized launch: configure Stripe, production hosting/CORS, legal pages, mobile checks, and real image scan checks.', '', '', '', '', '', ''],
  ['5', 'Build should be code-split before scale because one JS asset is 8.3 MB.', '', '', '', '', '', ''],
];
summary.getRange('A12:H12').merge();
summary.getRange('A12').format = { fill: '#CFE8D3', font: { bold: true, color: '#123B2A' } };
summary.getRange('B13:H17').merge(true);
summary.getRange('A1:H17').format.wrapText = true;

matrixSheet.getRangeByIndexes(0, 0, 1, headers.length).values = [headers];
matrixSheet.getRangeByIndexes(1, 0, matrix.length, headers.length).values = matrix;
matrixSheet.getRangeByIndexes(0, 0, 1, headers.length).format = { fill: '#0F3D2E', font: { color: '#FFFFFF', bold: true }, wrapText: true };
matrixSheet.getRangeByIndexes(1, 7, matrix.length, 1).conditionalFormats.add('containsText', { text: 'PASS', format: { fill: '#DCFCE7', font: { color: '#166534', bold: true } } });
matrixSheet.getRangeByIndexes(1, 7, matrix.length, 1).conditionalFormats.add('containsText', { text: 'WARNING', format: { fill: '#FEF3C7', font: { color: '#92400E', bold: true } } });
matrixSheet.getRangeByIndexes(1, 7, matrix.length, 1).conditionalFormats.add('containsText', { text: 'NOT RUN', format: { fill: '#E0E7FF', font: { color: '#3730A3', bold: true } } });
matrixSheet.freezePanes.freezeRows(1);
matrixSheet.getRange('A:I').format.wrapText = true;

const launchGaps = rows
  .filter(r => r.status !== 'PASS')
  .map((r, i) => [i + 1, r.status, r.module, r.scenario, r.actual, r.notes]);
gapsSheet.getRange('A1:F1').values = [['#', 'Status', 'Module', 'Gap / Scenario', 'Current Result', 'Next Action']];
gapsSheet.getRangeByIndexes(1, 0, launchGaps.length, 6).values = launchGaps;
gapsSheet.getRange('A1:F1').format = { fill: '#7C2D12', font: { color: '#FFFFFF', bold: true }, wrapText: true };
gapsSheet.freezePanes.freezeRows(1);
gapsSheet.getRange('A:F').format.wrapText = true;

function setColumnWidths(sheet, widths, rowCount = 300) {
  widths.forEach((width, idx) => {
    try { sheet.getRangeByIndexes(0, idx, rowCount, 1).format.columnWidthPx = width; } catch {}
  });
}

setColumnWidths(summary, [300, 220, 40, 140, 150, 30, 30, 30], 40);
setColumnWidths(matrixSheet, [78, 150, 170, 110, 320, 320, 300, 105, 330], matrix.length + 5);
setColumnWidths(gapsSheet, [60, 115, 160, 400, 380, 430], launchGaps.length + 5);
summary.getRange('A1:H17').format.rowHeightPx = 24;
summary.getRange('A5:B10').format.rowHeightPx = 34;
summary.getRange('A13:H17').format.rowHeightPx = 32;
gapsSheet.getRangeByIndexes(1, 0, launchGaps.length, 6).format.rowHeightPx = 48;

await fs.mkdir(outputDir, { recursive: true });
for (const sheetName of ['Summary', 'Scenario Matrix', 'Launch Gaps']) {
  const preview = await workbook.render({ sheetName, autoCrop: 'all', scale: 1, format: 'png' });
  await fs.writeFile(path.join(outputDir, `qa-${sheetName.toLowerCase().replace(/\s+/g, '-')}-preview.png`), new Uint8Array(await preview.arrayBuffer()));
}
const errors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 50 },
});
if (errors.ndjson && errors.ndjson.includes('#')) {
  console.log(errors.ndjson);
}
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(JSON.stringify({ outputPath, rows: rows.length, gaps: launchGaps.length }));
