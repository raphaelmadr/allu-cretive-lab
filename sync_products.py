"""
Sincroniza produtos via API oficial da Allugator.
API: api-gateway.dev.digital.allugator.com/api/public/v1/products
Campos exportados: name, description, price_36, price_24, price_12, img, local_img
"""

import os
import json
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
        print(f"   → {len(items)} produtos (total: {len(all_items)})")

        if not pagination.get("can_next_page"):
            break
        page += 1

    return all_items


def extract_prices(skus):
    """
    Retorna (price_36, price_24, price_12) em reais.
    A API fornece apenas installment_value sem campo de duração.
    O menor valor disponível é o plano de 36 meses (mais barato);
    12 e 24 meses são calculados com os mesmos multiplicadores usados no canvas.
    """
    values = []
    for sku in skus:
        try:
            v = float(sku.get("installment_value") or 0)
            if v > 0 and sku.get("site_availability"):
                values.append(v)
        except (TypeError, ValueError):
            continue

    # Fallback: aceitar SKUs sold_out se nenhum disponível
    if not values:
        for sku in skus:
            try:
                v = float(sku.get("installment_value") or 0)
                if v > 0:
                    values.append(v)
            except (TypeError, ValueError):
                continue

    if not values:
        return None, None, None

    price_36 = min(values)
    price_24 = round(price_36 * 1.05263, 2)
    price_12 = round(price_36 * 1.10526, 2)
    return price_36, price_24, price_12


def format_brl(value):
    if value is None:
        return "Consulte"
    return "R$ " + f"{value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def main_photo_url(product_photos):
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

    print("🔗 Conectando à API...")
    raw_products = fetch_all_products()
    print(f"✅ {len(raw_products)} produtos recebidos.\n")

    new_count = 0
    updated_count = 0
    skip_count = 0

    for item in raw_products:
        if item.get("archived"):
            skip_count += 1
            continue

        name = (item.get("name") or "").strip()
        if not name:
            skip_count += 1
            continue

        # Descrição curta
        description = (item.get("technical_details") or "").strip()

        # Preços 12/24/36 meses
        price_36, price_24, price_12 = extract_prices(item.get("skus") or [])

        # URL da imagem principal
        img_url = main_photo_url(item.get("product_photos") or [])
        if not img_url:
            skip_count += 1
            continue

        filename = f"{safe_filename(name)}.png"
        filepath = os.path.join(OUTPUT_DIR, filename)
        local_path = f"./assets/products/{filename}"

        # Baixar imagem se nova ou ausente no disco
        if name not in db or not os.path.exists(filepath):
            try:
                res = requests.get(img_url, headers=HEADERS, timeout=15)
                if res.status_code == 200:
                    with open(filepath, "wb") as f:
                        f.write(res.content)
                    action = "novo" if name not in db else "atualizado"
                    new_count += (1 if action == "novo" else 0)
                    updated_count += (1 if action == "atualizado" else 0)
                    print(f"   ✅ [{action}] {name} — {format_brl(price_36)}/mês")
                else:
                    print(f"   ⚠️ Imagem indisponível ({res.status_code}): {name}")
            except Exception as e:
                print(f"   ⚠️ Erro ao baixar {name}: {e}")
        else:
            updated_count += 1

        db[name] = {
            "name": name,
            "description": description,
            "price": format_brl(price_36),      # preço base (36 meses)
            "price_12": format_brl(price_12),
            "price_24": format_brl(price_24),
            "price_36": format_brl(price_36),
            "img": img_url,
            "local_img": local_path,
        }

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
