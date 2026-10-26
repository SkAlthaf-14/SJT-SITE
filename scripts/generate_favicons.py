import sys
import os
from PyQt5.QtWidgets import QApplication
from PyQt5.QtGui import QImage, QPainter
from PyQt5.QtCore import Qt
from PyQt5.QtSvg import QSvgRenderer
from PIL import Image

app = QApplication(sys.argv)

# Master Official SJT Farms Favicon SVG
# - Full-bleed espresso dark background (#24150F) so it never gets clipped awkwardly by Google/Chrome
# - Luxury warm Chikmagalur gold circular seal (#C49A5A)
# - Concentric precision gold ring with elegant dashed heritage ring
# - High-contrast roasted coffee bean with rich gold silhouette & roasted center groove
# - Bold, highly legible serif brand monogram "SJT"
svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <!-- Solid deep espresso roast background -->
  <rect width="100" height="100" fill="#24150F"/>
  
  <!-- Outer Gold Estate Crest Ring -->
  <circle cx="50" cy="50" r="45" stroke="#C49A5A" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="41.5" stroke="#C49A5A" stroke-width="0.75" stroke-dasharray="2.5 1.5" opacity="0.8"/>
  
  <!-- Central Hand-Harvested Coffee Bean Emblem -->
  <!-- Outer Bean Silhouette -->
  <path d="M50 20C36.5 20 26.5 30.5 26.5 45C26.5 59.5 36.5 70 50 70C63.5 70 73.5 59.5 73.5 45C73.5 30.5 63.5 20 50 20Z" fill="#361F15" stroke="#C49A5A" stroke-width="2.5"/>
  
  <!-- Signature Curved Center Groove / Crease -->
  <path d="M50 24C50 24 43 36 50 45C57 54 50 66 50 66" stroke="#E6C587" stroke-width="3.5" stroke-linecap="round"/>
  
  <!-- Official SJT Brand Monogram in Warm Chikmagalur Gold -->
  <text x="50" y="87" text-anchor="middle" fill="#E6C587" font-family="Georgia, 'Playfair Display', 'Times New Roman', serif" font-weight="bold" font-size="14.5" letter-spacing="2">SJT</text>
</svg>"""

# Save updated public/favicon.svg
with open('public/favicon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print("Saved public/favicon.svg")

renderer = QSvgRenderer('public/favicon.svg')

# 1. Render High-Resolution Master 512x512
img_512 = QImage(512, 512, QImage.Format_ARGB32)
img_512.fill(Qt.transparent)
painter = QPainter(img_512)
renderer.render(painter)
painter.end()
img_512.save('public/favicon-512x512.png')
print("Generated public/favicon-512x512.png")

# Use Pillow for high-quality downsampling to exact favicon sizes
master_pil = Image.open('public/favicon-512x512.png')

sizes = {
    'favicon-48x48.png': 48,
    'favicon-96x96.png': 96,
    'favicon-192x192.png': 192,
    'favicon.png': 96,  # 96x96 px square PNG as requested
    'apple-touch-icon.png': 180,
    'logo.png': 512,
}

for filename, sz in sizes.items():
    resized = master_pil.resize((sz, sz), Image.Resampling.LANCZOS)
    resized.save(os.path.join('public', filename), format='PNG')
    print(f"Generated public/{filename} ({sz}x{sz})")

# Also generate public/images/sjt-farms-logo.png (512x512) for Organization JSON-LD
os.makedirs('public/images', exist_ok=True)
master_pil.save('public/images/sjt-farms-logo.png', format='PNG')
print("Generated public/images/sjt-farms-logo.png (512x512)")

# Generate multi-size favicon.ico (16, 32, 48)
ico_16 = master_pil.resize((16, 16), Image.Resampling.LANCZOS)
ico_32 = master_pil.resize((32, 32), Image.Resampling.LANCZOS)
ico_48 = master_pil.resize((48, 48), Image.Resampling.LANCZOS)
master_pil.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
print("Generated public/favicon.ico with 16x16, 32x32, 48x48")

print("All favicon assets generated successfully!")
