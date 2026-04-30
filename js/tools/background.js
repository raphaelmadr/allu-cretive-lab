// js/tools/background.js
import { state } from '../state.js';
import { colors } from '../config.js';
import { history } from '../history.js';

export function renderBrandTools(sidebarContent) {
    const canvas = state.getCanvas();
    if (!canvas) return;

    const div = document.createElement('div');
    div.className = 'animate-fade';
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h3 style="margin:0;">Paleta Allu</h3>
            <button id="btn-clear-color" class="btn-tool" style="width:30px; height:30px; border:1px solid var(--glass-border); font-size:12px;" title="Remover Cor">
                <i class="fa-solid fa-droplet-slash"></i>
            </button>
        </div>
        <p class="subtitle">Personalize a cor da arte ou do elemento selecionado</p>
    `;
    const grid = document.createElement('div');
    grid.className = 'color-grid';
    
    const applyColor = (c) => {
        const active = canvas.getActiveObject();
        if (active) {
            if (active.isAlluCard || active.isAlluTable) {
                const bg = active.item(0);
                bg.set('fill', c || '#ffffff');
                
                if (c && c !== 'transparent') {
                    const isDark = (parseInt(c.replace('#',''), 16) < 0xffffff / 2);
                    active.forEachObject(obj => {
                        if (obj.type === 'text' || obj.type === 'i-text') {
                            if (obj.fill !== '#00D1FF' && obj.fill !== '#27AE60') {
                                obj.set('fill', isDark ? '#ffffff' : '#161617');
                            }
                        }
                    });
                }
                canvas.renderAll();
            } else if (active.type === 'i-text' || active.type === 'text') {
                active.set('fill', c || '#161617');
                canvas.renderAll();
            } else if (active.type === 'image') {
                active.set('backgroundColor', c || '');
                canvas.renderAll();
            } else if (active.type === 'rect' || active.type === 'circle' || active.type === 'polygon' || active.type === 'triangle') {
                active.set('fill', c || '#161617');
                canvas.renderAll();
            } else {
                canvas.setBackgroundColor(c || '#ffffff', canvas.renderAll.bind(canvas));
            }
        } else {
            canvas.setBackgroundColor(c || '#ffffff', canvas.renderAll.bind(canvas));
        }
        history.save();
    };

    div.querySelector('#btn-clear-color').onclick = () => applyColor('');

    colors.forEach(c => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = c;
        swatch.onclick = () => applyColor(c);
        grid.appendChild(swatch);
    });
    div.appendChild(grid);
    sidebarContent.appendChild(div);
}
