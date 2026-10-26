import urllib.request
import re

url = 'https://sjtfarms.com/'
html = urllib.request.urlopen(url).read().decode('utf-8')
print("HTML length:", len(html))

css_files = re.findall(r'href=[\'"]([^\'"]+\.css)[\'"]', html)
js_files = re.findall(r'src=[\'"]([^\'"]+\.js)[\'"]', html)
print("CSS files:", css_files)
print("JS files:", js_files)

for c in css_files:
    css_url = url + c.lstrip('/')
    css_data = urllib.request.urlopen(css_url).read().decode('utf-8')
    print(f"Downloaded {c}: {len(css_data)} bytes")
    # Search for hero styles
    matches = re.findall(r'([^{}]*hero[^{}]*\{[^}]+\})', css_data, re.IGNORECASE)
    print(f"Found {len(matches)} hero rules in {c}")
    for m in matches[:5]:
        print("  Rule:", m[:200])

for j in js_files:
    js_url = url + j.lstrip('/')
    js_data = urllib.request.urlopen(js_url).read().decode('utf-8')
    print(f"Downloaded {j}: {len(js_data)} bytes")
    if 'slide1_araku_estate_hero' in js_data:
        print(f"Found slide1_araku_estate_hero in {j}")
        # Look around mobile carousel rendering
        idx = js_data.find('slide-0')
        if idx != -1:
            print("Context around slide-0 in JS:")
            print(js_data[max(0, idx-600):min(len(js_data), idx+600)])
        else:
            idx = js_data.find('slide1_araku_estate_hero')
            print(js_data[max(0, idx-300):min(len(js_data), idx+300)])
