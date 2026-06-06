const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { checkBarcodeLimit } = require('../middleware/tier');

function n(nutriments, key) {
  const value = nutriments?.[key];
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function mapProduct(product, barcode) {
  const nutriments = product.nutriments || {};
  const quantity = product.serving_quantity || 100;
  const unit = String(product.serving_quantity_unit || product.product_quantity_unit || 'g').toLowerCase();
  const baseUnit = unit.includes('ml') ? 'ml' : 'g';

  return {
    barcode,
    name: product.product_name || product.generic_name || `Barcode ${barcode}`,
    brand: product.brands || '',
    image_url: product.image_front_small_url || product.image_url || '',
    ingredients_text: product.ingredients_text || '',
    serving: product.serving_size || `100${baseUnit}`,
    food: {
      name: product.product_name || product.generic_name || `Barcode ${barcode}`,
      category: 'custom',
      base_unit: baseUnit,
      base_amount: 100,
      serving: product.serving_size || `100${baseUnit}`,
      cal: Math.round(n(nutriments, 'energy-kcal_100g') || n(nutriments, 'energy-kcal')),
      protein_g: Math.round(n(nutriments, 'proteins_100g') * 10) / 10,
      fiber_g: Math.round(n(nutriments, 'fiber_100g') * 10) / 10,
      carbs_g: Math.round(n(nutriments, 'carbohydrates_100g') * 10) / 10,
      fat_g: Math.round(n(nutriments, 'fat_100g') * 10) / 10,
      sugar_g: Math.round(n(nutriments, 'sugars_100g') * 10) / 10,
      sodium_mg: Math.round((n(nutriments, 'sodium_100g') || n(nutriments, 'sodium')) * 1000),
      gi: 'unknown',
      notes: product.nutriscore_grade ? `Open Food Facts · Nutri-Score ${String(product.nutriscore_grade).toUpperCase()}` : 'Open Food Facts barcode import',
    },
    raw: {
      code: product.code,
      nutriscore_grade: product.nutriscore_grade || '',
      nova_group: product.nova_group || '',
      quantity,
    },
  };
}

router.get('/:barcode', authMiddleware, checkBarcodeLimit, async (req, res) => {
  const barcode = String(req.params.barcode || '').replace(/\D/g, '');
  if (!barcode || barcode.length < 6) return res.status(400).json({ error: 'Valid barcode required' });

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NutriTrack/1.0 (local nutrition tracker)',
        Accept: 'application/json',
      },
    });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: 'Open Food Facts lookup failed' });
    if (data.status !== 1 || !data.product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: mapProduct(data.product, barcode) });
  } catch (e) {
    res.status(502).json({ error: e.message || 'Barcode lookup failed' });
  }
});

module.exports = router;
