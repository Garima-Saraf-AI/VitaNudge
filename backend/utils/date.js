const APP_TIME_ZONE = process.env.APP_TIME_ZONE || 'America/Chicago';

function normalizeTimeZone(timeZone) {
  const value = String(timeZone || '').trim();
  if (!value) return APP_TIME_ZONE;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return value;
  } catch {
    return APP_TIME_ZONE;
  }
}

function dateKey(date = new Date(), timeZone = APP_TIME_ZONE) {
  const safeTimeZone = normalizeTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function today(timeZone = APP_TIME_ZONE) {
  return dateKey(new Date(), timeZone);
}

function addDays(dateStr, n) {
  const [year, month, day] = String(dateStr || today()).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + n, 12));
  return dateKey(date, 'UTC');
}

module.exports = { APP_TIME_ZONE, addDays, dateKey, normalizeTimeZone, today };
