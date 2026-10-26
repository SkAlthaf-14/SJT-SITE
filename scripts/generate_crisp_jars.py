import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

BASE_DIR = os.path.abspath(os.path.dirname(__file__) + '/..')
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
JARS_DIR = os.path.join(PUBLIC_DIR, 'images/products/jars')
LABELS_DIR = os.path.join(PUBLIC_DIR, 'images/products/labels')

os.makedirs(JARS_DIR, exist_ok=True)
os.makedirs(LABELS_DIR, exist_ok=True)

# 1. Master clean transparent jar
master_jar_path = os.path.join(JARS_DIR, 'master_coffee_jar_clean.png')
master_jar = Image.open(master_jar_path).convert('RGBA')

# 2. Vector TrueType fonts for 100% crispness
f_brand = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 44)
f_farms = ImageFont.truetype(r'C:\Windows\Fonts\georgiab.ttf', 24)
f_tagline = ImageFont.truetype(r'C:\Windows\Fonts\georgiai.ttf', 17)
f_georgia_lg = ImageFont.truetype(r'C:\Windows\Fonts\georgiab.ttf', 56)
f_georgia_md = ImageFont.truetype(r'C:\Windows\Fonts\georgiab.ttf', 23)
f_sans_sm = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 18)
f_sans_xs = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 14)
f_weight = ImageFont.truetype(r'C:\Windows\Fonts\georgiab.ttf', 42)

# 3. Scenic mountain sunrise background
bg_path = os.path.join(PUBLIC_DIR, 'images/araku_mountain_cinematic_hero.jpg')
bg = Image.open(bg_path).convert('RGB')
mountain_bg = bg.crop((200, 80, 1100, 680)).resize((800, 520), Image.Resampling.LANCZOS)

# 4. Traditional brass coffee cup and roasted beans vignette
hc_path = os.path.join(PUBLIC_DIR, 'images/sjt_hero_coffee.jpg')
hc = Image.open(hc_path).convert('RGB')
cup_crop = hc.crop((620, 490, 1140, 880)).resize((420, 280), Image.Resampling.LANCZOS)
cup_mask = Image.new('L', (420, 280), 0)
m_draw = ImageDraw.Draw(cup_mask)
m_draw.ellipse([25, 20, 395, 255], fill=255)
cup_mask = cup_mask.filter(ImageFilter.GaussianBlur(14))

PRODUCTS_DATA = [
    {
        'id': 'araku-instant',
        'key': 'instant',
        'sub': 'INSTANT COFFEE POWDER',
        'ratio': '100% PURE ARABICA • ZERO CHICORY',
        'theme': '#123D2F',
        'weights': [('50g', '50 g'), ('100g', '100 g'), ('250g', '250 g')]
    },
    {
        'id': 'araku-special-blend',
        'key': 'special_blend',
        'sub': 'SPECIAL BLEND FILTER',
        'ratio': '100% PURE FILTER COFFEE',
        'theme': '#28170F',
        'weights': [('50g', '50 g'), ('100g', '100 g'), ('250g', '250 g')]
    },
    {
        'id': 'araku-signature',
        'key': 'signature',
        'sub': 'SIGNATURE KAAPI',
        'ratio': '80% ARABICA • 20% CHICORY',
        'theme': '#651C2A',
        'weights': [('50g', '50 g'), ('100g', '100 g'), ('250g', '250 g')]
    },
    {
        'id': 'araku-premium',
        'key': 'premium',
        'sub': 'PREMIUM COFFEE POWDER',
        'ratio': '70% COFFEE • 30% CHICORY',
        'theme': '#202124',
        'weights': [('50g', '50 g'), ('100g', '100 g'), ('250g', '250 g')]
    }
]

def make_panel(prod, weight_tuple):
    slug, label_str = weight_tuple
    W, H = 800, 900
    panel = Image.new('RGB', (W, H), '#FBF8F2')
    panel.paste(mountain_bg, (0, 0))

    # Soft warm gradient transition from mountains to warm cream parchment
    grad = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)
    for y in range(230, H):
        alpha = int(min(255, (y - 230) * 1.3))
        gdraw.line([(0, y), (W, y)], fill=(248, 244, 236, alpha))
    panel.paste(grad, (0, 0), grad)
    draw = ImageDraw.Draw(panel)

    # 1. Authentic Brand Vector Emblem
    draw.ellipse([372, 38, 396, 62], fill='#2D7D46')
    draw.ellipse([404, 38, 428, 62], fill='#205B32')
    draw.text((W // 2, 88), 'SJT', fill='#1A0F0A', font=f_brand, anchor='mm')
    draw.text((W // 2, 122), 'FARMS', fill='#1A0F0A', font=f_farms, anchor='mm')
    draw.text((W // 2, 150), '— Pure Goodness from Nature —', fill='#8B5A2B', font=f_tagline, anchor='mm')

    # 2. Arched Heraldic Brand Banner
    banner_y = 185
    banner_h = 160
    bw = 640
    bx = (W - bw) // 2

    draw.rounded_rectangle([bx - 5, banner_y - 5, bx + bw + 5, banner_y + banner_h + 5], radius=24, fill='#D7AD36')
    draw.rounded_rectangle([bx - 1, banner_y - 1, bx + bw + 1, banner_y + banner_h + 1], radius=20, fill=prod['theme'])
    draw.rounded_rectangle([bx + 4, banner_y + 4, bx + bw - 4, banner_y + banner_h - 4], radius=16, outline='#FFE58F', width=2)

    draw.text((W // 2, banner_y + 44), 'ARAKU', fill='#FFFFFF', font=f_georgia_lg, anchor='mm')
    draw.text((W // 2, banner_y + 42), 'ARAKU', fill='#FFDF79', font=f_georgia_lg, anchor='mm')
    draw.text((W // 2, banner_y + 105), prod['sub'], fill='#FFFFFF', font=f_georgia_md, anchor='mm')

    # 3. Formulation Ribbon
    ribbon_y = banner_y + banner_h - 10
    rw = 520
    rx = (W - rw) // 2
    draw.rounded_rectangle([rx, ribbon_y, rx + rw, ribbon_y + 48], radius=12, fill='#D7AD36', outline='#8B6508', width=2)
    draw.rounded_rectangle([rx + 2, ribbon_y + 2, rx + rw - 2, ribbon_y + 46], radius=10, outline='#FFF5D0', width=1)
    draw.text((W // 2, ribbon_y + 24), prod['ratio'], fill='#28170F', font=f_sans_sm, anchor='mm')

    # 4. Middle Coffee Cup vignette
    panel.paste(cup_crop, ((W - 420) // 2, 400), cup_mask)

    # 5. Bottom Net Weight Ribbon
    nw_y = 750
    nw_w = 420
    nw_x = (W - nw_w) // 2
    draw.rounded_rectangle([nw_x, nw_y, nw_x + nw_w, nw_y + 86], radius=12, fill='#D7AD36', outline='#8B6508', width=3)
    draw.rounded_rectangle([nw_x + 3, nw_y + 3, nw_x + nw_w - 3, nw_y + 83], radius=9, outline='#FFF5D0', width=2)
    draw.text((W // 2, nw_y + 22), 'NET WEIGHT', fill='#3A2117', font=f_sans_xs, anchor='mm')
    draw.text((W // 2, nw_y + 55), label_str, fill='#160E0A', font=f_weight, anchor='mm')

    return panel

target_w, target_h = 480, 420
target_x, target_y = 272, 330
alpha = math.pi / 2.7
sin_alpha = math.sin(alpha)

for prod in PRODUCTS_DATA:
    for w in prod['weights']:
        slug, label_str = w
        panel = make_panel(prod, w)
        panel_path = os.path.join(LABELS_DIR, f"{prod['id']}-{slug}-crisp-label.png")
        panel.save(panel_path)

        resized_front = panel.convert('RGBA').resize((panel.width, target_h), Image.Resampling.LANCZOS)
        rw, rh = resized_front.size

        out_arr = np.zeros((target_h, target_w, 4), dtype=np.uint8)
        in_arr = np.array(resized_front)

        for x in range(target_w):
            nx = (x / (target_w - 1)) * 2 - 1
            val = nx * sin_alpha
            if abs(val) <= 1:
                theta = math.asin(val)
                norm_in_x = (theta / alpha + 1) / 2
                src_x = int(norm_in_x * (rw - 1))
                src_x = max(0, min(rw - 1, src_x))
                shade = math.cos(theta) ** 0.55
                col = in_arr[:, src_x, :].copy()
                col[:, :3] = (col[:, :3] * shade).astype(np.uint8)
                out_arr[:, x, :] = col

        warped = Image.fromarray(out_arr, 'RGBA')
        mask = Image.new('L', (target_w, target_h), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, target_w, target_h], radius=14, fill=255)
        warped.putalpha(mask)

        jar = master_jar.copy()
        shadow = Image.new('RGBA', jar.size, (0, 0, 0, 0))
        shadow_mask = Image.new('L', (target_w + 10, target_h + 10), 0)
        ImageDraw.Draw(shadow_mask).rounded_rectangle([0, 0, target_w + 10, target_h + 10], radius=16, fill=90)
        shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(6))
        shadow.paste((0, 0, 0, 80), (target_x - 5, target_y - 2), shadow_mask)

        composite = Image.alpha_composite(jar, shadow)
        composite.paste(warped, (target_x, target_y), warped)

        sheen = Image.new('RGBA', jar.size, (0, 0, 0, 0))
        draw_sheen = ImageDraw.Draw(sheen)
        draw_sheen.rectangle([target_x + 30, target_y, target_x + 65, target_y + target_h], fill=(255, 255, 255, 38))
        draw_sheen.rectangle([target_x + target_w - 75, target_y, target_x + target_w - 35, target_y + target_h], fill=(255, 255, 255, 25))
        sheen = sheen.filter(ImageFilter.GaussianBlur(10))
        composite = Image.alpha_composite(composite, sheen)

        out_jar = os.path.join(JARS_DIR, f"{prod['id']}-{slug}-jar.png")
        composite.save(out_jar)
        print(f"Generated clean crisp jar: {out_jar}")

print("ALL 12 JARS REGENERATED WITH VECTOR-CRISP LABELS!")
