import os
from PIL import Image, ImageDraw

os.makedirs('public/images/payment', exist_ok=True)

# 1. GOOGLE PAY SVG
gpay_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <rect width="64" height="64" rx="16" fill="#FFFFFF"/>
  <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="15.25" stroke="#E5DFD7" stroke-width="1.5"/>
  <g transform="translate(12, 12)">
    <!-- Google 4-color G -->
    <path d="M38.8 20.42c0-1.41-.12-2.77-.36-4.08H20v7.72h10.54c-.45 2.45-1.85 4.53-3.92 5.92v4.92h6.35c3.71-3.42 5.83-8.46 5.83-14.48z" fill="#4285F4"/>
    <path d="M20 39.58c5.29 0 9.73-1.75 12.97-4.75l-6.35-4.92c-1.76 1.18-4 1.88-6.62 1.88-5.09 0-9.4-3.44-10.94-8.06H2.43v5.08C5.66 35.21 12.3 39.58 20 39.58z" fill="#34A853"/>
    <path d="M9.06 23.73c-.39-1.18-.61-2.43-.61-3.73s.22-2.55.61-3.73V11.2H2.43C1.09 13.87.33 16.85.33 20s.76 6.13 2.1 8.8l6.63-5.07z" fill="#FBBC05"/>
    <path d="M20 7.82c2.88 0 5.46 1 7.49 2.93l5.62-5.62C29.72 2.05 25.28.42 20 .42 12.3.42 5.66 4.79 2.43 11.2l6.63 5.07c1.54-4.62 5.85-8.45 10.94-8.45z" fill="#EA4335"/>
  </g>
</svg>
'''

with open('public/images/payment/google-pay.svg', 'w', encoding='utf-8') as f:
    f.write(gpay_svg.strip())

# 2. PHONEPE SVG (Authentic Pe glyph based on official branding)
phonepe_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <rect width="64" height="64" rx="16" fill="#5F259F"/>
  <!-- Top Accent / Matra -->
  <path d="M34.8 17.6c-2.4-3.2-5.7-5.5-9.4-6.8-1.5-.5-2.8 1-1.8 2.2 2.8 3.2 5.8 6.5 8.2 9.4 1 1.2 2.7.7 3-0.8.2-1.3.1-2.7 0-4z" fill="#FFFFFF"/>
  <!-- Top Horizontal Bar -->
  <rect x="14" y="21.5" width="36" height="5.5" rx="1.5" fill="#FFFFFF"/>
  <!-- Right Vertical Stem -->
  <rect x="38" y="21.5" width="5.5" height="31" rx="1.5" fill="#FFFFFF"/>
  <!-- Left Loop ('Pa' counter) -->
  <path d="M27 27c-4.4 0-8 3.6-8 8v2c0 4.4 3.6 8 8 8h11v-5.5H27c-1.4 0-2.5-1.1-2.5-2.5v-2c0-1.4 1.1-2.5 2.5-2.5h11V27H27z" fill="#FFFFFF"/>
</svg>
'''

with open('public/images/payment/phonepe.svg', 'w', encoding='utf-8') as f:
    f.write(phonepe_svg.strip())

# 3. PAYTM SVG (Authentic two-tone Navy & Cyan wordmark in rounded white container)
paytm_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <rect width="64" height="64" rx="16" fill="#FFFFFF"/>
  <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="15.25" stroke="#E5DFD7" stroke-width="1.5"/>
  <g transform="translate(6, 21)">
    <!-- "Pay" in #002970 -->
    <!-- P -->
    <path d="M2 19V3h6.2c3.4 0 5.6 1.8 5.6 4.8 0 3-2.2 4.8-5.6 4.8H5.6V19H2zm3.6-9.4h2.4c1.5 0 2.4-.8 2.4-2 0-1.2-.9-2-2.4-2H5.6v4z" fill="#002970"/>
    <!-- a -->
    <path d="M19.4 19.3c-2.4 0-4-1.3-4-3.4 0-2.3 1.9-3.4 4.5-3.5l2.7-.1v-.8c0-1-.8-1.6-2.1-1.6-1.1 0-2 .4-2.8 1l-1.3-1.8c1.3-.9 2.7-1.4 4.4-1.4 3.2 0 4.9 1.6 4.9 4.3v7.1h-3.1v-1.6c-.9 1.2-2.1 1.8-3.2 1.8zm2.8-4.5l-2 .1c-1.2.1-2 .6-2 1.6 0 .9.7 1.5 1.7 1.5.9 0 1.7-.5 2.1-1.3l.2-1.9z" fill="#002970"/>
    <!-- y -->
    <path d="M26.8 8h3.4l2.5 7.6L35.2 8h3.3l-4.5 11.2c-1.2 3-2.8 4.6-5.4 4.6-.7 0-1.5-.1-2.1-.4l.7-2.3c.4.2.9.3 1.3.3 1.3 0 2.2-.8 2.8-2.3l.3-.8L26.8 8z" fill="#002970"/>
    <!-- "tm" in #00BAF2 -->
    <!-- t -->
    <path d="M39.6 19v-8.4h-1.6V8.2h1.6V5.4h3.1v2.8h2.3v2.4h-2.3v7.2c0 .6.4.9 1 .9.4 0 .9-.1 1.2-.3v2.3c-.6.3-1.3.4-2 .4-2.1 0-3.3-1.1-3.3-3z" fill="#00BAF2"/>
    <!-- m -->
    <path d="M47.2 19V8.2h3v1.8c.8-1.3 2-2 3.4-2 1.6 0 2.8.8 3.3 2.1.9-1.3 2.2-2.1 3.7-2.1 2.3 0 3.8 1.6 3.8 4.2V19h-3.1v-6.3c0-1.4-.7-2.2-1.8-2.2-1 0-1.8.8-2.1 1.9v6.6h-3.1v-6.3c0-1.4-.7-2.2-1.8-2.2-1 0-1.8.8-2.1 1.9V19h-3.2z" fill="#00BAF2"/>
  </g>
</svg>
'''

with open('public/images/payment/paytm.svg', 'w', encoding='utf-8') as f:
    f.write(paytm_svg.strip())

# 4. UNIVERSAL UPI SVG (NPCI standard chevron arrows in orange and green)
upi_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <rect width="64" height="64" rx="16" fill="#FFFFFF"/>
  <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="15.25" stroke="#E5DFD7" stroke-width="1.5"/>
  <g transform="translate(10, 10)">
    <!-- Orange Upper Triangle / Arrow -->
    <path d="M26.5 4.5L9.5 21.5L14.8 26.8L31.8 9.8L26.5 4.5Z" fill="#F47920"/>
    <!-- Green Lower Triangle / Arrow -->
    <path d="M34.5 20.5L17.5 37.5L22.8 42.8L39.8 25.8L34.5 20.5Z" fill="#0F7938"/>
    <!-- Dark Slate Core -->
    <path d="M15.5 11.5L3.5 23.5L8.8 28.8L20.8 16.8L15.5 11.5Z" fill="#4A5568"/>
    <!-- "UPI" Text wordmark -->
    <text x="22" y="34" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-style="italic" font-size="12" fill="#20150F">UPI</text>
  </g>
</svg>
'''

with open('public/images/payment/upi.svg', 'w', encoding='utf-8') as f:
    f.write(upi_svg.strip())

print("Successfully generated all 4 payment SVG assets in public/images/payment/")
