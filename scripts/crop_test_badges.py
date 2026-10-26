import os
from PIL import Image

def crop_badge(jar_name, box, out_name):
    p = os.path.join('public/images/products/jars', jar_name)
    im = Image.open(p)
    crop = im.crop(box)
    crop.save(out_name)
    print(f"Saved {out_name} size {crop.size}")

# Let's crop the weight badge area for instant, special, signature, and premium
crop_badge('araku-instant-50g-jar.png', (450, 790, 600, 870), 'scripts/test_instant_50g_badge.png')
crop_badge('araku-instant-100g-jar.png', (450, 790, 600, 870), 'scripts/test_instant_100g_badge.png')
crop_badge('araku-instant-250g-jar.png', (450, 790, 600, 870), 'scripts/test_instant_250g_badge.png')

crop_badge('araku-premium-50g-jar.png', (450, 790, 600, 870), 'scripts/test_premium_50g_badge.png')
crop_badge('araku-premium-100g-jar.png', (450, 790, 600, 870), 'scripts/test_premium_100g_badge.png')
crop_badge('araku-premium-250g-jar.png', (450, 790, 600, 870), 'scripts/test_premium_250g_badge.png')
