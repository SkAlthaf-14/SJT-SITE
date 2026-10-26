import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = os.path.abspath(os.path.dirname(__file__) + '/..')
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
JARS_DIR = os.path.join(PUBLIC_DIR, 'images/products/jars')

PRODUCTS = [
    {
        'id': 'araku-premium',
        'raw': r'C:\Users\badaa\.gemini\antigravity-ide\brain\8671384f-752d-46ff-a358-34441320a2f0\sjt_premium_jar_sharp_1792398564956.jpg',
        'font_path': r'C:\Windows\Fonts\arialbd.ttf',
        'font_size': 34,
        'patch_box': (458, 811, 578, 847),
        'sample_top': (809, 813),
        'sample_bot': (845, 849),
        'text_pos': (518, 829),
        'text_50g': '50 G',
        'text_250g': '250 G',
    },
    {
        'id': 'araku-instant',
        'raw': r'C:\Users\badaa\.gemini\antigravity-ide\brain\8671384f-752d-46ff-a358-34441320a2f0\sjt_instant_jar_sharp_1792398498757.jpg',
        'font_path': r'C:\Windows\Fonts\arialbd.ttf',
        'font_size': 34,
        'patch_box': (468, 818, 582, 848),
        'sample_top': (814, 818),
        'sample_bot': (849, 853),
        'text_pos': (525, 833),
        'text_50g': '50 G',
        'text_250g': '250 G',
    },
    {
        'id': 'araku-signature',
        'raw': r'C:\Users\badaa\.gemini\antigravity-ide\brain\8671384f-752d-46ff-a358-34441320a2f0\sjt_signature_jar_sharp_1792398413205.jpg',
        'font_path': r'C:\Windows\Fonts\arialbd.ttf',
        'font_size': 34,
        'patch_box': (458, 822, 578, 866),
        'sample_top': (820, 824),
        'sample_bot': (820, 824),
        'text_pos': (518, 839),
        'text_50g': '50 g',
        'text_250g': '250 g',
    },
    {
        'id': 'araku-special-blend',
        'raw': r'C:\Users\badaa\.gemini\antigravity-ide\brain\8671384f-752d-46ff-a358-34441320a2f0\sjt_special_jar_sharp_1792398533218.jpg',
        'font_path': r'C:\Windows\Fonts\ARIALNB.TTF',
        'font_size': 28,
        'patch_box': (556, 822, 626, 846),
        'sample_top': (816, 820),
        'sample_bot': (848, 852),
        'text_pos': (588, 834),
        'text_50g': '50 G',
        'text_250g': '250 G',
    },
]

def patch_raw_image(raw_img, prod_config, weight_str):
    im = raw_img.copy().convert('RGB')
    if weight_str == '100g':
        return im  # 100g is the original unedited photograph
    
    arr = np.array(im, dtype=np.float32)
    x1, y1, x2, y2 = prod_config['patch_box']
    ty1, ty2 = prod_config['sample_top']
    by1, by2 = prod_config['sample_bot']
    
    top_prof = arr[ty1:ty2, x1:x2].mean(axis=0)
    bot_prof = arr[by1:by2, x1:x2].mean(axis=0)
    
    v = np.linspace(0, 1, y2 - y1)[:, np.newaxis, np.newaxis]
    patch = (1 - v) * top_prof[np.newaxis, :, :] + v * bot_prof[np.newaxis, :, :]
    
    feather = 3
    mask = np.ones((y2 - y1, x2 - x1), dtype=np.float32)
    for i in range(feather):
        f = (i + 1) / (feather + 1)
        mask[:, i] = np.minimum(mask[:, i], f)
        mask[:, -(i+1)] = np.minimum(mask[:, -(i+1)], f)
        
    mask = mask[:, :, np.newaxis]
    arr[y1:y2, x1:x2] = arr[y1:y2, x1:x2] * (1 - mask) + patch * mask
    
    patched = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    
    font = ImageFont.truetype(prod_config['font_path'], prod_config['font_size'])
    draw = ImageDraw.Draw(patched)
    text = prod_config['text_50g'] if weight_str == '50g' else prod_config['text_250g']
    draw.text(prod_config['text_pos'], text, fill=(18, 12, 6), font=font, anchor='mm')
    
    return patched

def process_and_save_jar(patched_rgb, prod_id, weight_str):
    arr = np.array(patched_rgb.convert('RGBA')).astype(np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    # Background proximity to white
    diff = np.maximum(np.maximum(255 - r, 255 - g), 255 - b)
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
    
    bbox = clean_jar.getbbox()
    cropped = clean_jar.crop(bbox)
    
    paste_x = (1024 - cropped.width) // 2
    paste_y = (1024 - cropped.height) // 2
    
    out_img = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    
    if weight_str == '100g':
        out_img.paste(cropped, (paste_x, paste_y), cropped)
    elif weight_str == '50g':
        scale = 0.93
        w_50 = int(cropped.width * scale)
        h_50 = int(cropped.height * scale)
        crop_50 = cropped.resize((w_50, h_50), Image.Resampling.LANCZOS)
        out_img.paste(crop_50, ((1024 - w_50) // 2, paste_y + (cropped.height - h_50)), crop_50)
    elif weight_str == '250g':
        scale = 1.06
        w_250 = int(cropped.width * scale)
        h_250 = int(cropped.height * scale)
        crop_250 = cropped.resize((w_250, h_250), Image.Resampling.LANCZOS)
        out_img.paste(crop_250, ((1024 - w_250) // 2, paste_y - int((h_250 - cropped.height) * 0.9)), crop_250)
        
    out_path = os.path.join(JARS_DIR, f"{prod_id}-{weight_str}-jar.png")
    out_img.save(out_path)
    print(f"Generated authentic jar: {out_path}")

def main():
    print("Generating all 12 authentic variant jar photographs with exact Net Weight badges...")
    os.makedirs(JARS_DIR, exist_ok=True)
    for prod in PRODUCTS:
        raw_img = Image.open(prod['raw'])
        for w in ['50g', '100g', '250g']:
            patched = patch_raw_image(raw_img, prod, w)
            process_and_save_jar(patched, prod['id'], w)
    print("All 12 authentic jars generated successfully!")

if __name__ == '__main__':
    main()
