const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const { DB_PATH, initDatabase } = require('./init');

const DEFAULT_FOODS = [
  // ── PROTEIN FOODS ──
  { name: 'Egg white',              category: 'protein',  base_unit: 'piece', base_amount: 1,   serving: '1 white (33g)',         cal: 17,  protein_g: 3.6,  fiber_g: 0,   carbs_g: 0.2, fat_g: 0,   gi: 'low',  notes: 'Zero carb pure protein' },
  { name: 'Whole egg',              category: 'protein',  base_unit: 'piece', base_amount: 1,   serving: '1 egg (50g)',           cal: 70,  protein_g: 6,    fiber_g: 0,   carbs_g: 0.6, fat_g: 5,   gi: 'low',  notes: 'Choline + fat-soluble vitamins' },
  { name: 'Tofu (firm)',            category: 'protein',  base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 80,  protein_g: 9,    fiber_g: 0.3, carbs_g: 2,   fat_g: 4,   gi: 'low',  notes: 'Complete amino acids' },
  { name: 'Soya chunks (dry)',      category: 'protein',  base_unit: 'g',     base_amount: 10,  serving: '10g dry',               cal: 36,  protein_g: 5,    fiber_g: 0.8, carbs_g: 1.8, fat_g: 0.2, gi: 'low',  notes: 'Complete plant protein' },
  { name: 'Tofu bhurji',           category: 'protein',  base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 110, protein_g: 12,   fiber_g: 1,   carbs_g: 4,   fat_g: 5,   gi: 'low',  notes: 'Vegan scrambled tofu' },
  // ── DAIRY ──
  { name: 'Paneer',                 category: 'dairy',    base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 265, protein_g: 18,   fiber_g: 0,   carbs_g: 3,   fat_g: 20,  gi: 'low',  notes: 'Casein + calcium' },
  { name: 'Paneer bhurji',          category: 'dairy',    base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 220, protein_g: 17,   fiber_g: 0,   carbs_g: 3.5, fat_g: 15,  gi: 'low',  notes: 'Scrambled paneer' },
  { name: 'Greek yogurt (plain)',   category: 'dairy',    base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 59,  protein_g: 10,   fiber_g: 0,   carbs_g: 3.6, fat_g: 0.4, gi: 'low',  notes: 'Probiotic + casein' },
  { name: 'Low-fat curd (dahi)',    category: 'dairy',    base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 40,  protein_g: 3.5,  fiber_g: 0,   carbs_g: 4.5, fat_g: 1,   gi: 'low',  notes: 'Probiotics' },
  { name: 'Low-fat milk',          category: 'dairy',    base_unit: 'ml',    base_amount: 100, serving: '100ml',                 cal: 42,  protein_g: 3.4,  fiber_g: 0,   carbs_g: 5,   fat_g: 1,   gi: 'low',  notes: 'Calcium + protein' },
  { name: 'Turmeric milk',         category: 'dairy',    base_unit: 'ml',    base_amount: 100, serving: '100ml',                 cal: 46,  protein_g: 3.4,  fiber_g: 0,   carbs_g: 5.2, fat_g: 1.2, gi: 'low',  notes: 'Anti-inflammatory' },
  { name: 'Cucumber raita',        category: 'dairy',    base_unit: 'ml',    base_amount: 100, serving: '100ml',                 cal: 35,  protein_g: 3,    fiber_g: 0.4, carbs_g: 4,   fat_g: 0.6, gi: 'low',  notes: 'Probiotic + cooling' },
  // ── LEGUMES (per 100g cooked) ──
  { name: 'Masoor dal (cooked)',    category: 'legume',   base_unit: 'g',     base_amount: 100, serving: '100g cooked',           cal: 90,  protein_g: 7,    fiber_g: 4,   carbs_g: 12,  fat_g: 0.5, gi: 'low',  notes: 'Plant protein' },
  { name: 'Moong dal (cooked)',     category: 'legume',   base_unit: 'g',     base_amount: 100, serving: '100g cooked',           cal: 80,  protein_g: 6,    fiber_g: 3.5, carbs_g: 11,  fat_g: 0.4, gi: 'low',  notes: 'Easiest dal to digest' },
  { name: 'Chana dal (cooked)',     category: 'legume',   base_unit: 'g',     base_amount: 100, serving: '100g cooked',           cal: 88,  protein_g: 7,    fiber_g: 4,   carbs_g: 12.5,fat_g: 0.8, gi: 'low',  notes: 'Lowest GI dal' },
  { name: 'Rajma (cooked)',         category: 'legume',   base_unit: 'g',     base_amount: 100, serving: '100g cooked',           cal: 113, protein_g: 8,    fiber_g: 5.5, carbs_g: 15,  fat_g: 0.5, gi: 'low',  notes: 'Resistant starch' },
  { name: 'Chickpeas (cooked)',     category: 'legume',   base_unit: 'g',     base_amount: 100, serving: '100g cooked',           cal: 120, protein_g: 8,    fiber_g: 6,   carbs_g: 16,  fat_g: 1,   gi: 'low',  notes: 'Fibre powerhouse' },
  { name: 'Moong sprouts',         category: 'legume',   base_unit: 'g',     base_amount: 100, serving: '100g sprouted',         cal: 30,  protein_g: 3.5,  fiber_g: 2,   carbs_g: 4,   fat_g: 0.2, gi: 'low',  notes: 'Sprouted = more enzymes' },
  { name: 'Panchratna dal (cooked)',category: 'legume',   base_unit: 'g',     base_amount: 100, serving: '100g cooked',           cal: 95,  protein_g: 7.5,  fiber_g: 4.5, carbs_g: 13,  fat_g: 0.7, gi: 'low',  notes: '5-lentil mix, highest protein combo' },
  // ── GRAINS ──
  { name: 'Multigrain roti',        category: 'grain',    base_unit: 'piece', base_amount: 1,   serving: '1 roti (30g)',          cal: 80,  protein_g: 3,    fiber_g: 2,   carbs_g: 14,  fat_g: 1,   gi: 'med',  notes: 'Wheat+jowar+methi' },
  { name: 'Jowar roti',             category: 'grain',    base_unit: 'piece', base_amount: 1,   serving: '1 roti (30g)',          cal: 75,  protein_g: 2,    fiber_g: 2,   carbs_g: 13,  fat_g: 0.8, gi: 'low',  notes: 'Gluten-free, very low GI' },
  { name: 'Bajra roti',             category: 'grain',    base_unit: 'piece', base_amount: 1,   serving: '1 roti (30g)',          cal: 76,  protein_g: 2,    fiber_g: 2,   carbs_g: 13,  fat_g: 1,   gi: 'low',  notes: 'High magnesium' },
  { name: 'Ragi dosa',              category: 'grain',    base_unit: 'piece', base_amount: 1,   serving: '1 medium dosa',         cal: 90,  protein_g: 3,    fiber_g: 2,   carbs_g: 16,  fat_g: 1,   gi: 'low',  notes: 'Excellent for diabetics' },
  { name: 'Steel-cut oats (dry)',   category: 'grain',    base_unit: 'g',     base_amount: 100, serving: '100g dry',              cal: 389, protein_g: 17,   fiber_g: 11,  carbs_g: 56,  fat_g: 7,   gi: 'low',  notes: 'Beta-glucan controls glucose' },
  { name: 'Brown rice (cooked)',    category: 'grain',    base_unit: 'g',     base_amount: 100, serving: '100g cooked',           cal: 110, protein_g: 2.6,  fiber_g: 1.8, carbs_g: 22,  fat_g: 0.9, gi: 'med',  notes: 'More fibre than white rice' },
  { name: 'Dalia upma (cooked)',    category: 'grain',    base_unit: 'g',     base_amount: 100, serving: '100g cooked',           cal: 92,  protein_g: 3.5,  fiber_g: 3,   carbs_g: 15,  fat_g: 2,   gi: 'low',  notes: 'High-fibre breakfast' },
  { name: 'Moong dal chilla',       category: 'grain',    base_unit: 'piece', base_amount: 1,   serving: '1 medium chilla (60g)', cal: 95,  protein_g: 7,    fiber_g: 3,   carbs_g: 12,  fat_g: 1.5, gi: 'low',  notes: 'Protein pancake' },
  { name: 'Besan chilla',           category: 'grain',    base_unit: 'piece', base_amount: 1,   serving: '1 medium chilla (60g)', cal: 110, protein_g: 6,    fiber_g: 2.5, carbs_g: 14,  fat_g: 2,   gi: 'low',  notes: 'Chickpea flour pancake' },
  // ── VEGETABLES (per 100g) ──
  { name: 'Spinach / palak',        category: 'veg',      base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 23,  protein_g: 2.9,  fiber_g: 2.2, carbs_g: 1.4, fat_g: 0.4, gi: 'low',  notes: 'Iron + folate' },
  { name: 'Broccoli',               category: 'veg',      base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 34,  protein_g: 2.8,  fiber_g: 2.6, carbs_g: 4.5, fat_g: 0.4, gi: 'low',  notes: 'Cruciferous, anticancer' },
  { name: 'Lauki (bottle gourd)',   category: 'veg',      base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 15,  protein_g: 0.6,  fiber_g: 1.2, carbs_g: 2.5, fat_g: 0.1, gi: 'low',  notes: 'Excellent blood sugar control' },
  { name: 'Methi leaves',           category: 'veg',      base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 49,  protein_g: 4.4,  fiber_g: 7.2, carbs_g: 5.8, fat_g: 0.9, gi: 'low',  notes: 'Best vegetable for diabetes' },
  { name: 'Capsicum / bell pepper', category: 'veg',      base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 26,  protein_g: 1,    fiber_g: 1.7, carbs_g: 4.6, fat_g: 0.3, gi: 'low',  notes: 'Vitamin C' },
  { name: 'Mushrooms',              category: 'veg',      base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 22,  protein_g: 3.1,  fiber_g: 1,   carbs_g: 2.3, fat_g: 0.3, gi: 'low',  notes: 'Vitamin D' },
  { name: 'Tomato',                 category: 'veg',      base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 18,  protein_g: 0.9,  fiber_g: 1.2, carbs_g: 3.1, fat_g: 0.2, gi: 'low',  notes: 'Lycopene antioxidant' },
  { name: 'Cucumber',               category: 'veg',      base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 15,  protein_g: 0.7,  fiber_g: 0.5, carbs_g: 2.2, fat_g: 0.1, gi: 'low',  notes: 'Hydrating, very low cal' },
  // ── FRUITS (per 100g) ──
  { name: 'Guava',                  category: 'fruit',    base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 68,  protein_g: 2.6,  fiber_g: 5.4, carbs_g: 11,  fat_g: 1,   gi: 'low',  notes: 'Very low GI + Vitamin C' },
  { name: 'Mixed berries',          category: 'fruit',    base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 57,  protein_g: 0.7,  fiber_g: 2.4, carbs_g: 12,  fat_g: 0.3, gi: 'low',  notes: 'Antioxidants + low GI' },
  { name: 'Green apple (with peel)',category: 'fruit',    base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 52,  protein_g: 0.3,  fiber_g: 2.4, carbs_g: 11,  fat_g: 0.2, gi: 'low',  notes: 'Pectin slows glucose absorption' },
  { name: 'Kiwi',                   category: 'fruit',    base_unit: 'g',     base_amount: 100, serving: '100g',                  cal: 61,  protein_g: 1.1,  fiber_g: 3,   carbs_g: 12,  fat_g: 0.5, gi: 'low',  notes: 'Low GI + Vitamin C' },
  // ── SNACKS ──
  { name: 'Almond',                 category: 'snack',    base_unit: 'piece', base_amount: 1,   serving: '1 almond (1.2g)',       cal: 7,   protein_g: 0.25, fiber_g: 0.15,carbs_g: 0.25,fat_g: 0.6, gi: 'low',  notes: 'Healthy fat + protein' },
  { name: 'Walnut half',            category: 'snack',    base_unit: 'piece', base_amount: 1,   serving: '1 half (5g)',           cal: 33,  protein_g: 0.7,  fiber_g: 0.3, carbs_g: 0.7, fat_g: 3,   gi: 'low',  notes: 'Omega-3' },
  { name: 'Roasted chana',          category: 'snack',    base_unit: 'g',     base_amount: 30,  serving: '30g (¼ cup)',           cal: 90,  protein_g: 5,    fiber_g: 4,   carbs_g: 12,  fat_g: 1,   gi: 'low',  notes: 'High-fibre snack' },
  { name: 'Chia seeds',             category: 'snack',    base_unit: 'g',     base_amount: 10,  serving: '10g (1 tbsp)',          cal: 49,  protein_g: 1.7,  fiber_g: 3.4, carbs_g: 2.3, fat_g: 3.1, gi: 'low',  notes: 'Omega-3 + soluble fibre' },
  { name: 'Flaxseeds',              category: 'snack',    base_unit: 'g',     base_amount: 10,  serving: '10g (1 tbsp)',          cal: 53,  protein_g: 1.9,  fiber_g: 2.8, carbs_g: 1.5, fat_g: 4.3, gi: 'low',  notes: 'Omega-3 + lignan' },
  { name: 'Pumpkin seeds',          category: 'snack',    base_unit: 'g',     base_amount: 10,  serving: '10g',                   cal: 56,  protein_g: 2.5,  fiber_g: 0.6, carbs_g: 1.7, fat_g: 4.5, gi: 'low',  notes: 'Magnesium for insulin sensitivity' },
  // ── BEVERAGES (per 100ml) ──
  { name: 'Green tea',              category: 'beverage', base_unit: 'ml',    base_amount: 100, serving: '100ml',                 cal: 1,   protein_g: 0,    fiber_g: 0,   carbs_g: 0,   fat_g: 0,   gi: 'low',  notes: 'Boosts insulin sensitivity' },
  { name: 'Methi (fenugreek) water',category: 'beverage', base_unit: 'ml',    base_amount: 100, serving: '100ml',                 cal: 3,   protein_g: 0.1,  fiber_g: 0.1, carbs_g: 0.5, fat_g: 0,   gi: 'low',  notes: 'Proven blood sugar reducer' },
  { name: 'Coconut water',          category: 'beverage', base_unit: 'ml',    base_amount: 100, serving: '100ml',                 cal: 19,  protein_g: 0.7,  fiber_g: 1,   carbs_g: 3.7, fat_g: 0.2, gi: 'low',  notes: 'Electrolytes, moderate sugar' },
];

function seedDatabase() {
  initDatabase();
  const db = new Database(DB_PATH);
  
  const existing = db.prepare('SELECT COUNT(*) as c FROM foods WHERE is_default = 1').get();
  if (existing.c > 0) {
    console.log(`ℹ️  ${existing.c} default foods already seeded. Skipping.`);
    db.close();
    return;
  }

  const insert = db.prepare(`
    INSERT INTO foods (id, user_id, name, category, base_unit, base_amount, serving,
      cal, protein_g, fiber_g, carbs_g, fat_g, gi, notes, is_default)
    VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const insertMany = db.transaction((foods) => {
    for (const f of foods) {
      insert.run(
        uuidv4(), f.name, f.category, f.base_unit, f.base_amount, f.serving,
        f.cal, f.protein_g, f.fiber_g, f.carbs_g, f.fat_g, f.gi, f.notes
      );
    }
  });

  insertMany(DEFAULT_FOODS);
  console.log(`✅ Seeded ${DEFAULT_FOODS.length} default foods`);
  db.close();
}

module.exports = { seedDatabase };

if (require.main === module) {
  seedDatabase();
}
