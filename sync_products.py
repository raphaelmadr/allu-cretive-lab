"""
Sincroniza produtos da API oficial da Allugator.
API: api-gateway.dev.digital.allugator.com/api/public/v1/products
Sem necessidade de Playwright/scraping — dados completos via JSON.
"""

import os
import json
import time
import requests

API_BASE = "https://api-gateway.dev.digital.allugator.com/api/public/v1/products"
API_PARAMS = {
    "pageSize": 500,
    "sortOrder": "asc",
    "includeCommercialTags": "false",
    "includePhotos": "true",
    "soldOutLast": "false",
    "excludeSoldOut": "false",
}

OUTPUT_DIR = "assets/products"
JSON_OUTPUT = "assets/products.json"
JS_OUTPUT = "assets/products.js"

HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json",
}


def fetch_all_products():
    """Busca todos os produtos paginando a API."""
    all_items = []
    page = 0

    while True:
        params = {**API_PARAMS, "pageIndex": page}
        print(f"   Buscando página {page}...")
        try:
            r = requests.get(API_BASE, params=params, headers=HEADERS, timeout=30)
            r.raise_for_status()
            body = r.json()
        except Exception as e:
            print(f"⚠️ Erro ao buscar página {page}: {e}")
            break

        items = body.get("data") or []
        pagination = body.get("pagination") or {}
        all_items.extend(items)

        print(f"   → {len(items)} produtos (total acumulado: {len(all_items)})")

        if not pagination.get("can_next_page"):
            break
        page += 1

    return all_items


def best_price(skus):
    """Retorna o menor preço parcelado válido entre os SKUs."""
    values = []
    for sku in skus:
        v = sku.get("installment_value")
        try:
            fv = float(v)
            if fv > 0:
                values.append(fv)
        except (TypeError, ValueError):
            continue
    if not values:
        return None
    return min(values)


def main_photo_url(product_photos):
    """Retorna a URL da foto principal (ou primeira disponível)."""
    if not product_photos:
        return None
    main = next((p for p in product_photos if p.get("main")), product_photos[0])
    return main.get("url")


def safe_filename(name):
    return (
        name.lower()
        .replace(" ", "-")
        .replace("/", "-")
        .replace('"', "")
        .replace(":", "")
        .replace("?", "")
        .replace("'", "")
    )


def sync_products():
    print("🚀 Sincronizando produtos via API oficial da Allugator...")

    # Carregar banco existente (preserva imagens já baixadas)
    db = {}
    if os.path.exists(JSON_OUTPUT):
        try:
            with open(JSON_OUTPUT, "r", encoding="utf-8") as f:
                for p in json.load(f):
                    db[p["name"]] = p
            print(f"📂 {len(db)} produtos existentes carregados.")
        except Exception:
            print("⚠️ Banco existente inválido — iniciando do zero.")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Buscar todos os produtos da API
    print("🔗 Conectando à API...")
    raw_products = fetch_all_products()
    print(f"✅ {len(raw_products)} produtos recebidos da API.\n")

    new_count = 0
    updated_count = 0
    skip_count = 0

    for item in raw_products:
        # Ignorar produtos arquivados
        if item.get("archived"):
            skip_count += 1
            continue

        name = (item.get("name") or "").strip()
        if not name:
            skip_count += 1
            continue

        # Preço parcelado
        price_val = best_price(item.get("skus") or [])
        if price_val:
            price_str = "R$ " + f"{price_val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        else:
            price_str = "Consulte"

        # URL da foto
        img_url = main_photo_url(item.get("product_photos") or [])
        if not img_url:
            skip_count += 1
            continue

        # Caminho local
        filename = f"{safe_filename(name)}.png"
        filepath = os.path.join(OUTPUT_DIR, filename)
        local_path = f"./assets/products/{filename}"

        # Baixar imagem se necessário
        needs_download = name not in db or not os.path.exists(filepath)
        if needs_download:
            try:
                res = requests.get(img_url, headers=HEADERS, timeout=15)
                if res.status_code == 200:
                    with open(filepath, "wb") as f:
                        f.write(res.content)
                    if name not in db:
                        new_count += 1
                    else:
                        updated_count += 1
                    print(f"   ✅ {name} ({price_str})")
                else:
                    print(f"   ⚠️ Imagem não encontrada ({res.status_code}): {name}")
                    img_url = None
            except Exception as e:
                print(f"   ⚠️ Erro ao baixar {name}: {e}")
        else:
            # Atualizar apenas preço e img URL (mantém local_img existente)
            updated_count += 1

        db[name] = {
            "name": name,
            "price": price_str,
            "img": img_url or db.get(name, {}).get("img", ""),
            "local_img": local_path,
        }

    # Salvar JSON e JS
    final_list = list(db.values())
    with open(JSON_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(final_list, f, indent=4, ensure_ascii=False)
    with open(JS_OUTPUT, "w", encoding="utf-8") as f:
        f.write(f"window.alluProducts = {json.dumps(final_list, indent=4, ensure_ascii=False)};")

    print(f"\n✨ Sincronização concluída!")
    print(f"   ➕ Novos: {new_count} | 🔄 Atualizados: {updated_count} | ⏭️ Ignorados: {skip_count}")
    print(f"   📦 Total no banco: {len(final_list)} produtos")


if __name__ == "__main__":
    sync_products()
