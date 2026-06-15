from pydantic import BaseModel
from typing import List, Optional


class CartItem(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    tags: List[str]
    price_inr: float
    rating: float
    in_stock: bool
    image_url: str
    score: Optional[float] = None


class CartModel(BaseModel):
    items: List[dict]
    total_inr: float
    item_count: int
    situation: str
    urgency: str
    estimated_delivery_min: int
