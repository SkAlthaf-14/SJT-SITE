"""
SJT FARMS - Packaging Artwork & Jar Mockup Generation Engine
Generates:
1. 12 High-Resolution 300-DPI Label Artwork PNGs (6" x 3" @ 300 DPI = 1800 x 900 px)
2. 12 Editable Vector SVG Source Files
3. 12 Studio 3D Jar Mockups (1024 x 1024 px) matching Image B
4. Cinematic 4-Brand Website Showcase Banner for Hero Slide 2 (1920 x 1080 px)
"""

import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = os.path.abspath(os.path.dirname(__file__) + '/..')
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
LABELS_DIR = os.path.join(PUBLIC_DIR, 'images/products/labels')
JARS_DIR = os.path.join(PUBLIC_DIR, 'images/products/jars')
SHOWCASE_DIR = os.path.join(PUBLIC_DIR, 'images/products/showcase')

os.makedirs(LABELS_DIR, exist_ok=True)
os.makedirs(JARS_DIR, exist_ok=True)
os.makedirs(SHOWCASE_DIR, exist_ok=True)

# 1. Product Family Definitions
PRODUCTS = [
    {
        'id': 'araku-instant',
        'key': 'instant',
        'name': 'Araku Instant Coffee Powder',
        'short_name': 'Instant Coffee Powder',
        'theme_color': '#11382B',       # Forest Green
        'theme_color_dark': '#0A241C',
        'accent_gold': '#D4AF37',
        'text_cream': '#F9F5EB',
        'badge_bg': '#0D2E24',
        'story': 'Sourced from the lush hills of Araku Valley, our instant coffee powder brings you the rich aroma and bold taste of 100% pure Arabica, expertly crafted for true coffee lovers.',
        'bullets': [
            '100% Natural Arabica Beans',
            'Rich Aroma & Bold Taste',
            'Quick & Easy Preparation',
            'No Added Preservatives'
        ],
        'seal_text': '100% PURE ARABICA',
        'ingredients': '100% Pure Coffee Beans (Arabica) | Without Chicory',
        'prep_steps': [
            'Add 1 tsp (approx. 2 g) of coffee powder',
            'Pour hot water (150 ml)',
            'Stir well and enjoy!'
        ],
        'weights': [
            {'size': '50 g', 'slug': '50g', 'price': 99},
            {'size': '100 g', 'slug': '100g', 'price': 199},
            {'size': '250 g', 'slug': '250g', 'price': 479},
        ]
    },
    {
        'id': 'araku-special-blend',
        'key': 'special_blend',
        'name': 'Araku Special Blend Filter Coffee Powder',
        'short_name': 'Special Blend',
        'theme_color': '#3A2016',       # Coffee Brown
        'theme_color_dark': '#26140D',
        'accent_gold': '#C5A059',
        'text_cream': '#F9F4EC',
        'badge_bg': '#2E1911',
        'story': 'A perfect blend of handpicked Arabica coffee from the hills of Araku Valley. Our Special Blend filter coffee powder delivers a rich aroma, smooth taste and authentic South Indian coffee experience.',
        'bullets': [
            '100% Natural Arabica Beans',
            'Rich Aroma & Bold Taste',
            'Traditional Filter Coffee',
            'No Added Preservatives'
        ],
        'seal_text': '100% PURE ARABICA',
        'ingredients': '100% Pure Coffee Beans (Arabica) | Without Chicory',
        'prep_steps': [
            'Add 2 tbsp (15-20 g) of coffee powder into filter',
            'Pour hot water (100 ml) over the press disc',
            'Mix thick decoction with hot milk & enjoy!'
        ],
        'weights': [
            {'size': '50 g', 'slug': '50g', 'price': 69},
            {'size': '100 g', 'slug': '100g', 'price': 149},
            {'size': '250 g', 'slug': '250g', 'price': 329},
        ]
    },
    {
        'id': 'araku-signature',
        'key': 'signature',
        'name': 'Araku Signature Coffee Powder',
        'short_name': 'Signature (80:20)',
        'theme_color': '#4A0E17',       # Deep Burgundy
        'theme_color_dark': '#30080E',
        'accent_gold': '#D4AF37',
        'text_cream': '#FBF6F0',
        'badge_bg': '#3A0910',
        'story': 'A classic South Indian blend with 80% Arabica coffee and 20% chicory, sourced from the hills of Araku Valley. Roasted to perfection for your daily morning ritual.',
        'bullets': [
            '80% Coffee 20% Chicory',
            'Rich Aroma & Smooth Taste',
            'Traditional Filter Coffee',
            'No Added Preservatives'
        ],
        'seal_text': 'AUTHENTIC SOUTH INDIAN TASTE',
        'ingredients': '80% Coffee Beans (Arabica) | 20% Chicory',
        'prep_steps': [
            'Add 2 tbsp (15-20 g) of coffee powder into filter',
            'Pour hot water (100 ml) over the press disc',
            'Mix thick decoction with hot milk & enjoy!'
        ],
        'weights': [
            {'size': '50 g', 'slug': '50g', 'price': 49},
            {'size': '100 g', 'slug': '100g', 'price': 119},
            {'size': '250 g', 'slug': '250g', 'price': 219},
        ]
    },
    {
        'id': 'araku-premium',
        'key': 'premium',
        'name': 'Araku Premium Coffee Powder',
        'short_name': 'Premium (70:30)',
        'theme_color': '#16181B',       # Charcoal Black with forest green
        'theme_color_dark': '#0E0F11',
        'accent_gold': '#E5A93C',
        'text_cream': '#F8F6F0',
        'badge_bg': '#121416',
        'story': 'A premium blend with 70% Arabica coffee and 30% chicory, sourced from the hills of Araku Valley. Roasted for deep body, rich crema, and a truly authentic coffee experience.',
        'bullets': [
            '70% Coffee 30% Chicory (Flagged)',
            'Rich Aroma & Bold Taste',
            'Premium Quality Filter Coffee',
            'No Added Preservatives'
        ],
        'seal_text': 'PREMIUM QUALITY',
        'ingredients': '70% Coffee Beans (Arabica) | 30% Chicory (Flagged Standard Formulation)',
        'prep_steps': [
            'Add 2 tbsp (15-20 g) of coffee powder into filter',
            'Pour hot water (100 ml) over the press disc',
            'Mix thick decoction with hot milk & enjoy!'
        ],
        'weights': [
            {'size': '50 g', 'slug': '50g', 'price': 49},
            {'size': '100 g', 'slug': '100g', 'price': 109},
            {'size': '250 g', 'slug': '250g', 'price': 199},
        ]
    }
]

# Fonts setup
def get_font(name, size):
    font_paths = {
        'serif': r'C:\Windows\Fonts\georgia.ttf',
        'serif_bold': r'C:\Windows\Fonts\georgiab.ttf',
        'sans': r'C:\Windows\Fonts\arial.ttf',
        'sans_bold': r'C:\Windows\Fonts\arialbd.ttf',
        'script': r'C:\Windows\Fonts\georgiai.ttf',
    }
    path = font_paths.get(name, r'C:\Windows\Fonts\arial.ttf')
    if os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()

# Helper to draw a clean vector checkmark icon
def draw_check_icon(draw, cx, cy, radius, bg_color, check_color):
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=bg_color)
    # Checkmark line coordinates
    p1 = (cx - radius * 0.45, cy)
    p2 = (cx - radius * 0.1, cy + radius * 0.4)
    p3 = (cx + radius * 0.5, cy - radius * 0.35)
    draw.line([p1, p2, p3], fill=check_color, width=3, joint='curve')

# 2. Build 12 Label Artworks (1800 x 900 px @ 300 DPI)
def build_label_artwork(prod, weight_variant):
    width, height = 1800, 900
    label = Image.new('RGB', (width, height), prod['theme_color'])
    draw = ImageDraw.Draw(label)

    # Load center crop from raw montage
    raw_center_path = os.path.join(PUBLIC_DIR, f'images/products/labels_raw/center_{prod["key"]}.png')
    if os.path.exists(raw_center_path):
        raw_center = Image.open(raw_center_path).convert('RGB')
    else:
        raw_center = Image.new('RGB', (140, 170), prod['theme_color'])

    # Center Panel width = 800 px (from x=500 to x=1300)
    center_w, center_h = 800, 900
    center_img = raw_center.resize((center_w, center_h), Image.Resampling.LANCZOS)
    label.paste(center_img, (500, 0))

    # --- LEFT PANEL (x: 0 to 500) ---
    left_overlay = Image.new('RGB', (500, height), prod['theme_color_dark'])
    label.paste(left_overlay, (0, 0))
    draw = ImageDraw.Draw(label)

    gold_border = prod['accent_gold']
    draw.rectangle([25, 25, 480, height - 25], outline=gold_border, width=3)
    draw.rectangle([32, 32, 473, height - 32], outline=gold_border, width=1)

    for cx, cy in [(32, 32), (473, 32), (32, height - 32), (473, height - 32)]:
        draw.rectangle([cx - 4, cy - 4, cx + 4, cy + 4], fill=gold_border)

    f_script = get_font('script', 36)
    f_serif_bold = get_font('serif_bold', 26)
    f_sans = get_font('sans', 18)
    f_sans_bold = get_font('sans_bold', 19)
    f_small = get_font('sans', 15)

    draw.text((250, 75), "The True Taste", fill=gold_border, font=f_script, anchor='mm')
    draw.text((250, 115), "of Araku", fill='#FFFFFF', font=f_serif_bold, anchor='mm')
    draw.line([120, 145, 380, 145], fill=gold_border, width=2)

    # Word wrap story
    words = prod['story'].split(' ')
    lines = []
    cur_line = []
    for w in words:
        test = ' '.join(cur_line + [w])
        bbox = draw.textbbox((0, 0), test, font=f_sans)
        if bbox[2] - bbox[0] < 410:
            cur_line.append(w)
        else:
            lines.append(' '.join(cur_line))
            cur_line = [w]
    if cur_line:
        lines.append(' '.join(cur_line))

    y_text = 175
    for line in lines:
        draw.text((50, y_text), line, fill=prod['text_cream'], font=f_sans)
        y_text += 28

    # Bullet badges with vector checkmarks
    y_bullets = y_text + 30
    draw.line([80, y_bullets - 15, 420, y_bullets - 15], fill=gold_border, width=1)
    for b in prod['bullets']:
        draw_check_icon(draw, 64, y_bullets + 12, 13, gold_border, '#0A1C14')
        draw.text((92, y_bullets + 12), b, fill='#FFFFFF', font=f_sans_bold, anchor='lm')
        y_bullets += 44

    # Bottom Seal on Left Panel
    draw.ellipse([180, 710, 320, 850], outline=gold_border, width=3)
    draw.ellipse([186, 716, 314, 844], outline=gold_border, width=1)
    seal_parts = prod['seal_text'].split(' ')
    if len(seal_parts) >= 3:
        draw.text((250, 760), ' '.join(seal_parts[:2]), fill=gold_border, font=get_font('sans_bold', 15), anchor='mm')
        draw.text((250, 785), ' '.join(seal_parts[2:]), fill='#FFFFFF', font=get_font('sans_bold', 14), anchor='mm')
    else:
        draw.text((250, 775), prod['seal_text'], fill=gold_border, font=get_font('sans_bold', 15), anchor='mm')
    draw.text((250, 815), "★  PURE ESTATE  ★", fill=gold_border, font=get_font('sans_bold', 12), anchor='mm')

    # --- RIGHT PANEL (x: 1300 to 1800) ---
    right_overlay = Image.new('RGB', (500, height), prod['theme_color_dark'])
    label.paste(right_overlay, (1300, 0))
    draw = ImageDraw.Draw(label)

    draw.rectangle([1320, 25, 1775, height - 25], outline=gold_border, width=3)
    draw.rectangle([1327, 32, 1768, height - 32], outline=gold_border, width=1)

    for cx, cy in [(1327, 32), (1768, 32), (1327, height - 32), (1768, height - 32)]:
        draw.rectangle([cx - 4, cy - 4, cx + 4, cy + 4], fill=gold_border)

    # 1. INGREDIENTS BOX
    draw.rectangle([1350, 50, 1745, 180], fill=prod['badge_bg'], outline=gold_border, width=2)
    draw.text((1547, 75), "INGREDIENTS:", fill=gold_border, font=get_font('sans_bold', 20), anchor='mm')
    ing_words = prod['ingredients'].split(' ')
    ing_lines = []
    cur_line = []
    for w in ing_words:
        test = ' '.join(cur_line + [w])
        if draw.textbbox((0, 0), test, font=f_small)[2] < 370:
            cur_line.append(w)
        else:
            ing_lines.append(' '.join(cur_line))
            cur_line = [w]
    if cur_line:
        ing_lines.append(' '.join(cur_line))
    y_ing = 105
    for line in ing_lines:
        draw.text((1547, y_ing), line, fill='#FFFFFF', font=f_small, anchor='mm')
        y_ing += 24

    # 2. HOW TO PREPARE BOX
    draw.rectangle([1350, 200, 1745, 430], fill=prod['badge_bg'], outline=gold_border, width=2)
    draw.text((1547, 225), "HOW TO PREPARE:", fill=gold_border, font=get_font('sans_bold', 20), anchor='mm')
    y_p = 265
    for i, step in enumerate(prod['prep_steps'], 1):
        draw.ellipse([1365, y_p - 10, 1395, y_p + 20], fill=gold_border)
        draw.text((1380, y_p + 5), str(i), fill='#0A1C14', font=get_font('sans_bold', 16), anchor='mm')
        swords = step.split(' ')
        slines = []
        scur = []
        for w in swords:
            t = ' '.join(scur + [w])
            if draw.textbbox((0, 0), t, font=f_small)[2] < 310:
                scur.append(w)
            else:
                slines.append(' '.join(scur))
                scur = [w]
        if scur:
            slines.append(' '.join(scur))
        sy = y_p - 5
        for sl in slines:
            draw.text((1410, sy), sl, fill='#FFFFFF', font=f_small)
            sy += 20
        y_p += 54

    # 3. STORAGE BOX
    draw.rectangle([1350, 450, 1745, 570], fill=prod['badge_bg'], outline=gold_border, width=2)
    draw.text((1547, 475), "STORAGE INSTRUCTIONS:", fill=gold_border, font=get_font('sans_bold', 18), anchor='mm')
    draw.text((1547, 510), "Keep the jar tightly closed after opening.", fill='#FFFFFF', font=f_small, anchor='mm')
    draw.text((1547, 535), "Store in a cool, dry place away from sunlight.", fill='#FFFFFF', font=f_small, anchor='mm')

    # 4. REGULATORY & MRP BOX (with Green Veg Symbol)
    draw.rectangle([1350, 590, 1745, 845], fill='#FDFBF7', outline=gold_border, width=3)

    # Green Veg symbol
    draw.rectangle([1370, 615, 1420, 665], outline='#1B7A3E', width=3)
    draw.ellipse([1382, 627, 1408, 653], fill='#1B7A3E')

    # MRP Display
    draw.text((1580, 625), "MRP (incl. of all taxes)", fill='#5C4033', font=get_font('sans_bold', 18), anchor='mm')
    draw.text((1580, 670), f"₹{weight_variant['price']}", fill='#16181B', font=get_font('serif_bold', 48), anchor='mm')
    draw.text((1580, 715), f"NET WEIGHT: {weight_variant['size']}", fill='#A37936', font=get_font('sans_bold', 20), anchor='mm')

    draw.line([1370, 740, 1725, 740], fill='#DED2C4', width=1)
    draw.text((1547, 765), "MARKETED & PACKED BY: SJT FARMS", fill='#201814', font=get_font('sans_bold', 14), anchor='mm')
    draw.text((1547, 788), "Araku Valley, Visakhapatnam Dist, AP - 531149", fill='#6B5B52', font=f_small, anchor='mm')
    draw.text((1547, 812), "Customer Care: care@sjtfarms.com • Pure Harvest", fill='#6B5B52', font=f_small, anchor='mm')

    # --- RE-STAMP CENTER PANEL WEIGHT BANNER ---
    draw.rectangle([700, 770, 1100, 870], fill='#F0C767', outline='#8B6508', width=3)
    draw.rectangle([706, 776, 1094, 864], outline='#FFF1B8', width=2)
    draw.text((900, 800), "NET WEIGHT", fill='#4A3208', font=get_font('sans_bold', 20), anchor='mm')
    draw.text((900, 838), weight_variant['size'], fill='#1A1102', font=get_font('serif_bold', 38), anchor='mm')

    # Save 300 DPI PNG
    out_png_path = os.path.join(LABELS_DIR, f"{prod['id']}-{weight_variant['slug']}-label.png")
    label.save(out_png_path, dpi=(300, 300))

    front_panel = label.crop((500, 0, 1300, height))
    return label, front_panel


# 3. Build Realistic 3D Jar Mockup (1024 x 1024 px)
def build_jar_mockup(prod, weight_variant, front_panel):
    master_jar_path = os.path.join(PUBLIC_DIR, 'images/products/jars/master_coffee_jar_clean.png')
    jar = Image.open(master_jar_path).convert('RGBA')

    target_w = 480
    target_h = 420
    target_x = 272
    target_y = 330

    alpha = math.pi / 2.7
    sin_alpha = math.sin(alpha)
    resized_front = front_panel.convert('RGBA').resize((front_panel.width, target_h), Image.Resampling.LANCZOS)
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

    # Die-cut rounded corners
    mask = Image.new('L', (target_w, target_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, target_w, target_h], radius=14, fill=255)
    warped.putalpha(mask)

    # Soft label paper shadow
    shadow = Image.new('RGBA', jar.size, (0, 0, 0, 0))
    shadow_mask = Image.new('L', (target_w + 10, target_h + 10), 0)
    ImageDraw.Draw(shadow_mask).rounded_rectangle([0, 0, target_w + 10, target_h + 10], radius=16, fill=90)
    shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(6))
    shadow.paste((0, 0, 0, 80), (target_x - 5, target_y - 2), shadow_mask)

    composite = jar.copy()
    composite = Image.alpha_composite(composite, shadow)
    composite.paste(warped, (target_x, target_y), warped)

    # Glass specular sheen
    sheen = Image.new('RGBA', jar.size, (0, 0, 0, 0))
    draw_sheen = ImageDraw.Draw(sheen)
    draw_sheen.rectangle([target_x + 30, target_y, target_x + 65, target_y + target_h], fill=(255, 255, 255, 38))
    draw_sheen.rectangle([target_x + target_w - 75, target_y, target_x + target_w - 35, target_y + target_h], fill=(255, 255, 255, 25))
    sheen = sheen.filter(ImageFilter.GaussianBlur(10))

    composite = Image.alpha_composite(composite, sheen)

    out_jar_path = os.path.join(JARS_DIR, f"{prod['id']}-{weight_variant['slug']}-jar.png")
    composite.save(out_jar_path)
    return composite


# 4. Generate Editable SVG Source File
def build_label_svg(prod, weight_variant):
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 900" width="1800" height="900">
  <defs>
    <linearGradient id="themeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{prod['theme_color_dark']}" />
      <stop offset="100%" stop-color="{prod['theme_color']}" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E5C158" />
      <stop offset="50%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#997722" />
    </linearGradient>
  </defs>

  <!-- Left Panel: Story & Philosophy -->
  <rect x="0" y="0" width="500" height="900" fill="url(#themeGrad)" />
  <rect x="25" y="25" width="455" height="850" fill="none" stroke="{prod['accent_gold']}" stroke-width="3" />
  <rect x="32" y="32" width="441" height="836" fill="none" stroke="{prod['accent_gold']}" stroke-width="1" />
  <text x="250" y="80" font-family="Georgia, serif" font-size="34" font-style="italic" fill="{prod['accent_gold']}" text-anchor="middle">The True Taste</text>
  <text x="250" y="120" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#FFFFFF" text-anchor="middle">of Araku</text>
  <line x1="120" y1="145" x2="380" y2="145" stroke="{prod['accent_gold']}" stroke-width="2" />
  <text x="50" y="190" font-family="Arial, sans-serif" font-size="17" fill="{prod['text_cream']}">
    <tspan x="50" dy="0">Sourced from the lush hills of Araku Valley,</tspan>
    <tspan x="50" dy="28">our single-origin harvest delivers unmatched</tspan>
    <tspan x="50" dy="28">aroma, creamy crema, and authentic taste.</tspan>
  </text>

  <!-- Center Panel: Brand Identity & Net Weight -->
  <rect x="500" y="0" width="800" height="900" fill="{prod['theme_color']}" />
  <text x="900" y="80" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#FFFFFF" text-anchor="middle">SJT FARMS</text>
  <text x="900" y="115" font-family="Georgia, serif" font-size="20" font-style="italic" fill="{prod['accent_gold']}" text-anchor="middle">Pure Goodness from Nature</text>
  <rect x="620" y="150" width="560" height="90" rx="45" fill="{prod['badge_bg']}" stroke="{prod['accent_gold']}" stroke-width="3" />
  <text x="900" y="208" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="{prod['accent_gold']}" text-anchor="middle">{prod['name'].upper()}</text>

  <!-- Bottom Net Weight Banner -->
  <rect x="700" y="770" width="400" height="100" rx="10" fill="url(#goldGrad)" stroke="#8B6508" stroke-width="3" />
  <text x="900" y="805" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#4A3208" text-anchor="middle">NET WEIGHT</text>
  <text x="900" y="848" font-family="Georgia, serif" font-size="38" font-weight="bold" fill="#1A1102" text-anchor="middle">{weight_variant['size']}</text>

  <!-- Right Panel: Ingredients, Instructions & MRP -->
  <rect x="1300" y="0" width="500" height="900" fill="url(#themeGrad)" />
  <rect x="1320" y="25" width="455" height="850" fill="none" stroke="{prod['accent_gold']}" stroke-width="3" />
  <rect x="1327" y="32" width="441" height="836" fill="none" stroke="{prod['accent_gold']}" stroke-width="1" />
  <text x="1547" y="80" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="{prod['accent_gold']}" text-anchor="middle">INGREDIENTS</text>
  <text x="1547" y="120" font-family="Arial, sans-serif" font-size="16" fill="#FFFFFF" text-anchor="middle">{prod['ingredients']}</text>

  <!-- MRP White Card -->
  <rect x="1350" y="600" width="395" height="235" rx="12" fill="#FDFBF7" stroke="{prod['accent_gold']}" stroke-width="3" />
  <rect x="1370" y="625" width="44" height="44" fill="none" stroke="#1B7A3E" stroke-width="3" />
  <circle cx="1392" cy="647" r="12" fill="#1B7A3E" />
  <text x="1580" y="635" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#5C4033" text-anchor="middle">MRP (incl. of all taxes)</text>
  <text x="1580" y="685" font-family="Georgia, serif" font-size="46" font-weight="bold" fill="#16181B" text-anchor="middle">₹{weight_variant['price']}</text>
  <text x="1580" y="730" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#A37936" text-anchor="middle">NET WEIGHT: {weight_variant['size']}</text>
  <text x="1547" y="780" font-family="Arial, sans-serif" font-size="13" fill="#6B5B52" text-anchor="middle">FSSAI Certified • Marketed by SJT FARMS</text>
  <text x="1547" y="805" font-family="Arial, sans-serif" font-size="13" fill="#6B5B52" text-anchor="middle">Araku Valley, AP - 531149 • care@sjtfarms.com</text>
</svg>'''
    out_svg_path = os.path.join(LABELS_DIR, f"{prod['id']}-{weight_variant['slug']}-label.svg")
    with open(out_svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)


# 5. Build Hero Slide 2 Cinematic Showcase Banner (1920 x 1080)
def build_showcase_banner():
    canvas_w, canvas_h = 1920, 1080
    showcase = Image.new('RGB', (canvas_w, canvas_h), '#160E0A')

    # Load Araku mountain plantation background
    bg_path = os.path.join(PUBLIC_DIR, 'images/araku_mountain_cinematic_hero.jpg')
    if os.path.exists(bg_path):
        bg = Image.open(bg_path).convert('RGB')
        bg = bg.resize((canvas_w, canvas_h), Image.Resampling.LANCZOS)
        # Apply luxury deep espresso vignette & atmospheric darkening for high contrast
        vignette = Image.new('RGBA', (canvas_w, canvas_h), (22, 14, 10, 215))
        bg = Image.alpha_composite(bg.convert('RGBA'), vignette).convert('RGB')
        showcase.paste(bg, (0, 0))

    # Add elegant rustic wooden table at the bottom (y=720 to 1080)
    draw = ImageDraw.Draw(showcase)
    draw.rectangle([0, 720, canvas_w, canvas_h], fill='#1A0F0A')
    # Subtle antique gold reflection accent line
    draw.line([0, 720, canvas_w, 720], fill='#A66A3F', width=2)
    draw.line([0, 722, canvas_w, 722], fill='#2A1812', width=2)

    # Ambient warm glow circle in the center
    glow = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([300, 200, 1620, 900], fill=(215, 173, 54, 25))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    showcase.paste(glow, (0, 0), glow)

    out_showcase_path = os.path.join(SHOWCASE_DIR, 'sjt_four_coffee_showcase.jpg')
    showcase.save(out_showcase_path, quality=95)
    print(f"[SUCCESS] Saved Clean Atmospheric Showcase Banner: {out_showcase_path}")


def main():
    print("Starting generation of all 12 label variants, SVG sources, and 3D jar mockups...")
    for prod in PRODUCTS:
        for w in prod['weights']:
            label_img, front_panel = build_label_artwork(prod, w)
            build_label_svg(prod, w)
            build_jar_mockup(prod, w, front_panel)

    print("[SUCCESS] All 12 Label PNGs (300 DPI) and SVGs created.")
    print("[SUCCESS] All 12 Realistic Jar Mockup PNGs created.")
    build_showcase_banner()
    print("[COMPLETE] Packaging & Showcase Generation Finished Successfully!")


if __name__ == '__main__':
    main()
