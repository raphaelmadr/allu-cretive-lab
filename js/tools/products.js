// js/tools/products.js
import { state } from '../state.js';
import { presets } from '../config.js';
import { updateSidebar } from '../ui/sidebar.js';
import { history } from '../history.js';

export function renderProductsTools(sidebarContent) {
    const div = document.createElement('div');
    div.className = 'animate-fade';

    let displayedItems = 20;
    let currentFilterResults = window.alluProducts || [];

    const renderList = (products, limit) => {
        if (!products || products.length === 0) {
            return `<div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:0.8rem;">Nenhum produto encontrado.</div>`;
        }

        const toShow = products.slice(0, limit);
        let listHTML = '<div id="products-list" class="preset-grid">';
        toShow.forEach(p => {
            const price = p.price_36 || p.price || '';
            const desc = p.description ? `<span style="font-size:0.6rem; color:var(--text-secondary); line-height:1.2; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${p.description}</span>` : '';
            // Encode img URLs to avoid breaking the onerror attribute
            const imgSrc = (p.img || p.local_img || '').replace(/'/g, '%27');
            const imgFallback = (p.local_img || '').replace(/'/g, '%27');
            listHTML += `
                <div class="preset-card product-draggable" data-product='${JSON.stringify(p).replace(/'/g, "&#39;")}' style="padding:12px; display:flex; flex-direction:column; gap:6px; cursor:pointer;">
                    <div style="height:90px; width:100%; background:#fff; border-radius:10px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                        <img src="${imgSrc}"
                             onerror="this.onerror=null; this.src='${imgFallback}';"
                             style="max-height:85%; max-width:85%; object-fit:contain;">
                    </div>
                    <span style="font-size:0.65rem; font-weight:700; color:white; line-height:1.2; text-align:center;">${p.name}</span>
                    ${desc}
                    ${price ? `<span style="font-size:0.65rem; color:var(--accent); font-weight:700; text-align:center;">A partir de ${price}/mês</span>` : ''}
                    <div style="background:rgba(255,255,255,0.1); color:white; text-align:center; padding:5px; border-radius:6px; font-size:0.65rem; font-weight:700; border:1px solid var(--glass-border);">
                        <i class="fa-solid fa-plus"></i> Inserir
                    </div>
                </div>
            `;
        });
        listHTML += '</div>';

        if (products.length > limit) {
            listHTML += `
                <button id="btn-load-more" style="width:100%; margin-top:20px; padding:10px; background:rgba(255,255,255,0.05); border:1px dashed var(--glass-border); color:var(--text-secondary); border-radius:8px; cursor:pointer; font-size:0.75rem; font-weight:600;">
                    Mostrar mais (${products.length - limit} restantes)
                </button>
            `;
        }

        return listHTML;
    };

    const attachEvents = (container) => {
        container.querySelectorAll('.product-draggable').forEach(card => {
            card.onclick = () => {
                const p = JSON.parse(card.dataset.product);
                addProductToCanvas(p, 'solto');
            };
        });

        const btnLoadMore = container.querySelector('#btn-load-more');
        if (btnLoadMore) {
            btnLoadMore.onclick = () => {
                displayedItems += 20;
                container.innerHTML = renderList(currentFilterResults, displayedItems);
                attachEvents(container);
            };
        }
    };

    const count = window.alluProducts ? window.alluProducts.length : 0;
    const statusBadge = count > 0
        ? `<span style="font-size:0.7rem; color:var(--accent); background:rgba(39,174,96,0.2); padding:2px 8px; border-radius:10px;"><i class="fa-solid fa-check-circle"></i> ${count} produtos</span>`
        : `<span style="font-size:0.7rem; color:#ff4444; background:rgba(255,68,68,0.2); padding:2px 8px; border-radius:10px;"><i class="fa-solid fa-triangle-exclamation"></i> Desatualizado</span>`;

    const hasNewFields = count > 0 && window.alluProducts.some(p => p.price_36);

    div.innerHTML = `
        <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; margin-bottom:16px; border:1px solid var(--glass-border);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Catálogo</span>
                ${statusBadge}
            </div>
            <div style="font-size:0.72rem; color:var(--text-secondary); line-height:1.5;">
                Preços 12/24/36 meses${hasNewFields ? ' <span style="color:var(--accent)">✓</span>' : ''}<br>
                Descrição do produto${hasNewFields ? ' <span style="color:var(--accent)">✓</span>' : ''}<br>
                Imagem principal${count > 0 ? ' <span style="color:var(--accent)">✓</span>' : ''}
            </div>
        </div>

        <button id="btn-sync-full" style="width:100%; padding:13px; border-radius:10px; background:var(--accent); color:white; border:none; cursor:pointer; font-size:0.82rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:8px;">
            <i class="fa-solid fa-arrows-rotate"></i> Atualizar Produtos
        </button>
        <div id="sync-status" style="font-size:0.7rem; color:var(--text-secondary); text-align:center; min-height:18px; margin-bottom:16px;"></div>

        ${count > 0 ? `
        <div style="position:relative; margin-bottom:16px;">
            <input type="text" id="product-search" placeholder="Buscar produto..." style="width:100%; padding:10px 10px 10px 36px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:10px; color:white; font-size:0.82rem; outline:none;">
            <i class="fa-solid fa-magnifying-glass" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-secondary); font-size:0.85rem;"></i>
        </div>
        <p class="subtitle">Produtos Disponíveis</p>
        <div id="products-container">${renderList(window.alluProducts, displayedItems)}</div>
        ` : `<div style="text-align:center; padding:30px 0; color:var(--text-secondary); font-size:0.8rem;">Clique em "Atualizar Produtos" para carregar o catálogo.</div>`}

        <div style="margin-top:24px; border-top:1px solid var(--glass-border); padding-top:20px;">
            <p class="subtitle">Selos e Ofertas</p>
            <div style="display:grid; grid-template-columns: 1fr; gap:10px;">
                <button class="btn-tool" onclick="addPriceStamp()" style="width:100%; height:auto; padding:12px; border:1px solid var(--glass-border); justify-content:flex-start; gap:10px;">
                    <i class="fa-solid fa-tag"></i> Selo de Preço (De/Por)
                </button>
                <button class="btn-tool" onclick="addAvailabilityStamp()" style="width:100%; height:auto; padding:12px; border:1px solid var(--glass-border); justify-content:flex-start; gap:10px;">
                    <i class="fa-solid fa-circle-check"></i> Selo Disponibilidade
                </button>
            </div>
        </div>
    `;

    sidebarContent.appendChild(div);

    const containerEl = div.querySelector('#products-container');
    if (containerEl) attachEvents(containerEl);

    const searchInput = div.querySelector('#product-search');
    if (searchInput && containerEl) {
        searchInput.oninput = () => {
            const query = searchInput.value.toLowerCase();
            currentFilterResults = window.alluProducts.filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.description || '').toLowerCase().includes(query)
            );
            displayedItems = 20;
            containerEl.innerHTML = renderList(currentFilterResults, displayedItems);
            attachEvents(containerEl);
        };
        searchInput.onfocus = () => searchInput.style.borderColor = 'var(--accent)';
        searchInput.onblur = () => searchInput.style.borderColor = 'var(--glass-border)';
    }

    const btnSync = div.querySelector('#btn-sync-full');
    const syncStatus = div.querySelector('#sync-status');

    if (btnSync) {
        btnSync.onclick = async () => {
            btnSync.disabled = true;
            btnSync.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Atualizando...';
            syncStatus.textContent = 'Buscando dados da API...';

            // Passo 1: atualizar window.alluProducts ao vivo via API
            try {
                const liveCount = await syncProductsWithAPI();
                if (liveCount > 0 && containerEl) {
                    currentFilterResults = window.alluProducts;
                    containerEl.innerHTML = renderList(window.alluProducts, displayedItems);
                    attachEvents(containerEl);
                }
                syncStatus.textContent = `${liveCount} produtos atualizados ao vivo.`;
            } catch (e) {
                syncStatus.textContent = 'Erro na atualização ao vivo.';
            }

            // Passo 2: disparar GitHub Actions para baixar imagens + commitar
            syncStatus.textContent = 'Acionando sync completo no GitHub...';
            try {
                const res = await fetch('/api/sync', { method: 'POST' });
                if (res.ok) {
                    syncStatus.innerHTML = '✅ Sync iniciado! Imagens e preços novos estarão disponíveis em ~3 min após o deploy automático.';
                } else {
                    const err = await res.json().catch(() => ({}));
                    syncStatus.textContent = err.error || 'Erro ao acionar GitHub Actions.';
                }
            } catch (e) {
                syncStatus.textContent = 'Não foi possível acionar o GitHub Actions.';
            }

            btnSync.disabled = false;
            btnSync.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Atualizar Produtos';
        };
    }
}

export function addProductToCanvas(p, mode = 'solto', initialPos = null, callback = null) {
    const canvas = state.getCanvas();
    if (!canvas) return;

    const formatDisplay = document.getElementById('format-display');
    const formatStr = formatDisplay ? formatDisplay.innerText.split(' (')[0] : 'Instagram Feed';
    const activePreset = Object.values(presets).find(preset => preset.name === formatStr);
    const docW = activePreset ? activePreset.w : 1080;
    const docH = activePreset ? activePreset.h : 1080;

    const centerLogical = (obj) => {
        obj.set({
            left: (docW - obj.getScaledWidth()) / 2,
            top: (docH - obj.getScaledHeight()) / 2
        });
    };

    const imgElement = new Image();
    // Sempre permitir Cross-Origin para imagens remotas (Allugator ou Fallback)
    imgElement.crossOrigin = "anonymous";

    const placeholder = 'https://ui-avatars.com/api/?name=Allu+Product&background=27AE60&color=fff&size=512';
    
    imgElement.onload = function() {
        const fabricImg = new fabric.Image(imgElement);
        const numericPrice = parseFloat(p.price.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 499.90;
        
        if (mode === 'solto') {
            fabricImg.scaleToWidth(300);
            fabricImg.productData = p;
            fabricImg.currentMode = mode;
            canvas.add(fabricImg);
            if (initialPos) {
                const setProps = { left: initialPos.left, top: initialPos.top };
                if (initialPos.scaleX !== undefined) setProps.scaleX = initialPos.scaleX;
                if (initialPos.scaleY !== undefined) setProps.scaleY = initialPos.scaleY;
                if (initialPos.angle !== undefined) setProps.angle = initialPos.angle;
                fabricImg.set(setProps);
                fabricImg.setCoords();
            } else {
                centerLogical(fabricImg);
            }
            canvas.setActiveObject(fabricImg);
        } 
        else if (mode === 'card') {
            const rect = new fabric.Rect({
                width: 350,
                height: 480,
                fill: '#ffffff',
                rx: 24,
                ry: 24,
                shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.1)', blur: 20, offsetX: 0, offsetY: 10 })
            });

            fabricImg.scaleToHeight(220);
            if (fabricImg.getScaledWidth() > 280) fabricImg.scaleToWidth(280);
            fabricImg.set({ left: 35 + (280 - fabricImg.getScaledWidth())/2, top: 40 });

            const nameText = new fabric.Textbox(p.name, {
                left: 35,
                top: 290,
                fontFamily: 'Plus Jakarta Sans',
                fontSize: 22,
                fontWeight: '800',
                fill: '#161617',
                width: 280,
                textAlign: 'left'
            });

            const fakePriceNum = numericPrice * 1.2;
            const fakePriceStr = "De R$ " + fakePriceNum.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            const realPriceStr = "R$ " + numericPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});

            const fakeText = new fabric.Text(fakePriceStr, {
                left: 35,
                top: 350,
                fontFamily: 'Plus Jakarta Sans',
                fontSize: 16,
                fill: '#828392',
                textDecoration: 'line-through',
                fakePriceCard: true
            });

            const priceLabel = new fabric.Text('por apenas', {
                left: 35,
                top: 375,
                fontFamily: 'Plus Jakarta Sans',
                fontSize: 14,
                fill: '#828392',
                fontWeight: '600'
            });

            const realPriceText = new fabric.Text(realPriceStr, {
                left: 35,
                top: 395,
                fontFamily: 'Plus Jakarta Sans',
                fontSize: 36,
                fontWeight: '900',
                fill: '#27AE60',
                priceCard: true
            });

            const discountPct = Math.round((1 - numericPrice / fakePriceNum) * 100);

            const badgeBg = new fabric.Rect({
                left: 220,
                top: 25,
                width: 95,
                height: 34,
                fill: '#F45258',
                rx: 10,
                ry: 10,
                isDiscountBadgeRect: true,
                visible: discountPct > 0
            });

            const badgeText = new fabric.Text(`${discountPct}% OFF`, {
                left: 267,
                top: 42,
                originX: 'center',
                originY: 'center',
                fontFamily: 'Plus Jakarta Sans',
                fontSize: 14,
                fontWeight: '800',
                fill: '#ffffff',
                isDiscountBadgeText: true,
                visible: discountPct > 0
            });

            const group = new fabric.Group([rect, fabricImg, nameText, fakeText, priceLabel, realPriceText, badgeBg, badgeText], {
                left: 100,
                top: 100,
                isAlluCard: true,
                showDiscountBadge: true,
                cornerColor: '#27AE60',
                cornerStyle: 'circle',
                transparentCorners: false,
                hasControls: true,
                hasBorders: true,
                selectable: true
            });
            group.productData = p;
            group.currentMode = mode;
            canvas.add(group);
            if (initialPos) {
                const setProps = { left: initialPos.left, top: initialPos.top };
                if (initialPos.scaleX !== undefined) setProps.scaleX = initialPos.scaleX;
                if (initialPos.scaleY !== undefined) setProps.scaleY = initialPos.scaleY;
                if (initialPos.angle !== undefined) setProps.angle = initialPos.angle;
                group.set(setProps);
                group.setCoords();
            } else {
                centerLogical(group);
            }
            canvas.setActiveObject(group);
        }
        else if (mode === 'table-left' || mode === 'table-top') {
            const isLeft = (mode === 'table-left');
            let bgWidth, bgHeight, imgLeft, imgTop, titleLeft, titleTop, colsTop;
            
            if (isLeft) {
                bgHeight = 280; 
                fabricImg.scaleToHeight(220); 
                const imgWidth = fabricImg.getScaledWidth();
                imgLeft = 40;
                imgTop = (bgHeight - fabricImg.getScaledHeight()) / 2;
                titleLeft = imgLeft + imgWidth + 40;
                titleTop = 40;
                colsTop = 100;
                bgWidth = titleLeft + 500; 
            } else {
                bgWidth = 600;
                fabricImg.scaleToWidth(bgWidth - 100);
                const imgHeight = fabricImg.getScaledHeight();
                bgHeight = 40 + imgHeight + 40 + 30 + 40 + 120 + 40;
                imgLeft = (bgWidth - fabricImg.getScaledWidth()) / 2;
                imgTop = 40;
                titleLeft = bgWidth / 2;
                titleTop = 40 + imgHeight + 40;
                colsTop = titleTop + 70;
            }
            
            const bg = new fabric.Rect({ width: bgWidth, height: bgHeight, fill: '#161617', rx: 24, ry: 24 });
            fabricImg.set({ left: imgLeft, top: imgTop });
            const titleWidth = isLeft ? 450 : (bgWidth - 80);
            const title = new fabric.Textbox(p.name, {
                left: titleLeft, top: titleTop, 
                fontFamily: 'Plus Jakarta Sans', fontSize: 22, fontWeight: '800', fill: '#ffffff',
                width: titleWidth, originX: isLeft ? 'left' : 'center', textAlign: isLeft ? 'left' : 'center'
            });

            const createCol = (months, priceNum, left) => {
                const fakePriceNum = priceNum * 1.2;
                const priceStr = priceNum.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                const fakePriceStr = fakePriceNum.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                const mText = new fabric.Text(`${months} Meses`, { left, top: colsTop, fontFamily: 'Plus Jakarta Sans', fontSize: 16, fontWeight: '700', fill: '#ffffff' });
                const fakeText = new fabric.Text(`De R$ ${fakePriceStr}`, { left, top: colsTop + 35, fontFamily: 'Plus Jakarta Sans', fontSize: 14, fill: '#828392', textDecoration: 'line-through', fakePriceMonths: months });
                const lblText = new fabric.Text('por apenas', { left, top: colsTop + 55, fontFamily: 'Plus Jakarta Sans', fontSize: 12, fill: '#828392' });
                const pText = new fabric.Text(`R$ ${priceStr}`, { left, top: colsTop + 75, fontFamily: 'Plus Jakarta Sans', fontSize: 26, fontWeight: '800', fill: '#27AE60', priceMonths: months });
                const totalText = new fabric.Text('por mês', { left, top: colsTop + 110, fontFamily: 'Plus Jakarta Sans', fontSize: 12, fill: '#828392' });
                return [mText, fakeText, lblText, pText, totalText];
            };

            const price36 = numericPrice;
            const price24 = numericPrice * 1.05263;
            const price12 = numericPrice * 1.10526;
            const col1Left = isLeft ? titleLeft : 50;
            const col2Left = isLeft ? (titleLeft + 170) : 230;
            const col3Left = isLeft ? (titleLeft + 340) : 410;
            const col1 = createCol(12, price12, col1Left);
            const col2 = createCol(24, price24, col2Left);
            const col3 = createCol(36, price36, col3Left);

            const initialMaxDiscount = 17; 

            const badgeBg = new fabric.Rect({
                left: bgWidth - 125,
                top: 25,
                width: 95,
                height: 34,
                fill: '#F45258',
                rx: 10,
                ry: 10,
                isDiscountBadgeRect: true,
                visible: initialMaxDiscount > 0
            });

            const badgeText = new fabric.Text(`${initialMaxDiscount}% OFF`, {
                left: bgWidth - 125 + 47,
                top: 42,
                originX: 'center',
                originY: 'center',
                fontFamily: 'Plus Jakarta Sans',
                fontSize: 14,
                fontWeight: '800',
                fill: '#ffffff',
                isDiscountBadgeText: true,
                visible: initialMaxDiscount > 0
            });

            const group = new fabric.Group([bg, fabricImg, title, ...col1, ...col2, ...col3, badgeBg, badgeText], { 
                left: 100, top: 100, isAlluTable: true,
                showDiscountBadge: true,
                cornerColor: '#27AE60', cornerStyle: 'circle', transparentCorners: false,
                hasControls: true, hasBorders: true, selectable: true
            });
            group.productData = p;
            group.currentMode = mode;
            canvas.add(group);
            if (initialPos) {
                const setProps = { left: initialPos.left, top: initialPos.top };
                if (initialPos.scaleX !== undefined) setProps.scaleX = initialPos.scaleX;
                if (initialPos.scaleY !== undefined) setProps.scaleY = initialPos.scaleY;
                if (initialPos.angle !== undefined) setProps.angle = initialPos.angle;
                group.set(setProps);
                group.setCoords();
            } else {
                centerLogical(group);
            }
            canvas.setActiveObject(group);
        }

        canvas.renderAll();
        history.save();
        if (callback) callback(mode === 'solto' ? fabricImg : group);
    };

    imgElement.onerror = function() {
        if (imgElement.src !== p.img) {
            console.warn(`Local image failed for ${p.name}, falling back to remote.`);
            imgElement.src = p.img;
        } else if (imgElement.src !== placeholder) {
            console.warn(`Remote image failed for ${p.name}, using placeholder.`);
            imgElement.src = placeholder;
        }
    };

    // Usar caminho absoluto relativo à raiz se necessário, ou garantir que local_img seja válido
    const localImgPath = p.local_img.startsWith('./') ? p.local_img.substring(2) : p.local_img;
    imgElement.src = localImgPath || p.img;

}

export async function syncProductsWithAPI() {
    const formatBRL = (v) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const fetchPage = async (pageIndex) => {
        const url = `https://api-gateway.dev.digital.allugator.com/api/public/v1/products?pageIndex=${pageIndex}&pageSize=500&sortOrder=asc&includeCommercialTags=false&includePhotos=true&soldOutLast=false&excludeSoldOut=false`;
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
    };

    try {
        // Buscar todas as páginas
        const page0 = await fetchPage(0);
        let allItems = page0.data || [];
        if (page0.pagination?.can_next_page) {
            const page1 = await fetchPage(1);
            allItems = allItems.concat(page1.data || []);
        }

        // Indexar por nome normalizado
        const byName = {};
        allItems.forEach(item => {
            byName[item.name.toLowerCase().trim()] = item;
        });

        let count = 0;
        if (!window.alluProducts) window.alluProducts = [];

        // Adicionar produtos novos que ainda não estão na lista local
        const localNames = new Set(window.alluProducts.map(p => p.name.toLowerCase().trim()));
        allItems.forEach(item => {
            if (item.archived) return;
            const key = item.name.toLowerCase().trim();
            if (!localNames.has(key)) {
                const mainPhoto = (item.product_photos || []).find(p => p.main) || (item.product_photos || [])[0];
                window.alluProducts.push({
                    name: item.name,
                    description: item.technical_details || '',
                    price: 'Consulte',
                    price_12: 'Consulte',
                    price_24: 'Consulte',
                    price_36: 'Consulte',
                    img: mainPhoto?.url || '',
                    local_img: `./assets/products/${item.slug}.png`,
                });
            }
        });

        // Atualizar campos em todos os produtos locais
        window.alluProducts.forEach(prod => {
            const match = byName[prod.name.toLowerCase().trim()];
            if (!match) return;

            // Descrição
            if (match.technical_details) prod.description = match.technical_details;

            // Foto principal
            const mainPhoto = (match.product_photos || []).find(p => p.main) || (match.product_photos || [])[0];
            if (mainPhoto?.url) prod.img = mainPhoto.url;

            // Preços: menor installment_value disponível = base (36 meses)
            const values = (match.skus || [])
                .filter(s => s.site_availability && !s.sold_out)
                .map(s => parseFloat(s.installment_value))
                .filter(v => v > 0);

            const allValues = (match.skus || [])
                .map(s => parseFloat(s.installment_value))
                .filter(v => v > 0);

            const base = values.length ? Math.min(...values) : (allValues.length ? Math.min(...allValues) : null);
            if (base) {
                prod.price = formatBRL(base);
                prod.price_36 = formatBRL(base);
                prod.price_24 = formatBRL(Math.round(base * 1.05263 * 100) / 100);
                prod.price_12 = formatBRL(Math.round(base * 1.10526 * 100) / 100);
                count++;
            }
        });

        return count;
    } catch (err) {
        console.error('Erro ao sincronizar com API da Allu:', err);
    }
    return 0;
}
