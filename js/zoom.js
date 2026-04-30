// js/zoom.js
import { state } from './state.js';
import { presets } from './config.js';
import { drawSafeGuides, updateZoomDisplay } from './canvas.js';

export function setupZoom() {
    const setManualZoom = (delta) => {
        const canvas = state.getCanvas();
        if (!canvas) return;

        let currentScale = canvas.getZoom();
        let newScale = currentScale + delta;
        if (newScale < 0.1) newScale = 0.1; // Limite mínimo 10%
        if (newScale > 3) newScale = 3;   // Limite máximo 300%

        const formatDisplay = document.getElementById('format-display');
        const formatStr = formatDisplay ? formatDisplay.innerText.split(' (')[0] : 'Instagram Feed';
        const activePreset = Object.values(presets).find(p => p.name === formatStr);
        if(!activePreset) return;
        
        const w = activePreset.w;
        const h = activePreset.h;

        // Atualiza as dimensões físicas do elemento canvas de acordo com o novo zoom
        canvas.setDimensions({ 
            width: w * newScale, 
            height: h * newScale 
        }, { backstoreOnly: false });
        
        // Aplica o zoom visual
        canvas.setZoom(newScale);
        
        // Atualiza o container parente
        const container = canvas.getElement().parentNode;
        container.style.width = Math.round(w * newScale) + 'px';
        container.style.height = Math.round(h * newScale) + 'px';

        drawSafeGuides(w, h, newScale);
        updateZoomDisplay(newScale);
        canvas.renderAll();
    };

    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    
    if (btnZoomIn) btnZoomIn.onclick = () => setManualZoom(0.1);
    if (btnZoomOut) btnZoomOut.onclick = () => setManualZoom(-0.1);
}
