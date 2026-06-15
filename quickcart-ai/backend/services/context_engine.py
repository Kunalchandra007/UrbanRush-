"""
Context Engine — User profile and personalization data.
For demo: returns mock data. In production: query user database.
"""


def get_user_profile(user_id: str) -> dict:
    """
    Retrieve user profile for personalization.
    In production: query database. For demo: return mock profile.
    """
    # Mock profile for demo
    return {
        "user_id": user_id,
        "preferred_brands": ["Lay's", "Amul", "Britannia"],
        "dietary": "vegetarian",
        "avg_order_value_inr": 400,
        "past_categories": ["snacks", "dairy", "beverages"],
    }
