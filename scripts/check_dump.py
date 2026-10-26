import re

with open('scripts/live_dom_dump_50g.html', encoding='utf-8') as f:
    text = f.read()

match = re.search(r'<img[^>]+alt="Araku Instant Coffee Powder[^"]*"[^>]*>', text)
if match:
    print('Found live img tag:', match.group(0))
else:
    print('Not found')
