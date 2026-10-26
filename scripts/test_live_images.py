import urllib.request

products = ['araku-instant', 'araku-special-blend', 'araku-signature', 'araku-premium']
weights = ['50g', '100g', '250g']

for p in products:
    for w in weights:
        url = f'https://sjtfarms.com/images/products/jars/{p}-{w}-jar.png'
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            res = urllib.request.urlopen(req)
            print(f"{url} -> {res.getcode()} (length: {len(res.read())})")
        except Exception as e:
            print(f"{url} -> FAILED: {e}")
