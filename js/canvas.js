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
    const canvas = state.getCanvas();
    if (!canvas) return;

    const wrapper = document.getElementById('canvas-wrapper');
    const padding = 120; // Espaço de respiro
    const availableW = wrapper.clientWidth - padding;
    const availableH = wrapper.clientHeight - padding;
    const scale = Math.min(availableW / w, availableH / h, 1);
    
    canvas.setDimensions({ 
        width: w * scale, 
        height: h * scale 
    }, { backstoreOnly: false });
    
    canvas.setZoom(scale);
    
    // Garantir que o container do Fabric.js tenha o tamanho exato
    const container = canvas.getElement().parentNode;
    container.style.width = Math.round(w * scale) + 'px';
    container.style.height = Math.round(h * scale) + 'px';
    
    // Ativar/Desativar modo Carrossel baseado no preset
    const formatDisplay = document.getElementById('format-display');
    if (formatDisplay) {
        const formatLabel = formatDisplay.innerText;
        const isCarouselMode = formatLabel.includes('Carrossel');
        const manager = document.getElementById('carousel-manager');
        
        if (isCarouselMode) {
            carousel.active = true;
            if (manager) {
                manager.style.visibility = 'visible';
                manager.style.display = 'flex';
            }
            if (carousel.pages.length === 0) carousel.init();
            carousel.updateUI();
        } else {
            carousel.active = false;
            if (manager) {
                manager.style.visibility = 'hidden';
                manager.style.display = 'none';
            }
        }
    }
    
    updateZoomDisplay(scale);
    drawSafeGuides(w, h, scale);
    canvas.renderAll();
}

export function updateZoomDisplay(scale) {
    const zoomText = document.querySelector('.zoom-controls span');
    if(zoomText) zoomText.innerText = Math.round(scale * 100) + '%';
}

export function drawSafeGuides(w, h, scale) {
    const canvas = state.getCanvas();
    if (!canvas) return;

    // Remover guias antigas
    document.querySelectorAll('.canvas-guide').forEach(g => g.remove());
    
    const container = canvas.getElement().parentNode;
    const marginW = 0.05 * w * scale; // 5% de margem real baseada na largura da arte
    const marginH = 0.05 * h * scale; // 5% de margem real baseada na altura da arte
    
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
