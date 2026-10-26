import os

brain_dir = r"C:\Users\badaa\.gemini\antigravity-ide\brain"
for root, dirs, files in os.walk(brain_dir):
    for f in files:
        if f.lower().endswith(('.jpg', '.png', '.jpeg')) and not f.startswith('media_'):
            full_path = os.path.join(root, f)
            print(f"{f} ({os.path.getsize(full_path)} bytes) in {root}")
