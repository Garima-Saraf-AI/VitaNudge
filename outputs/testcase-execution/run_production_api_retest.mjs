const FRONTEND = "https://vitanudge.onrender.com";
const API = "https://vitanudge-api.onrender.com/api";
const stamp = Date.now();
const password = "Retest2026!";
const results = [];

function record(id, passed, actual, details = {}) {
  results.push({ id, passed, actual, ...details });
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body, headers: Object.fromEntries(response.headers) };
}

async function register(name, email) {
  return request("/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
}

async function login(email, suppliedPassword = password) {
  return request("/auth/login", {
    method: "POST",
    body: { email, password: suppliedPassword },
  });
}

const emailA = `qa-api-a-${stamp}@example.com`;
const emailB = `qa-api-b-${stamp}@example.com`;
const accountA = await register("QA Api Alpha", emailA);
const accountB = await register("QA Api Beta", emailB);
if (accountA.status !== 201 || accountB.status !== 201) {
  throw new Error(`Could not create disposable QA accounts: ${accountA.status}/${accountB.status}`);
}
const tokenA = accountA.body.token;
const tokenB = accountB.body.token;

try {
  const emptyLogin = await request("/auth/login", { method: "POST", body: { email: "", password: "" } });
  record(7, emptyLogin.status === 400, `API returned ${emptyLogin.status}: ${emptyLogin.body.error}`);

  const invalidEmail = await register("QA Invalid", "not-an-email");
  record(8, invalidEmail.status === 400, `API returned ${invalidEmail.status}: ${invalidEmail.body.error}`);

  const duplicate = await register("QA Duplicate", emailA);
  record(11, duplicate.status === 409, `Duplicate registration returned ${duplicate.status}: ${duplicate.body.error}`);

  const uppercaseLogin = await login(emailA.toUpperCase());
  const spacedLogin = await login(`  ${emailA.toUpperCase()}  `);
  record(
    12,
    uppercaseLogin.status === 200 && spacedLogin.status === 200,
    `Uppercase login returned ${uppercaseLogin.status}; leading/trailing-space login returned ${spacedLogin.status}.`
  );

  const longName = "A".repeat(100);
  const longEmail = `${"q".repeat(180)}-${stamp}@example.com`;
  const longRegistration = await register(longName, longEmail);
  record(
    13,
    longRegistration.status === 201,
    `100-character name and 200+ character valid email returned ${longRegistration.status}.`
  );
  if (longRegistration.body.token) {
    await request("/auth/account", { method: "DELETE", token: longRegistration.body.token, body: { reason: "QA cleanup" } });
  }

  const forgotKnown = await request("/auth/forgot-password", { method: "POST", body: { email: emailA } });
  const forgotUnknown = await request("/auth/forgot-password", {
    method: "POST",
    body: { email: `unknown-${stamp}@example.com` },
  });
  const neutralMessage = "If that email exists, a reset link has been sent";
  record(15, forgotKnown.status === 200 && forgotKnown.body.message === neutralMessage, `Registered email returned neutral confirmation (${forgotKnown.status}).`);
  record(16, forgotUnknown.status === 200 && forgotUnknown.body.message === neutralMessage, `Unknown email returned the same neutral confirmation (${forgotUnknown.status}).`);

  const noAuth = await request("/auth/me");
  record(17, noAuth.status === 401, `Protected /auth/me returned ${noAuth.status} without a token.`);

  const authPayloads = [accountA.body, (await login(emailA)).body, (await request("/auth/me", { token: tokenA })).body];
  const leaksPassword = authPayloads.some((value) => JSON.stringify(value).toLowerCase().includes('"password"'));
  record(228, !leaksPassword, `Register, login, and /auth/me responses ${leaksPassword ? "included" : "did not include"} a password field.`);

  const validProfile = {
    name: "QA Api Alpha",
    age: 35,
    gender: "female",
    weight_kg: 75,
    height_cm: 175,
    condition: "",
    diet_preference: "veg",
    country: "United States",
    state_region: "Illinois",
    city: "Chicago",
    timezone: "America/Chicago",
  };
  await request("/auth/profile", { method: "PUT", token: tokenA, body: validProfile });

  const badName = await request("/auth/profile", {
    method: "PUT",
    token: tokenA,
    body: { ...validProfile, name: "QA <script>alert(1)</script> 123" },
  });
  record(132, badName.status === 400, `Invalid profile name returned ${badName.status}: ${badName.body.error}`);

  const minProfile = await request("/auth/profile", {
    method: "PUT",
    token: tokenA,
    body: { ...validProfile, age: 1, weight_kg: 1, height_cm: 50 },
  });
  const maxProfile = await request("/auth/profile", {
    method: "PUT",
    token: tokenA,
    body: { ...validProfile, age: 150, weight_kg: 500, height_cm: 300 },
  });
  record(133, minProfile.status === 200 && maxProfile.status === 200, `Profile minimums returned ${minProfile.status}; maximums returned ${maxProfile.status}.`);

  const lowAge = await request("/auth/profile", { method: "PUT", token: tokenA, body: { ...validProfile, age: 0 } });
  const highWeight = await request("/auth/profile", { method: "PUT", token: tokenA, body: { ...validProfile, weight_kg: 501 } });
  const lowHeight = await request("/auth/profile", { method: "PUT", token: tokenA, body: { ...validProfile, height_cm: 49 } });
  record(134, [lowAge, highWeight, lowHeight].every((r) => r.status === 400), `Out-of-range age/weight/height returned ${lowAge.status}/${highWeight.status}/${lowHeight.status}.`);

  const dietStatuses = [];
  for (const diet of ["vegan", "veg", "non_veg"]) {
    dietStatuses.push((await request("/auth/profile", { method: "PUT", token: tokenA, body: { ...validProfile, diet_preference: diet } })).status);
  }
  record(135, dietStatuses.every((status) => status === 200), `Vegan/Vegetarian/Non-vegetarian profile saves returned ${dietStatuses.join("/")}.`);

  const locationSave = await request("/auth/profile", { method: "PUT", token: tokenA, body: validProfile });
  const countryChange = await request("/auth/profile", {
    method: "PUT",
    token: tokenA,
    body: { ...validProfile, country: "Canada", state_region: "", city: "", timezone: "America/Toronto" },
  });
  record(137, locationSave.status === 200 && countryChange.status === 200 && !countryChange.body.user.state_region && !countryChange.body.user.city, `Changing country cleared state/city and returned ${countryChange.status}.`);

  await request("/auth/profile", { method: "PUT", token: tokenA, body: validProfile });
  const emailEnable = await request("/health/weekly-email", { method: "PUT", token: tokenA, body: { enabled: true } });
  const emailReload = await request("/health/weekly-email", { token: tokenA });
  record(139, emailEnable.body.preferences?.enabled === 1 && emailReload.body.preferences?.enabled === 1, `Sunday summary preference persisted as enabled=${emailReload.body.preferences?.enabled}.`);

  const exported = await request("/auth/export-data", { token: tokenA });
  record(140, exported.status === 200 && exported.body.user?.email === emailA && exported.body.health, `JSON export returned ${exported.status} with user, goals, foods, meals, and health sections.`);

  const today = "2026-06-12";
  const yesterday = "2026-06-11";
  const foodName = `QA decimal bowl ${stamp}`;
  const foodPayload = {
    name: foodName,
    category: "custom",
    base_unit: "g",
    base_amount: 100,
    serving: "100g",
    cal: 123.4,
    protein_g: 10.5,
    fiber_g: 3.2,
    carbs_g: 20.75,
    fat_g: 4.25,
    gi: "low",
    notes: "<script>window.__qa_xss=1</script>",
  };
  const createdFood = await request("/foods", { method: "POST", token: tokenA, body: foodPayload });
  record(60, createdFood.status === 201, `Complete manual food returned ${createdFood.status}.`);

  const nameOnly = await request("/foods", { method: "POST", token: tokenA, body: { name: `QA name only ${stamp}` } });
  record(61, nameOnly.status === 400, `Name-only food returned ${nameOnly.status}: ${nameOnly.body.error}`);

  const noName = await request("/foods", { method: "POST", token: tokenA, body: { ...foodPayload, name: "" } });
  record(62, noName.status === 400, `Missing-name food returned ${noName.status}: ${noName.body.error}`);

  const zeroFood = await request("/foods", {
    method: "POST",
    token: tokenA,
    body: { ...foodPayload, name: `QA zero food ${stamp}`, cal: 0, protein_g: 0, fiber_g: 0, carbs_g: 0, fat_g: 0 },
  });
  record(63, zeroFood.status === 201, `Complete zero-nutrient food returned ${zeroFood.status}.`);

  const negativeFood = await request("/foods", {
    method: "POST",
    token: tokenA,
    body: { ...foodPayload, name: `QA negative ${stamp}`, protein_g: -1 },
  });
  record(64, negativeFood.status === 400, `Negative nutrition returned ${negativeFood.status}: ${negativeFood.body.error}`);

  const storedDecimal = createdFood.body.food;
  record(
    65,
    createdFood.status === 201 && Number(storedDecimal.cal) === 123.4 && Number(storedDecimal.carbs_g) === 20.75,
    `Decimal values persisted as cal=${storedDecimal.cal}, carbs=${storedDecimal.carbs_g}.`
  );

  const duplicateFood = await request("/foods", { method: "POST", token: tokenA, body: { ...foodPayload, name: `  ${foodName.toUpperCase()}  ` } });
  record(66, duplicateFood.status === 409, `Normalized duplicate manual food returned ${duplicateFood.status}.`);

  const estimate = await request("/foods/estimate", { method: "POST", token: tokenA, body: { name: "banana", serving: "1 medium" } });
  record(67, estimate.status === 200 && estimate.body.food?.cal >= 0 && estimate.body.food?.serving, `Banana estimate returned ${estimate.status} with serving '${estimate.body.food?.serving}'.`);

  const emptyEstimate = await request("/foods/estimate", { method: "POST", token: tokenA, body: { name: "" } });
  record(68, emptyEstimate.status === 400, `Empty estimate returned ${emptyEstimate.status}: ${emptyEstimate.body.error}`);

  const uncommonEstimate = await request("/foods/estimate", {
    method: "POST",
    token: tokenA,
    body: { name: `xylophonic quinoa cloud ${stamp}` },
  });
  record(69, uncommonEstimate.status === 200 && uncommonEstimate.body.food?.name, `Uncommon food returned ${uncommonEstimate.status}, provider=${uncommonEstimate.body.provider}, confidence=${uncommonEstimate.body.confidence}.`);

  const estimatedFood = {
    ...estimate.body.food,
    name: `QA estimated banana ${stamp}`,
    cal: Number(estimate.body.food.cal) + 1,
  };
  const savedEstimate = await request("/foods", { method: "POST", token: tokenA, body: estimatedFood });
  record(70, savedEstimate.status === 201 && Number(savedEstimate.body.food?.cal) === Number(estimatedFood.cal), `Edited estimate saved with cal=${savedEstimate.body.food?.cal}.`);
  record(71, savedEstimate.status === 201, `Estimated food saved once with status ${savedEstimate.status}.`);
  const duplicateEstimate = await request("/foods", { method: "POST", token: tokenA, body: estimatedFood });
  record(72, duplicateEstimate.status === 409, `Duplicate estimated food returned ${duplicateEstimate.status}.`);

  const foodsFull = await request(`/foods?search=${encodeURIComponent(foodName)}`, { token: tokenA });
  const foodsPartial = await request(`/foods?search=${encodeURIComponent(foodName.slice(0, 10))}`, { token: tokenA });
  record(103, foodsFull.body.foods?.some((f) => f.id === storedDecimal.id) && foodsPartial.body.foods?.some((f) => f.id === storedDecimal.id), `Full and partial search both returned the custom food.`);

  const caseSearch = await request(`/foods?search=${encodeURIComponent(`  ${foodName.toUpperCase()}  `)}`, { token: tokenA });
  record(104, caseSearch.body.foods?.some((f) => f.id === storedDecimal.id), `Uppercase search with surrounding spaces returned ${caseSearch.body.foods?.length || 0} matches.`);

  const sortChecks = {};
  for (const sort of ["name", "cal", "protein", "fiber"]) {
    const response = await request(`/foods?sort=${sort}`, { token: tokenA });
    sortChecks[sort] = response.status === 200 && Array.isArray(response.body.foods);
  }
  record(105, Object.values(sortChecks).every(Boolean), `Name/calorie/protein/fibre sort requests all returned ordered food arrays.`);

  const categories = ["protein", "dairy", "legume", "grain", "veg", "fruit", "snack", "beverage", "custom"];
  const categoryChecks = {};
  for (const category of categories) {
    const response = await request(`/foods?category=${category}`, { token: tokenA });
    categoryChecks[category] = response.status === 200 && (response.body.foods || []).every((food) => food.category === category);
  }
  record(106, Object.values(categoryChecks).every(Boolean), `All supported API category filters returned only matching foods; recipe is not a foods API category.`);

  const allFoods = await request("/foods", { token: tokenA });
  const defaultFood = allFoods.body.foods?.find((food) => food.is_default === 1);
  const defaultEdit = await request(`/foods/${defaultFood.id}`, { method: "PUT", token: tokenA, body: { ...foodPayload, name: defaultFood.name } });
  const defaultDelete = await request(`/foods/${defaultFood.id}`, { method: "DELETE", token: tokenA });
  record(109, defaultEdit.status === 403 && defaultDelete.status === 403, `Default food edit/delete returned ${defaultEdit.status}/${defaultDelete.status}.`);

  const duplicateAcrossSource = await request("/foods", { method: "POST", token: tokenA, body: { ...foodPayload, name: defaultFood.name } });
  record(111, duplicateAcrossSource.status === 409, `Saving a name matching a default library food returned ${duplicateAcrossSource.status}.`);

  const sourceFoodId = storedDecimal.id;
  const mealIds = [];
  for (const mealType of ["breakfast", "lunch", "dinner", "snack"]) {
    const meal = await request("/meals", {
      method: "POST",
      token: tokenA,
      body: { food_id: sourceFoodId, meal_type: mealType, log_date: today, qty: 100, unit: "g" },
    });
    if (meal.body.entry?.id) mealIds.push(meal.body.entry.id);
    record(mealType === "breakfast" ? 35 : 36, meal.status === 201, `${mealType} API meal creation returned ${meal.status}.`, { append: mealType !== "breakfast" });
  }

  const noSelection = await request("/meals", {
    method: "POST",
    token: tokenA,
    body: { meal_type: "breakfast", log_date: today, qty: 1, unit: "g", food_name: "" },
  });
  record(37, noSelection.status === 400, `Meal without selected food/name returned ${noSelection.status}.`);

  const minQtyMeal = await request("/meals", {
    method: "POST",
    token: tokenA,
    body: { food_id: sourceFoodId, meal_type: "breakfast", log_date: today, qty: 0.01, unit: "g" },
  });
  record(38, minQtyMeal.status === 201, `Quantity 0.01 returned ${minQtyMeal.status}; calculated calories=${minQtyMeal.body.entry?.cal}.`);

  const zeroQty = await request("/meals", {
    method: "POST",
    token: tokenA,
    body: { food_id: sourceFoodId, meal_type: "breakfast", log_date: today, qty: 0, unit: "g" },
  });
  record(39, zeroQty.status === 400, `Zero quantity returned ${zeroQty.status}.`);

  const negativeQty = await request("/meals", {
    method: "POST",
    token: tokenA,
    body: { food_id: sourceFoodId, meal_type: "breakfast", log_date: today, qty: -1, unit: "g" },
  });
  record(40, negativeQty.status === 400, `Negative quantity returned ${negativeQty.status}.`);

  const hugeQty = await request("/meals", {
    method: "POST",
    token: tokenA,
    body: { food_id: sourceFoodId, meal_type: "snack", log_date: today, qty: 1000000000, unit: "g" },
  });
  record(41, hugeQty.status === 201 && Number.isFinite(Number(hugeQty.body.entry?.cal)), `Very large quantity returned ${hugeQty.status}, calories=${hugeQty.body.entry?.cal}.`);

  const editMeal = await request(`/meals/${mealIds[0]}`, {
    method: "PUT",
    token: tokenA,
    body: { qty: 2, unit: "serving" },
  });
  const refreshedMeals = await request(`/meals?date=${today}`, { token: tokenA });
  const persistedEdit = Object.values(refreshedMeals.body.logs || {}).flat().find((entry) => entry.id === mealIds[0]);
  record(42, editMeal.status === 200 && persistedEdit?.qty === 2 && persistedEdit?.unit === "serving", `Edited meal persisted as ${persistedEdit?.qty} ${persistedEdit?.unit}.`);

  const badEdits = [];
  for (const qty of [0, -1, "not-a-number"]) {
    badEdits.push(await request(`/meals/${mealIds[0]}`, { method: "PUT", token: tokenA, body: { qty, unit: "g" } }));
  }
  record(43, badEdits.every((r) => r.status === 400), `Edit with 0/-1/non-numeric returned ${badEdits.map((r) => r.status).join("/")}.`);

  const deleteMeal = await request(`/meals/${mealIds[1]}`, { method: "DELETE", token: tokenA });
  const afterDelete = await request(`/meals?date=${today}`, { token: tokenA });
  const deletedAbsent = !Object.values(afterDelete.body.logs || {}).flat().some((entry) => entry.id === mealIds[1]);
  record(44, deleteMeal.status === 200 && deletedAbsent, `Delete returned ${deleteMeal.status}; entry absent after reload=${deletedAbsent}.`);

  const overTargetSummary = await request(`/health/summary?date=${today}`, { token: tokenA });
  record(52, overTargetSummary.status === 200 && Number(overTargetSummary.body.totals?.cal) > Number(overTargetSummary.body.goals?.cal), `Large meal produced ${overTargetSummary.body.totals?.cal} kcal vs ${overTargetSummary.body.goals?.cal} kcal target without NaN/overflow.`);

  const yesterdayDinner = await request("/meals", {
    method: "POST",
    token: tokenA,
    body: { food_id: sourceFoodId, meal_type: "dinner", log_date: yesterday, qty: 100, unit: "g" },
  });
  const yesterdayLunch = await request("/meals", {
    method: "POST",
    token: tokenA,
    body: { food_id: sourceFoodId, meal_type: "lunch", log_date: yesterday, qty: 50, unit: "g" },
  });
  record(54, yesterdayDinner.status === 201 && yesterdayLunch.status === 201, `Created previous-day Dinner and Lunch fixtures for review.`);

  const copyChangedMeal = await request("/meals/copy-yesterday", {
    method: "POST",
    token: tokenA,
    body: {
      date: today,
      source_date: yesterday,
      entry_ids: [yesterdayDinner.body.entry.id],
      destination_meals: { [yesterdayDinner.body.entry.id]: "lunch" },
    },
  });
  record(55, copyChangedMeal.status === 201 && copyChangedMeal.body.copied?.[0]?.meal_type === "lunch", `Dinner item copied to Lunch with status ${copyChangedMeal.status}.`);
  record(56, copyChangedMeal.status === 201 && copyChangedMeal.body.copied?.length === 1, `Only the selected previous-day item was copied.`);

  const copyNone = await request("/meals/copy-yesterday", {
    method: "POST",
    token: tokenA,
    body: { date: today, source_date: yesterday, entry_ids: [] },
  });
  record(57, copyNone.status === 400, `Empty selected-item copy returned ${copyNone.status}: ${copyNone.body.error}`);

  const copyNoMeals = await request("/meals/copy-yesterday", {
    method: "POST",
    token: tokenA,
    body: { date: "2026-01-02", source_date: "2026-01-01" },
  });
  record(58, copyNoMeals.status === 404, `No-meals copy returned ${copyNoMeals.status}: ${copyNoMeals.body.error}`);

  const copyAgain = await request("/meals/copy-yesterday", {
    method: "POST",
    token: tokenA,
    body: { date: today, source_date: yesterday, entry_ids: [yesterdayDinner.body.entry.id] },
  });
  record(59, copyAgain.status === 201, `Repeating the same copy created another entry with no duplicate warning (documented current behavior).`);

  const customGoals = {
    goal_type: "muscle",
    activity_level: "moderate",
    pace: "steady",
    carb_style: "high_protein",
    diabetes_status: "none",
    target_weight_kg: 78,
    target_muscle_gain_kg: 3,
    target_date: "2026-12-31",
    target_summary: "QA plan",
    cal: 3100,
    protein_g: 170,
    fiber_g: 32,
    carbs_g: 260,
    water_ml: 2800,
  };
  const goalSave = await request("/health/goals", { method: "PUT", token: tokenA, body: customGoals });
  const goalToday = await request(`/health/summary?date=${today}`, { token: tokenA });
  const goalReport = await request("/health/report?days=7&to=2026-06-12", { token: tokenA });
  record(124, goalSave.status === 200 && goalToday.body.goals?.cal === 3100, `Saved plan returned ${goalSave.status}; Today summary uses ${goalToday.body.goals?.cal} kcal.`);
  record(128, goalToday.body.goals?.protein_g === 170 && goalReport.body.goals?.protein_g === 170, `Goals, Today summary, and report all returned the unique 3100/170/260 targets; Coach is Pro-gated.`);

  const goalModify = await request("/health/goals", { method: "PUT", token: tokenA, body: { ...customGoals, cal: 3200 } });
  const goalReload = await request("/health/goals", { token: tokenA });
  record(125, goalModify.status === 200 && goalReload.body.goals?.cal === 3200, `Modified goal persisted as ${goalReload.body.goals?.cal} kcal.`);

  const weightValid = await request("/health/weight", { method: "POST", token: tokenA, body: { weight_kg: 75, log_date: today, notes: "QA" } });
  record(173, weightValid.status === 201 && weightValid.body.entry?.weight_kg === 75, `Valid weight returned ${weightValid.status}.`);
  const weightEdit = await request("/health/weight", { method: "POST", token: tokenA, body: { weight_kg: 76, log_date: today, notes: "Updated" } });
  const weightReload = await request(`/health/weight?date=${today}`, { token: tokenA });
  record(174, weightEdit.status === 201 && weightReload.body.entry?.weight_kg === 76, `Same-date weight updated to ${weightReload.body.entry?.weight_kg}.`);
  const minWeight = await request("/health/weight", { method: "POST", token: tokenA, body: { weight_kg: 20, log_date: "2026-06-10" } });
  const maxWeight = await request("/health/weight", { method: "POST", token: tokenA, body: { weight_kg: 400, log_date: "2026-06-09" } });
  record(175, minWeight.status === 201 && maxWeight.status === 201, `Weight boundaries 20/400 returned ${minWeight.status}/${maxWeight.status}.`);
  const invalidWeights = [];
  for (const weight_kg of [0, -1, "abc", 19, 401]) {
    invalidWeights.push(await request("/health/weight", { method: "POST", token: tokenA, body: { weight_kg, log_date: "2026-06-08" } }));
  }
  record(176, invalidWeights.every((r) => r.status === 400), `Invalid weights returned ${invalidWeights.map((r) => r.status).join("/")}.`);

  const waterValid = await request("/health/water", { method: "POST", token: tokenA, body: { ml: 250, log_date: today } });
  const waterReload = await request(`/health/water?date=${today}`, { token: tokenA });
  record(177, waterValid.status === 201 && waterReload.body.total_ml >= 250, `Water save returned ${waterValid.status}; daily total=${waterReload.body.total_ml} ml.`);
  const waterSmall = await request("/health/water", { method: "POST", token: tokenA, body: { ml: 0.01, log_date: today } });
  const waterLarge = await request("/health/water", { method: "POST", token: tokenA, body: { ml: 1000000000, log_date: today } });
  record(178, waterSmall.status === 201 && waterLarge.status === 201, `Water accepts 0.01 and 1,000,000,000 ml with no documented maximum (${waterSmall.status}/${waterLarge.status}).`);

  const stepsValid = await request("/health/steps", { method: "POST", token: tokenA, body: { steps: 12345, log_date: today } });
  const stepsReload = await request(`/health/steps?date=${today}`, { token: tokenA });
  record(179, stepsValid.status === 200 && stepsReload.body.steps === 12345, `Steps persisted as ${stepsReload.body.steps}.`);
  const stepsNegative = await request("/health/steps", { method: "POST", token: tokenA, body: { steps: -1, log_date: today } });
  record(180, stepsNegative.status === 400, `Negative steps returned ${stepsNegative.status}.`);

  const weightRange = await request("/health/weight/range?from=2026-06-01&to=2026-06-12", { token: tokenA });
  const waterRange = await request("/health/water/range?from=2026-06-01&to=2026-06-12", { token: tokenA });
  const stepsRange = await request("/health/steps/range?from=2026-06-01&to=2026-06-12", { token: tokenA });
  record(181, weightRange.body.data?.length >= 3 && waterRange.body.data?.length >= 1 && stepsRange.body.data?.length >= 1, `Weight/water/steps trend APIs returned ${weightRange.body.data?.length}/${waterRange.body.data?.length}/${stepsRange.body.data?.length} dated points.`);

  const glucoseFasting = await request("/health/glucose", { method: "POST", token: tokenA, body: { value_mgdl: 95, timing: "fasting", log_date: today } });
  record(183, glucoseFasting.status === 201 && glucoseFasting.body.entry?.timing === "fasting", `Fasting glucose returned ${glucoseFasting.status}.`);
  const glucosePost = await request("/health/glucose", { method: "POST", token: tokenA, body: { value_mgdl: 140, timing: "post_meal", log_date: today } });
  record(184, glucosePost.status === 201 && glucosePost.body.entry?.timing === "post_meal", `Post-meal glucose returned ${glucosePost.status}.`);
  const glucoseMin = await request("/health/glucose", { method: "POST", token: tokenA, body: { value_mgdl: 40, timing: "fasting", log_date: today } });
  const glucoseMax = await request("/health/glucose", { method: "POST", token: tokenA, body: { value_mgdl: 600, timing: "random", log_date: today } });
  record(185, glucoseMin.status === 201 && glucoseMax.status === 201, `Glucose boundaries 40/600 returned ${glucoseMin.status}/${glucoseMax.status}.`);
  const invalidGlucose = [];
  for (const value_mgdl of [0, -1, "abc", 39, 601]) {
    invalidGlucose.push(await request("/health/glucose", { method: "POST", token: tokenA, body: { value_mgdl, timing: "fasting", log_date: today } }));
  }
  record(186, invalidGlucose.every((r) => r.status === 400), `Invalid glucose values returned ${invalidGlucose.map((r) => r.status).join("/")}.`);

  const wellbeing = await request("/health/wellbeing", { method: "POST", token: tokenA, body: { status: "fine", notes: "<script>window.__qa_wellbeing=1</script>", log_date: today } });
  const wellbeingReload = await request(`/health/wellbeing?date=${today}`, { token: tokenA });
  record(192, wellbeing.status === 200 && wellbeingReload.body.log?.notes.includes("<script>"), `Wellbeing notes persisted as text through the API.`);

  const emptyBody = await request("/health/weight/range?from=2025-01-01&to=2025-01-02", { token: tokenB });
  record(182, emptyBody.status === 200 && emptyBody.body.data?.length === 0, `Fresh account Body range returned an empty array without an error.`);
  const emptyClinical = await request("/health/glucose/range?from=2025-01-01&to=2025-01-02", { token: tokenB });
  record(194, emptyClinical.status === 200 && emptyClinical.body.data?.length === 0, `Fresh account Clinical range returned an empty array without an error.`);

  const crossMeal = await request(`/meals/${mealIds[0]}`, { method: "PUT", token: tokenB, body: { qty: 9, unit: "g" } });
  const crossFood = await request(`/foods/${sourceFoodId}`, { method: "DELETE", token: tokenB });
  const crossWeight = await request(`/health/weight/${weightValid.body.entry.id}`, { method: "DELETE", token: tokenB });
  record(226, [crossMeal, crossFood, crossWeight].every((r) => r.status === 403), `Account B cross-user meal/food/weight mutations returned ${crossMeal.status}/${crossFood.status}/${crossWeight.status}.`);

  const notesFoodReload = await request(`/foods?search=${encodeURIComponent(foodName)}`, { token: tokenA });
  const storedScript = notesFoodReload.body.foods?.find((food) => food.id === sourceFoodId)?.notes;
  record(227, storedScript === foodPayload.notes && badName.status === 400, `Script-like profile name was rejected; allowed food/wellbeing notes were returned as literal text.`);

  const reportNoAuth = await request("/health/report?days=7&to=2026-06-12");
  const exportNoAuth = await request("/auth/export-data");
  record(214, reportNoAuth.status === 401 && exportNoAuth.status === 401, `Unauthenticated report/export returned ${reportNoAuth.status}/${exportNoAuth.status}.`);

  const persistenceBefore = await request("/auth/me", { token: tokenA });
  const relogin = await login(emailA);
  const persistenceAfter = await request("/auth/me", { token: relogin.body.token });
  const persistenceGoals = await request("/health/goals", { token: relogin.body.token });
  const persistenceFoods = await request(`/foods?search=${encodeURIComponent(foodName)}`, { token: relogin.body.token });
  record(231, persistenceBefore.status === 200 && persistenceAfter.status === 200 && persistenceGoals.body.goals?.cal === 3200 && persistenceFoods.body.foods?.some((f) => f.id === sourceFoodId), `Profile, modified goal, and custom food persisted through a new login session.`);

  const deleteGoals = await request("/health/goals", { method: "DELETE", token: tokenA });
  const goalsAfterDelete = await request("/health/goals", { token: tokenA });
  record(126, deleteGoals.status === 200 && goalsAfterDelete.body.goals?.cal === 1700, `Goal deletion returned ${deleteGoals.status}; reload returned documented default goals.`);

  const deleteWithoutCredentials = await request("/auth/account", {
    method: "DELETE",
    token: tokenB,
    body: { email: "wrong@example.com", password: "incorrect", reason: "QA negative delete" },
  });
  const deletedLoginB = await login(emailB);
  record(141, deleteWithoutCredentials.status !== 200, `Account deletion with incorrect credentials returned ${deleteWithoutCredentials.status}; subsequent login returned ${deletedLoginB.status}.`);
  record(142, deleteWithoutCredentials.status === 200 && deletedLoginB.status === 401, `Disposable account was deleted and subsequent login returned ${deletedLoginB.status}.`);
} finally {
  await request("/auth/account", { method: "DELETE", token: tokenA, body: { reason: "QA cleanup" } }).catch(() => {});
  await request("/auth/account", { method: "DELETE", token: tokenB, body: { reason: "QA cleanup" } }).catch(() => {});
}

const merged = new Map();
for (const result of results) {
  if (merged.has(result.id)) {
    const current = merged.get(result.id);
    current.passed = current.passed && result.passed;
    current.actual = `${current.actual} ${result.actual}`;
  } else {
    merged.set(result.id, { ...result });
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  target: { frontend: FRONTEND, api: API },
  results: [...merged.values()].sort((a, b) => a.id - b.id),
};
console.log(JSON.stringify(output, null, 2));
