// Lightweight on-device personalization (localStorage). No backend needed.

const NAME_KEY = "qc_user_name";
const PURCH_KEY = "qc_purchases";

export function getUserName() {
  return localStorage.getItem(NAME_KEY) || "Aman";
}
export function setUserName(name) {
  if (name && name.trim()) localStorage.setItem(NAME_KEY, name.trim());
}

export function getPurchases() {
  try {
    return JSON.parse(localStorage.getItem(PURCH_KEY)) || {};
  } catch {
    return {};
  }
}

export function recordPurchase(items = []) {
  const p = getPurchases();
  const now = Date.now();
  items.forEach((it) => {
    const e = p[it.id] || { count: 0, name: it.name, category: it.category, price: it.price_inr, image_url: it.image_url };
    e.count += 1;
    e.lastTs = now;
    e.name = it.name;
    e.category = it.category;
    e.price = it.price_inr;
    e.image_url = it.image_url;
    p[it.id] = e;
  });
  localStorage.setItem(PURCH_KEY, JSON.stringify(p));
}

// Items bought 2+ times = "your usual"
export function getUsualIds() {
  const p = getPurchases();
  return new Set(Object.keys(p).filter((id) => (p[id]?.count || 0) >= 2));
}

// Buddy reorder nudges: most-frequently bought essentials, "running low?"
export function getReorderNudges(limit = 2) {
  const p = getPurchases();
  return Object.entries(p)
    .filter(([, e]) => (e.count || 0) >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([id, e]) => ({ id, ...e }));
}

// Simple price-sensitivity signal: does the user lean toward cheaper picks?
export function pricePreferenceNote() {
  const p = getPurchases();
  const prices = Object.values(p).map((e) => e.price).filter(Boolean);
  if (prices.length < 3) return null;
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  if (avg <= 45) return "You usually pick value brands — we've prioritized those.";
  return null;
}


// --- Consumption-rate depletion engine ---
// Typical "days until you run out" by category/keyword (household-scale guess).
const SHELF_LIFE_DAYS = {
  milk: 3, bread: 4, eggs: 7, butter: 14, dairy: 5,
  vegetables: 4, juice: 6, beverages: 10, snacks: 12,
  baby: 6, diaper: 8, personal_care: 30, cleaning: 30,
  kitchen: 30, stationery: 60, emergency: 90, bakery: 5,
};

function shelfLifeFor(item) {
  const name = (item.name || "").toLowerCase();
  for (const key of Object.keys(SHELF_LIFE_DAYS)) {
    if (name.includes(key)) return SHELF_LIFE_DAYS[key];
  }
  return SHELF_LIFE_DAYS[item.category] || 14;
}

const DAY = 86400000;

// Seed a few backdated staples once, so the depletion demo works on first run.
export function seedDemoHistory() {
  if (localStorage.getItem("qc_seeded")) return;
  const p = getPurchases();
  if (Object.keys(p).length === 0) {
    const now = Date.now();
    p["P008"] = { count: 4, name: "Amul Milk 500ml", category: "dairy", price: 28, lastTs: now - 3 * DAY };
    p["P004"] = { count: 2, name: "Britannia Bread 400g", category: "bakery", price: 35, lastTs: now - 4 * DAY };
    localStorage.setItem("qc_purchases", JSON.stringify(p));
  }
  localStorage.setItem("qc_seeded", "1");
}

export function getDepletionAlerts(limit = 3) {
  const p = getPurchases();
  const now = Date.now();
  const out = [];
  for (const [id, e] of Object.entries(p)) {
    if (!e.lastTs) continue;
    const life = shelfLifeFor(e);
    const daysSince = (now - e.lastTs) / DAY;
    const daysLeft = Math.round(life - daysSince);
    if (daysLeft <= 2) {
      out.push({
        id, name: e.name, category: e.category, price: e.price, image_url: e.image_url,
        daysLeft: Math.max(daysLeft, 0),
      });
    }
  }
  return out.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, limit);
}

// --- Weekly budget envelope ---
const WEEK = 7 * DAY;

export function getWeeklyBudget() {
  const raw = localStorage.getItem("qc_week_budget");
  return raw ? Number(raw) : null;
}
export function setWeeklyBudget(amount) {
  localStorage.setItem("qc_week_budget", String(amount));
  localStorage.setItem("qc_week_start", String(Date.now()));
  localStorage.setItem("qc_week_spent", "0");
}
export function getWeeklySpent() {
  const start = Number(localStorage.getItem("qc_week_start") || 0);
  if (Date.now() - start > WEEK) {
    localStorage.setItem("qc_week_spent", "0");
    localStorage.setItem("qc_week_start", String(Date.now()));
    return 0;
  }
  return Number(localStorage.getItem("qc_week_spent") || 0);
}
export function addWeeklySpend(amount) {
  const cur = getWeeklySpent();
  localStorage.setItem("qc_week_spent", String(cur + amount));
}
