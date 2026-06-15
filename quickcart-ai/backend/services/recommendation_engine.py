"""
Recommendation Engine — Product scoring and ranking.
Scoring formula: intent×0.5 + budget×0.3 + availability×0.1 + rating×0.1
"""
import json
from pathlib import Path

# Load product catalog
catalog_path = Path(__file__).parent.parent / "data" / "products.json"
with open(catalog_path) as f:
    CATALOG = json.load(f)


def score_product(product: dict, intent: dict, user_profile: dict, weights: dict = None) -> float:
    """
    Score a product against extracted intent and user profile.
    Higher score = better match.
    """
    w = weights or {"intent": 0.5, "budget": 0.3, "availability": 0.1, "rating": 0.1}
    score = 0.0

    # Intent match (customizable weight)
    intent_tags = set(intent.get("product_categories", []) + [intent.get("occasion", "")] + intent.get("keywords", []))
    product_tags = set(product.get("tags", []))
    tag_overlap = len(intent_tags & product_tags) / max(len(intent_tags), 1)
    score += tag_overlap * w["intent"]

    # Budget fit (customizable weight)
    budget = intent.get("budget_inr")
    if budget:
        per_person_budget = budget / max(intent.get("people_count", 1), 1)
        if product["price_inr"] <= per_person_budget:
            score += w["budget"]
        elif product["price_inr"] <= per_person_budget * 1.3:
            score += w["budget"] * 0.5
    else:
        score += w["budget"]  # no budget = full score

    # Availability (customizable weight)
    if product.get("in_stock"):
        score += w["availability"]

    # Rating signal (customizable weight)
    score += (product.get("rating", 3.0) / 5.0) * w["rating"]

    return round(score, 4)


def diversify(scored_list: list, max_items: int, max_per_category: int = 3) -> list:
    """
    Ensure category diversity in the top results.
    Caps any single category at `max_per_category` items.
    """
    seen_categories = {}
    result = []
    for item in scored_list:
        cat = item.get("category", "general")
        count = seen_categories.get(cat, 0)
        if count < max_per_category:
            result.append(item)
            seen_categories[cat] = count + 1
        if len(result) >= max_items:
            break
    return result


def recommend(intent: dict, user_profile: dict, max_items: int = 8, weights: dict = None) -> list:
    """
    Recommend top products based on intent and profile.
    Returns sorted list of products with _score and _reason fields.
    """
    scored = []
    for product in CATALOG:
        if not product.get("in_stock"):
            continue
        s = score_product(product, intent, user_profile, weights)
        if s > 0:
            scored.append({**product, "_score": s})

    scored.sort(key=lambda x: x["_score"], reverse=True)

    # Enforce category diversity — no more than 3 items from one category
    top = diversify(scored, max_items)

    # --- SMART BUNDLE ENGINE: fill missing essential categories ---
    from services.bundle_engine import apply_bundles
    bundle_result = apply_bundles(top, intent, CATALOG)
    top = bundle_result["products"]
    bundle_meta = {
        "bundle_insights": bundle_result["insights"],
        "gaps_filled": bundle_result["gaps_filled"],
        "was_complete": bundle_result["was_complete"],
    }

    # Generate ALL reasons in a SINGLE LLM call (rate-limit friendly)
    from services.intent_engine import generate_reasons_batch
    reasons = generate_reasons_batch(intent, top)
    for product in top:
        product["_reason"] = reasons.get(product["id"], "")

    # Carrier object passes bundle meta up to the router (popped before build_cart)
    top.append({"__bundle_meta": True, **bundle_meta})
    return top
