"""
Test OpenAI API key to verify it's working
"""
import os
import sys

# Get the key from Secret Manager (same way the deployment does)
import subprocess

try:
    result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', 
         '--secret=openai-api-key', '--project=super-flashcards-475210'],
        capture_output=True,
        text=True,
        check=True
    )
    api_key = result.stdout.strip()
    print(f"✓ Retrieved API key from Secret Manager: {api_key[:20]}...")
    
    # Test the API key with OpenAI
    from openai import OpenAI
    
    print("\n🔄 Testing OpenAI API connection...")
    client = OpenAI(api_key=api_key)
    
    # Make a simple test call
    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say 'API key is working!' in JSON format: {\"status\": \"...\"}"}
        ],
        max_tokens=50,
        temperature=0.7
    )
    
    content = response.choices[0].message.content
    print(f"✓ OpenAI API Response: {content}")
    print("\n✅ SUCCESS: OpenAI API key is working correctly!")
    
except subprocess.CalledProcessError as e:
    print(f"❌ ERROR: Failed to retrieve API key from Secret Manager")
    print(f"Error: {e.stderr}")
    sys.exit(1)
    
except Exception as e:
    print(f"❌ ERROR: OpenAI API call failed")
    print(f"Error Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")
    sys.exit(1)
