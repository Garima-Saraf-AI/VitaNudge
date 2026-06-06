export function calcMacros(food, qty, unit) {
  const base = food.base_amount;
  let mult = 0;
  if (unit === 'g' || unit === 'ml')              mult = qty / base;
  else if (unit === 'piece' || unit === 'serving') mult = qty;
  else if (unit === 'cup')                        mult = (qty * 240) / base;
  else if (unit === 'tbsp')                       mult = (qty * 15) / base;
  else                                            mult = qty / base;

  return {
    cal:       Math.round(food.cal * mult),
    protein_g: Math.round(food.protein_g * mult * 10) / 10,
    fiber_g:   Math.round(food.fiber_g * mult * 10) / 10,
    carbs_g:   Math.round(food.carbs_g * mult * 10) / 10,
    fat_g:     Math.round(food.fat_g * mult * 10) / 10,
    mult:      Math.round(mult * 1000) / 1000,
  };
}

export function defaultUnit(food) {
  if (food.base_unit === 'piece') return 'piece';
  if (food.base_unit === 'serving') return 'serving';
  if (food.base_unit === 'ml')    return 'ml';
  return 'g';
}

export function defaultQty(food) {
  if (food.base_unit === 'piece') return 1;
  return food.base_amount;
}

export function availableUnits(food) {
  const all = [
    { v: 'g',       l: 'Grams (g)' },
    { v: 'ml',      l: 'Millilitres (ml)' },
    { v: 'piece',   l: 'Pieces / count' },
    { v: 'serving', l: 'Servings' },
    { v: 'cup',     l: 'Cups (240ml)' },
    { v: 'tbsp',    l: 'Tablespoons (15g)' },
  ];
  if (food.base_unit === 'piece') return all.filter(u => ['piece','g','serving'].includes(u.v));
  if (food.base_unit === 'serving') return all.filter(u => ['serving','g'].includes(u.v));
  if (food.base_unit === 'ml')    return all.filter(u => ['ml','cup','tbsp','serving'].includes(u.v));
  return all.filter(u => ['g','tbsp','cup','serving'].includes(u.v));
}

export function amtLabel(qty, unit, food) {
  if (unit === 'g')       return `${qty}g`;
  if (unit === 'ml')      return `${qty}ml`;
  if (unit === 'piece')   return `${qty} ${food?.base_unit || 'piece'}${qty !== 1 ? 's' : ''}`;
  if (unit === 'serving') return `${qty} srv`;
  if (unit === 'cup')     return `${qty} cup`;
  if (unit === 'tbsp')    return `${qty} tbsp`;
  return `${qty}`;
}

export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function today() {
  return dateKey(new Date());
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function shortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dateKey(d));
  }
  return days;
}

export function glucoseZone(val) {
  if (val < 70)   return { label: 'Low',         cls: 'zone-low' };
  if (val <= 99)  return { label: 'Normal',       cls: 'zone-normal' };
  if (val <= 125) return { label: 'Pre-diabetic', cls: 'zone-pre' };
  return             { label: 'High',          cls: 'zone-high' };
}
