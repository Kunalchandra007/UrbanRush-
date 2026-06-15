from pydantic import BaseModel
from typing import Optional, List


class IntentRequest(BaseModel):
    user_input: str
    user_id: Optional[str] = "guest"


class IntentResponse(BaseModel):
    situation: str
    occasion: str
    people_count: int
    urgency: str
    budget_inr: Optional[int]
    product_categories: List[str]
    keywords: List[str]
