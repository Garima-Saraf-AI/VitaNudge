const test = require('node:test');
const assert = require('node:assert/strict');
const foods = require('../database/default-foods-usda.json');

const CATEGORIES = new Set(['protein', 'dairy', 'legume', 'grain', 'veg', 'fruit', 'snack', 'beverage']);

test('USDA default library contains 300 unique, traceable foods', () => {
  assert.equal(foods.length, 300);
  assert.equal(new Set(foods.map(food => food.name.toLowerCase())).size, 300);
  assert.equal(new Set(foods.map(food => food.fdc_id)).size, 300);
});

test('USDA foods contain valid per-100g macros and source metadata', () => {
  for (const food of foods) {
    assert.ok(Number.isInteger(food.fdc_id) && food.fdc_id > 0, food.name);
    assert.ok(CATEGORIES.has(food.category), food.name);
    assert.equal(food.base_unit, 'g', food.name);
    assert.equal(food.base_amount, 100, food.name);
    assert.match(food.serving, /^100g/, food.name);
    assert.match(food.notes, new RegExp(`FDC ${food.fdc_id}`), food.name);

    for (const key of ['cal', 'protein_g', 'fiber_g', 'carbs_g', 'fat_g']) {
      assert.ok(Number.isFinite(food[key]), `${food.name}: ${key}`);
      assert.ok(food[key] >= 0, `${food.name}: ${key}`);
    }
  }
});

test('USDA library provides broad category coverage', () => {
  const counts = foods.reduce((result, food) => {
    result[food.category] = (result[food.category] || 0) + 1;
    return result;
  }, {});

  assert.ok(counts.fruit >= 40);
  assert.ok(counts.veg >= 60);
  assert.ok(counts.protein >= 50);
  assert.ok(counts.grain >= 35);
  assert.ok(counts.legume >= 25);
  assert.ok(counts.dairy >= 25);
  assert.ok(counts.snack >= 15);
  assert.ok(counts.beverage >= 10);
});
