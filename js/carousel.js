// js/carousel.js
import { state } from './state.js';
import { history } from './history.js';
import { setupCanvas, resizeCanvas } from './canvas.js';
import { notifications } from './ui/notifications.js';

export const carousel = {
    active: false,
    
    init() {
        this.active = true;
        const manager = document.getElementById('carousel-manager');
        if (manager) {
            manager.style.display = 'flex';
        }
        
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

        const canvasId = `canvas-${Date.now()}`;
        const newCanvasEl = document.createElement('canvas');
        newCanvasEl.id = canvasId;
        wrapper.appendChild(newCanvasEl);

        const newCanvas = new fabric.Canvas(canvasId, {
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
            width: activePreset.w,
            height: activePreset.h
        });

        setupCanvas(); 

        newCanvas.on('selection:created', () => this.onSelection(newCanvas));
        newCanvas.on('selection:updated', () => this.onSelection(newCanvas));
        newCanvas.on('object:modified', () => history.save());
        newCanvas.on('object:added', () => history.save());
        newCanvas.on('object:removed', () => history.save());

        state.addCanvas(newCanvas);
        resizeCanvas(activePreset.w, activePreset.h);
        
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

    async deletePage(index) {
        if (state.canvases.length <= 1) return;
        const ok = await notifications.confirm('Excluir Página?', 'Deseja realmente excluir esta página? Esta ação não pode ser desfeita.', 'fa-trash-can');
        if (!ok) return;
        
        const canvasToDelete = state.canvases[index];
        const container = canvasToDelete.getElement().parentNode;
        
        // Se a página deletada for a ativa, mude para outra antes
        if (index === state.activeCanvasIndex) {
            const nextIndex = index > 0 ? index - 1 : 1;
            this.switchPage(nextIndex);
        }

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
        const btnPrev = document.getElementById('btn-prev-page');
        const btnNext = document.getElementById('btn-next-page');

        if (!container || !countDisplay) return;
        
        container.innerHTML = '';
        state.canvases.forEach((canvas, index) => {
            const item = document.createElement('div');
            item.style.position = 'relative';
            item.style.flexShrink = '0';
            
            const thumb = document.createElement('div');
            const isActive = index === state.activeCanvasIndex;
            thumb.className = `carousel-thumb ${isActive ? 'active' : ''}`;
            thumb.innerText = index + 1;
            thumb.onclick = () => this.switchPage(index);

            if (state.canvases.length > 1) {
                const delBtn = document.createElement('div');
                delBtn.className = 'carousel-del-btn';
                delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                delBtn.style.top = '-5px';
                delBtn.style.right = '-5px';
                delBtn.style.width = '18px';
                delBtn.style.height = '18px';
                delBtn.style.fontSize = '10px';
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.deletePage(index);
                };
                item.appendChild(delBtn);
            }

            item.appendChild(thumb);
            container.appendChild(item);
            
            if (isActive) {
                setTimeout(() => {
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }, 50);
            }
        });

        countDisplay.innerText = `${state.activeCanvasIndex + 1} / ${state.canvases.length}`;

        // Controlar opacidade das setas
        if (btnPrev && btnNext) {
            btnPrev.style.opacity = container.scrollLeft <= 0 ? '0.2' : '1';
            btnNext.style.opacity = (container.scrollLeft + container.offsetWidth >= container.scrollWidth) ? '0.2' : '1';
        }

        state.canvases.forEach((canvas, index) => {
            const container = canvas.getElement().parentNode;
            if (index === state.activeCanvasIndex) {
                container.style.outline = '3px solid var(--accent)';
                container.style.outlineOffset = '8px';
                container.style.boxShadow = '0 0 50px rgba(39, 174, 96, 0.2)';
                container.style.display = 'block';
            } else {
                container.style.outline = 'none';
                container.style.display = 'none';
            }
        });
    },

    reset() {
        while (state.canvases.length > 1) {
            const canvasToDelete = state.canvases[1];
            const container = canvasToDelete.getElement().parentNode;
            container.parentNode.removeChild(container);
            state.removeCanvas(1);
        }
        state.setActiveCanvas(0);
        this.updateUI();
    },

    async loadPages(pagesData, width, height) {
        this.reset();
        for (let i = 0; i < pagesData.length; i++) {
            if (i === 0) {
                const canvas = state.getCanvas();
                await new Promise(resolve => {
                    canvas.loadFromJSON(pagesData[i], () => {
                        canvas.setDimensions({ width, height });
                        canvas.renderAll();
                        resolve();
                    });
                });
            } else {
                this.addPage();
                const canvas = state.getCanvas();
                await new Promise(resolve => {
                    canvas.loadFromJSON(pagesData[i], () => {
                        canvas.setDimensions({ width, height });
                        canvas.renderAll();
                        resolve();
                    });
                });
            }
        }
        state.setActiveCanvas(0);
        this.updateUI();
    }
};

export function setupCarousel() {
    const btnAddPage = document.getElementById('btn-add-page');
    if (btnAddPage) btnAddPage.onclick = () => carousel.addPage();

    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');
    const pagesList = document.getElementById('carousel-pages');

    if (btnPrev && pagesList) {
        btnPrev.onclick = () => pagesList.scrollBy({ left: -120, behavior: 'smooth' });
    }
    if (btnNext && pagesList) {
        btnNext.onclick = () => pagesList.scrollBy({ left: 120, behavior: 'smooth' });
    }
    
    if (pagesList) {
        pagesList.onscroll = () => {
            if (btnPrev) btnPrev.style.opacity = pagesList.scrollLeft <= 0 ? '0.2' : '1';
            if (btnNext) btnNext.style.opacity = (pagesList.scrollLeft + pagesList.offsetWidth >= pagesList.scrollWidth - 5) ? '0.2' : '1';
        };
    }
}
