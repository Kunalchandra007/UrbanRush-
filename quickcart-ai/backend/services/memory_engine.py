"""
Situational memory: stores past (situation -> cart) pairs and finds the closest
match for a new situation. Pure in-memory for demo (resets on server restart).
"""
from datetime import datetime

SITUATION_HISTORY = []


def record_situation(intent: dict, cart: dict):
    """Call after every successful cart build."""
    SITUATION_HISTORY.append({
        "timestamp": datetime.now().isoformat(),
        "occasion": intent.get("occasion"),
        "urgency": intent.get("urgency"),
        "hour": datetime.now().hour,
        "weekday": datetime.now().weekday(),
        "item_ids": [item["id"] for item in cart["items"][:5]],
        "item_names": [item["name"] for item in cart["items"][:5]],
        "total_inr": cart["total_inr"],
    })
    if len(SITUATION_HISTORY) > 20:
        SITUATION_HISTORY.pop(0)


def find_similar_situation(intent: dict):
    """Same occasion, or same time-of-day bucket + similar urgency."""
    current_occasion = intent.get("occasion")
    current_bucket = datetime.now().hour // 4  # 6 buckets of 4 hours

    best_match = None
    for past in reversed(SITUATION_HISTORY):
        if past["occasion"] == current_occasion:
            return past
        if past["hour"] // 4 == current_bucket and past["urgency"] == intent.get("urgency"):
            best_match = past
    return best_match


def get_replay_suggestion(intent: dict):
    """Returns a suggestion banner payload, or None if no good match."""
    match = find_similar_situation(intent)
    if not match:
        return None
    occasion = (match.get("occasion") or "shopping").replace("_", " ")
    return {
        "message": f"Last time you had a similar {occasion} situation — you ordered:",
        "item_names": match["item_names"],
        "total_inr": match["total_inr"],
        "match_occasion": match["occasion"],
    }
