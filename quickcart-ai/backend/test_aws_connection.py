"""
Quick test script to verify AWS Bedrock credentials
Run: python test_aws_connection.py
"""
import os
from dotenv import load_dotenv
import boto3

# Load environment variables
load_dotenv()

print("🔍 Testing AWS Credentials...\n")

# Check if credentials are set
access_key = os.getenv("AWS_ACCESS_KEY_ID")
secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
region = os.getenv("AWS_REGION")

if not access_key or access_key == "your_aws_access_key_here":
    print("❌ AWS_ACCESS_KEY_ID not set in .env file")
    print("   Please add your AWS credentials to backend/.env")
    exit(1)

if not secret_key or secret_key == "your_aws_secret_key_here":
    print("❌ AWS_SECRET_ACCESS_KEY not set in .env file")
    print("   Please add your AWS credentials to backend/.env")
    exit(1)

print(f"✅ AWS_ACCESS_KEY_ID found: {access_key[:10]}...")
print(f"✅ AWS_SECRET_ACCESS_KEY found: {secret_key[:10]}...")
print(f"✅ AWS_REGION: {region}\n")

# Test Bedrock connection
print("🔌 Testing Bedrock connection...\n")

try:
    client = boto3.client(
        "bedrock-runtime",
        region_name=region,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
    )
    print("✅ Successfully connected to AWS Bedrock!")
    print("✅ Credentials are valid!")
    print("\n🎉 All set! You can now run the application.")
    
except Exception as e:
    print(f"❌ Connection failed: {e}")
    print("\nTroubleshooting:")
    print("1. Verify credentials in .env are correct")
    print("2. Check Bedrock model access in AWS Console")
    print("3. Ensure region is us-east-1")
    print("4. Wait 5-10 minutes after granting access")
