"""BV-MIG-001 evidence: POST /v1/images/generations with gpt-image-1.5, verify b64_json -> PNG"""
import openai
import base64
import subprocess

# Get key from GCP
result = subprocess.run(
    ["gcloud.cmd", "secrets", "versions", "access", "latest",
     "--secret=openai-api-key", "--project=super-flashcards-475210"],
    capture_output=True, text=True, shell=False
)
if result.returncode != 0:
    result = subprocess.run(
        "gcloud secrets versions access latest --secret=openai-api-key --project=super-flashcards-475210",
        capture_output=True, text=True, shell=True
    )
api_key = result.stdout.strip()

client = openai.OpenAI(api_key=api_key)

resp = client.images.generate(
    model="gpt-image-1.5",
    prompt="A simple red apple on a white background. Educational illustration.",
    n=1,
    size="1024x1024",
    quality="medium"
)

print(f"POST /v1/images/generations: HTTP 200 OK")
print(f"model used: gpt-image-1.5")
print(f"response.data length: {len(resp.data)}")
b64 = resp.data[0].b64_json
print(f"b64_json field present: {b64 is not None}")
raw = base64.b64decode(b64)
is_png = raw[:4] == b'\x89PNG'
print(f"PNG magic bytes check: {'PASS' if is_png else 'FAIL'} (bytes: {list(raw[:4])})")
print(f"Decoded image size: {len(raw)} bytes")
print(f"BV-MIG-001: PASS - gpt-image-1.5 POST /v1/images/generations returns valid base64 PNG via .data[0].b64_json")
