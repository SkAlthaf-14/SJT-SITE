import os
from PIL import Image

raw_jars = {
    'instant': r'C:\Users\badaa\.gemini\antigravity-ide\brain\8671384f-752d-46ff-a358-34441320a2f0\sjt_instant_jar_sharp_1792398498757.jpg',
    'special': r'C:\Users\badaa\.gemini\antigravity-ide\brain\8671384f-752d-46ff-a358-34441320a2f0\sjt_special_jar_sharp_1792398533218.jpg',
    'signature': r'C:\Users\badaa\.gemini\antigravity-ide\brain\8671384f-752d-46ff-a358-34441320a2f0\sjt_signature_jar_sharp_1792398413205.jpg',
    'premium': r'C:\Users\badaa\.gemini\antigravity-ide\brain\8671384f-752d-46ff-a358-34441320a2f0\sjt_premium_jar_sharp_1792398564956.jpg',
}

for name, path in raw_jars.items():
    im = Image.open(path)
    print(name, im.size)
    crop = im.crop((400, 780, 650, 880))
    crop.save(f'scripts/raw_{name}_badge.png')
    print(f"Saved scripts/raw_{name}_badge.png")
