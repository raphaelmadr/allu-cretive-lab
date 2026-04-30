// js/zoom.js
import { state } from './state.js';
import { presets } from './config.js';
import { drawSafeGuides, updateZoomDisplay } from './canvas.js';

export function setupZoom() {
    const setManualZoom = (delta) => {
        if (state.canvases.length === 0) return;

        // Basear o zoom no primeiro canvas para consistência
        const baseCanvas = state.canvases[0];
        let currentScale = baseCanvas.getZoom();
        let newScale = currentScale + delta;
        if (newScale < 0.1) newScale = 0.1;
        if (newScale > 3) newScale = 3;

        const formatDisplay = document.getElementById('format-display');
        const formatStr = formatDisplay ? formatDisplay.innerText.split(' (')[0] : 'Instagram Feed';
        const activePreset = Object.values(presets).find(p => p.name === formatStr);
        if(!activePreset) return;
        
        const w = activePreset.w;
        const h = activePreset.h;

        // Aplicar a TODOS os canvases
        state.canvases.forEach(canvas => {
            canvas.setDimensions({ 
                width: w * newScale, 
                height: h * newScale 
            }, { backstoreOnly: false });
            
            canvas.setZoom(newScale);
            
            const container = canvas.getElement().parentNode;
            container.style.width = Math.round(w * newScale) + 'px';
            container.style.height = Math.round(h * newScale) + 'px';

            drawSafeGuides(canvas, w, h, newScale);
            canvas.renderAll();
        });

        updateZoomDisplay(newScale);
    };

    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    
    if (btnZoomIn) btnZoomIn.onclick = () => setManualZoom(0.1);
    if (btnZoomOut) btnZoomOut.onclick = () => setManualZoom(-0.1);
}
