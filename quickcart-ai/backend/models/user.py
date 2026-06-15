from pydantic import BaseModel
from typing import List, Optional


class UserProfile(BaseModel):
    user_id: str
    preferred_brands: List[str] = []
    dietary: Optional[str] = None
    avg_order_value_inr: Optional[float] = None
    past_categories: List[str] = []
