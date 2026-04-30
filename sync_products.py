import os
import json
import time
import requests
from playwright.sync_api import sync_playwright

# Configurações
BASE_URL = "https://allugator.com/catalog"
OUTPUT_DIR = "assets/products"
JSON_OUTPUT = "assets/products.json"
JS_OUTPUT = "assets/products.js"

# Garantir que o diretório de assets exista
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def sync_products():
    print(f"🚀 Iniciando sincronização MASSIVA de produtos de {BASE_URL}...")
    
    # Carregar banco de dados existente
    db = {}
    if os.path.exists(JSON_OUTPUT):
        try:
            with open(JSON_OUTPUT, 'r', encoding='utf-8') as f:
                old_data = json.load(f)
                db = {p['name']: p for p in old_data}
            print(f"📂 Banco de dados carregado: {len(db)} produtos existentes.")
        except:
            print("⚠️ Erro ao carregar banco de dados existente.")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        page = context.new_page()
        page.set_default_timeout(180000) # 3 minutos
        
        print("🔗 Acessando catálogo...")
        page.goto(BASE_URL, wait_until="networkidle")
        
        # Scroll infinito agressivo
        print("🖱️ Carregando TODOS os produtos (Infinite Scroll)...")
        last_height = page.evaluate("document.body.scrollHeight")
        
        while True:
            # Rola até o final
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(2.5) # Aguarda carregamento
            
            new_height = page.evaluate("document.body.scrollHeight")
            current_items = page.query_selector_all('a[href^="/catalog/"]')
            print(f"   📦 {len(current_items)} produtos carregados...")
            
            if new_height == last_height:
                # Tentar mais um scroll pequeno para garantir
                page.evaluate("window.scrollBy(0, 300)")
                time.sleep(1)
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                time.sleep(2)
                if page.evaluate("document.body.scrollHeight") == new_height:
                    break
            last_height = new_height

        # Extrair dados finais
        items = page.query_selector_all('a[href^="/catalog/"]')
        print(f"🔍 Extração final iniciada para {len(items)} produtos.")

        new_count = 0
        updated_count = 0
        headers = {"User-Agent": "Mozilla/5.0"}

        for item in items:
            try:
                # Localizar Nome e Preço (usando h2 como observado)
                headings = item.query_selector_all('h2')
                if not headings: continue
                
                name = headings[0].inner_text().strip()
                price = headings[-1].inner_text().strip() if len(headings) > 1 else "Consulte"
                img_el = item.query_selector('img')
                
                if name and img_el:
                    img_url = img_el.get_attribute('src')
                    
                    if img_url and img_url.startswith('/_next/image'):
                        from urllib.parse import urlparse, parse_qs
                        params = parse_qs(urlparse(img_url).query)
                        if 'url' in params: img_url = params['url'][0]
                    
                    if img_url and not img_url.startswith('http'):
                        img_url = urljoin(BASE_URL, img_url)

                    safe_name = name.lower().replace(" ", "-").replace("/", "-").replace('"', "").replace(":", "").replace("?", "")
                    filename = f"{safe_name}.png"
                    filepath = os.path.join(OUTPUT_DIR, filename)
                    local_path = f"./assets/products/{filename}"

                    if name not in db or not os.path.exists(filepath):
                        try:
                            res = requests.get(img_url, headers=headers, timeout=15)
                            if res.status_code == 200:
                                with open(filepath, 'wb') as f: f.write(res.content)
                                if name not in db: new_count += 1
                                else: updated_count += 1
                                db[name] = {"name": name, "price": price, "local_img": local_path}
                                print(f"   ✅ Sincronizado: {name}")
                        except:
                            pass
                    else:
                        db[name]["price"] = price
            except:
                continue

        # Salvar JSON e JS
        final_list = list(db.values())
        with open(JSON_OUTPUT, 'w', encoding='utf-8') as f:
            json.dump(final_list, f, indent=4, ensure_ascii=False)
            
        with open(JS_OUTPUT, 'w', encoding='utf-8') as f:
            f.write(f"window.alluProducts = {json.dumps(final_list, indent=4, ensure_ascii=False)};")

        print(f"\n✨ Sincronização MASSIVA CONCLUÍDA!")
        print(f"📈 Total no Banco: {len(final_list)} produtos.")
        browser.close()

if __name__ == "__main__":
    sync_products()
