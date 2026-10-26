import subprocess
import time
import urllib.request
import json
import asyncio
import os

# Start Chrome in background with remote debugging port
chrome_cmd = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "--headless=new",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "http://localhost:5173/#product/araku-instant-coffee-powder"
]

proc = subprocess.Popen(chrome_cmd)
time.sleep(2)

try:
    # Query DevTools HTTP endpoint for open tabs
    targets = json.loads(urllib.request.urlopen("http://127.0.0.1:9222/json").read().decode('utf-8'))
    print("Found targets:", len(targets))
    page_target = next(t for t in targets if t.get('type') == 'page')
    ws_url = page_target['webSocketDebuggerUrl']
    print("WS URL:", ws_url)
finally:
    proc.terminate()
