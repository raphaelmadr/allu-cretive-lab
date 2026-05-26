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

    // Sobrescrever renderização de texto do Fabric.js para suportar sombra interna
    const originalTextRender = fabric.Text.prototype._render;
    fabric.Text.prototype._render = function(ctx) {
        originalTextRender.call(this, ctx);
        
        if (this.innerShadowBlur > 0 && this.innerShadowColor) {
            ctx.save();
            ctx.globalCompositeOperation = 'source-atop';
            ctx.shadowColor = this.innerShadowColor;
            ctx.shadowBlur = this.innerShadowBlur;
            ctx.shadowOffsetX = (this.innerShadowOffsetX || 0) + 10000;
            ctx.shadowOffsetY = (this.innerShadowOffsetY || 0) + 10000;
            
            ctx.translate(-10000, -10000);
            originalTextRender.call(this, ctx);
            ctx.restore();
        }
    };
}

export function resizeCanvas(w, h) {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;

    // Layout horizontal (Lado a Lado) conforme solicitado
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'row';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'flex-start'; // Começa da esquerda
    wrapper.style.overflowX = 'auto';
    wrapper.style.overflowY = 'auto';
    wrapper.style.gap = '80px'; // Espaço generoso entre as telas

    const padding = 120; 
    const availableW = wrapper.clientWidth - padding;
    const availableH = wrapper.clientHeight - padding;
    const scale = Math.min(availableW / w, availableH / h, 1);

    const canvasWidth = Math.round(w * scale);
    const horizontalPadding = Math.max(100, Math.round((wrapper.clientWidth - canvasWidth) / 2));
    wrapper.style.paddingLeft = `${horizontalPadding}px`;
    wrapper.style.paddingRight = `${horizontalPadding}px`;
    wrapper.style.paddingTop = '100px';
    wrapper.style.paddingBottom = '100px';
    
    // Aplicar a todos os canvases no estado
    state.canvases.forEach(canvas => {
        canvas.setDimensions({ 
            width: w * scale, 
            height: h * scale 
        }, { backstoreOnly: false });
        
        canvas.setZoom(scale);
        
        const container = canvas.getElement().parentNode;
        if (container && container.classList.contains('canvas-container')) {
            container.style.width = Math.round(w * scale) + 'px';
            container.style.height = Math.round(h * scale) + 'px';
            container.style.flexShrink = '0';
            
            // Redesenhar guias de segurança
            drawSafeGuides(canvas, w, h, scale);
        }
    });

    // O Gerenciador de páginas (carousel) agora está sempre disponível se houver mais de uma página
    const manager = document.getElementById('carousel-manager');
    const onboardingModal = document.getElementById('onboarding-modal');
    const isShowingOnboarding = onboardingModal && onboardingModal.style.display !== 'none';
    if (manager) {
        manager.style.display = isShowingOnboarding ? 'none' : 'flex';
    }
    
    carousel.updateUI();
    updateZoomDisplay(scale);
    state.canvases.forEach(c => c.renderAll());
}

export function updateZoomDisplay(scale) {
    const zoomText = document.querySelector('.zoom-controls span');
    if(zoomText) zoomText.innerText = Math.round(scale * 100) + '%';
}

export function drawSafeGuides(canvas, w, h, scale) {
    const container = canvas.getElement().parentNode;
    if (!container || !container.classList.contains('canvas-container')) return;
    
    container.querySelectorAll('.canvas-guide').forEach(g => g.remove());
    
    const marginW = 0.05 * w * scale; 
    const marginH = 0.05 * h * scale; 
    
    const guide = document.createElement('div');
    guide.className = 'canvas-guide';
    guide.style.cssText = `
        position: absolute;
        left: ${marginW}px;
        top: ${marginH}px;
        width: ${(w * scale - 2 * marginW)}px;
        height: ${(h * scale - 2 * marginH)}px;
        pointer-events: none;
        border: 1px dashed rgba(0, 209, 255, 0.4);
        z-index: 10;
        border-radius: 2px;
    `;
    container.appendChild(guide);

    const border = document.createElement('div');
    border.className = 'canvas-guide';
    border.style.cssText = `
        position: absolute;
        inset: -1px;
        border: 1px solid rgba(255,255,255,0.05);
        pointer-events: none;
        z-index: 5;
    `;
    container.appendChild(border);
}
