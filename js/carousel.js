// js/carousel.js
import { state } from './state.js';
import { history } from './history.js';
import { setupCanvas, resizeCanvas } from './canvas.js';

export const carousel = {
    active: false,
    
    init() {
        this.active = true;
        const manager = document.getElementById('carousel-manager');
        if (manager) {
            manager.style.display = 'flex';
        }
        
        // Se já temos um canvas inicial, garanta que ele está no array
        const initialCanvas = state.getCanvas();
        if (initialCanvas && state.canvases.length === 0) {
            state.setCanvas(initialCanvas);
        }
        
        this.updateUI();
    },
    
    addPage() {
        const activePreset = state.getActivePreset() || { w: 1080, h: 1080 };
        const wrapper = document.getElementById('canvas-wrapper');
        if (!wrapper) return;

        // Criar novo elemento canvas
        const canvasId = `canvas-${Date.now()}`;
        const newCanvasEl = document.createElement('canvas');
        newCanvasEl.id = canvasId;
        wrapper.appendChild(newCanvasEl);

        // Inicializar Fabric
        const newCanvas = new fabric.Canvas(canvasId, {
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
            width: activePreset.w,
            height: activePreset.h
        });

        // Configurar protótipo e estilos globais se necessário
        setupCanvas(); 

        // Configurar eventos
        newCanvas.on('selection:created', () => this.onSelection(newCanvas));
        newCanvas.on('selection:updated', () => this.onSelection(newCanvas));
        newCanvas.on('object:modified', () => history.save());
        newCanvas.on('object:added', () => history.save());
        newCanvas.on('object:removed', () => history.save());

        // Adicionar ao estado
        state.addCanvas(newCanvas);
        
        // Sincronizar tamanho
        resizeCanvas(activePreset.w, activePreset.h);
        
        // Rolar até o novo canvas
        setTimeout(() => {
            newCanvasEl.parentNode.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }, 100);

        this.updateUI();
        history.save();
    },

    onSelection(canvasInstance) {
        const index = state.canvases.indexOf(canvasInstance);
        if (index !== -1) {
            state.setActiveCanvas(index);
            this.updateUI();
            const propBtn = document.querySelector('.btn-tool[data-tab="properties"]');
            if (propBtn) propBtn.click();
        }
    },

    deletePage(index) {
        if (state.canvases.length <= 1) return;
        if (!confirm('Deseja excluir esta página?')) return;
        
        const canvasToDelete = state.canvases[index];
        const container = canvasToDelete.getElement().parentNode;
        container.parentNode.removeChild(container);
        
        state.removeCanvas(index);
        this.updateUI();
        history.save();
    },
    
    switchPage(index) {
        state.setActiveCanvas(index);
        const canvas = state.getCanvas();
        if (canvas) {
            const container = canvas.getElement().parentNode;
            container.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            
            // Destacar o canvas selecionado visualmente
            document.querySelectorAll('.canvas-container').forEach(c => c.style.outline = 'none');
            container.style.outline = '2px solid var(--accent)';
            container.style.outlineOffset = '4px';
        }
        this.updateUI();
    },

    async exportAll(format = 'png') {
        const originalIndex = state.activeCanvasIndex;
        
        for (let i = 0; i < state.canvases.length; i++) {
            const canvas = state.canvases[i];
            canvas.discardActiveObject();
            canvas.renderAll();
            
            const dataURL = canvas.toDataURL({
                format: format === 'jpg' ? 'jpeg' : format,
                quality: 0.9,
                multiplier: 2
            });
            
            const link = document.createElement('a');
            link.download = `Allu_Creative_Lab_Page_${i + 1}.${format}`;
            link.href = dataURL;
            link.click();
            await new Promise(r => setTimeout(r, 500));
        }
        
        state.setActiveCanvas(originalIndex);
        this.updateUI();
    },
    
    updateUI() {
        const container = document.getElementById('carousel-pages');
        const countDisplay = document.getElementById('carousel-count');
        if (!container || !countDisplay) return;
        
        container.innerHTML = '';
        state.canvases.forEach((canvas, index) => {
            const item = document.createElement('div');
            item.style.position = 'relative';
            
            const thumb = document.createElement('div');
            const isActive = index === state.activeCanvasIndex;
            thumb.className = `carousel-thumb ${isActive ? 'active' : ''}`;
            thumb.innerText = index + 1;
            thumb.onclick = () => this.switchPage(index);

            if (state.canvases.length > 1) {
                const delBtn = document.createElement('div');
                delBtn.className = 'carousel-del-btn';
                delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.deletePage(index);
                };
                item.appendChild(delBtn);
            }

            item.appendChild(thumb);
            container.appendChild(item);
        });
        countDisplay.innerText = `${state.activeCanvasIndex + 1} / ${state.canvases.length}`;

        // Atualizar destaque dos containers de canvas
        state.canvases.forEach((canvas, index) => {
            const container = canvas.getElement().parentNode;
            if (index === state.activeCanvasIndex) {
                container.style.outline = '3px solid var(--accent)';
                container.style.outlineOffset = '8px';
                container.style.boxShadow = '0 0 50px rgba(39, 174, 96, 0.2)';
                container.style.opacity = '1';
            } else {
                container.style.outline = '1px solid rgba(255,255,255,0.1)';
                container.style.outlineOffset = '8px';
                container.style.boxShadow = 'none';
                container.style.opacity = '1';
            }
        });
    }
};

export function setupCarousel() {
    const btnAddPage = document.getElementById('btn-add-page');
    if (btnAddPage) {
        btnAddPage.onclick = () => carousel.addPage();
    }
}
