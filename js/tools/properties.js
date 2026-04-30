// js/tools/properties.js
import { state } from '../state.js';
import { colors } from '../config.js';
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
            <div style="display:flex; flex-direction:column; gap:20px; background:rgba(255,255,255,0.02); padding:20px; border-radius:12px; border:1px solid var(--glass-border);">
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <label style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Cor de Fundo</label>
                    ${generateColorSwatches('doc-bg', docBgHex)}
                </div>

                <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
                    <label style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Imagem de Fundo</label>
                    <input type="file" id="prop-doc-bg-upload" accept="image/*" style="display:none">
                    <button class="btn-primary" onclick="document.getElementById('prop-doc-bg-upload').click()" style="width:100%; padding:12px; border-radius:8px; background:rgba(255,255,255,0.05); color:white; border:1px solid var(--glass-border); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        <i class="fa-solid fa-upload"></i> Fazer Upload
                    </button>
                </div>
            </div>
        `;
        
        sidebarContent.appendChild(div);

        div.querySelectorAll('.prop-swatch-doc-bg').forEach(swatch => {
            swatch.onclick = () => {
                div.querySelectorAll('.prop-swatch-doc-bg').forEach(s => s.style.border = '1px solid rgba(255,255,255,0.1)');
                swatch.style.border = '2px solid white';
                const c = swatch.dataset.color;
                canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
                canvas.setBackgroundColor(c === 'transparent' ? '#ffffff' : c, canvas.renderAll.bind(canvas));
                history.save();
            };
        });

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

    let propertiesHTML = '';

    if (active.productData) {
        const p = active.productData;
        const currentMode = active.currentMode;
        propertiesHTML += `
            <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:16px; margin-bottom:24px; border:1px solid var(--glass-border); display:flex; flex-direction:column; align-items:center; gap:12px;">
                <img src="${p.local_img}" style="height:80px; object-fit:contain;">
                <span style="font-size:0.85rem; font-weight:700; text-align:center;">${p.name}</span>
            </div>
            
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
                ${generateColorSwatches('text', currentColor)}
            </div>

            <div style="display:flex; flex-direction:column; gap:8px;">
                <label style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Cor do Fundo</label>
                ${generateColorSwatches('bg', currentBg)}
            </div>

            <div style="display:flex; flex-direction:column; gap:8px;">
                <label style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Cor da Borda</label>
                ${generateColorSwatches('border', currentBorder)}
            </div>

        </div>

        <p class="subtitle" style="margin-top:24px; margin-bottom:12px;">Camadas (Layers)</p>
        <div style="display:flex; justify-content:space-between; gap:8px; margin-bottom:24px;">
            <button id="prop-layer-up" class="btn-tool" style="flex:1; border:1px solid var(--glass-border); border-radius:8px; padding:10px; background:rgba(255,255,255,0.02); color:white; cursor:pointer;" title="Trazer para Frente (1 nível)"><i class="fa-solid fa-angle-up"></i></button>
            <button id="prop-layer-front" class="btn-tool" style="flex:1; border:1px solid var(--glass-border); border-radius:8px; padding:10px; background:rgba(255,255,255,0.02); color:white; cursor:pointer;" title="Trazer para o Topo"><i class="fa-solid fa-angles-up"></i></button>
            <button id="prop-layer-down" class="btn-tool" style="flex:1; border:1px solid var(--glass-border); border-radius:8px; padding:10px; background:rgba(255,255,255,0.02); color:white; cursor:pointer;" title="Enviar para Trás (1 nível)"><i class="fa-solid fa-angle-down"></i></button>
            <button id="prop-layer-back" class="btn-tool" style="flex:1; border:1px solid var(--glass-border); border-radius:8px; padding:10px; background:rgba(255,255,255,0.02); color:white; cursor:pointer;" title="Enviar para o Fundo"><i class="fa-solid fa-angles-down"></i></button>
        </div>
    `;
    
    div.innerHTML = propertiesHTML;

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

function startCropping(target, canvas, sidebarContent) {
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
