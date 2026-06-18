import os
import json
import time
import requests
from urllib.parse import urljoin, urlparse, parse_qs
from playwright.sync_api import sync_playwright

BASE_URL = "https://allugator.com"
CATALOG_URL = "https://allugator.com/catalog"
OUTPUT_DIR = "assets/products"
JSON_OUTPUT = "assets/products.json"
JS_OUTPUT = "assets/products.js"


def extract_clean_img_url(img_url):
    if not img_url:
        return None
    if img_url.startswith('/_next/image'):
        params = parse_qs(urlparse(img_url).query)
        if 'url' in params:
            img_url = params['url'][0]
    if not img_url.startswith('http'):
        img_url = urljoin(BASE_URL, img_url)
    return img_url


def sync_products():
    print(f"🚀 Sincronizando produtos de {CATALOG_URL}...")

    db = {}
    if os.path.exists(JSON_OUTPUT):
        try:
            with open(JSON_OUTPUT, 'r', encoding='utf-8') as f:
                for p in json.load(f):
                    db[p['name']] = p
            print(f"📂 {len(db)} produtos existentes carregados.")
        except Exception:
            print("⚠️ Erro ao carregar banco existente, iniciando do zero.")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
        )
        page = context.new_page()
        page.set_default_timeout(120000)

        print("🔗 Acessando catálogo...")
        page.goto(CATALOG_URL, wait_until="networkidle")

        # Aguarda o primeiro produto aparecer no DOM
        try:
            page.wait_for_selector('a[href*="/catalog/"]', timeout=30000)
            print("✅ Primeiros produtos detectados.")
        except Exception:
            print("⚠️ Timeout ao aguardar produtos. Continuando mesmo assim...")

        # Scroll infinito: para quando 3 rodadas consecutivas não adicionam novos itens
        print("🖱️ Carregando todos os produtos (infinite scroll)...")
        prev_count = 0
        stable_rounds = 0

        while stable_rounds < 3:
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(2.5)
            count = len(page.query_selector_all('a[href*="/catalog/"]'))
            print(f"   📦 {count} produtos carregados...")
            if count == prev_count:
                stable_rounds += 1
            else:
                stable_rounds = 0
                prev_count = count

        items = page.query_selector_all('a[href*="/catalog/"]')
        print(f"🔍 {len(items)} elementos encontrados. Extraindo dados...")

        new_count = 0
        updated_count = 0
        dl_headers = {"User-Agent": "Mozilla/5.0"}

        for item in items:
            try:
                href = item.get_attribute('href') or ''
                # Ignora links que não são de produto (ex: /catalog sem slug)
                path_parts = [p for p in href.strip('/').split('/') if p]
                if len(path_parts) < 2:
                    continue

                # Tenta extrair o nome do produto via múltiplos seletores
                name = None
                for sel in ['h2', 'h3', 'h4', '[class*="name"]', '[class*="title"]', '[class*="product"]', 'p']:
                    el = item.query_selector(sel)
                    if el:
                        text = el.inner_text().strip()
                        # Nome válido: > 3 chars, sem "R$" (preço), sem texto genérico
                        if text and len(text) > 3 and 'R$' not in text and '/mês' not in text:
                            name = text
                            break

                # Fallback: alt da imagem
                img_el = item.query_selector('img')
                if not name and img_el:
                    alt = img_el.get_attribute('alt') or ''
                    if alt.strip() and len(alt.strip()) > 3:
                        name = alt.strip()

                if not name:
                    continue

                # Extrai preço
                price = "Consulte"
                for t_el in item.query_selector_all('*'):
                    try:
                        t = t_el.inner_text().strip()
                        if 'R$' in t and '/mês' in t and len(t) < 60:
                            price = t
                            break
                    except Exception:
                        continue

                if not img_el:
                    continue

                img_url = extract_clean_img_url(img_el.get_attribute('src'))
                if not img_url:
                    continue

                safe_name = (
                    name.lower()
                    .replace(" ", "-")
                    .replace("/", "-")
                    .replace('"', "")
                    .replace(":", "")
                    .replace("?", "")
                )
                filename = f"{safe_name}.png"
                filepath = os.path.join(OUTPUT_DIR, filename)
                local_path = f"./assets/products/{filename}"

                if name not in db or not os.path.exists(filepath):
                    try:
                        res = requests.get(img_url, headers=dl_headers, timeout=15)
                        if res.status_code == 200:
                            with open(filepath, 'wb') as f:
                                f.write(res.content)
                            if name not in db:
                                new_count += 1
                            else:
                                updated_count += 1
                            db[name] = {"name": name, "price": price, "local_img": local_path}
                            print(f"   ✅ {name}")
                    except Exception as e:
                        print(f"   ⚠️ Erro ao baixar {name}: {e}")
                else:
                    db[name]["price"] = price

            except Exception as e:
                print(f"   ⚠️ Erro ao processar item: {e}")
                continue

        browser.close()

    final_list = list(db.values())
    with open(JSON_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(final_list, f, indent=4, ensure_ascii=False)
    with open(JS_OUTPUT, 'w', encoding='utf-8') as f:
        f.write(f"window.alluProducts = {json.dumps(final_list, indent=4, ensure_ascii=False)};")

    print(f"\n✨ Sincronização concluída!")
    print(f"   ➕ Novos: {new_count} | 🔄 Atualizados: {updated_count} | 📦 Total: {len(final_list)}")


if __name__ == "__main__":
    sync_products()
