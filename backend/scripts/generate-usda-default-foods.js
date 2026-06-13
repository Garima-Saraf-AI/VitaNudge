const fs = require('fs');
const path = require('path');

const sourcePath = process.argv[2];
const outputPath = process.argv[3]
  || path.join(__dirname, '..', 'database', 'default-foods-usda.json');

if (!sourcePath) {
  console.error('Usage: node scripts/generate-usda-default-foods.js <surveyDownload.json> [output.json]');
  process.exit(1);
}

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const foods = source.SurveyFoods;

if (!Array.isArray(foods)) {
  throw new Error('Expected SurveyFoods in the USDA FoodData Central download');
}

const NUTRIENTS = {
  protein_g: 1003,
  fat_g: 1004,
  carbs_g: 1005,
  cal: 1008,
  fiber_g: 1079,
};

const commonExclude = /\b(NFS|NS as to|not specified|unknown|with animal fat|meat drippings|cooking spray|fat added|made with oil|made with butter|made with margarine|from restaurant|fast food|fried|breaded|coated)\b/i;
const softNegative = /flavored|sweetened|canned|frozen|sauce|mixture|smoked|salted|toasted|reconstituted/i;
const preferred = /\b(raw|plain|unsweetened|unroasted|unsalted|boiled|poached|baked|broiled|roasted|steamed|cooked|no added fat|whole|fresh|low fat|nonfat|reduced fat)\b/i;

function nutrient(food, id) {
  return food.foodNutrients.find(item => item.nutrient?.id === id)?.amount;
}

function hasRequiredNutrients(food) {
  return Object.values(NUTRIENTS).every(id => Number.isFinite(nutrient(food, id)));
}

function selectionScore(food) {
  let score = 100 - (food.description.length * 0.12) - ((food.description.split(',').length - 1) * 5);
  if (preferred.test(food.description)) score += 10;
  if (softNegative.test(food.description)) score -= 10;
  if (/raw$/i.test(food.description)) score += 14;
  if (/no added fat/i.test(food.description)) score += 8;
  if (/plain/i.test(food.description)) score += 5;
  return score;
}

function selectAutomatically(category, quota, sourceCategories, extraExclude) {
  const candidates = foods
    .filter(food => sourceCategories.includes(food.wweiaFoodCategory?.wweiaFoodCategoryDescription))
    .filter(hasRequiredNutrients)
    .filter(food => !commonExclude.test(food.description))
    .filter(food => !extraExclude?.test(food.description))
    .sort((a, b) => selectionScore(b) - selectionScore(a) || a.description.localeCompare(b.description));

  if (candidates.length < quota) {
    throw new Error(`Only ${candidates.length} eligible ${category} foods found; expected ${quota}`);
  }

  return candidates.slice(0, quota).map(food => ({ food, category }));
}

function selectExact(category, descriptions) {
  return descriptions.map(description => {
    const food = foods.find(item => item.description === description);
    if (!food) throw new Error(`USDA food not found: ${description}`);
    if (!hasRequiredNutrients(food)) throw new Error(`USDA food has incomplete macros: ${description}`);
    return { food, category };
  });
}

const selected = [
  ...selectAutomatically('fruit', 46, [
    'Apples',
    'Bananas',
    'Blueberries and other berries',
    'Citrus fruits',
    'Grapes',
    'Mango and papaya',
    'Melons',
    'Peaches and nectarines',
    'Pears',
    'Pineapple',
    'Strawberries',
    'Other fruits and fruit salads',
    'Dried fruits',
  ], /ambrosia|banana chips|pie|candied|pickled|canned|frozen|sauce|juice|^fruit,|salad/i),

  ...selectAutomatically('veg', 65, [
    'Broccoli',
    'Cabbage',
    'Carrots',
    'Corn',
    'Lettuce and lettuce salads',
    'Onions',
    'Other dark green vegetables',
    'Other red and orange vegetables',
    'Other starchy vegetables',
    'Other vegetables and combinations',
    'Spinach',
    'String beans',
    'Tomatoes',
    'White potatoes, baked or boiled',
  ], /salad with|meat|ham|pork|canned|frozen/i),

  ...selectAutomatically('legume', 29, [
    'Beans, peas, legumes',
  ], /with meat|pork|franks|wasabi|papad|refried|baked beans(?!, vegetarian)|soy nuts/i),

  ...selectAutomatically('grain', 40, [
    'Oatmeal',
    'Rice',
    'Pasta, noodles, cooked grains',
    'Yeast breads',
    'Tortillas',
    'Ready-to-eat cereal, lower sugar (=<21.2g/100g)',
    'Grits and other cooked cereals',
  ], /cereal, (K's|O's|other)|with cheese|gordita|with milk|yellow rice|sweet, cooked/i),

  ...selectExact('protein', [
    'Egg, whole, raw',
    'Egg, whole, boiled or poached',
    'Egg, whole, fried no added fat',
    'Egg, whole, baked, no added fat',
    'Egg, white only, raw',
    'Egg, white, cooked, no added fat',
    'Egg omelet or scrambled egg, no added fat',
    'Chicken breast, baked, broiled, or roasted, skin not eaten, from raw',
    'Chicken breast, grilled without sauce, skin not eaten',
    'Chicken breast, rotisserie, skin not eaten',
    'Chicken breast, stewed, skin not eaten',
    'Chicken thigh, baked, broiled, or roasted, skin not eaten, from raw',
    'Chicken thigh, grilled without sauce, skin not eaten',
    'Chicken thigh, stewed, skin not eaten',
    'Chicken drumstick, baked, broiled, or roasted, skin not eaten, from raw',
    'Chicken drumstick, grilled without sauce, skin not eaten',
    'Chicken wing, baked, broiled, or roasted, from raw',
    'Chicken, canned, meat only',
    'Chicken, ground',
    'Turkey, light meat, roasted, skin not eaten',
    'Turkey, dark meat, roasted, skin not eaten',
    'Turkey, ground',
    'Duck, roasted, skin not eaten',
    'Cornish game hen, roasted, skin not eaten',
    'Fish, salmon, raw',
    'Fish, salmon, grilled',
    'Fish, salmon, canned',
    'Fish, tuna, raw',
    'Fish, tuna, cooked',
    'Fish, tuna, canned',
    'Fish, cod, baked or broiled',
    'Fish, cod, grilled',
    'Fish, tilapia, baked or broiled',
    'Fish, tilapia, grilled',
    'Fish, trout, grilled',
    'Fish, sardines, canned',
    'Fish, mackerel, grilled',
    'Fish, snapper',
    'Shrimp, steamed or boiled',
    'Shrimp, grilled',
    'Crab',
    'Lobster',
    'Mussels',
    'Oysters, steamed',
    'Scallops, grilled',
    'Beef, ground, raw',
    'Beef, steak, sirloin, lean only eaten',
    'Beef, steak, tenderloin',
    'Beef, roast',
    'Pork, tenderloin',
    'Pork, chop, lean only eaten',
    'Lamb, chop',
    'Goat',
    'Soybean curd',
    'Textured vegetable protein, dry',
  ]),

  ...selectExact('dairy', [
    'Milk, whole',
    'Milk, reduced fat (2%)',
    'Milk, low fat (1%)',
    'Milk, fat free (skim)',
    'Goat milk',
    'Buttermilk',
    'Kefir',
    'Cheese, Cheddar',
    'Cheese, Mozzarella, part skim',
    'Cheese, Feta',
    'Cheese, cottage, low fat',
    'Cheese, Ricotta',
    'Cheese, paneer',
    'Cheese, Swiss',
    'Cheese, Parmesan, hard',
    'Cheese, goat',
    'Cheese, Gouda or Edam',
    'Cheese, Brie',
    'Cheese, Provolone',
    'Cheese, Colby Jack',
    'Cheese, Monterey',
    'Cheese, Blue or Roquefort',
    'Yogurt, whole milk, plain',
    'Yogurt, low fat milk, plain',
    'Yogurt, nonfat milk, plain',
    'Yogurt, Greek, whole milk, plain',
    'Yogurt, Greek, low fat milk, plain',
    'Yogurt, Greek, nonfat milk, plain',
    'Yogurt, Greek, low fat milk, fruit',
    'Yogurt, low fat milk, fruit',
  ]),

  ...selectExact('snack', [
    'Almonds, unroasted',
    'Cashews, unroasted',
    'Walnuts, excluding honey roasted',
    'Pistachio nuts, unsalted',
    'Pecans, unroasted',
    'Hazelnuts',
    'Brazil nuts',
    'Macadamia nuts',
    'Peanuts, dry roasted, unsalted',
    'Chestnuts',
    'Coconut, fresh',
    'Pine nuts',
    'Flax seeds',
    'Pumpkin seeds, unsalted',
    'Sunflower seeds, plain, unsalted',
    'Sesame seeds',
    'Tahini',
    'Peanut butter',
    'Almond butter',
    'Popcorn, ready-to-eat, plain',
  ]),

  ...selectExact('beverage', [
    'Coffee, brewed',
    'Coffee, espresso',
    'Coffee, brewed, decaffeinated',
    'Coffee, Latte, nonfat',
    'Tea, hot, leaf, black',
    'Tea, hot, leaf, green',
    'Tea, hot, herbal',
    'Tea, hot, chamomile',
    'Tea, ginger',
    'Tea, kombucha',
    'Soy milk, unsweetened',
    'Almond milk, unsweetened',
    'Oat milk',
    'Rice milk',
    'Coconut milk',
  ]),
];

function round1(value) {
  return Math.round(value * 10) / 10;
}

function typicalPortion(food) {
  const portion = [...(food.foodPortions || [])]
    .filter(item => Number(item.gramWeight) > 0)
    .filter(item => !/quantity not specified/i.test(item.portionDescription || ''))
    .sort((a, b) => (a.sequenceNumber || 999) - (b.sequenceNumber || 999))[0];

  if (!portion) return '';
  return `${portion.portionDescription} (${round1(portion.gramWeight)}g)`;
}

const normalized = selected.map(({ food, category }) => {
  const portion = typicalPortion(food);
  return {
    fdc_id: food.fdcId,
    name: food.description,
    category,
    base_unit: 'g',
    base_amount: 100,
    serving: portion ? `100g; typical ${portion}` : '100g',
    cal: Math.round(nutrient(food, NUTRIENTS.cal)),
    protein_g: round1(nutrient(food, NUTRIENTS.protein_g)),
    fiber_g: round1(nutrient(food, NUTRIENTS.fiber_g)),
    carbs_g: round1(nutrient(food, NUTRIENTS.carbs_g)),
    fat_g: round1(nutrient(food, NUTRIENTS.fat_g)),
    gi: 'unknown',
    notes: `USDA FoodData Central FNDDS 2021-2023, FDC ${food.fdcId}. Nutrients are per 100g.`,
  };
});

const names = new Set(normalized.map(food => food.name.toLowerCase()));
const sourceIds = new Set(normalized.map(food => food.fdc_id));

if (normalized.length !== 300 || names.size !== 300 || sourceIds.size !== 300) {
  throw new Error(`Expected 300 unique foods; got ${normalized.length} records, ${names.size} names, ${sourceIds.size} FDC IDs`);
}

fs.writeFileSync(outputPath, `${JSON.stringify(normalized, null, 2)}\n`);
console.log(`Wrote ${normalized.length} USDA foods to ${outputPath}`);
