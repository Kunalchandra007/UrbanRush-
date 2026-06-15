// Relevant emoji + category tint per product — reliable, instant, never broken.

const EMOJI_RULES = [
  [["popcorn"], "🍿"],
  [["lay", "kurkure", "bingo", "chips", "namkeen", "wafer", "bhujia"], "🍟"],
  [["red bull", "redbull", "sting", "monster", "energy"], "🧃"],
  [["frooti", "maaza", "slice", "tropicana", "juice"], "🧃"],
  [["coke", "coca", "pepsi", "sprite", "fanta", "thums", "mirinda", "limca", "7up", "cola", "soda"], "🥤"],
  [["ice cream", "icecream", "kulfi", "cornetto"], "🍦"],
  [["paneer", "cheese"], "🧀"],
  [["dahi", "curd", "yogurt", "yoghurt", "lassi"], "🥛"],
  [["butter", "ghee"], "🧈"],
  [["milk"], "🥛"],
  [["egg"], "🥚"],
  [["bread", "bun", "pav", "rusk"], "🍞"],
  [["cake", "pastry", "muffin", "croissant"], "🧁"],
  [["biscuit", "cookie", "oreo", "marie", "bourbon", "parle", "dark fantasy", "good day"], "🍪"],
  [["maggi", "noodle", "pasta", "ramen", "yippee"], "🍜"],
  [["kitkat", "dairy milk", "5 star", "munch", "perk", "chocolate", "cadbury"], "🍫"],
  [["candy", "toffee", "gum", "lollipop", "mint", "eclair"], "🍬"],
  [["nescafe", "bru", "coffee"], "☕"],
  [["tea", "chai", "tetley", "red label", "taj mahal"], "🍵"],
  [["diaper", "pampers", "huggies"], "🧷"],
  [["cerelac", "infant", "baby food", "wipes", "baby"], "🍼"],
  [["ors", "electrolyte"], "💧"],
  [["thermometer"], "🌡️"],
  [["bandage", "band-aid", "bandaid"], "🩹"],
  [["sanitizer"], "🧴"],
  [["mask"], "😷"],
  [["crocin", "dolo", "paracetamol", "tablet", "medicine", "syrup", "drops", "vicks", "balm", "capsule"], "💊"],
  [["torch", "flashlight", "lantern", "emergency light", "led light"], "🔦"],
  [["battery", "duracell", "eveready"], "🔋"],
  [["candle"], "🕯️"],
  [["matchbox", "matches", "lighter"], "🔥"],
  [["umbrella"], "☂️"],
  [["raincoat"], "🧥"],
  [["notebook", "notepad", "diary", "register", "exam pad"], "📓"],
  [["pencil"], "✏️"],
  [["marker", "highlighter"], "🖍️"],
  [["eraser", "sharpener", "stapler", "scale", "geometry"], "📐"],
  [["pen"], "🖊️"],
  [["shampoo"], "🧴"],
  [["toothpaste", "toothbrush", "colgate", "oral"], "🪥"],
  [["deodorant", "perfume", "axe", "deo"], "🧴"],
  [["lotion", "cream", "moisturizer", "nivea", "vaseline"], "🧴"],
  [["soap", "handwash", "bodywash", "facewash", "dettol", "lifebuoy"], "🧼"],
  [["detergent", "surf", "ariel", "tide", "rin", "wheel"], "🧺"],
  [["harpic", "lizol", "phenyl", "floor cleaner", "toilet"], "🧹"],
  [["vim", "dishwash", "scrub"], "🧽"],
  [["water", "bisleri", "aquafina", "kinley", "mineral"], "💧"],
  [["rice", "basmati"], "🍚"],
  [["atta", "flour", "maida"], "🌾"],
  [["dal", "pulse", "lentil", "rajma", "chana"], "🫘"],
  [["sugar"], "🥄"],
  [["salt"], "🧂"],
  [["oil", "refined"], "🫒"],
  [["plate", "cup", "napkin", "tissue", "spoon", "fork", "disposable", "glass", "foil"], "🍽️"],
];

const CATEGORY_EMOJI = {
  snacks: "🍿", beverages: "🥤", dairy: "🥛", bakery: "🍞", baby: "👶",
  emergency: "⚡", personal_care: "🧴", stationery: "📚", cleaning: "🧹",
  kitchen: "🍳", electronics: "🔌", general: "🛒",
};

export const CATEGORY_TINT = {
  snacks: "from-orange-50 to-amber-100",
  beverages: "from-sky-50 to-blue-100",
  dairy: "from-purple-50 to-fuchsia-100",
  bakery: "from-amber-50 to-yellow-100",
  baby: "from-pink-50 to-rose-100",
  emergency: "from-red-50 to-rose-100",
  personal_care: "from-green-50 to-emerald-100",
  stationery: "from-cyan-50 to-sky-100",
  cleaning: "from-teal-50 to-emerald-100",
  kitchen: "from-orange-50 to-red-100",
  electronics: "from-indigo-50 to-violet-100",
  general: "from-slate-50 to-blue-100",
};

export function getProductEmoji(item) {
  const hay = `${item.name || ""} ${(item.tags || []).join(" ")} ${item.brand || ""}`.toLowerCase();
  for (const [keys, emoji] of EMOJI_RULES) {
    if (keys.some((k) => hay.includes(k))) return emoji;
  }
  return CATEGORY_EMOJI[item.category] || "🛒";
}

export function getCategoryTint(item) {
  return CATEGORY_TINT[item.category] || CATEGORY_TINT.general;
}
