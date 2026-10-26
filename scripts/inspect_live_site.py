import urllib.request

content = urllib.request.urlopen('https://sjtfarms.com/assets/index-D4R7oUEe.js').read().decode('utf-8')
idx = content.find('Select Glass Jar Pack Size')
with open('scripts/live_detail_snippet3.txt', 'w', encoding='utf-8') as f:
    f.write(content[max(0, idx-8000):max(0, idx-4000)])
print("Written to scripts/live_detail_snippet3.txt")
