from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List as PyList, Any, Dict
from models.intent import IntentRequest, IntentResponse
from services.intent_engine import (
    extract_intent,
    generate_cart_summary,
    is_vague,
    get_clarification,
    extract_intent_stream,
    get_crisis_triage,
    get_followup,
)
from services.recommendation_engine import recommend
from services.cart_optimizer import build_cart
from services.context_engine import get_user_profile
from services.memory_engine import record_situation, get_replay_suggestion
from services.user_memory import (
    get_profile, update_after_order, get_frequent_item_ids, set_name, set_dietary,
    set_preference, get_preferences,
)
import base64
import re
import json as jsonlib

router = APIRouter(prefix="/intent", tags=["intent"])


def _violates_dietary(item: dict, dietary: list) -> bool:
    """Simple keyword-based dietary filter."""
    name = item.get("name", "").lower()
    tags = " ".join(item.get("tags", [])).lower()
    hay = f"{name} {tags}"
    if "vegetarian" in dietary and any(x in hay for x in ["chicken", "mutton", "fish", "egg", "meat"]):
        return True
    if "no nuts" in dietary and any(x in hay for x in ["almond", "cashew", "peanut", "walnut", "nut"]):
        return True
    if "vegan" in dietary and any(x in hay for x in ["milk", "butter", "cheese", "paneer", "curd", "ghee", "egg"]):
        return True
    return False


def _apply_profile(cart: dict, user_id: str) -> dict:
    """Silently apply dietary prefs + learned brand preferences + mark 'your usual'."""
    from services.cart_optimizer import group_by_category
    from services.recommendation_engine import CATALOG
    profile = get_profile(user_id)
    dietary = profile.get("dietary") or []
    if dietary:
        cart["items"] = [it for it in cart["items"] if not _violates_dietary(it, dietary)]

    # Learned brand preference: swap in the user's chosen product for a category
    prefs = get_preferences(user_id)
    if prefs:
        by_id = {p["id"]: p for p in CATALOG}
        present = {it["id"] for it in cart["items"]}
        for cat, pref_id in prefs.items():
            if pref_id in present or pref_id not in by_id:
                continue
            # replace the lowest-scoring same-category item with the preferred one
            idxs = [i for i, it in enumerate(cart["items"]) if it.get("category") == cat]
            if idxs:
                worst = min(idxs, key=lambda i: cart["items"][i].get("_score", 0))
                pref = {**by_id[pref_id], "_score": cart["items"][worst].get("_score", 0.7),
                        "_reason": "You preferred this brand last time", "_preferred": True}
                cart["items"][worst] = pref

    frequent = set(get_frequent_item_ids(user_id))
    for it in cart["items"]:
        it["_is_usual"] = it["id"] in frequent
    cart["total_inr"] = sum(i["price_inr"] for i in cart["items"])
    cart["item_count"] = len(cart["items"])
    cart["groups"] = group_by_category(cart["items"])
    return cart


def _profile_snippet(user_id: str) -> dict:
    p = get_profile(user_id)
    return {"name": p.get("name"), "total_orders": p.get("total_orders", 0), "price_tier": p.get("price_tier")}


def _finalize_cart(products: list, intent: dict) -> dict:
    """
    Shared post-processing: pop the bundle-meta carrier object that
    recommend() appends, build the cart, and attach bundle + summary metadata.
    """
    bundle_meta = {}
    if products and products[-1].get("__bundle_meta"):
        bundle_meta = products.pop()

    cart = build_cart(products, intent)
    cart["bundle_insights"] = bundle_meta.get("bundle_insights", [])
    cart["gaps_filled"] = bundle_meta.get("gaps_filled", 0)
    cart["was_complete"] = bundle_meta.get("was_complete", True)
    cart["ai_summary"] = generate_cart_summary(intent, [p["name"] for p in products])
    return cart


@router.post("/extract")
async def extract_and_build(
    req: IntentRequest,
    w_intent: float = 0.5,
    w_budget: float = 0.3,
    w_avail: float = 0.1,
    w_rating: float = 0.1,
):
    """
    Main endpoint: Extract intent from natural language and build cart.
    Supports custom scoring weights for live tuning demos.
    """
    # Step 1: Extract structured intent
    intent = extract_intent(req.user_input)

    # Step 1b: If the request is too vague, ask a clarifying question instead
    if is_vague(req.user_input, intent):
        return {
            "needs_clarification": True,
            "clarification": get_clarification(req.user_input),
            "intent": intent,
            "cart": None,
        }

    # Step 2: Get user context (mock for demo)
    user_profile = get_user_profile(req.user_id)

    # Step 3: Score and recommend products with custom weights
    products = recommend(intent, user_profile, weights={
        "intent": w_intent,
        "budget": w_budget,
        "availability": w_avail,
        "rating": w_rating,
    })

    # Step 4: Finalize (bundle meta + cart + summary)
    cart = _finalize_cart(products, intent)

    # Per-user memory: silent dietary filter + "your usual" marks
    cart = _apply_profile(cart, req.user_id)

    # Feature A (memory) + Feature E (triage)
    replay = get_replay_suggestion(intent)
    record_situation(intent, cart)
    triage = get_crisis_triage(intent)
    followup = get_followup(intent, req.user_input)
    update_after_order(req.user_id, intent, cart)

    return {
        "intent": intent,
        "cart": cart,
        "replay_suggestion": replay,
        "triage": triage,
        "followup": followup,
        "profile_snippet": _profile_snippet(req.user_id),
    }


@router.post("/analyze-image")
async def analyze_image_and_build(file: UploadFile = File(...)):
    """
    Accepts an image upload, analyzes the scene with Claude Vision,
    and returns a cart just like /extract does.
    """
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file.content_type} not supported. Use JPEG, PNG, or WebP."
        )

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="Image too large. Max 5MB.")

    image_b64 = base64.b64encode(contents).decode("utf-8")

    try:
        from services.vision_engine import analyze_scene_image
        intent = analyze_scene_image(image_b64, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision analysis failed: {str(e)}")

    user_profile = {}
    products = recommend(intent, user_profile)
    cart = _finalize_cart(products, intent)
    replay = get_replay_suggestion(intent)
    record_situation(intent, cart)

    return {
        "intent": intent,
        "cart": cart,
        "source": "camera",
        "scene_description": intent.get("scene_description", ""),
        "replay_suggestion": replay,
    }


class PanicRequest(BaseModel):
    city: str = "Unknown"
    hour: int = 12            # 0-23 hour of day
    weather: str = "clear"    # rain, clear, cloudy, thunderstorm, etc.
    temperature_c: float = 28.0
    is_weekend: bool = False
    past_occasion: Optional[str] = None  # from localStorage in frontend


@router.post("/panic")
async def panic_mode(req: PanicRequest):
    """
    Zero-input cart. Takes device context signals and builds
    a situationally relevant cart with no user typing.
    """
    from services.panic_engine import build_panic_situation

    intent = build_panic_situation(
        hour=req.hour,
        weather_condition=req.weather,
        temperature_c=req.temperature_c,
        location_city=req.city,
        is_weekend=req.is_weekend,
        past_occasion=req.past_occasion,
    )

    user_profile = {}
    products = recommend(intent, user_profile)
    cart = _finalize_cart(products, intent)
    replay = get_replay_suggestion(intent)
    record_situation(intent, cart)

    return {
        "intent": intent,
        "cart": cart,
        "source": "panic_mode",
        "situation_summary": intent["situation"],
        "replay_suggestion": replay,
    }


@router.get("/search")
async def search_products(q: str = Query("", min_length=0), limit: int = Query(8)):
    """
    Lightweight catalog search so users can manually add their own items.
    Matches against name, brand, category, and tags.
    """
    from services.recommendation_engine import CATALOG

    query = q.strip().lower()
    if not query:
        # Return a few popular in-stock items as suggestions
        results = [p for p in CATALOG if p.get("in_stock")][:limit]
        return {"results": results}

    scored = []
    for p in CATALOG:
        if not p.get("in_stock"):
            continue
        haystack = " ".join([
            p.get("name", ""),
            p.get("brand", ""),
            p.get("category", ""),
            " ".join(p.get("tags", [])),
        ]).lower()
        if query in haystack:
            # crude relevance: earlier match in name ranks higher
            name_hit = p.get("name", "").lower().find(query)
            rank = name_hit if name_hit >= 0 else 999
            scored.append((rank, p))

    scored.sort(key=lambda x: x[0])
    return {"results": [p for _, p in scored[:limit]]}


@router.get("/alternatives")
async def get_alternatives(
    product_id: str = Query(...),
    occasion: str = Query("general"),
    category: str = Query(""),
    budget: int = Query(None),
    exclude: str = Query(""),
):
    """
    Returns 3 ranked alternative products for a removed item.
    Excludes items already in the cart.
    """
    from services.recommendation_engine import CATALOG, score_product

    excluded_ids = set(exclude.split(",")) if exclude else set()
    excluded_ids.add(product_id)

    mini_intent = {
        "occasion": occasion,
        "product_categories": [category] if category else [],
        "urgency": "medium",
        "people_count": 1,
        "budget_inr": budget,
        "keywords": [],
    }

    candidates = [
        p for p in CATALOG
        if p.get("in_stock")
        and p["id"] not in excluded_ids
        and (not category or p.get("category") == category)
    ]

    scored = sorted(
        [{**p, "_score": score_product(p, mini_intent, {}, None)} for p in candidates],
        key=lambda x: x["_score"],
        reverse=True,
    )

    top = scored[:3]
    # Substitution intelligence: explain WHY each is a good swap
    for alt in top:
        cat = (alt.get("category") or "item").replace("_", " ")
        alt["_sub_reason"] = f"Closest {cat} match · {alt.get('rating', 4)}★ · ₹{alt['price_inr']}"

    return {"alternatives": top}


@router.post("/parse-items")
async def parse_items(req: IntentRequest):
    """
    Party Mode: extract product mentions from a spoken sentence and match them
    to catalog items (e.g., 'get me chips and a coke and some chocolate').
    """
    from services.recommendation_engine import CATALOG

    text = (req.user_input or "").lower()
    matched = []
    seen = set()
    for p in CATALOG:
        if not p.get("in_stock") or p["id"] in seen:
            continue
        tokens = set(p.get("tags", []) + p.get("name", "").lower().split() + [p.get("brand", "").lower()])
        # match if any meaningful token (3+ chars) appears in the spoken text
        if any(t in text for t in tokens if len(t) >= 3):
            matched.append({**p, "_score": 0.7})
            seen.add(p["id"])
        if len(matched) >= 8:
            break

    return {"items": matched}


class FuseContext(BaseModel):
    type: str                    # "text" | "voice" | "image"
    value: str                   # transcript or text input
    scene: Optional[str] = None  # image scene description


class FuseRequest(BaseModel):
    contexts: PyList[FuseContext]
    user_id: Optional[str] = "guest"


@router.post("/fuse")
async def fuse_and_build(req: FuseRequest):
    """
    Accepts multiple input signals (text + voice + image descriptions),
    merges them into a single intent, builds cart.
    """
    parts = []
    for ctx in req.contexts:
        if ctx.type in ("text", "voice"):
            parts.append(ctx.value)
        elif ctx.type == "image" and ctx.scene:
            parts.append(f"The scene shows: {ctx.scene}")

    fused_input = ". ".join(parts)

    intent = extract_intent(fused_input)
    user_profile = get_user_profile(req.user_id)
    products = recommend(intent, user_profile)
    cart = _finalize_cart(products, intent)
    cart["fused_from"] = len(req.contexts)
    replay = get_replay_suggestion(intent)
    record_situation(intent, cart)

    return {
        "intent": intent,
        "cart": cart,
        "fused_input": fused_input,
        "source": "fusion",
        "replay_suggestion": replay,
    }


@router.post("/extract-stream")
async def extract_stream(
    req: IntentRequest,
    w_intent: float = 0.5,
    w_budget: float = 0.3,
    w_avail: float = 0.1,
    w_rating: float = 0.1,
):
    """
    Feature B: stream the AI's reasoning token-by-token (SSE), then emit the
    full result (intent + cart, or a clarification) as a final 'done' event.
    """
    weights = {"intent": w_intent, "budget": w_budget, "availability": w_avail, "rating": w_rating}

    def event_generator():
        full = ""
        for token in extract_intent_stream(req.user_input):
            full += token
            yield f"data: {jsonlib.dumps({'token': token})}\n\n"

        # Parse the RESULT JSON from the streamed text
        m = re.search(r"RESULT:\s*(\{.*\})", full, re.DOTALL)
        try:
            intent = jsonlib.loads(m.group(1)) if m else extract_intent(req.user_input)
        except Exception:
            intent = extract_intent(req.user_input)

        if is_vague(req.user_input, intent):
            yield f"data: {jsonlib.dumps({'done': True, 'needs_clarification': True, 'clarification': get_clarification(req.user_input), 'intent': intent})}\n\n"
            return

        products = recommend(intent, {}, weights=weights)
        cart = _finalize_cart(products, intent)
        cart = _apply_profile(cart, req.user_id)
        replay = get_replay_suggestion(intent)
        record_situation(intent, cart)
        triage = get_crisis_triage(intent)
        followup = get_followup(intent, req.user_input)
        update_after_order(req.user_id, intent, cart)
        yield f"data: {jsonlib.dumps({'done': True, 'intent': intent, 'cart': cart, 'replay_suggestion': replay, 'triage': triage, 'followup': followup, 'profile_snippet': _profile_snippet(req.user_id)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


class RefineRequest(BaseModel):
    intent: Dict[str, Any]


@router.post("/refine")
async def refine_cart(req: RefineRequest):
    """
    Feature E: rebuild the cart from an already-augmented intent (skips re-extraction).
    Used when the user answers a crisis-triage question.
    """
    intent = req.intent
    products = recommend(intent, {})
    cart = _finalize_cart(products, intent)
    return {"intent": intent, "cart": cart}


class ProfileUpdateRequest(BaseModel):
    user_id: str = "guest"
    name: Optional[str] = None
    dietary: Optional[PyList[str]] = None


@router.post("/profile")
async def update_profile(req: ProfileUpdateRequest):
    if req.name is not None:
        set_name(req.user_id, req.name)
    if req.dietary is not None:
        set_dietary(req.user_id, req.dietary)
    return get_profile(req.user_id)


@router.get("/profile/{user_id}")
async def fetch_profile(user_id: str):
    return get_profile(user_id)


class PreferenceRequest(BaseModel):
    user_id: str = "guest"
    category: str
    product_id: str


@router.post("/preference")
async def save_preference(req: PreferenceRequest):
    set_preference(req.user_id, req.category, req.product_id)
    return {"ok": True, "preferred": get_preferences(req.user_id)}


@router.get("/scenarios/{user_id}")
async def get_personalized_scenarios(user_id: str):
    from datetime import datetime

    ALL_SCENARIOS = [
        {"text": "I have guests coming in 30 minutes", "occasion": "party", "emoji": "🎉", "label": "Guests in 30 mins"},
        {"text": "Movie night for 5 people", "occasion": "movie_night", "emoji": "🎬", "label": "Movie night"},
        {"text": "My baby has fever", "occasion": "baby_care", "emoji": "🤒", "label": "Baby fever"},
        {"text": "Exam tomorrow morning", "occasion": "exam", "emoji": "📚", "label": "Exam tomorrow"},
        {"text": "Power cut at home", "occasion": "power_cut", "emoji": "⚡", "label": "Power cut"},
        {"text": "Breakfast for 4 people", "occasion": "breakfast", "emoji": "🍳", "label": "Breakfast"},
        {"text": "Rain is coming", "occasion": "rain", "emoji": "🌧️", "label": "Rain coming"},
        {"text": "House party tonight", "occasion": "party", "emoji": "🎊", "label": "House party"},
    ]

    profile = get_profile(user_id)
    history = profile.get("situation_history", [])
    hour = datetime.now().hour

    def score(scenario):
        s = 0.0
        s += sum(2 for h in history if h.get("occasion") == scenario["occasion"])
        if scenario["occasion"] == "breakfast" and 6 <= hour <= 10:
            s += 5
        if scenario["occasion"] in ("movie_night", "party") and 18 <= hour <= 23:
            s += 5
        if scenario["occasion"] == "exam" and 19 <= hour <= 23:
            s += 2
        return s

    return {"scenarios": sorted(ALL_SCENARIOS, key=score, reverse=True)[:8]}
