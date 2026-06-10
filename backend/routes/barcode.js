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

  // BUGFIX: Use actual serving quantity instead of hardcoded 100
  // Example: Coca-Cola 330ml can should be base_amount: 330, not 100
  const baseAmount = quantity || 100;

  // BUGFIX: Scale nutrition from per-100g to actual serving size
  // Open Food Facts provides *_100g values (per 100g/100ml)
  // We need to scale them to the actual serving size
  const scaleFactor = baseAmount / 100;

  // BUGFIX: Ensure serving text matches base_unit to avoid confusion
  // Example: Don't show "330ml" when base_unit is 'g'
  const normalizedServing = `${baseAmount}${baseUnit}`;

  return {
    barcode,
    name: product.product_name || product.generic_name || `Barcode ${barcode}`,
    brand: product.brands || '',
    image_url: product.image_front_small_url || product.image_url || '',
    ingredients_text: product.ingredients_text || '',
    serving: normalizedServing,  // Use normalized serving instead of Open Food Facts text
    food: {
      name: product.product_name || product.generic_name || `Barcode ${barcode}`,
      category: 'custom',
      base_unit: baseUnit,
      base_amount: baseAmount,  // FIX: Use actual quantity
      serving: normalizedServing,  // Consistent with base_unit
      cal: Math.round((n(nutriments, 'energy-kcal_100g') || n(nutriments, 'energy-kcal')) * scaleFactor),
      protein_g: Math.round(n(nutriments, 'proteins_100g') * scaleFactor * 10) / 10,
      fiber_g: Math.round(n(nutriments, 'fiber_100g') * scaleFactor * 10) / 10,
      carbs_g: Math.round(n(nutriments, 'carbohydrates_100g') * scaleFactor * 10) / 10,
      fat_g: Math.round(n(nutriments, 'fat_100g') * scaleFactor * 10) / 10,
      sugar_g: Math.round(n(nutriments, 'sugars_100g') * scaleFactor * 10) / 10,
      sodium_mg: Math.round((n(nutriments, 'sodium_100g') || n(nutriments, 'sodium')) * scaleFactor * 1000),
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
