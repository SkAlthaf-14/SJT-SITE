import urllib.request
import re

url = 'https://sjtfarms.com/'
html = urllib.request.urlopen(url).read().decode('utf-8')

js_files = re.findall(r'src=[\'"]([^\'"]+\.js)[\'"]', html)
print("JS files on live website:", js_files)

for j in js_files:
    js_url = url + j.lstrip('/')
    js_data = urllib.request.urlopen(js_url).read().decode('utf-8')
    # search for mobile hero
    idx = js_data.find('mobile-bg')
    if idx != -1:
        print(f"Found mobile-bg in {j} at index {idx}")
        snippet = js_data[max(0, idx-400):min(len(js_data), idx+600)]
        with open('scripts/live_js_snippet.txt', 'w', encoding='utf-8') as f:
            f.write(snippet)
        print("Written to scripts/live_js_snippet.txt")
    else:
        print(f"mobile-bg NOT found in {j}")
