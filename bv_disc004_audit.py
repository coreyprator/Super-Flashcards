import os, re

files = [os.path.join(r,f) for r,d,fs in os.walk("backend/app") for f in fs if f.endswith(".py")]

# grep 1: model=dall-e (live API model= calls)
hits_dalle = []
for fn in files:
    for i, l in enumerate(open(fn, encoding="utf-8", errors="ignore")):
        if re.search(r"model=['\"]dall-e", l):
            hits_dalle.append((fn, i+1, l.rstrip()))

print(f"=== grep backend/app for model='dall-e' ===")
print(f"Total matches: {len(hits_dalle)}")
for fn, lineno, line in hits_dalle:
    print(f"  {fn}:{lineno}: {line.strip()}")

# grep 2: gpt-image-1
hits_gpt = []
for fn in files:
    for i, l in enumerate(open(fn, encoding="utf-8", errors="ignore")):
        if "gpt-image-1" in l:
            hits_gpt.append((fn, i+1, l.rstrip()))

print(f"\n=== grep backend/app for gpt-image-1 ===")
print(f"Total matches: {len(hits_gpt)}")
for fn, lineno, line in hits_gpt:
    print(f"  {fn}:{lineno}: {line.strip()}")
