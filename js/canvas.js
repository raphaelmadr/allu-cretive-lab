// js/canvas.js
import { state } from './state.js';
import { presets } from './config.js';
import { carousel } from './carousel.js';
import { history } from './history.js';

export function setupCanvas() {
    fabric.Object.prototype.set({
        transparentCorners: false,
        cornerColor: '#27AE60',
        cornerStrokeColor: '#ffffff',
        borderColor: '#27AE60',
        cornerSize: 12,
        padding: 5,
        cornerStyle: 'circle',
        borderScaleFactor: 2
    });
}

export function resizeCanvas(w, h) {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;

    // Se estivermos em modo carrossel, as larguras podem ser diferentes
    const formatDisplay = document.getElementById('format-display');
    const isCarouselMode = formatDisplay && formatDisplay.innerText.includes('Carrossel');

    // Configurar wrapper para scroll horizontal se for carrossel
    if (isCarouselMode) {
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'row';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'flex-start';
        wrapper.style.gap = '80px';
        wrapper.style.overflowX = 'auto';
        wrapper.style.padding = '100px';
    } else {
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.overflowX = 'hidden';
        wrapper.style.padding = '20px';
    }

    const padding = 120; 
    const availableW = wrapper.clientWidth - padding;
    const availableH = wrapper.clientHeight - padding;
    const scale = Math.min(availableW / w, availableH / h, 1);
    
    // Aplicar a todos os canvases no estado
    state.canvases.forEach(canvas => {
        canvas.setDimensions({ 
            width: w * scale, 
            height: h * scale 
        }, { backstoreOnly: false });
        
        canvas.setZoom(scale);
        
        const container = canvas.getElement().parentNode;
        container.style.width = Math.round(w * scale) + 'px';
        container.style.height = Math.round(h * scale) + 'px';
        container.style.flexShrink = '0'; // Não deixa o canvas espremer
        
        // Redesenhar guias
        drawSafeGuides(canvas, w, h, scale);
    });

    // Ativar/Desativar modo Carrossel baseado no preset
    if (formatDisplay) {
        const manager = document.getElementById('carousel-manager');
        if (isCarouselMode) {
            carousel.active = true;
            if (manager) manager.style.display = 'flex';
            if (state.canvases.length === 0) carousel.init();
            carousel.updateUI();
        } else {
            carousel.active = false;
            if (manager) manager.style.display = 'none';
        }
    }
    
    updateZoomDisplay(scale);
    state.canvases.forEach(c => c.renderAll());
}

export function updateZoomDisplay(scale) {
    const zoomText = document.querySelector('.zoom-controls span');
    if(zoomText) zoomText.innerText = Math.round(scale * 100) + '%';
}

export function drawSafeGuides(canvas, w, h, scale) {
    const container = canvas.getElement().parentNode;
    
    // Remover guias antigas deste container específico
    container.querySelectorAll('.canvas-guide').forEach(g => g.remove());
    
    const marginW = 0.05 * w * scale; 
    const marginH = 0.05 * h * scale; 
    
    const guide = document.createElement('div');
    guide.className = 'canvas-guide';
    guide.style.position = 'absolute';
    guide.style.left = marginW + 'px';
    guide.style.top = marginH + 'px';
    guide.style.width = (w * scale - 2 * marginW) + 'px';
    guide.style.height = (h * scale - 2 * marginH) + 'px';
    guide.style.pointerEvents = 'none';
    guide.style.border = '1px dashed rgba(0, 209, 255, 0.5)';
    guide.style.zIndex = '10';
    container.appendChild(guide);
}
