import os
import numpy as np
from PIL import Image, ImageFilter

JARS = [
    {
        'name': 'signature',
        'raw': r'C:\Users\badaa\.gemini\antigravity-ide\brain\8671384f-752d-46ff-a358-34441320a2f0\sjt_signature_jar_sharp_1792398413205.jpg',
        'id': 'araku-signature',
    },
    {
        'name': 'instant',
        'raw': r'C:\Users\badaa\.gemini\antigravity-ide\brain\8671384f-752d-46ff-a358-34441320a2f0\sjt_instant_jar_sharp_1792398498757.jpg',
        'id': 'araku-instant',
    },
    {
        'name': 'special',
        'raw': r'C:\Users\badaa\.gemini\antigravity-ide\brain\8671384f-752d-46ff-a358-34441320a2f0\sjt_special_jar_sharp_1792398533218.jpg',
        'id': 'araku-special-blend',
    },
    {
        'name': 'premium',
        'raw': r'C:\Users\badaa\.gemini\antigravity-ide\brain\8671384f-752d-46ff-a358-34441320a2f0\sjt_premium_jar_sharp_1792398564956.jpg',
        'id': 'araku-premium',
    }
]

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public/images/products/jars'))
os.makedirs(OUT_DIR, exist_ok=True)

def process_jar(jar_info):
    img = Image.open(jar_info['raw']).convert('RGBA')
    arr = np.array(img).astype(np.float32)
    
    # RGB channels
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    # Calculate backgroundness based on proximity to white [255, 255, 255]
    diff = np.maximum(np.maximum(255 - r, 255 - g), 255 - b)
    
    # Smooth alpha transition
    alpha = np.clip((diff - 6.0) / 14.0 * 255.0, 0, 255).astype(np.uint8)
    
    # Suppress floor shadow below y=920
    H, W = alpha.shape
    for y in range(920, H):
        factor = max(0.0, 1.0 - (y - 920) / 25.0)
        floor_shadow_mask = (diff[y, :] < 55)
        alpha[y, floor_shadow_mask] = (alpha[y, floor_shadow_mask].astype(np.float32) * factor).astype(np.uint8)
        
    out_arr = arr.copy()
    out_arr[:, :, 3] = alpha
    
    clean_jar = Image.fromarray(out_arr.astype(np.uint8), 'RGBA')
    mask = Image.fromarray(alpha, 'L').filter(ImageFilter.GaussianBlur(0.5))
    clean_jar.putalpha(mask)
    
    # Crop to bounding box of the jar
    bbox = clean_jar.getbbox()
    cropped = clean_jar.crop(bbox)
    
    # Canonical 100g
    # Paste onto 1024x1024 centered
    w100 = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    paste_x = (1024 - cropped.width) // 2
    paste_y = (1024 - cropped.height) // 2
    w100.paste(cropped, (paste_x, paste_y), cropped)
    w100_path = os.path.join(OUT_DIR, f"{jar_info['id']}-100g-jar.png")
    w100.save(w100_path)
    print(f"Saved 100g: {w100_path}")
    
    # 50g: slightly more compact (0.93x)
    scale_50 = 0.93
    w_50 = int(cropped.width * scale_50)
    h_50 = int(cropped.height * scale_50)
    crop_50 = cropped.resize((w_50, h_50), Image.Resampling.LANCZOS)
    img_50 = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    # Align bottom base with 100g
    img_50.paste(crop_50, ((1024 - w_50) // 2, paste_y + (cropped.height - h_50)), crop_50)
    w50_path = os.path.join(OUT_DIR, f"{jar_info['id']}-50g-jar.png")
    img_50.save(w50_path)
    print(f"Saved 50g: {w50_path}")
    
    # 250g: slightly larger/fuller (1.06x)
    scale_250 = 1.06
    w_250 = int(cropped.width * scale_250)
    h_250 = int(cropped.height * scale_250)
    crop_250 = cropped.resize((w_250, h_250), Image.Resampling.LANCZOS)
    img_250 = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    img_250.paste(crop_250, ((1024 - w_250) // 2, paste_y - int((h_250 - cropped.height) * 0.9)), crop_250)
    w250_path = os.path.join(OUT_DIR, f"{jar_info['id']}-250g-jar.png")
    img_250.save(w250_path)
    print(f"Saved 250g: {w250_path}")

for jar in JARS:
    process_jar(jar)

print("ALL 12 JARS REGENERATED AT ULTRA-HIGH FIDELITY!")
