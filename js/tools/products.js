// js/tools/products.js
import { state } from '../state.js';
import { presets } from '../config.js';
import { updateSidebar } from '../ui/sidebar.js';
import { history } from '../history.js';

export function renderProductsTools(sidebarContent) {
    const div = document.createElement('div');
    div.className = 'animate-fade';
    sidebarContent.appendChild(div);

    div.innerHTML = `<div id="api-loading" style="text-align:center; padding:40px; color:var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem; color:var(--accent); margin-bottom:12px;"></i><br>Carregando catálogo...</div>`;

    const renderList = (products) => {
        if (!products || products.length === 0) {
            return `<div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:0.8rem;">Nenhum produto encontrado.</div>`;
        }
        let listHTML = '<div id="products-list" class="preset-grid">';
        products.forEach(p => {
            listHTML += `
                <div class="preset-card product-draggable" data-product='${JSON.stringify(p).replace(/'/g, "&#39;")}' style="padding:12px; display:flex; flex-direction:column; gap:8px; cursor:pointer;">
                    <div style="height:100px; width:100%; background:#fff; border-radius:12px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                        <img src="${p.local_img}" style="max-height:85%; max-width:85%; object-fit:contain;">
                    </div>
                    <span style="font-size:0.7rem; font-weight:700; color:white; line-height:1.2; text-align:center;">${p.name}</span>
                    <div style="background:rgba(255,255,255,0.1); color:white; text-align:center; padding:6px; border-radius:6px; font-size:0.7rem; font-weight:700; margin-top:4px; border:1px solid var(--glass-border);">
                        <i class="fa-solid fa-plus"></i> Inserir
                    </div>
                </div>
            `;
        });
        listHTML += '</div>';
        return listHTML;
    };

    const attachEvents = (container) => {
        container.querySelectorAll('.product-draggable').forEach(card => {
            card.onclick = () => {
                const p = JSON.parse(card.dataset.product);
                addProductToCanvas(p, 'solto');
            };
        });
    };

    syncProductsWithAPI().then(() => {
        const headerHTML = `
            <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; margin-bottom:20px; border:1px solid var(--glass-border);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Status do Banco</span>
                    <span style="font-size:0.7rem; color:var(--accent); background:rgba(39, 174, 96, 0.2); padding:2px 8px; border-radius:10px;"><i class="fa-solid fa-check-circle"></i> Atualizado</span>
                </div>
                <div style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4;">
                    Última checagem: Hoje às ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}<br>
                    Produtos em estoque: <b>${window.alluProducts.length} itens</b>
                </div>
            </div>`;

        const searchHTML = `
            <div style="position:relative; margin-bottom:20px;">
                <input type="text" id="product-search" placeholder="Buscar produto..." style="width:100%; padding:12px 12px 12px 40px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:10px; color:white; font-size:0.85rem; outline:none; transition:all 0.2s;">
                <i class="fa-solid fa-magnifying-glass" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-secondary); font-size:0.9rem;"></i>
            </div>
            <p class="subtitle">Produtos Disponíveis</p>
            <div id="products-container">
                ${renderList(window.alluProducts)}
            </div>`;

        const footerHTML = `
            <button class="btn-primary" id="btn-sync-catalog" style="width:100%; margin-top:20px; padding:12px; border-radius:8px; background:var(--accent); color:white; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px;">
                <i class="fa-solid fa-arrows-rotate"></i> Atualizar Produtos
            </button>
            <div style="margin-top:30px; border-top:1px solid var(--glass-border); padding-top:20px;">
                <p class="subtitle">Selos e Ofertas</p>
                <div style="display:grid; grid-template-columns: 1fr; gap:10px;">
                    <button class="btn-tool" onclick="addPriceStamp()" style="width:100%; height:auto; padding:12px; border:1px solid var(--glass-border); justify-content:flex-start; gap:10px;">
                        <i class="fa-solid fa-tag"></i> Selo de Preço (De/Por)
                    </button>
                    <button class="btn-tool" onclick="addAvailabilityStamp()" style="width:100%; height:auto; padding:12px; border:1px solid var(--glass-border); justify-content:flex-start; gap:10px;">
                        <i class="fa-solid fa-circle-check"></i> Selo Disponibilidade
                    </button>
                </div>
            </div>`;

        div.innerHTML = headerHTML + searchHTML + footerHTML;

        const containerEl = div.querySelector('#products-container');
        if (containerEl) attachEvents(containerEl);

        const searchInput = div.querySelector('#product-search');
        if (searchInput && containerEl) {
            searchInput.oninput = () => {
                const query = searchInput.value.toLowerCase();
                const filtered = window.alluProducts.filter(p => p.name.toLowerCase().includes(query));
                containerEl.innerHTML = renderList(filtered);
                attachEvents(containerEl);
            };
            searchInput.onfocus = () => searchInput.style.borderColor = 'var(--accent)';
            searchInput.onblur = () => searchInput.style.borderColor = 'var(--glass-border)';
        }

        const btnSync = div.querySelector('#btn-sync-catalog');
        if (btnSync) {
            btnSync.onclick = async () => {
                const originalHTML = btnSync.innerHTML;
                btnSync.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Atualizando...';
                btnSync.style.opacity = '0.7';

                const count = await syncProductsWithAPI();

                btnSync.innerHTML = originalHTML;
                btnSync.style.opacity = '1';

                if (count > 0 && containerEl) {
                    containerEl.innerHTML = renderList(window.alluProducts);
                    attachEvents(containerEl);
                    alert(`✅ ${count} produtos atualizados com sucesso via API da Allugator!`);
                } else {
                    alert("✨ Os preços já estão totalmente atualizados com a API.");
                }
            };
        }
    }).catch(err => {
        console.error('Erro ao carregar produtos:', err);
        div.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:0.8rem;">Erro ao conectar com a API.</div>';
    });
}

export function addProductToCanvas(p, mode = 'solto', initialPos = null) {
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
    if (p.local_img && p.local_img.startsWith('http')) {
        imgElement.crossOrigin = "anonymous";
    }
    imgElement.onload = function() {
        const fabricImg = new fabric.Image(imgElement);
        
        // Cálculos de Preço
        const numericPrice = parseFloat(p.price.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 499.90;
        
        if (mode === 'solto') {
            fabricImg.scaleToWidth(300);
            fabricImg.productData = p;
            fabricImg.currentMode = mode;
            canvas.add(fabricImg);
            if (initialPos) fabricImg.set({ left: initialPos.left, top: initialPos.top });
            else centerLogical(fabricImg);
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

            const group = new fabric.Group([rect, fabricImg, nameText, fakeText, priceLabel, realPriceText], {
                left: 100,
                top: 100,
                isAlluCard: true,
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
            if (initialPos) group.set({ left: initialPos.left, top: initialPos.top });
            else centerLogical(group);
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
                left: titleLeft, 
                top: titleTop, 
                fontFamily: 'Plus Jakarta Sans', 
                fontSize: 22, 
                fontWeight: '800', 
                fill: '#ffffff',
                width: titleWidth,
                originX: isLeft ? 'left' : 'center',
                textAlign: isLeft ? 'left' : 'center'
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

            const group = new fabric.Group([bg, fabricImg, title, ...col1, ...col2, ...col3], { 
                left: 100, 
                top: 100,
                isAlluTable: true,
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
            if (initialPos) group.set({ left: initialPos.left, top: initialPos.top });
            else centerLogical(group);
            canvas.setActiveObject(group);
        }

        canvas.renderAll();
        history.save();
    };
    imgElement.src = p.local_img;
}

export async function syncProductsWithAPI() {
    try {
        const url = 'https://api-gateway.dev.digital.allugator.com/api/public/v1/products?pageIndex=0&pageSize=1000&page=1&limit=10&sortOrder=asc&includeCommercialTags=false&includePhotos=false&soldOutLast=false&excludeSoldOut=false';
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        
        if (result && result.data && Array.isArray(result.data)) {
            let count = 0;
            if (window.alluProducts && window.alluProducts.length > 0) {
                window.alluProducts.forEach(prod => {
                    const match = result.data.find(item => 
                        item.name.toLowerCase().trim() === prod.name.toLowerCase().trim() ||
                        item.slug.toLowerCase().trim() === prod.name.toLowerCase().replace(/\s+/g, '-').trim()
                    );
                    
                    if (match && match.skus && match.skus.length > 0) {
                        const validSku = match.skus.find(s => s.installment_value && parseFloat(s.installment_value) > 0);
                        if (validSku) {
                            const numericVal = parseFloat(validSku.installment_value);
                            prod.price = "R$ " + numericVal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                            count++;
                        }
                    }
                });
            }
            console.log(`Sincronizados ${count} produtos com sucesso via API.`);
            return count;
        }
    } catch (err) {
        console.error('Erro ao sincronizar com API da Allu:', err);
    }
    return 0;
}
