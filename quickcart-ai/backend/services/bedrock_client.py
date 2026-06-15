import boto3
import json
import os
import time
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

client = boto3.client(
    "bedrock-runtime",
    region_name=os.getenv("AWS_REGION", "us-east-1"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

MODEL_ID = os.getenv("BEDROCK_MODEL_ID")


def invoke(system_prompt: str, user_message: str, max_tokens: int = 512) -> str:
    """
    Invoke AWS Bedrock Claude model with system + user prompt.
    Retries with exponential backoff on throttling (common on new accounts).
    """
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_message}],
    }

    last_err = None
    for attempt in range(4):
        try:
            response = client.invoke_model(
                modelId=MODEL_ID,
                body=json.dumps(body),
                contentType="application/json",
                accept="application/json",
            )
            result = json.loads(response["body"].read())
            return result["content"][0]["text"]
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "")
            last_err = e
            if code in ("ThrottlingException", "TooManyRequestsException"):
                time.sleep(1.5 * (2 ** attempt))  # 1.5s, 3s, 6s, 12s
                continue
            raise
    raise last_err
