"""
Lightweight per-user memory store (one JSON file per user_id on disk).
In production this becomes a DB table. Tracks name, dietary prefs, price tier,
favorite categories, frequent items, and the last 10 situations.
"""
import json
from datetime import datetime
from pathlib import Path

MEMORY_DIR = Path(__file__).parent.parent / "data" / "user_memory"
MEMORY_DIR.mkdir(parents=True, exist_ok=True)


def _path(user_id: str) -> Path:
    safe = "".join(c for c in (user_id or "guest") if c.isalnum() or c in ("_", "-"))
    return MEMORY_DIR / f"{safe or 'guest'}.json"


def get_profile(user_id: str = "guest") -> dict:
    path = _path(user_id)
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    default = {
        "user_id": user_id,
        "name": None,
        "dietary": [],
        "price_tier": "balanced",
        "favorite_categories": {},
        "frequent_items": {},
        "situation_history": [],
        "total_orders": 0,
        "created_at": datetime.now().isoformat(),
    }
    save_profile(user_id, default)
    return default


def save_profile(user_id: str, profile: dict):
    _path(user_id).write_text(json.dumps(profile, indent=2), encoding="utf-8")


def update_after_order(user_id: str, intent: dict, cart: dict):
    profile = get_profile(user_id)
    for item in cart["items"]:
        cat = item.get("category", "unknown")
        profile["favorite_categories"][cat] = profile["favorite_categories"].get(cat, 0) + 1
        profile["frequent_items"][item["id"]] = profile["frequent_items"].get(item["id"], 0) + 1

    prices = [item["price_inr"] for item in cart["items"]]
    if prices:
        avg = sum(prices) / len(prices)
        profile["price_tier"] = "budget" if avg < 40 else "balanced" if avg < 100 else "premium"

    profile["situation_history"].append({
        "occasion": intent.get("occasion"),
        "hour": datetime.now().hour,
        "weekday": datetime.now().weekday(),
        "item_ids": [i["id"] for i in cart["items"][:5]],
        "timestamp": datetime.now().isoformat(),
    })
    profile["situation_history"] = profile["situation_history"][-10:]
    profile["total_orders"] += 1
    save_profile(user_id, profile)
    return profile


def set_name(user_id: str, name: str):
    profile = get_profile(user_id)
    profile["name"] = name
    save_profile(user_id, profile)


def set_dietary(user_id: str, dietary_list: list):
    profile = get_profile(user_id)
    profile["dietary"] = dietary_list
    save_profile(user_id, profile)


def get_frequent_item_ids(user_id: str, limit: int = 5) -> list:
    profile = get_profile(user_id)
    items = profile.get("frequent_items", {})
    return [i for i, _ in sorted(items.items(), key=lambda x: x[1], reverse=True)[:limit]]


def set_preference(user_id: str, category: str, product_id: str):
    """Remember the user's preferred product for a category (from a manual switch)."""
    profile = get_profile(user_id)
    prefs = profile.setdefault("preferred", {})
    prefs[category] = product_id
    save_profile(user_id, profile)


def get_preferences(user_id: str) -> dict:
    return get_profile(user_id).get("preferred", {})
