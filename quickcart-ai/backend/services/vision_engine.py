import boto3
import base64
import json
import os
import re
from dotenv import load_dotenv

load_dotenv()

_client = boto3.client(
    "bedrock-runtime",
    region_name=os.getenv("AWS_REGION", "us-east-1"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

VISION_SYSTEM_PROMPT = """You are a visual shopping assistant for an Indian quick-commerce app.

Look at this photo carefully. Identify the real-world situation shown.

Your job:
1. Understand what scene this is (kitchen, fridge, sick person, messy room, etc.)
2. Identify what items are missing, depleted, or urgently needed
3. Map it to a shopping occasion

Respond ONLY with this exact JSON structure, no extra text:
{
  "scene_description": "<one sentence: what you actually see in this image>",
  "occasion": "<one of: party | movie_night | emergency | breakfast | baby_care | exam | rain | power_cut | general>",
  "urgency": "<high | medium | low>",
  "people_count": <integer, estimate from image or default 1>,
  "missing_items": ["<specific item 1>", "<specific item 2>", "<specific item 3>"],
  "product_categories": ["<category1>", "<category2>"],
  "confidence": "<high | medium | low>"
}

Be specific about what you see. If it's a dark fridge with only condiments, say that. If it's a sick child, say baby_care + emergency. If you cannot determine the situation, set occasion to general and confidence to low."""


def analyze_scene_image(image_base64: str, media_type: str = "image/jpeg") -> dict:
    """
    Analyze a base64-encoded image and extract shopping intent from the scene.
    Returns the same intent structure as extract_intent() for pipeline compatibility.
    """
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 400,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_base64,
                        },
                    },
                    {
                        "type": "text",
                        "text": VISION_SYSTEM_PROMPT,
                    },
                ],
            }
        ],
    }

    response = _client.invoke_model(
        modelId=os.getenv("BEDROCK_MODEL_ID"),
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )

    raw_text = json.loads(response["body"].read())["content"][0]["text"]
    clean = re.sub(r"```json|```", "", raw_text).strip()
    vision_data = json.loads(clean)

    # Transform into the SAME intent format the rest of the pipeline expects
    intent = {
        "situation": vision_data["scene_description"],
        "occasion": vision_data["occasion"],
        "urgency": vision_data["urgency"],
        "people_count": vision_data.get("people_count", 1),
        "budget_inr": None,
        "dietary_notes": None,
        "product_categories": vision_data["product_categories"],
        "keywords": vision_data["missing_items"],  # missing items become search keywords
        "source": "camera",                         # so frontend knows how it was triggered
        "scene_description": vision_data["scene_description"],
        "vision_confidence": vision_data.get("confidence", "medium"),
    }

    return intent
