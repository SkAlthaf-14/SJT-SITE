import os

labels_dir = 'public/images/products/labels'
if os.path.exists(labels_dir):
    for f in sorted(os.listdir(labels_dir)):
        print(f, os.path.getsize(os.path.join(labels_dir, f)))
else:
    print('labels_dir does not exist!')
