import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

BASE_DIR = os.path.abspath(os.path.dirname(__file__) + '/..')
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
SEO_DIR = os.path.join(PUBLIC_DIR, 'images/seo')
os.makedirs(SEO_DIR, exist_ok=True)

# Assets
JAR_PATH = os.path.join(PUBLIC_DIR, 'images/products/jars/araku-signature-100g-jar.png')
STUDIO_BG_PATH = os.path.join(PUBLIC_DIR, 'images/hero/slide4_signature_studio.jpg')
STUDIO_BG3_PATH = os.path.join(PUBLIC_DIR, 'images/hero/slide3_special_blend_studio.jpg')

def create_seo_thumbnail_v1():
    """
    Composition 1:
    1200x630 canvas
    Uses the warm studio background (slide4_signature_studio.jpg) resized and cropped to 1200x630.
    Centers the authentic Araku Signature 100g jar with multi-layer realistic contact shadows,
    ambient warm glow, and subtle vignetting.
    The jar is centered within the 630x630 square safe zone (x=285 to 915).
    """
    canvas_w, canvas_h = 1200, 630
    
    # 1. Base background
    bg = Image.open(STUDIO_BG_PATH).convert('RGB')
    # Resize keeping aspect ratio to cover 1200x630
    scale = max(canvas_w / bg.width, canvas_h / bg.height)
    new_w, new_h = int(bg.width * scale), int(bg.height * scale)
    bg = bg.resize((new_w, new_h), Image.Resampling.LANCZOS)
    # Center crop
    crop_x = (new_w - canvas_w) // 2
    crop_y = (new_h - canvas_h) // 2
    bg_cropped = bg.crop((crop_x, crop_y, crop_x + canvas_w, crop_y + canvas_h)).convert('RGBA')
    
    # 2. Add subtle luxury vignette and warm central spotlight
    vignette = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    v_draw = ImageDraw.Draw(vignette)
    
    # Radial spotlight in center-back
    center_x = canvas_w // 2
    center_y = int(canvas_h * 0.48)
    
    # Warm amber backlight behind jar
    glow = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    g_draw.ellipse([center_x - 260, center_y - 240, center_x + 260, center_y + 240], fill=(215, 173, 54, 45))
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    bg_composite = Image.alpha_composite(bg_cropped, glow)
    
    # 3. Load authentic jar
    jar = Image.open(JAR_PATH).convert('RGBA')
    bbox = jar.getbbox()
    jar_tight = jar.crop(bbox)
    
    # Scale jar to fit elegantly within height=630 (target height ~520px, leaving ~55px top/bottom padding)
    target_jar_h = 515
    jar_scale = target_jar_h / jar_tight.height
    target_jar_w = int(jar_tight.width * jar_scale)
    jar_resized = jar_tight.resize((target_jar_w, target_jar_h), Image.Resampling.LANCZOS)
    
    # Calculate jar position
    jar_x = center_x - (target_jar_w // 2)
    jar_y = int(canvas_h * 0.94) - target_jar_h  # Base aligned near bottom table
    
    # 4. Realistic Ground Contact Shadow
    shadow_layer = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    base_y = jar_y + target_jar_h - 10
    
    # Soft wide ambient shadow
    s_draw.ellipse([center_x - int(target_jar_w * 0.52), base_y - 12, center_x + int(target_jar_w * 0.52), base_y + 24], fill=(12, 6, 4, 180))
    # Dense contact shadow right under base
    s_draw.ellipse([center_x - int(target_jar_w * 0.40), base_y - 6, center_x + int(target_jar_w * 0.40), base_y + 12], fill=(8, 4, 2, 235))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(8))
    
    # Extra sharp contact occlusion line
    sharp_shadow = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    ss_draw = ImageDraw.Draw(sharp_shadow)
    ss_draw.ellipse([center_x - int(target_jar_w * 0.32), base_y - 2, center_x + int(target_jar_w * 0.32), base_y + 5], fill=(0, 0, 0, 240))
    sharp_shadow = sharp_shadow.filter(ImageFilter.GaussianBlur(2.5))
    
    # Composite shadows
    bg_composite = Image.alpha_composite(bg_composite, shadow_layer)
    bg_composite = Image.alpha_composite(bg_composite, sharp_shadow)
    
    # Paste jar
    bg_composite.paste(jar_resized, (jar_x, jar_y), jar_resized)
    
    # Convert to RGB with premium quality
    final_img = bg_composite.convert('RGB')
    
    # Enhance contrast and sharpness slightly for thumbnail clarity at small scale
    enhancer = ImageEnhance.Sharpness(final_img)
    final_img = enhancer.enhance(1.10)
    
    out_path = os.path.join(SEO_DIR, 'sjt-farms-coffee-search-thumbnail.jpg')
    final_img.save(out_path, format='JPEG', quality=94, optimize=True)
    print(f"[SUCCESS] Generated V1 SEO Image: {out_path} ({os.path.getsize(out_path)} bytes)")

    companion_path = os.path.join(PUBLIC_DIR, 'images', 'sjt-farms-og-image.jpg')
    final_img.save(companion_path, format='JPEG', quality=94, optimize=True)
    print(f"[SUCCESS] Saved Companion OG Image: {companion_path} ({os.path.getsize(companion_path)} bytes)")

    return out_path

create_seo_thumbnail_v1()
