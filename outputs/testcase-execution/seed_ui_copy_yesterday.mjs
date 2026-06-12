const API = "https://vitanudge-api.onrender.com/api";
const email = "qa-ui-1781267461920@example.com";
const password = "Retest2026!";

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

const login = await request("/auth/login", {
  method: "POST",
  body: { email, password },
});
if (login.status !== 200) throw new Error(`Login failed: ${login.status}`);

const foods = await request("/foods?search=Green%20apple", { token: login.body.token });
const food = foods.body.foods?.[0];
if (!food) throw new Error("Green apple fixture was not found");

const created = [];
for (const [meal_type, qty] of [["dinner", 100], ["lunch", 50]]) {
  created.push(await request("/meals", {
    method: "POST",
    token: login.body.token,
    body: {
      food_id: food.id,
      meal_type,
      log_date: "2026-06-11",
      qty,
      unit: "g",
    },
  }));
}

console.log(JSON.stringify(created));
