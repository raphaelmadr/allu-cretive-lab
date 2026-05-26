// js/tools/properties.js
import { state } from '../state.js';
import { colors, backgroundColors, textColors } from '../config.js';
import { history } from '../history.js';
import { updateSidebar } from '../ui/sidebar.js';
// TODO: import addProductToCanvas

export function renderPropertiesTools(sidebarContent) {
    const canvas = state.getCanvas();
    if (!canvas) return;

    const div = document.createElement('div');
    div.className = 'animate-fade';

    const toHex = (color) => {
        if (!color || color === 'transparent') return '#000000';
        if (color.startsWith('#')) return color.substring(0, 7);
        return '#000000'; 
    };

    const generateColorSwatches = (id, currentColor) => {
        let swatchesHTML = `<div style="display:flex; flex-wrap:wrap; gap:6px; width:100%;">`;
        const isTransparent = currentColor === 'transparent' || !currentColor;
        swatchesHTML += `<div class="prop-swatch-${id}" data-color="transparent" style="min-width:24px; height:24px; border-radius:4px; border:${isTransparent ? '2px solid white' : '1px solid rgba(255,255,255,0.1)'}; background:repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 8px 8px; cursor:pointer;" title="Transparente"></div>`;
        colors.forEach(c => {
            const isActive = toHex(currentColor).toLowerCase() === c.toLowerCase();
            swatchesHTML += `<div class="prop-swatch-${id}" data-color="${c}" style="min-width:24px; height:24px; border-radius:4px; border: ${isActive ? '2px solid white' : '1px solid rgba(255,255,255,0.1)'}; background-color:${c}; cursor:pointer; transition:transform 0.1s;" title="${c}" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></div>`;
        });
        swatchesHTML += `</div>`;
        return swatchesHTML;
    };
    
    const active = canvas.getActiveObject();
    
    // Auto-switch to badges tab if a badge is selected while in properties
    if (active && (active.isBadge || (active.get && active.get('isBadge')))) {
        const badgeBtn = document.querySelector('.btn-tool[data-tab="badges"]');
        if (badgeBtn) {
            badgeBtn.click();
            return;
        }
    }
    
    // Auto-switch to icons tab if an icon is selected while in properties
    if (active && (active.isIcon || (active.get && active.get('isIcon')))) {
        const iconBtn = document.querySelector('.btn-tool[data-tab="icons"]');
        if (iconBtn) {
            iconBtn.click();
            return;
        }
    }
    
    if (!active) {

        let docBgHex = canvas.backgroundColor;
        if (typeof docBgHex === 'object') docBgHex = 'transparent';

        div.innerHTML = `
            <style>
            .color-scroll::-webkit-scrollbar { height: 6px; }
            .color-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
            .color-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
            </style>
            <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:16px; margin-bottom:24px; border:1px solid var(--glass-border); display:flex; flex-direction:column; align-items:center; gap:12px;">
                <i class="fa-solid fa-file-image" style="font-size:32px; color:var(--text-secondary);"></i>
                <span style="font-size:0.85rem; font-weight:700; text-align:center;">Propriedades do Documento</span>
                <span style="font-size:0.75rem; color:var(--text-secondary);">${canvas.width} x ${canvas.height} px</span>
            </div>
            
            <p class="subtitle" style="margin-bottom:12px;">Fundo do Documento</p>
            <div id="prop-bg-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;"></div>
            <button id="prop-clear-bg" style="width:100%; padding:11px; border-radius:10px; background:transparent; border:1px solid var(--glass-border); color:var(--text-secondary); cursor:pointer; font-size:0.82rem; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s; font-family:inherit; margin-bottom:20px;">
                <i class="fa-solid fa-droplet-slash"></i> Branco (padrão)
            </button>

            <div style="display:flex; flex-direction:column; gap:8px; margin-top:4px; padding-top:16px; border-top:1px solid var(--glass-border);">
                <label style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Imagem de Fundo</label>
                <input type="file" id="prop-doc-bg-upload" accept="image/*" style="display:none">
                <button class="btn-primary" onclick="document.getElementById('prop-doc-bg-upload').click()" style="width:100%; padding:12px; border-radius:8px; background:rgba(255,255,255,0.05); color:white; border:1px solid var(--glass-border); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <i class="fa-solid fa-upload"></i> Fazer Upload
                </button>
            </div>
        `;
        
        sidebarContent.appendChild(div);

        // Cartões de cor de fundo (apenas as 6 cores aprovadas)
        const bgGrid = div.querySelector('#prop-bg-grid');
        const currentBg = (canvas.backgroundColor || '#ffffff').toUpperCase();

        const updateCardStates = (selectedHex) => {
            bgGrid.querySelectorAll('.prop-bg-card').forEach(card => {
                const isActive = card.dataset.hex.toUpperCase() === selectedHex.toUpperCase();
                card.style.outline = isActive ? '2px solid var(--accent)' : '1px solid var(--glass-border)';
                card.style.transform = isActive ? 'scale(1.03)' : 'scale(1)';
            });
        };

        backgroundColors.forEach(({ hex, label }) => {
            const card = document.createElement('div');
            card.className = 'prop-bg-card';
            card.dataset.hex = hex;
            const isActive = currentBg === hex.toUpperCase();
            const isLight = (parseInt(hex.replace('#',''), 16) > 0xffffff / 2);
            const textColor = isLight ? '#161617' : '#ffffff';
            card.style.cssText = `height:64px; border-radius:12px; background-color:${hex}; cursor:pointer; display:flex; align-items:flex-end; padding:7px 9px; transition:all 0.18s ease; outline:${isActive ? '2px solid var(--accent)' : '1px solid var(--glass-border)'}; transform:${isActive ? 'scale(1.03)' : 'scale(1)'};`;
            card.innerHTML = `<span style="font-size:0.65rem; font-weight:700; color:${textColor}; opacity:0.85; text-shadow:0 1px 3px rgba(0,0,0,0.3);">${label}</span>`;
            card.onmouseenter = () => { if (bgGrid.querySelector('.prop-bg-card[style*="scale(1.03)"]') !== card) card.style.outline = '1px solid rgba(255,255,255,0.4)'; };
            card.onmouseleave = () => { if (bgGrid.querySelector('.prop-bg-card[style*="scale(1.03)"]') !== card) card.style.outline = '1px solid var(--glass-border)'; };
            card.onclick = () => {
                canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
                canvas.setBackgroundColor(hex, canvas.renderAll.bind(canvas));
                history.save();
                updateCardStates(hex);
            };
            bgGrid.appendChild(card);
        });

        div.querySelector('#prop-clear-bg').onclick = () => {
            canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
            canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
            history.save();
            updateCardStates('#ffffff');
        };
        div.querySelector('#prop-clear-bg').onmouseenter = e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'white'; };
        div.querySelector('#prop-clear-bg').onmouseleave = e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.color = 'var(--text-secondary)'; };

        div.querySelector('#prop-doc-bg-upload').onchange = (e) => {
            const file = e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = function(f) {
                fabric.Image.fromURL(f.target.result, function(img) {
                    canvas.setBackgroundColor('', canvas.renderAll.bind(canvas));
                    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                        scaleX: canvas.width / img.width,
                        scaleY: canvas.height / img.height
                    });
                    history.save();
                });
            };
            reader.readAsDataURL(file);
        };

        return;
    }

    const currentMode = active ? active.currentMode : null;
    const parsePrice = (val) => {
        if (!val) return 0;
        return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
    };

    const updateGroupDiscountBadge = (active, canvas) => {
        const discountObj = active.getObjects().find(o => o.isDiscountBadgeText === true);
        const discountBg = active.getObjects().find(o => o.isDiscountBadgeRect === true);
        if (!discountObj && !discountBg) return;

        const isChecked = active.showDiscountBadge !== false;

        let maxDiscount = -Infinity;

        if (active.currentMode === 'card') {
            const origObj = active.getObjects().find(o => o.fakePriceCard === true);
            const finalObj = active.getObjects().find(o => o.priceCard === true);
            if (origObj && finalObj) {
                const origVal = parsePrice(origObj.text.replace('De R$ ', '').trim());
                const finalVal = parsePrice(finalObj.text.replace('R$ ', '').trim());
                if (origVal > 0 && finalVal > 0 && origVal > finalVal) {
                    maxDiscount = Math.round((1 - finalVal / origVal) * 100);
                }
            }
        } else if (active.currentMode === 'table-left' || active.currentMode === 'table-top') {
            [12, 24, 36].forEach(months => {
                const origObj = active.getObjects().find(o => o.fakePriceMonths === months);
                const finalObj = active.getObjects().find(o => o.priceMonths === months);
                if (origObj && finalObj) {
                    const origVal = parsePrice(origObj.text.replace('De R$ ', '').trim());
                    const finalVal = parsePrice(finalObj.text.replace('R$ ', '').trim());
                    if (origVal > 0 && finalVal > 0 && origVal > finalVal) {
                        const d = Math.round((1 - finalVal / origVal) * 100);
                        if (d > maxDiscount) maxDiscount = d;
                    }
                }
            });
        }

        if (isChecked && maxDiscount !== -Infinity && maxDiscount > 0) {
            if (discountObj) {
                discountObj.set({ text: `${maxDiscount}% OFF`, visible: true });
            }
            if (discountBg) {
                discountBg.set({ visible: true });
            }
        } else {
            if (discountObj) discountObj.set({ visible: false });
            if (discountBg) discountBg.set({ visible: false });
        }
        active.dirty = true;
    };

    let propertiesHTML = '';

    if (active.productData) {
        const p = active.productData;

        let p12 = '', p24 = '', p36 = '';
        let p12Orig = '', p24Orig = '', p36Orig = '';
        
        if (active.getObjects) {
            const obj12 = active.getObjects().find(o => o.priceMonths === 12);
            const obj24 = active.getObjects().find(o => o.priceMonths === 24);
            const obj36 = active.getObjects().find(o => o.priceMonths === 36 || o.priceCard === true);

            const obj12O = active.getObjects().find(o => o.fakePriceMonths === 12);
            const obj24O = active.getObjects().find(o => o.fakePriceMonths === 24);
            const obj36O = active.getObjects().find(o => o.fakePriceMonths === 36 || o.fakePriceCard === true);

            if (obj12) p12 = obj12.text.replace('R$ ', '').trim();
            if (obj24) p24 = obj24.text.replace('R$ ', '').trim();
            if (obj36) p36 = obj36.text.replace('R$ ', '').trim();

            if (obj12O) p12Orig = obj12O.text.replace('De R$ ', '').trim();
            if (obj24O) p24Orig = obj24O.text.replace('De R$ ', '').trim();
            if (obj36O) p36Orig = obj36O.text.replace('De R$ ', '').trim();
        }

        if (!p36 && p.price) p36 = p.price.replace('R$', '').trim();
        if (!p36Orig && p36) {
            const numP36 = parseFloat(p36.replace(/\./g, '').replace(',', '.')) || 0;
            p36Orig = (numP36 * 1.2).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        }

        const getDiscountPct = (orig, final) => {
            const o = parsePrice(orig);
            const f = parsePrice(final);
            if (o > 0 && f > 0 && o > f) {
                return Math.round((1 - f / o) * 100);
            }
            return 0;
        };

        let priceInputsHTML = '';
        if (currentMode === 'table-left' || currentMode === 'table-top') {
            const disc12 = getDiscountPct(p12Orig, p12);
            const disc24 = getDiscountPct(p24Orig, p24);
            const disc36 = getDiscountPct(p36Orig, p36);

            priceInputsHTML = `
                <p class="subtitle" style="margin-bottom:12px;">Editar Preços do Catálogo</p>
                <div style="display:flex; flex-direction:column; gap:16px; background:rgba(255,255,255,0.02); padding:15px; border-radius:12px; border:1px solid var(--glass-border); margin-bottom:24px;">
                    
                    <!-- 12 Meses -->
                    <div style="display:flex; flex-direction:column; gap:8px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:12px;">
                        <span style="font-size:0.75rem; font-weight:700; color:white;">12 Meses</span>
                        <div style="display:flex; gap:8px;">
                            <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                                <label style="font-size:0.65rem; color:var(--text-secondary);">De (R$)</label>
                                <input type="text" id="prop-p12-original" value="${p12Orig}" style="width:100%; padding:6px 10px; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.05); color:white; outline:none; font-size:0.75rem;">
                            </div>
                            <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                                <label style="font-size:0.65rem; color:var(--text-secondary);">Por (R$)</label>
                                <input type="text" id="prop-p12-final" value="${p12}" style="width:100%; padding:6px 10px; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.05); color:white; outline:none; font-size:0.75rem;">
                            </div>
                            <div style="width:60px; display:flex; flex-direction:column; gap:4px;">
                                <label style="font-size:0.65rem; color:var(--text-secondary);">Desc (%)</label>
                                <input type="number" id="prop-p12-discount" value="${disc12 || ''}" placeholder="0" style="width:100%; padding:6px 6px; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.05); color:white; outline:none; text-align:center; font-size:0.75rem;">
                            </div>
                        </div>
                    </div>

                    <!-- 24 Meses -->
                    <div style="display:flex; flex-direction:column; gap:8px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:12px;">
                        <span style="font-size:0.75rem; font-weight:700; color:white;">24 Meses</span>
                        <div style="display:flex; gap:8px;">
                            <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                                <label style="font-size:0.65rem; color:var(--text-secondary);">De (R$)</label>
                                <input type="text" id="prop-p24-original" value="${p24Orig}" style="width:100%; padding:6px 10px; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.05); color:white; outline:none; font-size:0.75rem;">
                            </div>
                            <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                                <label style="font-size:0.65rem; color:var(--text-secondary);">Por (R$)</label>
                                <input type="text" id="prop-p24-final" value="${p24}" style="width:100%; padding:6px 10px; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.05); color:white; outline:none; font-size:0.75rem;">
                            </div>
                            <div style="width:60px; display:flex; flex-direction:column; gap:4px;">
                                <label style="font-size:0.65rem; color:var(--text-secondary);">Desc (%)</label>
                                <input type="number" id="prop-p24-discount" value="${disc24 || ''}" placeholder="0" style="width:100%; padding:6px 6px; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.05); color:white; outline:none; text-align:center; font-size:0.75rem;">
                            </div>
                        </div>
                    </div>

                    <!-- 36 Meses -->
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <span style="font-size:0.75rem; font-weight:700; color:white;">36 Meses</span>
                        <div style="display:flex; gap:8px;">
                            <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                                <label style="font-size:0.65rem; color:var(--text-secondary);">De (R$)</label>
                                <input type="text" id="prop-p36-original" value="${p36Orig}" style="width:100%; padding:6px 10px; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.05); color:white; outline:none; font-size:0.75rem;">
                            </div>
                            <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                                <label style="font-size:0.65rem; color:var(--text-secondary);">Por (R$)</label>
                                <input type="text" id="prop-p36-final" value="${p36}" style="width:100%; padding:6px 10px; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.05); color:white; outline:none; font-size:0.75rem;">
                            </div>
                            <div style="width:60px; display:flex; flex-direction:column; gap:4px;">
                                <label style="font-size:0.65rem; color:var(--text-secondary);">Desc (%)</label>
                                <input type="number" id="prop-p36-discount" value="${disc36 || ''}" placeholder="0" style="width:100%; padding:6px 6px; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.05); color:white; outline:none; text-align:center; font-size:0.75rem;">
                            </div>
                        </div>
                    </div>

                    <!-- Badge Switch Toggle -->
                    <div style="display:flex; align-items:center; gap:10px; margin-top:16px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.05);">
                        <label class="allu-switch">
                            <input type="checkbox" id="prop-product-show-badge" ${active.showDiscountBadge !== false ? 'checked' : ''}>
                            <span class="allu-slider"></span>
                        </label>
                        <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:600; cursor:pointer;" onclick="document.getElementById('prop-product-show-badge').click()">Ativar selo com porcentagem do desconto</span>
                    </div>

                </div>
            `;
        } else if (currentMode === 'card') {
            const discCard = getDiscountPct(p36Orig, p36);
            priceInputsHTML = `
                <p class="subtitle" style="margin-bottom:12px;">Editar Preço do Card</p>
                <div style="display:flex; flex-direction:column; gap:12px; background:rgba(255,255,255,0.02); padding:15px; border-radius:12px; border:1px solid var(--glass-border); margin-bottom:24px;">
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <div style="display:flex; gap:8px;">
                            <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                                <label style="font-size:0.65rem; color:var(--text-secondary);">De (R$)</label>
                                <input type="text" id="prop-card-original" value="${p36Orig}" style="width:100%; padding:6px 10px; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.05); color:white; outline:none; font-size:0.75rem;">
                            </div>
                            <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                                <label style="font-size:0.65rem; color:var(--text-secondary);">Por (R$)</label>
                                <input type="text" id="prop-card-final" value="${p36}" style="width:100%; padding:6px 10px; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.05); color:white; outline:none; font-size:0.75rem;">
                            </div>
                            <div style="width:60px; display:flex; flex-direction:column; gap:4px;">
                                <label style="font-size:0.65rem; color:var(--text-secondary);">Desc (%)</label>
                                <input type="number" id="prop-card-discount" value="${discCard || ''}" placeholder="0" style="width:100%; padding:6px 6px; border-radius:6px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.05); color:white; outline:none; text-align:center; font-size:0.75rem;">
                            </div>
                        </div>
                    </div>
                    <!-- Badge Switch Toggle -->
                    <div style="display:flex; align-items:center; gap:10px; margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.05);">
                        <label class="allu-switch">
                            <input type="checkbox" id="prop-product-show-badge" ${active.showDiscountBadge !== false ? 'checked' : ''}>
                            <span class="allu-slider"></span>
                        </label>
                        <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:600; cursor:pointer;" onclick="document.getElementById('prop-product-show-badge').click()">Ativar selo com porcentagem do desconto</span>
                    </div>
                </div>
            `;
        }

        propertiesHTML += `
            <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:16px; margin-bottom:24px; border:1px solid var(--glass-border); display:flex; flex-direction:column; align-items:center; gap:12px;">
                <img src="${p.local_img}" style="height:80px; object-fit:contain;">
                <span style="font-size:0.85rem; font-weight:700; text-align:center;">${p.name}</span>
            </div>
            
            ${priceInputsHTML}
            
            <p class="subtitle" style="margin-bottom:12px;">Formato de Apresentação</p>
            <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:24px;">
                <button class="btn-primary prop-mode-btn" data-mode="solto" style="padding:16px; border-radius:12px; border:1px solid ${currentMode === 'solto' ? 'var(--accent)' : 'var(--glass-border)'}; background: ${currentMode === 'solto' ? 'rgba(39, 174, 96, 0.1)' : 'transparent'}; color:white; cursor:pointer; text-align:left; display:flex; align-items:center; gap:12px; transition:all 0.2s;">
                    <i class="fa-solid fa-image"></i> Produto Solto
                </button>
                <button class="btn-primary prop-mode-btn" data-mode="card" style="padding:16px; border-radius:12px; border:1px solid ${currentMode === 'card' ? 'var(--accent)' : 'var(--glass-border)'}; background: ${currentMode === 'card' ? 'rgba(39, 174, 96, 0.1)' : 'transparent'}; color:white; cursor:pointer; text-align:left; display:flex; align-items:center; gap:12px; transition:all 0.2s;">
                    <i class="fa-solid fa-id-card"></i> Card Destaque
                </button>
                <button class="btn-primary prop-mode-btn" data-mode="table-left" style="padding:16px; border-radius:12px; border:1px solid ${currentMode === 'table-left' ? 'var(--accent)' : 'var(--glass-border)'}; background: ${currentMode === 'table-left' ? 'rgba(39, 174, 96, 0.1)' : 'transparent'}; color:white; cursor:pointer; text-align:left; display:flex; align-items:center; gap:12px; transition:all 0.2s;">
                    <i class="fa-solid fa-table-list"></i> Tabela (Lateral)
                </button>
                <button class="btn-primary prop-mode-btn" data-mode="table-top" style="padding:16px; border-radius:12px; border:1px solid ${currentMode === 'table-top' ? 'var(--accent)' : 'var(--glass-border)'}; background: ${currentMode === 'table-top' ? 'rgba(39, 174, 96, 0.1)' : 'transparent'}; color:white; cursor:pointer; text-align:left; display:flex; align-items:center; gap:12px; transition:all 0.2s;">
                    <i class="fa-solid fa-table-cells-large"></i> Tabela (Topo)
                </button>
            </div>
        `;
    } else if (active.type === 'image') {
        propertiesHTML += `
            <p class="subtitle" style="margin-bottom:12px;">Edição de Imagem</p>
            <div style="background:rgba(255,255,255,0.02); padding:20px; border-radius:12px; border:1px solid var(--glass-border); margin-bottom:20px;">
                <button id="btn-crop-start" class="btn-primary" style="width:100%; padding:12px; border-radius:8px; background:var(--accent); color:white; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-weight:700;">
                    <i class="fa-solid fa-crop"></i> Recortar Imagem
                </button>
                <p style="font-size:0.65rem; color:var(--text-secondary); margin-top:8px; text-align:center;">Corte não-destrutivo. Você pode reajustar depois.</p>
            </div>
        `;
    }


    let currentColor = '#ffffff';
    let currentBg = '#161617';
    let currentBorder = '#000000';
    let currentFontSize = 100;
    let isGroup = active.type === 'group';

    if (active.type === 'i-text' || active.type === 'text') {
        currentColor = active.fill || '#ffffff';
        currentBg = active.backgroundColor || '#000000';
        currentBorder = active.stroke || '#000000';
        currentFontSize = active.fontSize || 16;
    } else if (isGroup || active.isAlluCard || active.isAlluTable) {
        const bgRect = active.getObjects().find(o => o.type === 'rect');
        if (bgRect) {
            currentBg = bgRect.fill || '#161617';
            currentBorder = bgRect.stroke || '#000000';
        }
        const firstText = active.getObjects().find(o => o.type === 'text' || o.type === 'i-text');
        if (firstText) currentColor = firstText.fill;
        currentFontSize = 100; 
    } else {
        currentBg = active.fill || '#ffffff';
        currentBorder = active.stroke || '#000000';
    }

    propertiesHTML += `
        <style>
        .color-scroll::-webkit-scrollbar { height: 6px; }
        .color-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
        .color-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
        </style>
        <p class="subtitle" style="margin-bottom:12px;">Propriedades Gerais (Cores da Marca)</p>
        <div style="display:flex; flex-direction:column; gap:20px; background:rgba(255,255,255,0.02); padding:20px; border-radius:12px; border:1px solid var(--glass-border);">
            
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <label style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Tamanho do Texto</label>
                <div style="display:flex; align-items:center; gap:8px;">
                    <input type="range" id="prop-text-size" min="10" max="200" value="${currentFontSize}" style="width:100px;">
                    <span id="prop-text-size-val" style="font-size:0.8rem; width:30px; text-align:right;">${currentFontSize}${isGroup ? '%' : 'px'}</span>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:8px;">
                <label style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Cor do Texto</label>
                <div id="prop-text-color-grid" style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px;"></div>
            </div>

            ${(active.type !== 'i-text' && active.type !== 'text') ? `
            <div style="display:flex; flex-direction:column; gap:8px;">
                <label style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Cor do Fundo</label>
                ${generateColorSwatches('bg', currentBg)}
            </div>

            <div style="display:flex; flex-direction:column; gap:8px;">
                <label style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Cor da Borda</label>
                ${generateColorSwatches('border', currentBorder)}
            </div>` : ''}

        </div>
    `;

    let textEffectsHTML = '';
    if (active.type === 'i-text' || active.type === 'text') {
        const hasShadow = !!active.shadow;
        const shadowBlur = active.shadow ? active.shadow.blur : 10;
        const shadowOffsetX = active.shadow ? active.shadow.offsetX : 5;
        const shadowOffsetY = active.shadow ? active.shadow.offsetY : 5;
        const shadowColor = active.shadow ? (typeof active.shadow.color === 'string' ? active.shadow.color : '#000000') : '#000000';

        const hasInnerShadow = (active.innerShadowBlur || 0) > 0;
        const innerShadowBlur = active.innerShadowBlur || 10;
        const innerShadowOffsetX = active.innerShadowOffsetX || 5;
        const innerShadowOffsetY = active.innerShadowOffsetY || 5;
        const innerShadowColor = active.innerShadowColor || '#000000';

        const charSpacingVal = active.charSpacing || 0;
        const lineHeightVal = active.lineHeight || 1.16;

        textEffectsHTML = `
            <p class="subtitle" style="margin-top:24px; margin-bottom:12px;">Formatação Avançada</p>
            <div style="display:flex; flex-direction:column; gap:16px; background:rgba(255,255,255,0.02); padding:20px; border-radius:12px; border:1px solid var(--glass-border); margin-bottom:20px;">
                <!-- Espaçamento -->
                <div style="display:flex; flex-direction:column; gap:6px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <label style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Espaçamento</label>
                        <span id="prop-char-spacing-val" style="font-size:0.75rem; color:var(--text-secondary);">${charSpacingVal}</span>
                    </div>
                    <input type="range" id="prop-char-spacing" min="-100" max="800" value="${charSpacingVal}" style="width:100%;">
                </div>

                <!-- Altura da Linha -->
                <div style="display:flex; flex-direction:column; gap:6px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <label style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Altura da Linha</label>
                        <span id="prop-line-height-val" style="font-size:0.75rem; color:var(--text-secondary);">${lineHeightVal.toFixed(2)}</span>
                    </div>
                    <input type="range" id="prop-line-height" min="0.5" max="3" step="0.05" value="${lineHeightVal}" style="width:100%;">
                </div>
            </div>

            <p class="subtitle" style="margin-top:24px; margin-bottom:12px;">Sombra Projetada (Externa)</p>
            <div style="display:flex; flex-direction:column; gap:16px; background:rgba(255,255,255,0.02); padding:20px; border-radius:12px; border:1px solid var(--glass-border); margin-bottom:20px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" id="prop-has-shadow" ${hasShadow ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--accent); cursor:pointer;">
                    <label for="prop-has-shadow" style="font-size:0.8rem; font-weight:600; color:var(--text-secondary); cursor:pointer;">Habilitar Sombra</label>
                </div>
                
                <div id="shadow-details-container" style="display:${hasShadow ? 'flex' : 'none'}; flex-direction:column; gap:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <label style="font-size:0.8rem; color:var(--text-secondary);">Cor da Sombra</label>
                        <input type="color" id="prop-shadow-color" value="${shadowColor.startsWith('#') ? shadowColor : '#000000'}" style="border:none; background:transparent; width:30px; height:24px; cursor:pointer;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <label style="font-size:0.75rem; color:var(--text-secondary);">Desfoque (Blur)</label>
                            <span id="prop-shadow-blur-val" style="font-size:0.7rem; color:var(--text-secondary);">${shadowBlur}px</span>
                        </div>
                        <input type="range" id="prop-shadow-blur" min="0" max="50" value="${shadowBlur}" style="width:100%;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <label style="font-size:0.75rem; color:var(--text-secondary);">Deslocamento X</label>
                            <span id="prop-shadow-offsetx-val" style="font-size:0.7rem; color:var(--text-secondary);">${shadowOffsetX}px</span>
                        </div>
                        <input type="range" id="prop-shadow-offsetx" min="-50" max="50" value="${shadowOffsetX}" style="width:100%;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <label style="font-size:0.75rem; color:var(--text-secondary);">Deslocamento Y</label>
                            <span id="prop-shadow-offsety-val" style="font-size:0.7rem; color:var(--text-secondary);">${shadowOffsetY}px</span>
                        </div>
                        <input type="range" id="prop-shadow-offsety" min="-50" max="50" value="${shadowOffsetY}" style="width:100%;">
                    </div>
                </div>
            </div>

            <p class="subtitle" style="margin-top:24px; margin-bottom:12px;">Sombra Interna (Inset)</p>
            <div style="display:flex; flex-direction:column; gap:16px; background:rgba(255,255,255,0.02); padding:20px; border-radius:12px; border:1px solid var(--glass-border); margin-bottom:20px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" id="prop-has-innershadow" ${hasInnerShadow ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--accent); cursor:pointer;">
                    <label for="prop-has-innershadow" style="font-size:0.8rem; font-weight:600; color:var(--text-secondary); cursor:pointer;">Habilitar Sombra Interna</label>
                </div>
                
                <div id="innershadow-details-container" style="display:${hasInnerShadow ? 'flex' : 'none'}; flex-direction:column; gap:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <label style="font-size:0.8rem; color:var(--text-secondary);">Cor da Sombra</label>
                        <input type="color" id="prop-innershadow-color" value="${innerShadowColor.startsWith('#') ? innerShadowColor : '#000000'}" style="border:none; background:transparent; width:30px; height:24px; cursor:pointer;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <label style="font-size:0.75rem; color:var(--text-secondary);">Desfoque (Blur)</label>
                            <span id="prop-innershadow-blur-val" style="font-size:0.7rem; color:var(--text-secondary);">${innerShadowBlur}px</span>
                        </div>
                        <input type="range" id="prop-innershadow-blur" min="0" max="50" value="${innerShadowBlur}" style="width:100%;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <label style="font-size:0.75rem; color:var(--text-secondary);">Deslocamento X</label>
                            <span id="prop-innershadow-offsetx-val" style="font-size:0.7rem; color:var(--text-secondary);">${innerShadowOffsetX}px</span>
                        </div>
                        <input type="range" id="prop-innershadow-offsetx" min="-50" max="50" value="${innerShadowOffsetX}" style="width:100%;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <label style="font-size:0.75rem; color:var(--text-secondary);">Deslocamento Y</label>
                            <span id="prop-innershadow-offsety-val" style="font-size:0.7rem; color:var(--text-secondary);">${innerShadowOffsetY}px</span>
                        </div>
                        <input type="range" id="prop-innershadow-offsety" min="-50" max="50" value="${innerShadowOffsetY}" style="width:100%;">
                    </div>
                </div>
            </div>
        `;
    }

    propertiesHTML += textEffectsHTML;

    propertiesHTML += `
        <p class="subtitle" style="margin-top:24px; margin-bottom:12px;">Camadas (Layers)</p>
        <div style="display:flex; justify-content:space-between; gap:8px; margin-bottom:24px;">
            <button id="prop-layer-up" class="btn-tool" style="flex:1; border:1px solid var(--glass-border); border-radius:8px; padding:10px; background:rgba(255,255,255,0.02); color:white; cursor:pointer;" title="Trazer para Frente (1 nível)"><i class="fa-solid fa-angle-up"></i></button>
            <button id="prop-layer-front" class="btn-tool" style="flex:1; border:1px solid var(--glass-border); border-radius:8px; padding:10px; background:rgba(255,255,255,0.02); color:white; cursor:pointer;" title="Trazer para o Topo"><i class="fa-solid fa-angles-up"></i></button>
            <button id="prop-layer-down" class="btn-tool" style="flex:1; border:1px solid var(--glass-border); border-radius:8px; padding:10px; background:rgba(255,255,255,0.02); color:white; cursor:pointer;" title="Enviar para Trás (1 nível)"><i class="fa-solid fa-angle-down"></i></button>
            <button id="prop-layer-back" class="btn-tool" style="flex:1; border:1px solid var(--glass-border); border-radius:8px; padding:10px; background:rgba(255,255,255,0.02); color:white; cursor:pointer;" title="Enviar para o Fundo"><i class="fa-solid fa-angles-down"></i></button>
        </div>
    `;
    
    div.innerHTML = propertiesHTML;

    // ── Cartões de Cor do Texto (paleta filtrada) ───────────────────────────
    const textColorGrid = div.querySelector('#prop-text-color-grid');
    if (textColorGrid) {
        const currentTextHex = (currentColor || '#000000').toUpperCase();
        const updateTextCards = (selectedHex) => {
            textColorGrid.querySelectorAll('.prop-text-card').forEach(card => {
                const active = card.dataset.hex.toUpperCase() === selectedHex.toUpperCase();
                card.style.outline = active ? '2px solid var(--accent)' : '1px solid var(--glass-border)';
                card.style.transform = active ? 'scale(1.08)' : 'scale(1)';
                card.querySelector('.check-icon').style.display = active ? 'flex' : 'none';
            });
        };
        textColors.forEach(({ hex, label }) => {
            const card = document.createElement('div');
            card.className = 'prop-text-card';
            card.dataset.hex = hex;
            const isActive = currentTextHex === hex.toUpperCase();
            const isLight = (parseInt(hex.replace('#', ''), 16) > 0xffffff / 2);
            card.style.cssText = `
                height:52px; border-radius:10px; background-color:${hex};
                cursor:pointer; display:flex; align-items:center; justify-content:center;
                transition:all 0.15s ease; position:relative;
                outline:${isActive ? '2px solid var(--accent)' : '1px solid var(--glass-border)'};
                transform:${isActive ? 'scale(1.08)' : 'scale(1)'};
            `;
            card.innerHTML = `
                <span class="check-icon" style="display:${isActive ? 'flex' : 'none'}; position:absolute; inset:0; align-items:center; justify-content:center;">
                    <i class="fa-solid fa-check" style="font-size:0.75rem; color:${isLight ? '#161617' : '#ffffff'};"></i>
                </span>
            `;
            card.title = label;
            card.onmouseenter = () => { if (!card.style.transform.includes('1.08')) card.style.outline = '1px solid rgba(255,255,255,0.4)'; };
            card.onmouseleave = () => { if (!card.style.transform.includes('1.08')) card.style.outline = '1px solid var(--glass-border)'; };
            card.onclick = () => {
                applyColor('text', hex);
                updateTextCards(hex);
            };
            textColorGrid.appendChild(card);
        });
    }

    div.querySelectorAll('.prop-mode-btn').forEach(btn => {
        btn.onclick = () => {
            const newMode = btn.dataset.mode;
            if (newMode !== active.currentMode) {
                const left = active.left;
                const top = active.top;
                const p = active.productData;
                canvas.remove(active);
                canvas.discardActiveObject();
                // A importação de addProductToCanvas é necessária. Podemos usar um import estático do products.js
                import('./products.js').then(module => {
                    module.addProductToCanvas(p, newMode, {left, top});
                });
            }
        };
    });

    const formatCurrencyStr = (num) => "R$ " + num.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const formatFakeCurrencyStr = (num) => "De R$ " + num.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    if (active.productData) {
        if (currentMode === 'card') {
            const origInput = div.querySelector('#prop-card-original');
            const finalInput = div.querySelector('#prop-card-final');
            const discInput = div.querySelector('#prop-card-discount');

            if (origInput && finalInput && discInput) {
                const updateOnCanvas = () => {
                    const origVal = parsePrice(origInput.value);
                    const finalVal = parsePrice(finalInput.value);

                    const origObj = active.getObjects().find(o => o.fakePriceCard === true);
                    const finalObj = active.getObjects().find(o => o.priceCard === true);

                    if (origObj) origObj.set('text', formatFakeCurrencyStr(origVal));
                    if (finalObj) finalObj.set('text', formatCurrencyStr(finalVal));
                    updateGroupDiscountBadge(active, canvas);
                    canvas.renderAll();
                };

                origInput.oninput = () => {
                    const origVal = parsePrice(origInput.value);
                    const finalVal = parsePrice(finalInput.value);
                    if (origVal > 0 && finalVal > 0) {
                        discInput.value = Math.round((1 - finalVal / origVal) * 100);
                    }
                    updateOnCanvas();
                };
                origInput.onchange = () => history.save();

                finalInput.oninput = () => {
                    const origVal = parsePrice(origInput.value);
                    const finalVal = parsePrice(finalInput.value);
                    if (origVal > 0 && finalVal > 0) {
                        discInput.value = Math.round((1 - finalVal / origVal) * 100);
                    }
                    updateOnCanvas();
                };
                finalInput.onchange = () => history.save();

                discInput.oninput = () => {
                    const origVal = parsePrice(origInput.value);
                    const discVal = parseFloat(discInput.value) || 0;
                    if (origVal > 0) {
                        const finalVal = origVal * (1 - discVal / 100);
                        finalInput.value = finalVal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                        updateOnCanvas();
                    }
                };
                discInput.onchange = () => history.save();
            }
        } else if (currentMode === 'table-left' || currentMode === 'table-top') {
            const setupPriceTableEvents = (months) => {
                const origInput = div.querySelector(`#prop-p${months}-original`);
                const finalInput = div.querySelector(`#prop-p${months}-final`);
                const discInput = div.querySelector(`#prop-p${months}-discount`);

                if (!origInput || !finalInput || !discInput) return;

                const updateOnCanvas = () => {
                    const origVal = parsePrice(origInput.value);
                    const finalVal = parsePrice(finalInput.value);

                    const origObj = active.getObjects().find(o => o.fakePriceMonths === months);
                    const finalObj = active.getObjects().find(o => o.priceMonths === months);

                    if (origObj) origObj.set('text', formatFakeCurrencyStr(origVal));
                    if (finalObj) finalObj.set('text', formatCurrencyStr(finalVal));
                    updateGroupDiscountBadge(active, canvas);
                    canvas.renderAll();
                };

                origInput.oninput = () => {
                    const origVal = parsePrice(origInput.value);
                    const finalVal = parsePrice(finalInput.value);
                    if (origVal > 0 && finalVal > 0) {
                        discInput.value = Math.round((1 - finalVal / origVal) * 100);
                    }
                    updateOnCanvas();
                };
                origInput.onchange = () => history.save();

                finalInput.oninput = () => {
                    const origVal = parsePrice(origInput.value);
                    const finalVal = parsePrice(finalInput.value);
                    if (origVal > 0 && finalVal > 0) {
                        discInput.value = Math.round((1 - finalVal / origVal) * 100);
                    }
                    updateOnCanvas();
                };
                finalInput.onchange = () => history.save();

                discInput.oninput = () => {
                    const origVal = parsePrice(origInput.value);
                    const discVal = parseFloat(discInput.value) || 0;
                    if (origVal > 0) {
                        const finalVal = origVal * (1 - discVal / 100);
                        finalInput.value = finalVal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                        updateOnCanvas();
                    }
                };
                discInput.onchange = () => history.save();
            };

            setupPriceTableEvents(12);
            setupPriceTableEvents(24);
            setupPriceTableEvents(36);
        }

        const showBadgeCheckbox = div.querySelector('#prop-product-show-badge');
        if (showBadgeCheckbox) {
            showBadgeCheckbox.onchange = (e) => {
                active.showDiscountBadge = e.target.checked;
                updateGroupDiscountBadge(active, canvas);
                canvas.renderAll();
                history.save();
            };
        }
    }

    // Wiring Text Effects
    if (active.type === 'i-text' || active.type === 'text') {
        const charSpacingInput = div.querySelector('#prop-char-spacing');
        const charSpacingVal = div.querySelector('#prop-char-spacing-val');
        if (charSpacingInput) {
            charSpacingInput.oninput = (e) => {
                const val = parseInt(e.target.value);
                charSpacingVal.innerText = val;
                active.set('charSpacing', val);
                canvas.renderAll();
            };
            charSpacingInput.onchange = () => history.save();
        }

        const lineHeightInput = div.querySelector('#prop-line-height');
        const lineHeightVal = div.querySelector('#prop-line-height-val');
        if (lineHeightInput) {
            lineHeightInput.oninput = (e) => {
                const val = parseFloat(e.target.value);
                lineHeightVal.innerText = val.toFixed(2);
                active.set('lineHeight', val);
                canvas.renderAll();
            };
            lineHeightInput.onchange = () => history.save();
        }

        // Outer Shadow
        const hasShadowCheck = div.querySelector('#prop-has-shadow');
        const shadowDetails = div.querySelector('#shadow-details-container');
        const shadowColorInput = div.querySelector('#prop-shadow-color');
        const shadowBlurInput = div.querySelector('#prop-shadow-blur');
        const shadowBlurVal = div.querySelector('#prop-shadow-blur-val');
        const shadowOffsetXInput = div.querySelector('#prop-shadow-offsetx');
        const shadowOffsetXVal = div.querySelector('#prop-shadow-offsetx-val');
        const shadowOffsetYInput = div.querySelector('#prop-shadow-offsety');
        const shadowOffsetYVal = div.querySelector('#prop-shadow-offsety-val');

        const updateShadow = () => {
            if (hasShadowCheck.checked) {
                shadowDetails.style.display = 'flex';
                active.set('shadow', new fabric.Shadow({
                    color: shadowColorInput.value,
                    blur: parseInt(shadowBlurInput.value),
                    offsetX: parseInt(shadowOffsetXInput.value),
                    offsetY: parseInt(shadowOffsetYInput.value)
                }));
            } else {
                shadowDetails.style.display = 'none';
                active.set('shadow', null);
            }
            canvas.renderAll();
        };

        if (hasShadowCheck) {
            hasShadowCheck.onchange = () => {
                updateShadow();
                history.save();
            };
            shadowColorInput.onchange = () => {
                updateShadow();
                history.save();
            };
            shadowBlurInput.oninput = (e) => {
                shadowBlurVal.innerText = e.target.value + 'px';
                updateShadow();
            };
            shadowBlurInput.onchange = () => history.save();
            shadowOffsetXInput.oninput = (e) => {
                shadowOffsetXVal.innerText = e.target.value + 'px';
                updateShadow();
            };
            shadowOffsetXInput.onchange = () => history.save();
            shadowOffsetYInput.oninput = (e) => {
                shadowOffsetYVal.innerText = e.target.value + 'px';
                updateShadow();
            };
            shadowOffsetYInput.onchange = () => history.save();
        }

        // Inner Shadow
        const hasInnerShadowCheck = div.querySelector('#prop-has-innershadow');
        const innerShadowDetails = div.querySelector('#innershadow-details-container');
        const innerShadowColorInput = div.querySelector('#prop-innershadow-color');
        const innerShadowBlurInput = div.querySelector('#prop-innershadow-blur');
        const innerShadowBlurVal = div.querySelector('#prop-innershadow-blur-val');
        const innerShadowOffsetXInput = div.querySelector('#prop-innershadow-offsetx');
        const innerShadowOffsetXVal = div.querySelector('#prop-innershadow-offsetx-val');
        const innerShadowOffsetYInput = div.querySelector('#prop-innershadow-offsety');
        const innerShadowOffsetYVal = div.querySelector('#prop-innershadow-offsety-val');

        const updateInnerShadow = () => {
            if (hasInnerShadowCheck.checked) {
                innerShadowDetails.style.display = 'flex';
                active.set('innerShadowColor', innerShadowColorInput.value);
                active.set('innerShadowBlur', parseInt(innerShadowBlurInput.value));
                active.set('innerShadowOffsetX', parseInt(innerShadowOffsetXInput.value));
                active.set('innerShadowOffsetY', parseInt(innerShadowOffsetYInput.value));
            } else {
                innerShadowDetails.style.display = 'none';
                active.set('innerShadowColor', null);
                active.set('innerShadowBlur', 0);
                active.set('innerShadowOffsetX', 0);
                active.set('innerShadowOffsetY', 0);
            }
            canvas.renderAll();
        };

        if (hasInnerShadowCheck) {
            hasInnerShadowCheck.onchange = () => {
                updateInnerShadow();
                history.save();
            };
            innerShadowColorInput.onchange = () => {
                updateInnerShadow();
                history.save();
            };
            innerShadowBlurInput.oninput = (e) => {
                innerShadowBlurVal.innerText = e.target.value + 'px';
                updateInnerShadow();
            };
            innerShadowBlurInput.onchange = () => history.save();
            innerShadowOffsetXInput.oninput = (e) => {
                innerShadowOffsetXVal.innerText = e.target.value + 'px';
                updateInnerShadow();
            };
            innerShadowOffsetXInput.onchange = () => history.save();
            innerShadowOffsetYInput.oninput = (e) => {
                innerShadowOffsetYVal.innerText = e.target.value + 'px';
                updateInnerShadow();
            };
            innerShadowOffsetYInput.onchange = () => history.save();
        }
    }

    const sizeInput = div.querySelector('#prop-text-size');
    const sizeVal = div.querySelector('#prop-text-size-val');
    
    const initialFontSizes = new Map();
    if (isGroup) {
        active.getObjects().forEach(o => {
            if (o.type === 'text' || o.type === 'i-text') initialFontSizes.set(o, o.fontSize);
        });
    }

    if(sizeInput) sizeInput.oninput = (e) => {
        const val = parseInt(e.target.value);
        sizeVal.innerText = val + (isGroup ? '%' : 'px');
        
        if (active.type === 'i-text' || active.type === 'text') {
            active.set('fontSize', val);
        } else if (isGroup) {
            const scaleFactor = val / 100;
            active.getObjects().forEach(o => {
                if ((o.type === 'text' || o.type === 'i-text') && initialFontSizes.has(o)) {
                    o.set('fontSize', initialFontSizes.get(o) * scaleFactor);
                }
            });
            active.dirty = true;
        }
        canvas.renderAll();
    };

    const applyColor = (type, hex) => {
        if (active.type === 'i-text' || active.type === 'text') {
            if (type === 'text') active.set('fill', hex === 'transparent' ? '' : hex);
            if (type === 'bg') active.set('backgroundColor', hex === 'transparent' ? '' : hex);
            if (type === 'border') {
                active.set('stroke', hex === 'transparent' ? '' : hex);
                active.set('strokeWidth', hex === 'transparent' ? 0 : 2);
            }
        } else if (isGroup) {
            if (type === 'text') {
                active.getObjects().forEach(o => {
                    if (o.type === 'text' || o.type === 'i-text') o.set('fill', hex === 'transparent' ? '' : hex);
                });
            }
            if (type === 'bg' || type === 'border') {
                const bgRect = active.getObjects().find(o => o.type === 'rect');
                if (bgRect) {
                    if (type === 'bg') bgRect.set('fill', hex === 'transparent' ? '' : hex);
                    if (type === 'border') {
                        bgRect.set('stroke', hex === 'transparent' ? '' : hex);
                        bgRect.set('strokeWidth', hex === 'transparent' ? 0 : 3);
                    }
                }
            }
            active.dirty = true;
        } else {
            if (type === 'bg') active.set('fill', hex === 'transparent' ? '' : hex);
            if (type === 'border') {
                active.set('stroke', hex === 'transparent' ? '' : hex);
                active.set('strokeWidth', hex === 'transparent' ? 0 : 2);
            }
        }
        canvas.renderAll();
        history.save();
    };

    const setupSwatches = (id, type) => {
        div.querySelectorAll(`.prop-swatch-${id}`).forEach(swatch => {
            swatch.onclick = () => {
                div.querySelectorAll(`.prop-swatch-${id}`).forEach(s => s.style.border = '1px solid rgba(255,255,255,0.1)');
                swatch.style.border = '2px solid white';
                applyColor(type, swatch.dataset.color);
            };
        });
    };
    
    setupSwatches('text', 'text');
    setupSwatches('bg', 'bg');
    setupSwatches('border', 'border');

    const btnUp = div.querySelector('#prop-layer-up');
    const btnFront = div.querySelector('#prop-layer-front');
    const btnDown = div.querySelector('#prop-layer-down');
    const btnBack = div.querySelector('#prop-layer-back');

    if(btnUp) btnUp.onclick = () => { canvas.bringForward(active); canvas.renderAll(); history.save(); };
    if(btnFront) btnFront.onclick = () => { canvas.bringToFront(active); canvas.renderAll(); history.save(); };
    if(btnDown) btnDown.onclick = () => { canvas.sendBackwards(active); canvas.renderAll(); history.save(); };
    if(btnBack) btnBack.onclick = () => { canvas.sendToBack(active); canvas.renderAll(); history.save(); };
    
    const btnCropStart = div.querySelector('#btn-crop-start');
    if (btnCropStart) {
        btnCropStart.onclick = () => startCropping(active, canvas, sidebarContent);
    }

    sidebarContent.appendChild(div);
}

export function startCropping(target, canvas, sidebarContent) {
    if (!target || target.type !== 'image') return;
    
    canvas.discardActiveObject();
    target.set({ selectable: false, evented: false });
    
    const cropRect = new fabric.Rect({
        left: target.left,
        top: target.top,
        width: target.getScaledWidth(),
        height: target.getScaledHeight(),
        fill: 'rgba(0,0,0,0.3)',
        stroke: 'var(--accent)',
        strokeWidth: 2,
        cornerColor: 'var(--accent)',
        cornerStyle: 'circle',
        transparentCorners: false,
        id: 'crop-rect'
    });
    
    canvas.add(cropRect);
    canvas.setActiveObject(cropRect);
    
    const sidebarTitle = document.getElementById('sidebar-title');
    const originalTitle = sidebarTitle.innerText;
    
    sidebarTitle.innerText = 'Recortar Imagem';
    sidebarContent.innerHTML = `
        <div class="animate-fade" style="padding:20px; background:rgba(39, 174, 96, 0.1); border-radius:12px; border:1px solid var(--accent); margin-top:20px;">
            <p class="subtitle" style="color:var(--accent); font-weight:700;">Modo de Recorte Ativo</p>
            <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:20px; line-height:1.4;">Ajuste o retângulo sobre a área que deseja manter e clique em confirmar.</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
                <button id="btn-crop-confirm" class="btn-primary" style="width:100%; background:var(--accent); color:white; padding:14px; border-radius:8px; border:none; cursor:pointer; font-weight:800; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <i class="fa-solid fa-check"></i> Confirmar Recorte
                </button>
                <button id="btn-crop-cancel" class="btn-primary" style="width:100%; background:rgba(255,255,255,0.05); color:white; padding:12px; border-radius:8px; border:1px solid var(--glass-border); cursor:pointer;">Cancelar</button>
            </div>
        </div>
    `;
    
    document.getElementById('btn-crop-confirm').onclick = () => {
        const rectLeft = cropRect.left;
        const rectTop = cropRect.top;
        const rectW = cropRect.getScaledWidth();
        const rectH = cropRect.getScaledHeight();
        
        const relLeft = (rectLeft - target.left) / target.scaleX;
        const relTop = (rectTop - target.top) / target.scaleY;
        const relW = rectW / target.scaleX;
        const relH = rectH / target.scaleY;
        
        const clipPath = new fabric.Rect({
            left: relLeft - target.width / 2,
            top: relTop - target.height / 2,
            width: relW,
            height: relH,
            originX: 'left',
            originY: 'top'
        });
        
        target.set('clipPath', clipPath);
        finishCrop();
    };
    
    document.getElementById('btn-crop-cancel').onclick = () => {
        finishCrop();
    };
    
    function finishCrop() {
        canvas.remove(cropRect);
        target.set({ selectable: true, evented: true });
        canvas.setActiveObject(target);
        canvas.renderAll();
        sidebarTitle.innerText = originalTitle;
        updateSidebar('properties'); 
        history.save();
    }
}
