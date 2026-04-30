// js/align.js
import { state } from './state.js';

export function setupAlignment() {
    const alignObj = (action) => {
        const canvas = state.getCanvas();
        if (!canvas) return;

        const active = canvas.getActiveObject();
        if (!active) return;
        
        // Dimensões lógicas reais do documento (ignorando o zoom)
        const docW = canvas.width / canvas.getZoom();
        const docH = canvas.height / canvas.getZoom();

        const activeW = active.getScaledWidth();
        const activeH = active.getScaledHeight();

        // Compensa a âncora (origin) do objeto
        const offsetX = active.originX === 'center' ? activeW / 2 : (active.originX === 'right' ? activeW : 0);
        const offsetY = active.originY === 'center' ? activeH / 2 : (active.originY === 'bottom' ? activeH : 0);

        switch(action) {
            case 'left':
                active.set({ left: offsetX });
                break;
            case 'center-h':
                active.set({ left: (docW / 2) - (activeW / 2) + offsetX });
                break;
            case 'right':
                active.set({ left: docW - activeW + offsetX });
                break;
            case 'top':
                active.set({ top: offsetY });
                break;
            case 'center-v':
                active.set({ top: (docH / 2) - (activeH / 2) + offsetY });
                break;
            case 'bottom':
                active.set({ top: docH - activeH + offsetY });
                break;
        }
        active.setCoords();
        canvas.renderAll();
    };

    const btnAlignLeft = document.getElementById('align-left');
    const btnAlignCenterH = document.getElementById('align-center-h');
    const btnAlignRight = document.getElementById('align-right');
    const btnAlignTop = document.getElementById('align-top');
    const btnAlignCenterV = document.getElementById('align-center-v');
    const btnAlignBottom = document.getElementById('align-bottom');

    if(btnAlignLeft) btnAlignLeft.onclick = () => alignObj('left');
    if(btnAlignCenterH) btnAlignCenterH.onclick = () => alignObj('center-h');
    if(btnAlignRight) btnAlignRight.onclick = () => alignObj('right');
    if(btnAlignTop) btnAlignTop.onclick = () => alignObj('top');
    if(btnAlignCenterV) btnAlignCenterV.onclick = () => alignObj('center-v');
    if(btnAlignBottom) btnAlignBottom.onclick = () => alignObj('bottom');
}
