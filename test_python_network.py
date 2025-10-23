"""
Quick test to diagnose Python's slow HTTPS requests
"""
import time
import httpx

print("Testing Python's network performance...")
print("=" * 60)

# Test 1: Simple DNS resolution via httpx
print("\n1. Testing httpx GET request to Google OAuth config:")
start = time.time()
try:
    with httpx.Client(timeout=30.0) as client:
        response = client.get("https://accounts.google.com/.well-known/openid-configuration")
        elapsed = time.time() - start
        print(f"   ✅ Success in {elapsed:.2f} seconds")
        print(f"   Status: {response.status_code}")
except Exception as e:
    elapsed = time.time() - start
    print(f"   ❌ Failed after {elapsed:.2f} seconds")
    print(f"   Error: {e}")

# Test 2: With HTTP/2 disabled
print("\n2. Testing httpx with HTTP/2 disabled:")
start = time.time()
try:
    with httpx.Client(timeout=30.0, http2=False) as client:
        response = client.get("https://accounts.google.com/.well-known/openid-configuration")
        elapsed = time.time() - start
        print(f"   ✅ Success in {elapsed:.2f} seconds")
        print(f"   Status: {response.status_code}")
except Exception as e:
    elapsed = time.time() - start
    print(f"   ❌ Failed after {elapsed:.2f} seconds")
    print(f"   Error: {e}")

# Test 3: With SSL verification disabled
print("\n3. Testing httpx with SSL verification disabled:")
start = time.time()
try:
    with httpx.Client(timeout=30.0, verify=False) as client:
        response = client.get("https://accounts.google.com/.well-known/openid-configuration")
        elapsed = time.time() - start
        print(f"   ✅ Success in {elapsed:.2f} seconds")
        print(f"   Status: {response.status_code}")
except Exception as e:
    elapsed = time.time() - start
    print(f"   ❌ Failed after {elapsed:.2f} seconds")
    print(f"   Error: {e}")

# Test 4: Check for proxy settings
print("\n4. Checking environment proxy settings:")
import os
http_proxy = os.environ.get('HTTP_PROXY') or os.environ.get('http_proxy')
https_proxy = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
no_proxy = os.environ.get('NO_PROXY') or os.environ.get('no_proxy')
print(f"   HTTP_PROXY: {http_proxy or 'Not set'}")
print(f"   HTTPS_PROXY: {https_proxy or 'Not set'}")
print(f"   NO_PROXY: {no_proxy or 'Not set'}")

print("\n" + "=" * 60)
print("Test complete!")
