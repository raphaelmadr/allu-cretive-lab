// js/tools/text.js
import { state } from '../state.js';
import { presets } from '../config.js';
import { history } from '../history.js';

export function renderTextTools(sidebarContent) {
    const canvas = state.getCanvas();
    if (!canvas) return;

    const div = document.createElement('div');
    div.className = 'animate-fade';
    div.innerHTML = `
        <p class="subtitle">Adicionar Texto</p>
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:24px;">
            <button class="btn-add-text" data-size="76" data-weight="bold" style="padding:10px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; border-radius:8px; cursor:pointer; text-align:left;"><b>Título Principal (H1)</b></button>
            <button class="btn-add-text" data-size="66" data-weight="bold" style="padding:10px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; border-radius:8px; cursor:pointer; text-align:left;"><b>Título Seção (H2)</b></button>
            <button class="btn-add-text" data-size="46" data-weight="500" style="padding:10px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; border-radius:8px; cursor:pointer; text-align:left;">Subtítulo (H3)</button>
            <button class="btn-add-text" data-size="16" data-weight="400" style="padding:10px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; border-radius:8px; cursor:pointer; text-align:left;">Parágrafo</button>
        </div>
        
        <div id="text-controls" style="display:none; border-top:1px solid var(--glass-border); padding-top:20px;">
            <p class="subtitle">Personalizar Seleção</p>
            
            <div style="display:flex; align-items:center; justify-content:center; gap:15px; margin-bottom:20px; background:rgba(0,0,0,0.2); padding:10px; border-radius:12px;">
                <button id="btn-dec" class="btn-tool" style="width:36px; height:36px; border:1px solid var(--glass-border)"><i class="fa-solid fa-minus"></i></button>
                <span id="font-size-display" style="font-weight:700; min-width:40px; text-align:center;">40</span>
                <button id="btn-inc" class="btn-tool" style="width:36px; height:36px; border:1px solid var(--glass-border)"><i class="fa-solid fa-plus"></i></button>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:15px;">
                <button class="btn-weight" data-weight="300" style="padding:8px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; border-radius:6px; cursor:pointer; font-weight:300;">Light</button>
                <button class="btn-weight" data-weight="400" style="padding:8px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; border-radius:6px; cursor:pointer; font-weight:400;">Regular</button>
                <button class="btn-weight" data-weight="500" style="padding:8px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; border-radius:6px; cursor:pointer; font-weight:500;">Medium</button>
                <button class="btn-weight" data-weight="700" style="padding:8px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; border-radius:6px; cursor:pointer; font-weight:700;">Bold</button>
            </div>

            <div style="display:flex; gap:8px;">
                <button id="btn-italic" class="btn-tool" style="flex:1; border:1px solid var(--glass-border)"><i class="fa-solid fa-italic"></i></button>
                <button id="btn-color-text" class="btn-tool" style="flex:1; border:1px solid var(--glass-border)"><i class="fa-solid fa-palette"></i></button>
            </div>
        </div>
    `;
    
    div.querySelectorAll('.btn-add-text').forEach(btn => {
        btn.onclick = () => {
            const size = parseInt(btn.dataset.size);
            const weight = btn.dataset.weight === 'bold' ? 'bold' : btn.dataset.weight;
            const formatDisplay = document.getElementById('format-display');
            const formatStr = formatDisplay ? formatDisplay.innerText.split(' (')[0] : 'Instagram Feed';
            const activePreset = Object.values(presets).find(preset => preset.name === formatStr);
            const docW = activePreset ? activePreset.w : 1080;
            const docH = activePreset ? activePreset.h : 1080;

            const text = new fabric.IText('Novo Texto', {
                left: docW / 2,
                top: docH / 2,
                originX: 'center',
                originY: 'center',
                fontFamily: 'Plus Jakarta Sans',
                fill: '#000000',
                fontSize: size,
                fontWeight: weight
            });
            canvas.add(text);
            canvas.setActiveObject(text);
            history.save();
        };
    });

    sidebarContent.appendChild(div);

    const updateControls = (obj) => {
        const ctrl = document.getElementById('text-controls');
        if(obj && obj.type === 'i-text') {
            if(ctrl) ctrl.style.display = 'block';
            const display = document.getElementById('font-size-display');
            if (display) display.innerText = Math.round(obj.fontSize);
        } else {
            if(ctrl) ctrl.style.display = 'none';
        }
    };

    // Store callbacks to prevent multiple event bindings if function is called multiple times
    if (!canvas._textEventsSetup) {
        canvas.on('selection:created', (e) => updateControls(e.selected[0]));
        canvas.on('selection:updated', (e) => updateControls(e.selected[0]));
        canvas.on('selection:cleared', () => updateControls(null));
        canvas._textEventsSetup = true;
    }

    const btnInc = document.getElementById('btn-inc');
    if (btnInc) {
        btnInc.onclick = () => {
            const active = canvas.getActiveObject();
            if(active && active.type === 'i-text') {
                active.set('fontSize', active.fontSize + 2);
                document.getElementById('font-size-display').innerText = Math.round(active.fontSize);
                canvas.renderAll();
                history.save();
            }
        };
    }

    const btnDec = document.getElementById('btn-dec');
    if (btnDec) {
        btnDec.onclick = () => {
            const active = canvas.getActiveObject();
            if(active && active.type === 'i-text' && active.fontSize > 5) {
                active.set('fontSize', active.fontSize - 2);
                document.getElementById('font-size-display').innerText = Math.round(active.fontSize);
                canvas.renderAll();
                history.save();
            }
        };
    }

    div.querySelectorAll('.btn-weight').forEach(btn => {
        btn.onclick = () => {
            const active = canvas.getActiveObject();
            if(active && active.type === 'i-text') {
                active.set('fontWeight', btn.dataset.weight);
                canvas.renderAll();
                history.save();
            }
        };
    });

    const btnItalic = document.getElementById('btn-italic');
    if (btnItalic) {
        btnItalic.onclick = () => {
            const active = canvas.getActiveObject();
            if(active && active.type === 'i-text') {
                const isItalic = active.fontStyle === 'italic';
                active.set('fontStyle', isItalic ? 'normal' : 'italic');
                canvas.renderAll();
                history.save();
            }
        };
    }

    const btnColorText = document.getElementById('btn-color-text');
    if (btnColorText) {
        btnColorText.onclick = () => {
            const propBtn = document.querySelector('.btn-tool[data-tab="properties"]');
            if(propBtn) propBtn.click();
        };
    }

    updateControls(canvas.getActiveObject());
}
