import os
from PIL import Image

jars_dir = 'public/images/products/jars'
for fname in sorted(os.listdir(jars_dir)):
    if fname.endswith('.png'):
        fpath = os.path.join(jars_dir, fname)
        img = Image.open(fpath)
        print(f"{fname}: {img.size}, mode {img.mode}")
