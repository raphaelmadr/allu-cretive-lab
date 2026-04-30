import os
import json
import requests
from concurrent.futures import ThreadPoolExecutor

JSON_PATH = "assets/products.json"
OUTPUT_DIR = "assets/products"
JS_PATH = "assets/products.js"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def download_image(product):
    name = product['name']
    url = product['img']
    safe_name = name.lower().replace(" ", "-").replace("/", "-").replace('"', "").replace(":", "").replace("?", "")
    filename = f"{safe_name}.png"
    filepath = os.path.join(OUTPUT_DIR, filename)
    local_path = f"./assets/products/{filename}"
    
    # Se já existe e tem tamanho razoável, pula
    if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
        return {**product, "local_img": local_path}

    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        res = requests.get(url, headers=headers, timeout=15)
        if res.status_code == 200:
            with open(filepath, 'wb') as f:
                f.write(res.content)
            print(f"✅ Baixado: {name}")
            return {**product, "local_img": local_path}
        else:
            print(f"❌ Falha ({res.status_code}): {name}")
    except Exception as e:
        print(f"⚠️ Erro: {name} - {e}")
    
    return {**product, "local_img": "https://allu.com.br/favicon.ico"} # Fallback

def run():
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"🚀 Iniciando download massivo de {len(products)} imagens...")
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(download_image, products))
    
    # Atualizar JSON e JS com os caminhos locais
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=4, ensure_ascii=False)
    
    with open(JS_PATH, 'w', encoding='utf-8') as f:
        f.write(f"window.alluProducts = {json.dumps(results, indent=4, ensure_ascii=False)};")
    
    print(f"\n✨ TUDO PRONTO! {len(results)} produtos sincronizados localmente.")

if __name__ == "__main__":
    run()
