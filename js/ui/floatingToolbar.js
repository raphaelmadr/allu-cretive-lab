// js/ui/floatingToolbar.js
import { state } from '../state.js';
import { history } from '../history.js';
import { colors, textColors } from '../config.js';
import { notifications } from './notifications.js';
import { buildIconObject } from '../tools/icons.js';

let toolbarElement = null;
let currentActiveObject = null;

export function initFloatingToolbar(canvas) {
    if (!toolbarElement) {
        toolbarElement = document.createElement('div');
        toolbarElement.id = 'floating-toolbar';
        toolbarElement.className = 'floating-toolbar';
        document.body.appendChild(toolbarElement);

        // Event listener para fechar submenus ao clicar fora
        document.addEventListener('mousedown', (e) => {
            if (!e.target.closest('#floating-toolbar')) {
                closeAllPopups();
            }
        });
    }

    // Registrar ouvintes de evento do canvas
    canvas.on('selection:created', (e) => onSelectionChange(canvas, e));
    canvas.on('selection:updated', (e) => onSelectionChange(canvas, e));
    canvas.on('selection:cleared', () => hideToolbar());
    canvas.on('object:moving', () => updateToolbarPosition(canvas));
    canvas.on('object:scaling', () => updateToolbarPosition(canvas));
    canvas.on('object:rotating', () => updateToolbarPosition(canvas));
    canvas.on('after:render', () => updateToolbarPosition(canvas));

    // Ouvintes globais
    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper) {
        wrapper.addEventListener('scroll', () => updateToolbarPosition(canvas));
    }
    window.addEventListener('resize', () => updateToolbarPosition(canvas));
}

function closeAllPopups() {
    if (toolbarElement) {
        toolbarElement.querySelectorAll('.toolbar-popup').forEach(p => p.classList.remove('active'));
        toolbarElement.querySelectorAll('.toolbar-btn').forEach(b => b.classList.remove('active'));
    }
}

function onSelectionChange(canvas, e) {
    const active = canvas.getActiveObject();
    // O retângulo de recorte é um objeto interno/transitório do modo de
    // recorte (js/tools/properties.js) — nunca deve ganhar a barra flutuante,
    // já que suas ações (excluir, duplicar, mudar cor) corromperiam o modo.
    if (active && active.id === 'crop-rect') {
        hideToolbar();
        return;
    }
    if (active) {
        currentActiveObject = active;
        renderToolbar(canvas, active);
        updateToolbarPosition(canvas);
    } else {
        hideToolbar();
    }
}

function hideToolbar() {
    currentActiveObject = null;
    if (toolbarElement) {
        toolbarElement.classList.remove('active');
        closeAllPopups();
    }
}

function updateToolbarPosition(canvas) {
    if (!currentActiveObject || !toolbarElement) return;

    // Obtém o retângulo delimitador do objeto no espaço do viewport do canvas
    const rect = currentActiveObject.getBoundingRect();

    // Obtém o elemento de tela do canvas
    const upperCanvas = canvas.upperCanvasEl;
    if (!upperCanvas) return;

    const canvasRect = upperCanvas.getBoundingClientRect();

    // Calcula a posição do centro horizontal e o topo
    const centerX = canvasRect.left + rect.left + rect.width / 2;
    let posY = canvasRect.top + rect.top - 12; // 12px de folga acima do objeto

    // Se bater no topo (abaixo do header de 60px), inverte e mostra abaixo do objeto
    if (posY < 80) {
        posY = canvasRect.top + rect.top + rect.height + 12;
        toolbarElement.style.top = `${posY}px`;
        toolbarElement.style.left = `${centerX}px`;
        toolbarElement.style.transform = 'translate(-50%, 0)';
        toolbarElement.dataset.position = 'below';
    } else {
        toolbarElement.style.top = `${posY}px`;
        toolbarElement.style.left = `${centerX}px`;
        toolbarElement.style.transform = 'translate(-50%, -100%)';
        toolbarElement.dataset.position = 'above';
    }

    toolbarElement.classList.add('active');

    // Ajustar a posição de qualquer popup ativo se a barra de ferramentas se moveu
    const activePopup = toolbarElement.querySelector('.toolbar-popup.active');
    if (activePopup) {
        adjustPopupPosition(activePopup);
    }
}

function renderToolbar(canvas, active) {
    if (!toolbarElement) return;

    toolbarElement.innerHTML = '';
    closeAllPopups();

    const isText = active.type === 'i-text' || active.type === 'text';
    const isImage = active.type === 'image';
    const isProduct = !!active.productData;
    const isGroup = active.type === 'group' && !active.isIcon && !(active.get && active.get('isIcon'));
    const isIcon = active.isIcon || (active.get && active.get('isIcon'));
    const isShape = active.type === 'rect' || active.type === 'circle' || active.type === 'triangle' || active.type === 'polygon';

    // ── 1. OPÇÕES ESPECÍFICAS DE TEXTO ──────────────────────────────────────────
    if (isText) {
        // Dropdown de Fontes
        const fontBtn = createButton('font-family', '<i class="fa-solid fa-font"></i>', 'Fonte');
        const fontPopup = createPopup('popup-fonts');
        const fonts = ['Plus Jakarta Sans', 'Inter', 'Arial', 'Georgia', 'Courier New'];
        fonts.forEach(f => {
            const fontItem = document.createElement('div');
            fontItem.className = `font-item ${active.fontFamily === f ? 'active' : ''}`;
            fontItem.style.fontFamily = f;
            fontItem.innerText = f;
            fontItem.onclick = () => {
                active.set('fontFamily', f);
                canvas.renderAll();
                history.save();
                renderToolbar(canvas, active);
            };
            fontPopup.appendChild(fontItem);
        });
        fontBtn.appendChild(fontPopup);
        toolbarElement.appendChild(fontBtn);

        // Tamanho do Texto
        const sizeGroup = document.createElement('div');
        sizeGroup.style.display = 'flex';
        sizeGroup.style.alignItems = 'center';
        sizeGroup.style.gap = '2px';
        sizeGroup.style.background = 'rgba(255,255,255,0.05)';
        sizeGroup.style.borderRadius = '8px';
        sizeGroup.style.padding = '0 4px';

        const btnDec = document.createElement('button');
        btnDec.className = 'toolbar-btn';
        btnDec.innerHTML = '<i class="fa-solid fa-minus"></i>';
        btnDec.onclick = () => {
            const currentSize = active.fontSize || 16;
            if (currentSize > 6) {
                active.set('fontSize', currentSize - 2);
                canvas.renderAll();
                history.save();
                sizeInput.value = currentSize - 2;
            }
        };

        const sizeInput = document.createElement('input');
        sizeInput.type = 'number';
        sizeInput.value = active.fontSize || 16;
        sizeInput.style.cssText = 'width:38px; height:28px; background:transparent; border:none; color:white; text-align:center; font-size:0.75rem; font-weight:700; outline:none; -moz-appearance: textfield;';
        sizeInput.onchange = () => {
            const val = Math.max(6, parseInt(sizeInput.value) || 16);
            active.set('fontSize', val);
            canvas.renderAll();
            history.save();
            sizeInput.value = val;
        };

        const btnInc = document.createElement('button');
        btnInc.className = 'toolbar-btn';
        btnInc.innerHTML = '<i class="fa-solid fa-plus"></i>';
        btnInc.onclick = () => {
            const currentSize = active.fontSize || 16;
            active.set('fontSize', currentSize + 2);
            canvas.renderAll();
            history.save();
            sizeInput.value = currentSize + 2;
        };

        sizeGroup.appendChild(btnDec);
        sizeGroup.appendChild(sizeInput);
        sizeGroup.appendChild(btnInc);
        toolbarElement.appendChild(sizeGroup);

        // Cor do Texto
        const colorBtn = createButton('text-color', '', 'Cor do Texto');
        // Adiciona cor no icone
        colorBtn.innerHTML = `<i class="fa-solid fa-droplet" style="color:${active.fill || '#ffffff'};"></i>`;
        const colorPopup = createPopup('popup-color');
        
        let colorSwatches = `<div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:6px; width:170px;">`;
        colors.forEach(c => {
            const isActive = (active.fill || '#ffffff').toLowerCase() === c.toLowerCase();
            colorSwatches += `<div class="toolbar-color-swatch" data-color="${c}" style="width:24px; height:24px; border-radius:4px; cursor:pointer; background-color:${c}; border:${isActive ? '2px solid white' : '1px solid rgba(255,255,255,0.1)'};"></div>`;
        });
        colorSwatches += `</div>`;
        colorPopup.innerHTML = colorSwatches;
        
        colorPopup.querySelectorAll('.toolbar-color-swatch').forEach(swatch => {
            swatch.onclick = () => {
                active.set('fill', swatch.dataset.color);
                canvas.renderAll();
                history.save();
                renderToolbar(canvas, active);
            };
        });
        colorBtn.appendChild(colorPopup);
        toolbarElement.appendChild(colorBtn);

        // Divisória
        toolbarElement.appendChild(createDivider());

        // Estilos: Bold, Italic, Underline, Strike
        const btnBold = createButton('bold', '<i class="fa-solid fa-bold"></i>', 'Negrito');
        if (active.fontWeight === 'bold') btnBold.classList.add('active');
        btnBold.onclick = (e) => {
            if (e.target.closest('.toolbar-popup')) return;
            active.set('fontWeight', active.fontWeight === 'bold' ? 'normal' : 'bold');
            canvas.renderAll();
            history.save();
            btnBold.classList.toggle('active');
        };
        toolbarElement.appendChild(btnBold);

        const btnItalic = createButton('italic', '<i class="fa-solid fa-italic"></i>', 'Itálico');
        if (active.fontStyle === 'italic') btnItalic.classList.add('active');
        btnItalic.onclick = (e) => {
            if (e.target.closest('.toolbar-popup')) return;
            active.set('fontStyle', active.fontStyle === 'italic' ? 'normal' : 'italic');
            canvas.renderAll();
            history.save();
            btnItalic.classList.toggle('active');
        };
        toolbarElement.appendChild(btnItalic);

        const btnUnderline = createButton('underline', '<i class="fa-solid fa-underline"></i>', 'Sublinhado');
        if (active.underline) btnUnderline.classList.add('active');
        btnUnderline.onclick = (e) => {
            if (e.target.closest('.toolbar-popup')) return;
            active.set('underline', !active.underline);
            canvas.renderAll();
            history.save();
            btnUnderline.classList.toggle('active');
        };
        toolbarElement.appendChild(btnUnderline);

        const btnStrike = createButton('strikethrough', '<i class="fa-solid fa-strikethrough"></i>', 'Riscado');
        if (active.linethrough) btnStrike.classList.add('active');
        btnStrike.onclick = (e) => {
            if (e.target.closest('.toolbar-popup')) return;
            active.set('linethrough', !active.linethrough);
            canvas.renderAll();
            history.save();
            btnStrike.classList.toggle('active');
        };
        toolbarElement.appendChild(btnStrike);

        // Alinhamento
        const alignIcons = {
            left: '<i class="fa-solid fa-align-left"></i>',
            center: '<i class="fa-solid fa-align-center"></i>',
            right: '<i class="fa-solid fa-align-right"></i>',
            justify: '<i class="fa-solid fa-align-justify"></i>'
        };
        const currentAlign = active.textAlign || 'left';
        const btnAlign = createButton('align', alignIcons[currentAlign] || alignIcons.left, 'Alinhamento');
        btnAlign.onclick = (e) => {
            if (e.target.closest('.toolbar-popup')) return;
            const aligns = ['left', 'center', 'right', 'justify'];
            const nextIdx = (aligns.indexOf(currentAlign) + 1) % aligns.length;
            active.set('textAlign', aligns[nextIdx]);
            canvas.renderAll();
            history.save();
            renderToolbar(canvas, active);
        };
        toolbarElement.appendChild(btnAlign);

        // Espaçamento de Texto
        const spacingBtn = createButton('spacing', '<i class="fa-solid fa-arrows-left-right-to-line"></i>', 'Espaçamento');
        const spacingPopup = createPopup('popup-spacing');
        spacingPopup.style.width = '180px';
        spacingPopup.innerHTML = `
            <div class="toolbar-popup-column">
                <div class="toolbar-popup-row" style="justify-content:space-between;">
                    <label>Entre letras</label>
                    <span id="popup-char-spacing-val" style="font-size:0.7rem; color:var(--text-secondary);">${active.charSpacing || 0}</span>
                </div>
                <input type="range" id="popup-char-spacing" min="-100" max="800" value="${active.charSpacing || 0}" style="width:100%;">
            </div>
            <div class="toolbar-popup-column" style="margin-top:8px;">
                <div class="toolbar-popup-row" style="justify-content:space-between;">
                    <label>Altura da linha</label>
                    <span id="popup-line-height-val" style="font-size:0.7rem; color:var(--text-secondary);">${(active.lineHeight || 1.16).toFixed(2)}</span>
                </div>
                <input type="range" id="popup-line-height" min="0.5" max="3" step="0.05" value="${active.lineHeight || 1.16}" style="width:100%;">
            </div>
        `;
        const charSpacingInput = spacingPopup.querySelector('#popup-char-spacing');
        const charSpacingVal = spacingPopup.querySelector('#popup-char-spacing-val');
        charSpacingInput.oninput = (e) => {
            const val = parseInt(e.target.value);
            charSpacingVal.innerText = val;
            active.set('charSpacing', val);
            canvas.renderAll();
        };
        charSpacingInput.onchange = () => history.save();

        const lineHeightInput = spacingPopup.querySelector('#popup-line-height');
        const lineHeightVal = spacingPopup.querySelector('#popup-line-height-val');
        lineHeightInput.oninput = (e) => {
            const val = parseFloat(e.target.value);
            lineHeightVal.innerText = val.toFixed(2);
            active.set('lineHeight', val);
            canvas.renderAll();
        };
        lineHeightInput.onchange = () => history.save();

        spacingBtn.appendChild(spacingPopup);
        toolbarElement.appendChild(spacingBtn);
    }

    // ── 2. OPÇÕES ESPECÍFICAS DE IMAGEM ─────────────────────────────────────────
    if (isImage) {
        // 1. Recortar
        const cropBtn = createButton('crop', '<i class="fa-solid fa-crop"></i> Recortar', 'Recortar Imagem');
        cropBtn.onclick = () => {
            import('../tools/properties.js').then(module => {
                const sidebarContent = document.getElementById('sidebar-content');
                module.startCropping(active, canvas, sidebarContent);
            });
            hideToolbar();
        };
        toolbarElement.appendChild(cropBtn);

        // 2. Arredondar Cantos (Bordas arredondadas)
        const radiusBtn = createButton('img-radius', '<i class="fa-regular fa-square-minus"></i> Cantos', 'Arredondar Cantos');
        const radiusPopup = createPopup('popup-img-radius');
        radiusPopup.style.width = '180px';
        
        let currentRadius = 0;
        if (active.clipPath && active.clipPath.rx !== undefined) {
            currentRadius = active.clipPath.rx;
        }

        radiusPopup.innerHTML = `
            <div class="toolbar-popup-column">
                <div class="toolbar-popup-row" style="justify-content:space-between;">
                    <label>Arredondamento</label>
                    <span id="popup-img-radius-val" style="font-size:0.7rem; color:var(--text-secondary);">${currentRadius}px</span>
                </div>
                <input type="range" id="popup-img-radius-range" min="0" max="150" value="${currentRadius}" style="width:100%;">
            </div>
        `;

        const radiusInput = radiusPopup.querySelector('#popup-img-radius-range');
        const radiusVal = radiusPopup.querySelector('#popup-img-radius-val');
        
        radiusInput.oninput = (e) => {
            const val = parseInt(e.target.value);
            radiusVal.innerText = val + 'px';
            
            let clipPath = active.clipPath;
            if (val > 0) {
                if (!clipPath || clipPath.type !== 'rect') {
                    clipPath = new fabric.Rect({
                        left: -active.width / 2,
                        top: -active.height / 2,
                        width: active.width,
                        height: active.height,
                        originX: 'left',
                        originY: 'top'
                    });
                    active.set('clipPath', clipPath);
                }
                clipPath.set({
                    rx: val,
                    ry: val
                });
            } else {
                if (clipPath) {
                    const isCropped = Math.round(clipPath.width) < Math.round(active.width) || Math.round(clipPath.height) < Math.round(active.height);
                    if (!isCropped) {
                        active.set('clipPath', null);
                    } else {
                        clipPath.set({
                            rx: 0,
                            ry: 0
                        });
                    }
                }
            }
            active.dirty = true;
            canvas.renderAll();
        };
        radiusInput.onchange = () => history.save();
        radiusBtn.appendChild(radiusPopup);
        toolbarElement.appendChild(radiusBtn);

        // 3. Sombras (Ativar/Desativar Sombras)
        const shadowBtn = createButton('img-shadow', '<i class="fa-solid fa-circle-half-stroke"></i> Sombra', 'Sombra Projetada');
        const shadowPopup = createPopup('popup-img-shadow');
        shadowPopup.style.width = '200px';

        const hasShadow = !!active.shadow;
        const shadowBlur = active.shadow ? active.shadow.blur : 10;
        const shadowOffsetX = active.shadow ? active.shadow.offsetX : 5;
        const shadowOffsetY = active.shadow ? active.shadow.offsetY : 5;
        const shadowColor = active.shadow ? (typeof active.shadow.color === 'string' ? active.shadow.color : '#000000') : '#000000';

        shadowPopup.innerHTML = `
            <div class="toolbar-popup-column" style="gap: 10px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" id="popup-has-shadow" ${hasShadow ? 'checked' : ''} style="width:14px; height:14px; accent-color:var(--accent); cursor:pointer;">
                    <label for="popup-has-shadow" style="font-size:0.75rem; font-weight:600; color:white; cursor:pointer;">Habilitar Sombra</label>
                </div>
                
                <div id="popup-shadow-details" style="display:${hasShadow ? 'flex' : 'none'}; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <label style="font-size:0.7rem; color:var(--text-secondary);">Cor</label>
                        <input type="color" id="popup-shadow-color" value="${shadowColor.startsWith('#') ? shadowColor : '#000000'}" style="border:none; background:transparent; width:26px; height:20px; cursor:pointer;">
                    </div>
                    <div class="toolbar-popup-column">
                        <div style="display:flex; justify-content:space-between;">
                            <label style="font-size:0.7rem;">Desfoque</label>
                            <span id="popup-shadow-blur-val" style="font-size:0.65rem; color:var(--text-secondary);">${shadowBlur}px</span>
                        </div>
                        <input type="range" id="popup-shadow-blur" min="0" max="50" value="${shadowBlur}" style="width:100%;">
                    </div>
                    <div class="toolbar-popup-column">
                        <div style="display:flex; justify-content:space-between;">
                            <label style="font-size:0.7rem;">Deslocamento X</label>
                            <span id="popup-shadow-offsetx-val" style="font-size:0.65rem; color:var(--text-secondary);">${shadowOffsetX}px</span>
                        </div>
                        <input type="range" id="popup-shadow-offsetx" min="-30" max="30" value="${shadowOffsetX}" style="width:100%;">
                    </div>
                    <div class="toolbar-popup-column">
                        <div style="display:flex; justify-content:space-between;">
                            <label style="font-size:0.7rem;">Deslocamento Y</label>
                            <span id="popup-shadow-offsety-val" style="font-size:0.65rem; color:var(--text-secondary);">${shadowOffsetY}px</span>
                        </div>
                        <input type="range" id="popup-shadow-offsety" min="-30" max="30" value="${shadowOffsetY}" style="width:100%;">
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const hasShadowCheck = shadowPopup.querySelector('#popup-has-shadow');
            const shadowDetails = shadowPopup.querySelector('#popup-shadow-details');
            const shadowColorInput = shadowPopup.querySelector('#popup-shadow-color');
            const shadowBlurInput = shadowPopup.querySelector('#popup-shadow-blur');
            const shadowBlurVal = shadowPopup.querySelector('#popup-shadow-blur-val');
            const shadowOffsetXInput = shadowPopup.querySelector('#popup-shadow-offsetx');
            const shadowOffsetXVal = shadowPopup.querySelector('#popup-shadow-offsetx-val');
            const shadowOffsetYInput = shadowPopup.querySelector('#popup-shadow-offsety');
            const shadowOffsetYVal = shadowPopup.querySelector('#popup-shadow-offsety-val');

            const applyShadow = () => {
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
                active.dirty = true;
                canvas.renderAll();
            };

            hasShadowCheck.onchange = () => {
                applyShadow();
                history.save();
                adjustPopupPosition(shadowPopup);
            };
            shadowColorInput.oninput = applyShadow;
            shadowColorInput.onchange = () => history.save();

            shadowBlurInput.oninput = (e) => {
                shadowBlurVal.innerText = e.target.value + 'px';
                applyShadow();
            };
            shadowBlurInput.onchange = () => history.save();

            shadowOffsetXInput.oninput = (e) => {
                shadowOffsetXVal.innerText = e.target.value + 'px';
                applyShadow();
            };
            shadowOffsetXInput.onchange = () => history.save();

            shadowOffsetYInput.oninput = (e) => {
                shadowOffsetYVal.innerText = e.target.value + 'px';
                applyShadow();
            };
            shadowOffsetYInput.onchange = () => history.save();
        }, 50);

        shadowBtn.appendChild(shadowPopup);
        toolbarElement.appendChild(shadowBtn);
    }

    // ── 2.5. OPÇÕES ESPECÍFICAS DE ÍCONE ────────────────────────────────────────
    if (isIcon) {
        // 1. Cor do Ícone
        const iconColorBtn = createButton('icon-color', `<i class="fa-solid fa-palette" style="color:${active.iconData?.iconColor || '#ffffff'};"></i> Ícone`, 'Cor do Ícone');
        const iconColorPopup = createPopup('popup-icon-color');
        
        let iconColorSwatches = `<div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:6px; width:170px;">`;
        colors.forEach(c => {
            const isActive = (active.iconData?.iconColor || '#ffffff').toLowerCase() === c.toLowerCase();
            iconColorSwatches += `<div class="toolbar-icon-color-swatch" data-color="${c}" style="width:24px; height:24px; border-radius:4px; cursor:pointer; background-color:${c}; border:${isActive ? '2px solid white' : '1px solid rgba(255,255,255,0.1)'};"></div>`;
        });
        iconColorSwatches += `</div>`;
        iconColorPopup.innerHTML = iconColorSwatches;
        
        iconColorPopup.querySelectorAll('.toolbar-icon-color-swatch').forEach(swatch => {
            swatch.onclick = () => {
                const color = swatch.dataset.color;
                const iconObj = (active.type === 'group' && active.getObjects().length > 1) ? active.getObjects()[1] : active;
                iconObj.getObjects().forEach(obj => {
                    if (obj.stroke) obj.set('stroke', color);
                    if (obj.fill && obj.fill !== 'none') obj.set('fill', color);
                });
                if (active.iconData) active.iconData.iconColor = color;
                active.dirty = true;
                canvas.renderAll();
                history.save();
                renderToolbar(canvas, active);
            };
        });
        iconColorBtn.appendChild(iconColorPopup);
        toolbarElement.appendChild(iconColorBtn);

        // 2. Cor do Fundo (se houver forma)
        if (active.iconData && active.iconData.shape !== 'none') {
            const bgColorBtn = createButton('icon-bg', `<i class="fa-solid fa-square" style="color:${active.iconData.bgColor || '#27AE60'};"></i> Fundo`, 'Cor do Fundo');
            const bgColorPopup = createPopup('popup-icon-bg');
            
            let bgColorSwatches = `<div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:6px; width:170px;">`;
            colors.forEach(c => {
                const isActive = (active.iconData.bgColor || '#27AE60').toLowerCase() === c.toLowerCase();
                bgColorSwatches += `<div class="toolbar-icon-bg-swatch" data-color="${c}" style="width:24px; height:24px; border-radius:4px; cursor:pointer; background-color:${c}; border:${isActive ? '2px solid white' : '1px solid rgba(255,255,255,0.1)'};"></div>`;
            });
            bgColorSwatches += `</div>`;
            bgColorPopup.innerHTML = bgColorSwatches;
            
            bgColorPopup.querySelectorAll('.toolbar-icon-bg-swatch').forEach(swatch => {
                swatch.onclick = () => {
                    const color = swatch.dataset.color;
                    const bgObj = active.getObjects()[0];
                    if (bgObj) bgObj.set('fill', color);
                    if (active.iconData) active.iconData.bgColor = color;
                    active.dirty = true;
                    canvas.renderAll();
                    history.save();
                    renderToolbar(canvas, active);
                };
            });
            bgColorBtn.appendChild(bgColorPopup);
            toolbarElement.appendChild(bgColorBtn);
        }

        // 3. Forma de Fundo
        const shapeBtn = createButton('icon-shape', '<i class="fa-solid fa-icons"></i> Forma', 'Forma de Fundo');
        const shapePopup = createPopup('popup-icon-shape');
        const iconShapes = [
            { id: 'none', label: 'Nenhum', icon: 'fa-ban' },
            { id: 'circle', label: 'Círculo', icon: 'fa-circle' },
            { id: 'square', label: 'Quadrado', icon: 'fa-square' },
            { id: 'rounded', label: 'Arredondado', icon: 'fa-square-check' }
        ];
        iconShapes.forEach(s => {
            const item = document.createElement('div');
            item.className = `font-item ${active.iconData?.shape === s.id ? 'active' : ''}`;
            item.innerHTML = `<i class="fa-solid ${s.icon}" style="margin-right:8px;"></i> ${s.label}`;
            item.onclick = async () => {
                if (active.iconData) {
                    active.iconData.shape = s.id;
                    const newIcon = await buildIconObject(active.iconData);
                    const { left, top, scaleX, scaleY, angle } = active;
                    newIcon.set({ left, top, scaleX, scaleY, angle });
                    canvas.remove(active);
                    canvas.add(newIcon);
                    canvas.setActiveObject(newIcon);
                    canvas.renderAll();
                    history.save();
                }
            };
            shapePopup.appendChild(item);
        });
        shapeBtn.appendChild(shapePopup);
        toolbarElement.appendChild(shapeBtn);

        // 4. Ajustes do Ícone (Tamanho, Traço, Padding)
        const settingsBtn = createButton('icon-settings', '<i class="fa-solid fa-sliders"></i> Ajustes', 'Ajustes do Ícone');
        const settingsPopup = createPopup('popup-icon-settings');
        settingsPopup.style.width = '200px';
        
        const sizeVal = active.iconData?.iconSize || 40;
        const strokeVal = active.iconData?.strokeWidth || 2;
        const padVal = active.iconData?.padding || 15;
        
        settingsPopup.innerHTML = `
            <div class="toolbar-popup-column">
                <div style="display:flex; justify-content:space-between;">
                    <label>Tamanho</label>
                    <span id="pop-icon-size-val" style="font-size:0.65rem;">${sizeVal}px</span>
                </div>
                <input type="range" id="pop-icon-size" min="12" max="120" value="${sizeVal}" style="width:100%;">
            </div>
            <div class="toolbar-popup-column" style="margin-top:8px;">
                <div style="display:flex; justify-content:space-between;">
                    <label>Traço</label>
                    <span id="pop-icon-stroke-val" style="font-size:0.65rem;">${strokeVal}</span>
                </div>
                <input type="range" id="pop-icon-stroke" min="0.5" max="5" step="0.5" value="${strokeVal}" style="width:100%;">
            </div>
            ${active.iconData?.shape !== 'none' ? `
            <div class="toolbar-popup-column" style="margin-top:8px;">
                <div style="display:flex; justify-content:space-between;">
                    <label>Padding</label>
                    <span id="pop-icon-pad-val" style="font-size:0.65rem;">${padVal}px</span>
                </div>
                <input type="range" id="pop-icon-pad" min="0" max="60" value="${padVal}" style="width:100%;">
            </div>
            ` : ''}
        `;

        setTimeout(() => {
            const sizeInput = settingsPopup.querySelector('#pop-icon-size');
            const strokeInput = settingsPopup.querySelector('#pop-icon-stroke');
            const padInput = settingsPopup.querySelector('#pop-icon-pad');
            
            const sizeValSpan = settingsPopup.querySelector('#pop-icon-size-val');
            const strokeValSpan = settingsPopup.querySelector('#pop-icon-stroke-val');
            const padValSpan = settingsPopup.querySelector('#pop-icon-pad-val');

            const rebuildIcon = async () => {
                if (active.iconData) {
                    active.iconData.iconSize = parseFloat(sizeInput.value);
                    active.iconData.strokeWidth = parseFloat(strokeInput.value);
                    if (padInput) active.iconData.padding = parseFloat(padInput.value);
                    
                    const newIcon = await buildIconObject(active.iconData);
                    const { left, top, scaleX, scaleY, angle } = active;
                    newIcon.set({ left, top, scaleX, scaleY, angle });
                    canvas.remove(active);
                    canvas.add(newIcon);
                    canvas.setActiveObject(newIcon);
                    canvas.renderAll();
                }
            };

            sizeInput.oninput = (e) => { sizeValSpan.innerText = e.target.value + 'px'; };
            sizeInput.onchange = () => { rebuildIcon(); history.save(); };
            
            strokeInput.oninput = (e) => { strokeValSpan.innerText = e.target.value; };
            strokeInput.onchange = () => { rebuildIcon(); history.save(); };

            if (padInput) {
                padInput.oninput = (e) => { padValSpan.innerText = e.target.value + 'px'; };
                padInput.onchange = () => { rebuildIcon(); history.save(); };
            }
        }, 50);

        settingsBtn.appendChild(settingsPopup);
        toolbarElement.appendChild(settingsBtn);
    }

    // ── 3. OPÇÕES ESPECÍFICAS DE FORMA ──────────────────────────────────────────
    if (isShape && !isProduct) {
        // Cor do Preenchimento
        const fillBtn = createButton('shape-fill', `<i class="fa-solid fa-square" style="color:${active.fill || '#ffffff'};"></i> Preenchimento`, 'Cor de Fundo');
        const fillPopup = createPopup('popup-fill');
        
        let fillSwatches = `<div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:6px; width:170px;">`;
        fillSwatches += `<div class="toolbar-fill-swatch" data-color="transparent" style="width:24px; height:24px; border-radius:4px; cursor:pointer; background:repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 8px 8px; border:1px solid rgba(255,255,255,0.1);"></div>`;
        colors.forEach(c => {
            const isActive = (active.fill || '#ffffff').toLowerCase() === c.toLowerCase();
            fillSwatches += `<div class="toolbar-fill-swatch" data-color="${c}" style="width:24px; height:24px; border-radius:4px; cursor:pointer; background-color:${c}; border:${isActive ? '2px solid white' : '1px solid rgba(255,255,255,0.1)'};"></div>`;
        });
        fillSwatches += `</div>`;
        fillPopup.innerHTML = fillSwatches;
        
        fillPopup.querySelectorAll('.toolbar-fill-swatch').forEach(swatch => {
            swatch.onclick = () => {
                active.set('fill', swatch.dataset.color === 'transparent' ? '' : swatch.dataset.color);
                canvas.renderAll();
                history.save();
                renderToolbar(canvas, active);
            };
        });
        fillBtn.appendChild(fillPopup);
        toolbarElement.appendChild(fillBtn);

        // Cor da Borda
        const strokeBtn = createButton('shape-border', `<i class="fa-regular fa-square" style="color:${active.stroke || '#transparent'}; border-width: 2px;"></i> Borda`, 'Cor da Borda');
        const strokePopup = createPopup('popup-stroke');
        
        let strokeSwatches = `<div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:6px; width:170px;">`;
        strokeSwatches += `<div class="toolbar-stroke-swatch" data-color="transparent" style="width:24px; height:24px; border-radius:4px; cursor:pointer; background:repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 8px 8px; border:1px solid rgba(255,255,255,0.1);"></div>`;
        colors.forEach(c => {
            const isActive = (active.stroke || '').toLowerCase() === c.toLowerCase();
            strokeSwatches += `<div class="toolbar-stroke-swatch" data-color="${c}" style="width:24px; height:24px; border-radius:4px; cursor:pointer; background-color:${c}; border:${isActive ? '2px solid white' : '1px solid rgba(255,255,255,0.1)'};"></div>`;
        });
        strokeSwatches += `</div>`;
        strokePopup.innerHTML = strokeSwatches;
        
        strokePopup.querySelectorAll('.toolbar-stroke-swatch').forEach(swatch => {
            swatch.onclick = () => {
                const color = swatch.dataset.color;
                if (color === 'transparent') {
                    active.set('stroke', '');
                    active.set('strokeWidth', 0);
                } else {
                    active.set('stroke', color);
                    if ((active.strokeWidth || 0) === 0) active.set('strokeWidth', 2);
                }
                canvas.renderAll();
                history.save();
                renderToolbar(canvas, active);
            };
        });
        strokeBtn.appendChild(strokePopup);
        toolbarElement.appendChild(strokeBtn);

        // Espessura da Borda
        if (active.stroke && active.stroke !== 'transparent') {
            const strokeWidthBtn = createButton('stroke-width', `<i class="fa-solid fa-border-all"></i> Borda: ${active.strokeWidth || 0}px`, 'Espessura da Borda');
            const strokeWidthPopup = createPopup('popup-stroke-width');
            strokeWidthPopup.innerHTML = `
                <div class="toolbar-popup-column">
                    <label>Espessura</label>
                    <input type="range" id="popup-stroke-width-range" min="1" max="20" value="${active.strokeWidth || 2}">
                </div>
            `;
            const range = strokeWidthPopup.querySelector('#popup-stroke-width-range');
            range.oninput = (e) => {
                active.set('strokeWidth', parseInt(e.target.value));
                canvas.renderAll();
            };
            range.onchange = () => {
                history.save();
                renderToolbar(canvas, active);
            };
            strokeWidthBtn.appendChild(strokeWidthPopup);
            toolbarElement.appendChild(strokeWidthBtn);
        }
    }

    // ── 4. OPÇÕES ESPECÍFICAS DE PRODUTO ────────────────────────────────────────
    if (isProduct) {
        const p = active.productData;
        const currentMode = active.currentMode;

        // Tipo de Card (Dropdown)
        const formatBtn = createButton('prod-format', '<i class="fa-solid fa-rectangle-ad"></i> Formato', 'Apresentação');
        const formatPopup = createPopup('popup-prod-format');
        const modes = [
            { id: 'solto', label: 'Produto Solto', icon: 'fa-image' },
            { id: 'card', label: 'Card Destaque', icon: 'fa-id-card' },
            { id: 'table-left', label: 'Tabela (Lateral)', icon: 'fa-table-list' },
            { id: 'table-top', label: 'Tabela (Topo)', icon: 'fa-table-cells-large' }
        ];

        modes.forEach(m => {
            const item = document.createElement('div');
            item.className = `font-item ${currentMode === m.id ? 'active' : ''}`;
            item.innerHTML = `<i class="fa-solid ${m.icon}" style="margin-right:8px;"></i> ${m.label}`;
            item.onclick = () => {
                const left = active.left;
                const top = active.top;
                canvas.remove(active);
                canvas.discardActiveObject();
                import('../tools/products.js').then(module => {
                    module.addProductToCanvas(p, m.id, { left, top });
                });
            };
            formatPopup.appendChild(item);
        });
        formatBtn.appendChild(formatPopup);
        toolbarElement.appendChild(formatBtn);

        // Preços (Popup de Edição)
        const priceBtn = createButton('prod-prices', '<i class="fa-solid fa-tags"></i> Preços', 'Editar Preços');
        const pricePopup = createPopup('popup-prod-prices');
        pricePopup.style.width = '240px';

        const parsePrice = (val) => {
            if (!val) return 0;
            return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
        };

        const formatCurrencyStr = (num) => "R$ " + num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formatFakeCurrencyStr = (num) => "De R$ " + num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const getDiscountPct = (orig, final) => {
            const o = parsePrice(orig);
            const f = parsePrice(final);
            if (o > 0 && f > 0 && o > f) {
                return Math.round((1 - f / o) * 100);
            }
            return 0;
        };

        const updateGroupDiscountBadge = (target) => {
            const discountObj = target.getObjects().find(o => o.isDiscountBadgeText === true);
            const discountBg = target.getObjects().find(o => o.isDiscountBadgeRect === true);
            if (!discountObj && !discountBg) return;

            const isChecked = target.showDiscountBadge !== false;
            let maxDiscount = -Infinity;

            if (target.currentMode === 'card') {
                const origObj = target.getObjects().find(o => o.fakePriceCard === true);
                const finalObj = target.getObjects().find(o => o.priceCard === true);
                if (origObj && finalObj) {
                    const origVal = parsePrice(origObj.text.replace('De R$ ', '').trim());
                    const finalVal = parsePrice(finalObj.text.replace('R$ ', '').trim());
                    if (origVal > 0 && finalVal > 0 && origVal > finalVal) {
                        maxDiscount = Math.round((1 - finalVal / origVal) * 100);
                    }
                }
            } else if (target.currentMode === 'table-left' || target.currentMode === 'table-top') {
                [12, 24, 36].forEach(months => {
                    const origObj = target.getObjects().find(o => o.fakePriceMonths === months);
                    const finalObj = target.getObjects().find(o => o.priceMonths === months);
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
                if (discountObj) discountObj.set({ text: `${maxDiscount}% OFF`, visible: true });
                if (discountBg) discountBg.set({ visible: true });
            } else {
                if (discountObj) discountObj.set({ visible: false });
                if (discountBg) discountBg.set({ visible: false });
            }
            target.dirty = true;
        };

        // Obter valores atuais
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

        if (currentMode === 'table-left' || currentMode === 'table-top') {
            const disc12 = getDiscountPct(p12Orig, p12);
            const disc24 = getDiscountPct(p24Orig, p24);
            const disc36 = getDiscountPct(p36Orig, p36);

            pricePopup.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:10px; max-height: 250px; overflow-y: auto; padding-right: 4px;">
                    <!-- 12 Meses -->
                    <div style="border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">
                        <span style="font-size:0.75rem; font-weight:700; color:white;">12 Meses</span>
                        <div class="toolbar-popup-row" style="margin-top:4px;">
                            <div class="toolbar-popup-column"><label>De</label><input type="text" id="pop-p12-orig" value="${p12Orig}"></div>
                            <div class="toolbar-popup-column"><label>Por</label><input type="text" id="pop-p12-final" value="${p12}"></div>
                        </div>
                    </div>
                    <!-- 24 Meses -->
                    <div style="border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">
                        <span style="font-size:0.75rem; font-weight:700; color:white;">24 Meses</span>
                        <div class="toolbar-popup-row" style="margin-top:4px;">
                            <div class="toolbar-popup-column"><label>De</label><input type="text" id="pop-p24-orig" value="${p24Orig}"></div>
                            <div class="toolbar-popup-column"><label>Por</label><input type="text" id="pop-p24-final" value="${p24}"></div>
                        </div>
                    </div>
                    <!-- 36 Meses -->
                    <div>
                        <span style="font-size:0.75rem; font-weight:700; color:white;">36 Meses</span>
                        <div class="toolbar-popup-row" style="margin-top:4px;">
                            <div class="toolbar-popup-column"><label>De</label><input type="text" id="pop-p36-orig" value="${p36Orig}"></div>
                            <div class="toolbar-popup-column"><label>Por</label><input type="text" id="pop-p36-final" value="${p36}"></div>
                        </div>
                    </div>
                </div>
            `;

            // Vincular ouvintes
            const bindInputs = (months, idOrig, idFinal) => {
                const iOrig = pricePopup.querySelector(idOrig);
                const iFinal = pricePopup.querySelector(idFinal);
                const apply = () => {
                    const origVal = parsePrice(iOrig.value);
                    const finalVal = parsePrice(iFinal.value);
                    const objOrig = active.getObjects().find(o => o.fakePriceMonths === months);
                    const objFinal = active.getObjects().find(o => o.priceMonths === months);
                    if (objOrig) objOrig.set('text', formatFakeCurrencyStr(origVal));
                    if (objFinal) objFinal.set('text', formatCurrencyStr(finalVal));
                    updateGroupDiscountBadge(active);
                    canvas.renderAll();
                };
                iOrig.oninput = apply;
                iFinal.oninput = apply;
                iOrig.onchange = () => history.save();
                iFinal.onchange = () => history.save();
            };

            setTimeout(() => {
                bindInputs(12, '#pop-p12-orig', '#pop-p12-final');
                bindInputs(24, '#pop-p24-orig', '#pop-p24-final');
                bindInputs(36, '#pop-p36-orig', '#pop-p36-final');
            }, 50);

        } else if (currentMode === 'card') {
            pricePopup.innerHTML = `
                <div class="toolbar-popup-row">
                    <div class="toolbar-popup-column"><label>Preço De</label><input type="text" id="pop-card-orig" value="${p36Orig}"></div>
                    <div class="toolbar-popup-column"><label>Preço Por</label><input type="text" id="pop-card-final" value="${p36}"></div>
                </div>
            `;
            setTimeout(() => {
                const iOrig = pricePopup.querySelector('#pop-card-orig');
                const iFinal = pricePopup.querySelector('#pop-card-final');
                const apply = () => {
                    const origVal = parsePrice(iOrig.value);
                    const finalVal = parsePrice(iFinal.value);
                    const objOrig = active.getObjects().find(o => o.fakePriceCard === true);
                    const objFinal = active.getObjects().find(o => o.priceCard === true);
                    if (objOrig) objOrig.set('text', formatFakeCurrencyStr(origVal));
                    if (objFinal) objFinal.set('text', formatCurrencyStr(finalVal));
                    updateGroupDiscountBadge(active);
                    canvas.renderAll();
                };
                iOrig.oninput = apply;
                iFinal.oninput = apply;
                iOrig.onchange = () => history.save();
                iFinal.onchange = () => history.save();
            }, 50);
        }

        priceBtn.appendChild(pricePopup);
        toolbarElement.appendChild(priceBtn);

        // Toggle do Selo de Desconto
        const badgeObj = active.getObjects().find(o => o.isDiscountBadgeRect === true || o.isDiscountBadgeText === true);
        if (badgeObj) {
            const badgeBtn = createButton('prod-badge', '<i class="fa-solid fa-stamp"></i> Selo', 'Sinalizar Desconto');
            if (active.showDiscountBadge !== false) badgeBtn.classList.add('active');
            badgeBtn.onclick = () => {
                const isChecked = active.showDiscountBadge === false;
                active.showDiscountBadge = isChecked;
                updateGroupDiscountBadge(active);
                canvas.renderAll();
                history.save();
                badgeBtn.classList.toggle('active');
            };
            toolbarElement.appendChild(badgeBtn);
        }
    }

    // ── 5. DIVISÓRIA COMUM ──────────────────────────────────────────────────────
    toolbarElement.appendChild(createDivider());

    // ── 6. OPÇÕES COMUNS (Todos os elementos) ──────────────────────────────────
    // Posição (Camadas)
    const layersBtn = createButton('layers', '<i class="fa-solid fa-layer-group"></i>', 'Posição');
    const layersPopup = createPopup('popup-layers');
    layersPopup.innerHTML = `
        <div class="font-item" id="pop-layer-front"><i class="fa-solid fa-angles-up" style="margin-right:8px;"></i> Trazer ao Topo</div>
        <div class="font-item" id="pop-layer-up"><i class="fa-solid fa-angle-up" style="margin-right:8px;"></i> Trazer para Frente</div>
        <div class="font-item" id="pop-layer-down"><i class="fa-solid fa-angle-down" style="margin-right:8px;"></i> Enviar para Trás</div>
        <div class="font-item" id="pop-layer-back"><i class="fa-solid fa-angles-down" style="margin-right:8px;"></i> Enviar ao Fundo</div>
    `;
    setTimeout(() => {
        layersPopup.querySelector('#pop-layer-front').onclick = () => {
            if (active.type === 'activeSelection') {
                active.forEachObject(obj => canvas.bringToFront(obj));
            } else {
                canvas.bringToFront(active);
            }
            canvas.renderAll();
            history.save();
        };
        layersPopup.querySelector('#pop-layer-up').onclick = () => {
            if (active.type === 'activeSelection') {
                active.forEachObject(obj => canvas.bringForward(obj));
            } else {
                canvas.bringForward(active);
            }
            canvas.renderAll();
            history.save();
        };
        layersPopup.querySelector('#pop-layer-down').onclick = () => {
            if (active.type === 'activeSelection') {
                active.forEachObject(obj => canvas.sendBackwards(obj));
            } else {
                canvas.sendBackwards(active);
            }
            canvas.renderAll();
            history.save();
        };
        layersPopup.querySelector('#pop-layer-back').onclick = () => {
            if (active.type === 'activeSelection') {
                active.forEachObject(obj => canvas.sendToBack(obj));
            } else {
                canvas.sendToBack(active);
            }
            canvas.renderAll();
            history.save();
        };
    }, 50);
    layersBtn.appendChild(layersPopup);
    toolbarElement.appendChild(layersBtn);

    // Opacidade (Transparência)
    const opacityBtn = createButton('opacity', '<i class="fa-solid fa-eye-slash"></i>', 'Transparência');
    const opacityPopup = createPopup('popup-opacity');
    opacityPopup.innerHTML = `
        <div class="toolbar-popup-column" style="width:100px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <label>Opacidade</label>
                <span id="popup-opacity-val" style="font-size:0.75rem;">${Math.round((active.opacity !== undefined ? active.opacity : 1) * 100)}%</span>
            </div>
            <input type="range" id="popup-opacity-range" min="0.1" max="1" step="0.05" value="${active.opacity !== undefined ? active.opacity : 1}" style="width:100%;">
        </div>
    `;
    setTimeout(() => {
        const range = opacityPopup.querySelector('#popup-opacity-range');
        const valSpan = opacityPopup.querySelector('#popup-opacity-val');
        range.oninput = (e) => {
            const val = parseFloat(e.target.value);
            valSpan.innerText = Math.round(val * 100) + '%';
            if (active.type === 'activeSelection') {
                active.forEachObject(obj => obj.set('opacity', val));
            } else {
                active.set('opacity', val);
            }
            canvas.renderAll();
        };
        range.onchange = () => history.save();
    }, 50);
    opacityBtn.appendChild(opacityPopup);
    toolbarElement.appendChild(opacityBtn);

    // Duplicar
    const duplicateBtn = createButton('duplicate', '<i class="fa-solid fa-clone"></i>', 'Duplicar');
    duplicateBtn.onclick = (e) => {
        if (e.target.closest('.toolbar-popup')) return;
        duplicateObject(active, canvas);
    };
    toolbarElement.appendChild(duplicateBtn);

    // Excluir
    const deleteBtn = createButton('delete', '<i class="fa-solid fa-trash-can"></i>', 'Excluir');
    deleteBtn.classList.add('btn-danger');
    deleteBtn.onclick = (e) => {
        if (e.target.closest('.toolbar-popup')) return;
        if (active.type === 'activeSelection') {
            const objects = active.getObjects().slice();
            canvas.discardActiveObject();
            objects.forEach((obj) => {
                canvas.remove(obj);
            });
        } else {
            canvas.remove(active);
            canvas.discardActiveObject();
        }
        canvas.renderAll();
        history.save();
    };
    toolbarElement.appendChild(deleteBtn);
}

function createButton(id, innerHTML, title) {
    const btn = document.createElement('button');
    btn.className = 'toolbar-btn';
    btn.dataset.btnId = id;
    btn.innerHTML = innerHTML;
    btn.title = title;
    
    // Toggles popup if there is any child popup
    btn.addEventListener('click', (e) => {
        const popup = btn.querySelector('.toolbar-popup');
        if (popup) {
            e.stopPropagation();
            const wasActive = popup.classList.contains('active');
            closeAllPopups();
            if (!wasActive) {
                popup.classList.add('active');
                btn.classList.add('active');
                adjustPopupPosition(popup);
            }
        }
    });

    return btn;
}

function adjustPopupPosition(popup) {
    if (!toolbarElement) return;
    const position = toolbarElement.dataset.position || 'above';

    if (position === 'above') {
        // Toolbar está acima do objeto -> Abre o popup para CIMA (longe do objeto)
        popup.style.bottom = '100%';
        popup.style.top = 'auto';
        popup.style.marginBottom = '10px';
        popup.style.marginTop = '0';
    } else {
        // Toolbar está abaixo do objeto -> Abre o popup para BAIXO (longe do objeto)
        popup.style.bottom = 'auto';
        popup.style.top = '100%';
        popup.style.marginBottom = '0';
        popup.style.marginTop = '10px';
    }
}

function createPopup(id) {
    const popup = document.createElement('div');
    popup.id = id;
    popup.className = 'toolbar-popup';
    popup.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Evita fechar ao clicar no popup
    });
    return popup;
}

function createDivider() {
    const div = document.createElement('div');
    div.className = 'toolbar-divider';
    return div;
}

function duplicateObject(active, canvas) {
    if (!active) return;
    const propertiesToClone = [
        'productData', 'currentMode', 'isAlluCard', 'isAlluTable', 'selectable', 'hasControls', 'id', 
        'isBadge', 'badgePresetId', 'badgeShape', 'innerShadowBlur', 'innerShadowColor', 'innerShadowOffsetX', 
        'innerShadowOffsetY', 'charSpacing', 'lineHeight', 'shadow', 'fakePriceCard', 'priceCard', 
        'fakePriceMonths', 'priceMonths', 'isDiscountBadgeRect', 'isDiscountBadgeText', 'showDiscountBadge'
    ];
    active.clone((clonedObj) => {
        canvas.discardActiveObject();
        clonedObj.set({
            left: clonedObj.left + 20,
            top: clonedObj.top + 20,
            evented: true
        });
        if (clonedObj.type === 'activeSelection') {
            clonedObj.canvas = canvas;
            clonedObj.forEachObject((obj) => {
                canvas.add(obj);
            });
            clonedObj.setCoords();
        } else {
            canvas.add(clonedObj);
        }
        canvas.setActiveObject(clonedObj);
        canvas.renderAll();
        history.save();
    }, propertiesToClone);
}
