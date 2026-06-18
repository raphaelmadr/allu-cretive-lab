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
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
        )
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

        # ── Interceptar respostas de API para capturar dados de produto ──────
        api_products = []

        def handle_response(response):
            try:
                url = response.url
                ct = response.headers.get("content-type", "")
                if "json" not in ct:
                    return
                # Filtrar URLs relevantes (produtos, catálogo, API)
                if not any(k in url for k in ["/api/", "product", "catalog", "item", "search"]):
                    return
                data = response.json()
                # Procurar lista de produtos em diferentes formatos de resposta
                candidates = []
                if isinstance(data, list):
                    candidates = data
                elif isinstance(data, dict):
                    for key in ["products", "items", "data", "results", "catalog", "docs", "list"]:
                        if key in data and isinstance(data[key], list):
                            candidates = data[key]
                            break
                for item in candidates:
                    if isinstance(item, dict) and ("name" in item or "title" in item):
                        name = item.get("name") or item.get("title", "")
                        if name:
                            api_products.append(item)
            except Exception:
                pass

        page.on("response", handle_response)

        # ── Navegar e carregar todos os produtos ─────────────────────────────
        print("🔗 Acessando catálogo...")
        page.goto(CATALOG_URL, wait_until="networkidle")
        page.wait_for_timeout(3000)

        # Scroll agressivo para carregar todos via infinite scroll / lazy load
        print("🖱️ Rolando para carregar todos os produtos...")
        prev_height = 0
        stable_rounds = 0

        while stable_rounds < 4:
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(2500)
            new_height = page.evaluate("document.body.scrollHeight")
            if new_height == prev_height:
                stable_rounds += 1
            else:
                stable_rounds = 0
                prev_height = new_height
            print(f"   Altura: {new_height}px (estável: {stable_rounds}/4)")

        # ── DEBUG: mostrar o que foi encontrado no DOM ───────────────────────
        all_links = page.query_selector_all("a[href]")
        catalog_hrefs = []
        for link in all_links:
            href = link.get_attribute("href") or ""
            if "/catalog/" in href:
                catalog_hrefs.append(href)

        print(f"\nDEBUG: {len(catalog_hrefs)} links com /catalog/ encontrados:")
        for h in catalog_hrefs[:20]:
            print(f"   {h}")

        print(f"\nDEBUG: {len(api_products)} produtos capturados via API/JSON")

        # ── Estratégia 1: dados vindos de respostas de API ───────────────────
        new_count = 0
        dl_headers = {"User-Agent": "Mozilla/5.0"}

        if api_products:
            print(f"\n✅ Usando {len(api_products)} produtos da API...")
            for item in api_products:
                try:
                    name = (item.get("name") or item.get("title") or "").strip()
                    if not name or len(name) < 3:
                        continue
                    price = item.get("price") or item.get("monthly_price") or "Consulte"
                    img_url = (
                        item.get("image") or item.get("img") or item.get("thumbnail")
                        or item.get("imageUrl") or item.get("image_url") or ""
                    )
                    img_url = extract_clean_img_url(img_url)
                    if not img_url:
                        continue
                    _save_product(db, name, price, img_url, dl_headers, new_count)
                except Exception as e:
                    print(f"   ⚠️ Erro: {e}")
        else:
            # ── Estratégia 2: scraping DOM com múltiplos seletores ───────────
            print("\n⚠️ Nenhum dado via API. Tentando scraping do DOM...")

            # Tentar seletores de card de produto comuns
            product_selectors = [
                "article",
                "[class*='product-card']",
                "[class*='ProductCard']",
                "[class*='catalog-item']",
                "[class*='product-item']",
                "[data-testid*='product']",
                "[data-testid*='card']",
            ]

            items = []
            for sel in product_selectors:
                found = page.query_selector_all(sel)
                if found:
                    print(f"   Seletor '{sel}': {len(found)} elementos")
                    items = found
                    break

            # Fallback: usar os links /catalog/ encontrados, filtrando slugs de produto
            if not items:
                print("   Usando links /catalog/ como fallback...")
                all_link_els = page.query_selector_all("a[href*='/catalog/']")
                # Produto tem slug com pelo menos 2 segmentos: /catalog/categoria/produto
                items = [
                    el for el in all_link_els
                    if len([p for p in (el.get_attribute("href") or "").strip("/").split("/") if p]) >= 2
                ]
                print(f"   {len(items)} links de produto encontrados após filtragem")

            print(f"\n🔍 {len(items)} cards encontrados. Extraindo...")

            for item in items:
                try:
                    name = None
                    for sel in ["h2", "h3", "h4", "[class*='name']", "[class*='title']", "p"]:
                        el = item.query_selector(sel)
                        if el:
                            text = el.inner_text().strip()
                            if text and len(text) > 3 and "R$" not in text and "/mês" not in text:
                                name = text
                                break

                    img_el = item.query_selector("img")
                    if not name and img_el:
                        alt = img_el.get_attribute("alt") or ""
                        if alt.strip() and len(alt.strip()) > 3:
                            name = alt.strip()

                    if not name:
                        continue

                    price = "Consulte"
                    for t_el in item.query_selector_all("*"):
                        try:
                            t = t_el.inner_text().strip()
                            if "R$" in t and "/mês" in t and len(t) < 60:
                                price = t
                                break
                        except Exception:
                            continue

                    if not img_el:
                        continue

                    img_url = extract_clean_img_url(img_el.get_attribute("src"))
                    if not img_url:
                        continue

                    _save_product(db, name, price, img_url, dl_headers, new_count)

                except Exception as e:
                    print(f"   ⚠️ Erro ao processar item: {e}")

        browser.close()

    final_list = list(db.values())
    with open(JSON_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(final_list, f, indent=4, ensure_ascii=False)
    with open(JS_OUTPUT, "w", encoding="utf-8") as f:
        f.write(f"window.alluProducts = {json.dumps(final_list, indent=4, ensure_ascii=False)};")

    print(f"\n✨ Sincronização concluída! Total: {len(final_list)} produtos.")


def _save_product(db, name, price, img_url, headers, counter):
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
            res = requests.get(img_url, headers=headers, timeout=15)
            if res.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(res.content)
                db[name] = {"name": name, "price": price, "local_img": local_path}
                print(f"   ✅ {name}")
                return True
        except Exception as e:
            print(f"   ⚠️ Erro ao baixar {name}: {e}")
    else:
        db[name]["price"] = price
    return False


if __name__ == "__main__":
    sync_products()
