"""
Cart Optimizer — Final cart assembly with delivery estimates,
category grouping, confidence scoring, and time-saved metrics.
"""

CATEGORY_LABELS = {
    "snacks": "🍿 Snacks",
    "beverages": "🥤 Drinks",
    "dairy": "🥛 Dairy",
    "bakery": "🍞 Bakery",
    "baby": "👶 Baby Care",
    "emergency": "⚡ Emergency",
    "personal_care": "🧴 Personal Care",
    "stationery": "📚 Stationery",
    "cleaning": "🧹 Cleaning",
    "kitchen": "🍳 Kitchen",
    "electronics": "🔌 Electronics",
}


def group_by_category(products: list) -> dict:
    """Group products into named display bundles for the frontend."""
    groups = {}
    for p in products:
        cat = p.get("category", "general")
        label = CATEGORY_LABELS.get(cat, "🛒 Other")
        groups.setdefault(label, []).append(p)
    return groups


def _confidence_label(score: float) -> str:
    if score >= 85:
        return "Very confident"
    if score >= 70:
        return "Confident"
    if score >= 55:
        return "Fairly confident"
    return "Not sure — be more specific"


def _confidence_color(score: float) -> str:
    if score >= 85:
        return "green"
    if score >= 70:
        return "blue"
    if score >= 55:
        return "yellow"
    return "red"


def build_cart(products: list, intent: dict) -> dict:
    """
    Build optimized cart from recommended products.
    Confidence = average match score × 100 across all items.
    """
    total = sum(p["price_inr"] for p in products)

    scores = [p.get("_score", 0) for p in products]
    confidence = round((sum(scores) / max(len(scores), 1)) * 100, 1)

    return {
        "items": products,
        "groups": group_by_category(products),
        "total_inr": total,
        "item_count": len(products),
        "situation": intent.get("situation", ""),
        "occasion": intent.get("occasion", "general"),
        "urgency": intent.get("urgency", "medium"),
        "estimated_delivery_min": 10 if intent.get("urgency") == "high" else 20,
        "confidence": confidence,
        "confidence_label": _confidence_label(confidence),
        "confidence_color": _confidence_color(confidence),
        "time_saved_sec": 285,  # Traditional ≈ 5 min (300s), QuickCart ≈ 15s
        "time_saved_label": "You saved ~4 min 45 sec vs traditional search",
    }
