"""
Smart Bundle Engine — Gap detection and occasion-aware cart completion.
Runs AFTER recommendation_engine scoring, BEFORE cart_optimizer.
"""

# Required category slots per occasion: (category, min_count, label)
OCCASION_BUNDLES = {
    "party": [
        ("snacks", 2, "party snacks"),
        ("beverages", 2, "drinks for guests"),
        ("kitchen", 1, "serving essentials"),
    ],
    "movie_night": [
        ("snacks", 2, "movie snacks"),
        ("beverages", 1, "drinks"),
    ],
    "breakfast": [
        ("dairy", 1, "dairy"),
        ("bakery", 1, "bread or eggs"),
        ("beverages", 1, "morning drink"),
    ],
    "baby_care": [
        ("baby", 2, "baby essentials"),
        ("personal_care", 1, "hygiene"),
    ],
    "emergency": [
        ("emergency", 2, "emergency supplies"),
    ],
    "power_cut": [
        ("emergency", 2, "power cut essentials"),
    ],
    "rain": [
        ("emergency", 1, "rain protection"),
        ("personal_care", 1, "hygiene"),
    ],
    "exam": [
        ("stationery", 2, "study supplies"),
        ("beverages", 1, "energy or coffee"),
        ("snacks", 1, "study snacks"),
    ],
    "general": [
        ("snacks", 1, "snacks"),
        ("beverages", 1, "drinks"),
    ],
}


def detect_gaps(products: list, occasion: str) -> list:
    """Returns list of gap dicts for missing required categories."""
    required = OCCASION_BUNDLES.get(occasion, OCCASION_BUNDLES["general"])
    counts = {}
    for p in products:
        cat = p.get("category", "")
        counts[cat] = counts.get(cat, 0) + 1

    gaps = []
    for (category, min_count, label) in required:
        if counts.get(category, 0) < min_count:
            gaps.append({
                "category": category,
                "needed": min_count - counts.get(category, 0),
                "label": label,
            })
    return gaps


def fill_gaps(gaps: list, existing_ids: set, catalog: list, intent: dict) -> tuple:
    """Inject best-scoring products from catalog to fill each gap."""
    from services.recommendation_engine import score_product

    injected = []
    insights = []

    for gap in gaps:
        category = gap["category"]
        needed = gap["needed"]
        label = gap["label"]

        candidates = sorted(
            [
                p for p in catalog
                if p.get("category") == category
                and p.get("in_stock")
                and p["id"] not in existing_ids
            ],
            key=lambda p: score_product(p, intent, {}, None),
            reverse=True,
        )

        added = []
        for p in candidates[:needed]:
            injected.append({
                **p,
                "_injected": True,
                "_score": score_product(p, intent, {}, None),
            })
            existing_ids.add(p["id"])
            added.append(p["name"].split()[0])

        if added:
            insights.append({
                "message": f"Added {', '.join(added)} — {label} is essential for this.",
                "category": category,
                "label": label,
                "count": len(added),
            })

    return injected, insights


def apply_bundles(products: list, intent: dict, catalog: list) -> dict:
    """
    Main entry point called from recommendation_engine.
    Returns enriched result dict with bundle metadata.
    """
    occasion = intent.get("occasion", "general")
    gaps = detect_gaps(products, occasion)

    if not gaps:
        return {
            "products": products,
            "insights": [],
            "gaps_filled": 0,
            "was_complete": True,
        }

    existing_ids = {p["id"] for p in products}
    injected, insights = fill_gaps(gaps, existing_ids, catalog, intent)
    merged = (products + injected)[:10]

    return {
        "products": merged,
        "insights": insights,
        "gaps_filled": len(injected),
        "was_complete": False,
    }
