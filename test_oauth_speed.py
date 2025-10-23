"""
Test OAuth speed by measuring redirect time
Tests the /api/auth/google/login endpoint that was taking 110 seconds
"""
import time
import httpx

url = "http://localhost:8000/api/auth/google/login"

print("Testing OAuth login redirect speed...")
print(f"URL: {url}")
print("=" * 60)

start = time.time()
try:
    # Follow redirects=False so we can measure just the initial redirect
    response = httpx.get(url, follow_redirects=False, timeout=30.0)
    elapsed = time.time() - start
    
    print(f"✅ Response received in {elapsed:.3f} seconds")
    print(f"Status: {response.status_code}")
    print(f"Location: {response.headers.get('location', 'N/A')[:100]}...")
    
    if elapsed < 2.0:
        print(f"\n🎉 SUCCESS! OAuth is fast now (was 110 seconds, now {elapsed:.3f}s)")
    elif elapsed < 10.0:
        print(f"\n✅ IMPROVED! OAuth is faster (was 110 seconds, now {elapsed:.3f}s)")
    else:
        print(f"\n⚠️  Still slow: {elapsed:.3f}s (target: <2s)")
        
except Exception as e:
    elapsed = time.time() - start
    print(f"❌ Error after {elapsed:.3f} seconds: {e}")
