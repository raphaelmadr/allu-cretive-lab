import json
import os
import re
import urllib.request
import unicodedata

def slugify(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[^\w\s-]', '', value).strip().lower()
    return re.sub(r'[-\s]+', '-', value)

products_path = 'assets/products.js'
products_dir = 'assets/products'

if not os.path.exists(products_dir):
    os.makedirs(products_dir)

with open(products_path, 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('[')
end = content.rfind(']')
products_json = content[start:end+1]

# Simple cleanup for JSON parsing if needed, though usually it's fine
products = json.loads(products_json)

print(f"Processing {len(products)} products...")

for i, p in enumerate(products):
    if 'img' not in p or not p['img']:
        continue
    
    filename = slugify(p['name']) + '.png'
    dest = os.path.join(products_dir, filename)
    local_path = f"./assets/products/{filename}"
    
    if not os.path.exists(dest):
        try:
            # Allugator URLs often have next/image wrapping, we can use them directly
            urllib.request.urlretrieve(p['img'], dest)
            print(f"Downloaded: {dest}")
        except Exception as e:
            print(f"Error downloading {p['name']}: {e}")
    
    p['local_img'] = local_path
    
    if i % 20 == 0:
        print(f"Progress: {i}/{len(products)}")

with open(products_path, 'w', encoding='utf-8') as f:
    f.write(f"window.alluProducts = {json.dumps(products, indent=4, ensure_ascii=False)};\n")

print("All set! products.js updated with local image paths.")
