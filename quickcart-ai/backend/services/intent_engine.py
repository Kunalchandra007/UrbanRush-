"""
Core Intent Extraction Engine — Show this to judges!
Transforms natural language → structured shopping intent using Claude on Bedrock.
"""
from services.bedrock_client import invoke
import json
import re

SYSTEM_PROMPT = """You are an intent extraction engine for a quick-commerce AI shopping assistant.

Given a user's natural language input describing their situation or need, extract structured shopping intent.

ALWAYS respond with ONLY valid JSON in this exact schema — no explanation, no markdown:
{
  "situation": "<short description of the situation>",
  "occasion": "<one of: movie_night | party | emergency | breakfast | baby_care | travel | exam | rain | power_cut | general>",
  "people_count": <integer, 1 if not mentioned>,
  "urgency": "<high | medium | low>",
  "budget_inr": <integer or null if not mentioned>,
  "dietary_notes": "<any restrictions mentioned or null>",
  "product_categories": ["<list of product category tags to fetch>"],
  "keywords": ["<specific product keywords if mentioned>"]
}

Examples of category tags: snacks, beverages, dairy, bakery, personal_care, baby, stationery, electronics, emergency, cleaning, kitchen.
"""


def extract_intent(user_input: str) -> dict:
    """
    Extract structured intent from natural language.
    Special intents (recipe, mood) resolve deterministically first; otherwise
    Claude is used, with a keyword rule engine as fallback.
    """
    # Outcome-based + emotional intents take priority (fast, deterministic)
    special = _recipe_intent(user_input) or _mood_intent(user_input)
    if special:
        return special
    try:
        raw = invoke(SYSTEM_PROMPT, user_input, max_tokens=400)
        # Strip markdown fences if model adds them
        clean = re.sub(r"```json|```", "", raw).strip()
        return json.loads(clean)
    except Exception:
        return _fallback_intent(user_input)


# Keyword → occasion mapping for the offline fallback engine
_OCCASION_RULES = [
    ("baby_care", ["baby", "infant", "fever", "diaper", "child"]),
    ("power_cut", ["power cut", "power-cut", "blackout", "no electricity", "load shedding"]),
    ("rain", ["rain", "storm", "monsoon", "umbrella", "flood"]),
    ("exam", ["exam", "study", "studying", "test tomorrow", "assignment"]),
    ("movie_night", ["movie", "netflix", "binge", "film", "tv show", "web series"]),
    ("party", ["party", "guests", "guest", "celebration", "friends over", "host"]),
    ("breakfast", ["breakfast", "morning", "tea", "coffee", "milk", "bread"]),
    ("travel", ["travel", "trip", "journey", "road trip", "packing"]),
    ("emergency", ["emergency", "urgent", "medicine", "first aid", "sick"]),
]

_CATEGORY_BY_OCCASION = {
    "baby_care": ["baby", "personal_care"],
    "power_cut": ["emergency"],
    "rain": ["emergency", "beverages", "snacks"],
    "exam": ["stationery", "beverages", "snacks"],
    "movie_night": ["snacks", "beverages"],
    "party": ["snacks", "beverages", "kitchen"],
    "breakfast": ["dairy", "bakery", "beverages"],
    "travel": ["snacks", "beverages", "personal_care"],
    "emergency": ["emergency", "personal_care"],
    "general": ["snacks", "beverages"],
}


def _fallback_intent(user_input: str) -> dict:
    """Pure-Python keyword intent extraction — no LLM needed."""
    text = user_input.lower()

    occasion = "general"
    for occ, keywords in _OCCASION_RULES:
        if any(k in text for k in keywords):
            occasion = occ
            break

    # People count
    people = 1
    m = re.search(r"(\d+)\s*(people|persons|guests|friends|of us)", text)
    if m:
        people = int(m.group(1))

    # Urgency
    if any(k in text for k in ["now", "urgent", "immediately", "30 min", "asap", "fever", "emergency", "power cut"]):
        urgency = "high"
    elif any(k in text for k in ["tomorrow", "later", "weekend", "tonight"]):
        urgency = "medium"
    else:
        urgency = "medium"

    # Budget
    budget = None
    b = re.search(r"(?:₹|rs\.?\s*|budget\s*(?:of\s*)?)(\d+)", text)
    if b:
        budget = int(b.group(1))

    return {
        "situation": user_input.strip(),
        "occasion": occasion,
        "people_count": people,
        "urgency": urgency,
        "budget_inr": budget,
        "dietary_notes": None,
        "product_categories": _CATEGORY_BY_OCCASION.get(occasion, ["snacks", "beverages"]),
        "keywords": [],
        "_demo_mode": True,
    }


REASONING_PROMPT = """You are a product-to-situation reasoning explainer.

Given an intent JSON and a product name+tags, write ONE sentence (max 12 words)
explaining WHY this product fits the user's situation.

Rules:
- Be specific to the occasion and urgency
- Mention people_count if > 1
- Sound like a smart assistant, not a robot
- Return ONLY the sentence, nothing else

Examples:
Intent: {"occasion":"party","people_count":5,"urgency":"high"}, Product: Lay's Chips → Popular party snack, enough for 5 guests

Intent: {"occasion":"baby_care","urgency":"high"}, Product: Crocin Drops → Fast-acting fever relief safe for infants

Intent: {"occasion":"power_cut","urgency":"high"}, Product: LED Torch → Essential emergency lighting during power outage
"""


def generate_reason(intent: dict, product_name: str, product_tags: list) -> str:
    """Generate a one-line reason why this product fits the intent."""
    msg = f"Intent: {json.dumps({'occasion': intent.get('occasion'), 'people_count': intent.get('people_count', 1), 'urgency': intent.get('urgency')})}\nProduct: {product_name} (tags: {', '.join(product_tags[:4])})"
    try:
        raw = invoke(REASONING_PROMPT, msg, max_tokens=50)
        return raw.strip().rstrip('.')
    except Exception:
        return f"Ideal for {intent.get('occasion', 'your situation').replace('_', ' ')}"


BATCH_REASONING_PROMPT = """You are a product-to-situation reasoning explainer for a shopping app.

Given an intent JSON and a numbered list of products, write ONE short reason
(max 10 words) for EACH product explaining why it fits the user's situation.

Rules:
- Be specific to the occasion and urgency
- Sound like a smart assistant, not a robot
- Return ONLY valid JSON: a map of the product number (as string) to its reason
- No markdown, no extra text

Example input:
Intent: {"occasion":"party","people_count":5,"urgency":"high"}
Products:
1. Lay's Chips
2. Coca-Cola

Example output:
{"1":"Popular party snack, enough for 5 guests","2":"Refreshing drink everyone enjoys at parties"}
"""


def _smart_fallback_reason(product: dict, occasion: str) -> str:
    """Build a specific-sounding reason from product category, no LLM needed."""
    by_cat = {
        "snacks": f"Crowd-favourite snack for {occasion}",
        "beverages": f"Refreshing drink to serve at {occasion}",
        "dairy": "Fresh dairy essential for the moment",
        "bakery": "Bakery staple ready to serve",
        "baby": "Gentle, safe pick for your little one",
        "emergency": "Must-have for emergency readiness",
        "personal_care": "Everyday care essential",
        "stationery": "Handy for last-minute study prep",
        "cleaning": "Keeps things tidy in a pinch",
        "kitchen": "Useful kitchen add-on for hosting",
    }
    return by_cat.get(product.get("category", ""), f"Great fit for {occasion}")


def generate_reasons_batch(intent: dict, products: list) -> dict:
    """
    Generate reasons for ALL products in a SINGLE LLM call.
    Returns {product_id: reason}. Falls back gracefully on failure.
    This avoids firing one Bedrock call per product (rate-limit friendly).
    """
    occasion = intent.get("occasion", "your situation").replace("_", " ")
    fallback = {p["id"]: _smart_fallback_reason(p, occasion) for p in products}

    if not products:
        return fallback

    intent_str = json.dumps({
        "occasion": intent.get("occasion"),
        "people_count": intent.get("people_count", 1),
        "urgency": intent.get("urgency"),
    })
    listing = "\n".join(f"{i + 1}. {p['name']}" for i, p in enumerate(products))
    msg = f"Intent: {intent_str}\nProducts:\n{listing}"

    try:
        raw = invoke(BATCH_REASONING_PROMPT, msg, max_tokens=400)
        clean = re.sub(r"```json|```", "", raw).strip()
        mapping = json.loads(clean)
        # Map numbered reasons back to product ids
        result = {}
        for i, p in enumerate(products):
            reason = mapping.get(str(i + 1)) or mapping.get(i + 1)
            result[p["id"]] = (reason or fallback[p["id"]]).strip().rstrip(".")
        return result
    except Exception:
        return fallback


CART_EXPLANATION_PROMPT = """You are a shopping assistant summarizing a cart.
Given the intent and selected products, write EXACTLY 2 sentences explaining:
1. Why this cart was built (based on the situation)
2. What the customer will be able to do with these items

Be warm, specific, and under 30 words total.
Return ONLY the 2 sentences, no JSON, no formatting.

Example:
Intent: party, 5 people, high urgency
Products: chips, cola, cups, napkins
Response: "Built for your last-minute guest arrival — covers snacks and drinks for 5 people. Everything you need to host without leaving the house."
"""


def generate_cart_summary(intent: dict, product_names: list) -> str:
    """Generate a warm 2-sentence summary of the whole cart for the AI banner."""
    msg = (
        f"Intent: {intent.get('occasion')}, {intent.get('people_count')} people, "
        f"{intent.get('urgency')} urgency\n"
        f"Products: {', '.join(product_names[:6])}"
    )
    try:
        return invoke(CART_EXPLANATION_PROMPT, msg, max_tokens=80).strip()
    except Exception:
        occasion = intent.get("occasion", "situation").replace("_", " ")
        return f"Curated for your {occasion} — ready in minutes."


# --- Feature 7: Vague input detection + clarification flow ---

VAGUE_PATTERNS = {
    "need stuff", "i need things", "general", "don't know", "idk",
    "help", "something", "anything", "stuff", "things", "i need help",
    "not sure", "whatever", "anything will do", "i need",
}


def is_vague(user_input: str, intent: dict) -> bool:
    """Returns True if input is too vague for a useful cart."""
    lowered = user_input.lower().strip()
    # Cravings are specific enough — let the follow-up handle them, not clarification
    if any(w in lowered for w in ["crunchy", "spicy", "sweet", "healthy", "snack"]):
        return False
    if any(v in lowered for v in VAGUE_PATTERNS):
        return True
    if len(lowered.split()) <= 2 and intent.get("occasion") == "general":
        return True
    if (intent.get("occasion") == "general"
            and len(intent.get("product_categories", [])) <= 1
            and not intent.get("keywords")):
        return True
    return False


CLARIFICATION_PROMPT = """You are a friendly quick-commerce AI assistant.

A user gave a vague shopping request. Generate ONE short clarifying question
with exactly 4 short answer options to help identify their situation.

Rules:
- Question: maximum 8 words
- Each option: 1-3 words only
- Options should cover the most common urgent shopping situations
- Return ONLY valid JSON, no explanation:
{
  "question": "<max 8 word question>",
  "options": ["<opt1>", "<opt2>", "<opt3>", "<opt4>"]
}

Examples:
Input: "need stuff"
Output: {"question": "What's your situation right now?", "options": ["Guests arriving", "Sick at home", "Movie night", "Morning breakfast"]}

Input: "help me"
Output: {"question": "What do you need help shopping for?", "options": ["Party supplies", "Emergency items", "Study session", "Daily groceries"]}
"""


def get_clarification(user_input: str) -> dict:
    """Generate a clarifying question with 4 options. Falls back if LLM unavailable."""
    try:
        raw = invoke(CLARIFICATION_PROMPT, user_input, max_tokens=120)
        clean = re.sub(r"```json|```", "", raw).strip()
        return json.loads(clean)
    except Exception:
        return {
            "question": "What are you shopping for today?",
            "options": ["Party supplies", "Morning breakfast", "Emergency items", "Movie night"],
        }


# --- Feature B: live "thinking" token stream ---

import time
from services.bedrock_client import client, MODEL_ID

STREAMING_PROMPT = """You are extracting shopping intent from a situation.

First, THINK OUT LOUD in 2-3 short sentences about what you're detecting
(occasion, urgency, people, categories). Prefix this with "THINKING: ".

Then on a new line, output ONLY the JSON intent object, prefixed with "RESULT: ".
The JSON must match this schema:
{"situation": "...", "occasion": "...", "people_count": 1, "urgency": "...",
 "budget_inr": null, "dietary_notes": null, "product_categories": [], "keywords": []}
"""


def _fallback_thinking(intent: dict) -> str:
    occ = (intent.get("occasion") or "general").replace("_", " ")
    cats = ", ".join(intent.get("product_categories", []) or ["snacks", "beverages"])
    people = intent.get("people_count", 1)
    urg = intent.get("urgency", "medium")
    budget = intent.get("budget_inr")
    budget_part = f"a budget of ₹{budget}" if budget else "no budget mentioned"
    return (
        f"THINKING: This reads like a {occ} situation with {urg} urgency. "
        f"I count about {people} {'person' if people == 1 else 'people'} and {budget_part}. "
        f"I'll focus on these categories: {cats}.\n"
    )


def extract_intent_stream(user_input: str):
    """
    Generator yielding reasoning tokens (then a 'RESULT: {json}' line).
    Tries Bedrock streaming; falls back to a synthesized stream if unavailable.
    """
    try:
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 400,
            "system": STREAMING_PROMPT,
            "messages": [{"role": "user", "content": user_input}],
        }
        response = client.invoke_model_with_response_stream(
            modelId=MODEL_ID,
            body=json.dumps(body),
        )
        for event in response["body"]:
            chunk = json.loads(event["chunk"]["bytes"])
            if chunk.get("type") == "content_block_delta":
                yield chunk["delta"].get("text", "")
        return
    except Exception:
        pass

    # Fallback: synthesize a thinking stream from the rule-based intent
    intent = _fallback_intent(user_input)
    thinking = _fallback_thinking(intent)
    for word in thinking.split(" "):
        yield word + " "
        time.sleep(0.03)
    yield "RESULT: " + json.dumps(intent)


# --- Feature E: crisis triage ---

EMERGENCY_TRIAGE_PROMPT = """The user has an emergency situation. Generate ONE critical
follow-up question with 2 answer options that would change what's in their cart.

Respond ONLY as JSON:
{
  "question": "<short question>",
  "options": [
    {"label": "<option 1>", "additional_categories": ["<category>"], "additional_keywords": ["<item>"]},
    {"label": "<option 2>", "additional_categories": ["<category>"], "additional_keywords": ["<item>"]}
  ]
}
"""


def _fallback_triage(occasion: str) -> dict:
    if occasion == "baby_care":
        return {
            "question": "How high is the fever?",
            "options": [
                {"label": "Above 102°F — seems serious", "additional_categories": ["emergency"], "additional_keywords": ["paracetamol", "ORS"]},
                {"label": "Below 102°F — mild", "additional_categories": ["baby"], "additional_keywords": ["thermometer", "cooling patch"]},
            ],
        }
    return {
        "question": "Is anyone injured or in immediate danger?",
        "options": [
            {"label": "Yes — need first aid now", "additional_categories": ["emergency"], "additional_keywords": ["first aid", "bandage", "torch"]},
            {"label": "No — just preparing", "additional_categories": ["emergency"], "additional_keywords": ["candles", "battery", "water"]},
        ],
    }


def get_crisis_triage(intent: dict):
    occasion = intent.get("occasion")
    if occasion not in ["emergency", "baby_care"] or intent.get("urgency") != "high":
        return None
    try:
        raw = invoke(EMERGENCY_TRIAGE_PROMPT, json.dumps(intent), max_tokens=200)
        clean = re.sub(r"```json|```", "", raw).strip()
        return json.loads(clean)
    except Exception:
        return _fallback_triage(occasion)


# --- Personalized follow-up questions ---

_CRAVING_MAP = {
    "crunchy": [
        {"label": "Chips & wafers", "patch": {"keywords": ["chips", "wafer"], "product_categories": ["snacks"]}},
        {"label": "Namkeen & bhujia", "patch": {"keywords": ["namkeen", "bhujia"], "product_categories": ["snacks"]}},
        {"label": "Crunchy biscuits", "patch": {"keywords": ["biscuit", "cookie"], "product_categories": ["bakery", "snacks"]}},
    ],
    "spicy": [
        {"label": "Spicy namkeen", "patch": {"keywords": ["masala", "spicy", "bhujia"], "product_categories": ["snacks"]}},
        {"label": "Instant noodles", "patch": {"keywords": ["maggi", "noodles"], "product_categories": ["snacks"]}},
    ],
    "sweet": [
        {"label": "Chocolate", "patch": {"keywords": ["chocolate"], "product_categories": ["snacks"]}},
        {"label": "Biscuits & cookies", "patch": {"keywords": ["biscuit", "cookie"], "product_categories": ["bakery"]}},
        {"label": "Ice cream", "patch": {"keywords": ["ice cream"], "product_categories": ["dairy"]}},
    ],
    "healthy": [
        {"label": "Fruits & dairy", "patch": {"keywords": ["milk", "yogurt"], "product_categories": ["dairy"]}},
        {"label": "Light snacks", "patch": {"keywords": ["roasted", "baked"], "product_categories": ["snacks"]}},
    ],
}


def get_followup(intent: dict, user_input: str):
    """
    A friendly, non-blocking follow-up to personalize the cart further.
    Returns {question, options:[{label, patch}]} or None.
    """
    text = (user_input or "").lower()

    # Craving-based
    for craving, options in _CRAVING_MAP.items():
        if craving in text:
            return {
                "question": f"Craving something {craving}? Which sounds good?",
                "options": options,
            }

    # Guests count for social occasions when not specified
    if intent.get("occasion") in ("party", "movie_night") and (intent.get("people_count") or 1) <= 1:
        return {
            "question": "How many guests are coming over?",
            "options": [
                {"label": "Just 2-4", "patch": {"people_count": 3}},
                {"label": "Around 5-8", "patch": {"people_count": 6}},
                {"label": "10 or more", "patch": {"people_count": 12}},
            ],
        }

    return None


# --- Mood -> cart (emotional intent) ---

_MOOD_MAP = {
    "sad": ("comfort", ["snacks", "dairy"], ["chocolate", "ice cream", "chips"]),
    "down": ("comfort", ["snacks", "dairy"], ["chocolate", "ice cream"]),
    "depressed": ("comfort", ["snacks", "dairy"], ["chocolate", "ice cream"]),
    "stressed": ("comfort", ["snacks", "beverages"], ["chocolate", "tea", "biscuit"]),
    "anxious": ("comfort", ["beverages", "snacks"], ["tea", "chocolate"]),
    "lazy": ("comfort", ["snacks", "kitchen"], ["maggi", "chips", "cola"]),
    "tired": ("recharge", ["beverages", "snacks"], ["coffee", "energy", "tea"]),
    "exhausted": ("recharge", ["beverages"], ["coffee", "energy"]),
    "sleepy": ("recharge", ["beverages"], ["coffee", "energy"]),
    "bored": ("comfort", ["snacks", "beverages"], ["chips", "chocolate", "cola"]),
    "happy": ("party", ["snacks", "beverages"], ["chocolate", "cola", "chips"]),
    "celebrate": ("party", ["snacks", "beverages", "kitchen"], ["chocolate", "cola", "chips"]),
    "sick": ("emergency", ["emergency", "kitchen"], ["medicine", "ors", "soup"]),
    "unwell": ("emergency", ["emergency", "kitchen"], ["medicine", "ors", "soup"]),
    "hungover": ("recharge", ["beverages", "emergency"], ["ors", "juice", "coffee"]),
}


def _mood_intent(text: str):
    low = text.lower()
    for word, (occasion, cats, kws) in _MOOD_MAP.items():
        if word in low:
            return {
                "situation": text.strip(),
                "occasion": occasion,
                "people_count": 1,
                "urgency": "medium",
                "budget_inr": None,
                "dietary_notes": None,
                "product_categories": cats,
                "keywords": kws,
                "mood": word,
                "_demo_mode": True,
            }
    return None


# --- Recipe -> cart (outcome-based) ---

_RECIPES = {
    "maggi": ["maggi", "noodles", "egg"],
    "noodles": ["maggi", "noodles"],
    "tea": ["tea", "milk", "sugar"],
    "chai": ["tea", "milk", "sugar"],
    "coffee": ["coffee", "milk", "sugar"],
    "sandwich": ["bread", "butter", "cheese"],
    "toast": ["bread", "butter"],
    "omelette": ["egg", "onion", "oil"],
    "poha": ["poha", "onion", "oil"],
    "pasta": ["pasta", "cheese", "sauce"],
    "khichdi": ["rice", "dal", "salt"],
    "pancake": ["flour", "milk", "egg"],
}


def _recipe_intent(text: str):
    low = text.lower()
    if not any(w in low for w in ["make", "cook", "prepare", "recipe", "want to eat", "wanna make"]):
        return None
    for dish, ingredients in _RECIPES.items():
        if dish in low:
            m = re.search(r"for\s+(\d+)", low)
            people = int(m.group(1)) if m else 1
            return {
                "situation": text.strip(),
                "occasion": "cooking",
                "people_count": people,
                "urgency": "medium",
                "budget_inr": None,
                "dietary_notes": None,
                "product_categories": ["kitchen", "dairy", "bakery", "snacks"],
                "keywords": ingredients,
                "recipe": dish,
                "_demo_mode": True,
            }
    return None
