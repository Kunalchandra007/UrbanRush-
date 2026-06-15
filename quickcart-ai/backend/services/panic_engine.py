"""
Panic Mode: Fuses GPS location + time of day + weather + past orders into a situation string,
then runs through the normal intent pipeline. No user input needed at all.
"""

import json
from datetime import datetime


def build_panic_situation(
    hour: int,
    weather_condition: str,
    temperature_c: float,
    location_city: str,
    is_weekend: bool,
    past_occasion: str = None,
) -> dict:
    """
    Build a structured intent directly from contextual signals.
    No LLM call needed — pure signal fusion logic.
    """
    
    # Time-of-day mapping
    if 6 <= hour < 10:
        time_context = "morning"
        default_occasion = "breakfast"
    elif 10 <= hour < 13:
        time_context = "mid-morning"
        default_occasion = "general"
    elif 13 <= hour < 16:
        time_context = "afternoon"
        default_occasion = "general"
    elif 16 <= hour < 20:
        time_context = "evening"
        default_occasion = "party" if is_weekend else "movie_night"
    elif 20 <= hour < 23:
        time_context = "night"
        default_occasion = "movie_night"
    else:
        time_context = "late night"
        default_occasion = "emergency"

    # Weather override
    if weather_condition in ["rain", "heavy_rain", "thunderstorm"]:
        default_occasion = "rain"
        weather_desc = f"raining in {location_city}"
    elif weather_condition in ["storm", "cyclone"]:
        default_occasion = "emergency"
        weather_desc = f"storm conditions in {location_city}"
    elif temperature_c > 38:
        weather_desc = f"very hot ({temperature_c:.0f}°C) in {location_city}"
    elif temperature_c < 15:
        weather_desc = f"cold ({temperature_c:.0f}°C) in {location_city}"
    else:
        weather_desc = f"{weather_condition} weather in {location_city}"

    # Past occasion override (if user previously ordered for same occasion)
    occasion = past_occasion if past_occasion else default_occasion

    # Build the situation string
    situation = f"{time_context} on a {'weekend' if is_weekend else 'weekday'}, {weather_desc}"

    # Urgency — panic mode is always high
    urgency = "high"

    # Build product categories from signals
    categories = {
        "breakfast": ["dairy", "bakery", "beverages"],
        "party": ["snacks", "beverages", "kitchen"],
        "movie_night": ["snacks", "beverages"],
        "rain": ["emergency", "personal_care"],
        "emergency": ["emergency"],
        "general": ["snacks", "beverages"],
    }.get(occasion, ["snacks", "beverages"])

    return {
        "situation": situation,
        "occasion": occasion,
        "people_count": 1,
        "urgency": urgency,
        "budget_inr": None,
        "dietary_notes": None,
        "product_categories": categories,
        "keywords": [],
        "source": "panic_mode",
    }
