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
        const onboardingModal = document.getElementById('onboarding-modal');
        const isShowingOnboarding = onboardingModal && onboardingModal.style.display !== 'none';
        if (manager) {
            manager.style.display = isShowingOnboarding ? 'none' : 'flex';
        }
        
        const initialCanvas = state.getCanvas();
        if (initialCanvas) {
            if (state.canvases.length === 0) state.setCanvas(initialCanvas);
            
            // Listeners para a primeira página
            initialCanvas.on('selection:created', () => this.onSelection(initialCanvas));
            initialCanvas.on('selection:updated', () => this.onSelection(initialCanvas));
            initialCanvas.on('mouse:down', () => this.onSelection(initialCanvas));
        }

        
        this.updateUI();
    },
    
    addPage(w, h) {
        const activePreset = state.getActivePreset() || { w: 1080, h: 1080 };
        const pageW = w || activePreset.w;
        const pageH = h || activePreset.h;
        
        const wrapper = document.getElementById('canvas-wrapper');
        if (!wrapper) return;

        const canvasId = `canvas-${Date.now()}`;
        const newCanvasEl = document.createElement('canvas');
        newCanvasEl.id = canvasId;
        wrapper.appendChild(newCanvasEl);

        const newCanvas = new fabric.Canvas(canvasId, {
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
            width: pageW,
            height: pageH
        });
        
        newCanvas.originalW = pageW;
        newCanvas.originalH = pageH;

        setupCanvas(); 

        newCanvas.on('selection:created', () => this.onSelection(newCanvas));
        newCanvas.on('selection:updated', () => this.onSelection(newCanvas));
        newCanvas.on('mouse:down', () => this.onSelection(newCanvas)); // Clique para focar página
        newCanvas.on('object:modified', () => history.save());

        newCanvas.on('object:added', () => history.save());
        newCanvas.on('object:removed', () => history.save());

        state.addCanvas(newCanvas);
        resizeCanvas();
        
        setTimeout(() => {
            newCanvasEl.parentNode.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }, 100);

        this.updateUI();
        history.save();
    },

    duplicatePage() {
        const activeIndex = state.activeCanvasIndex;
        const activeCanvas = state.getCanvas();
        if (!activeCanvas) return;

        // Desmarcar objeto ativo no canvas original para não copiar a caixa de seleção
        activeCanvas.discardActiveObject();
        activeCanvas.renderAll();

        const activePreset = state.getActivePreset() || { w: 1080, h: 1080 };
        const currentContainer = activeCanvas.getElement().parentNode;

        // Serializar o canvas ativo com as propriedades customizadas necessárias
        const serializationProps = [
            'productData', 'currentMode', 'isAlluCard', 'isAlluTable', 'selectable', 'hasControls', 'id', 
            'isBadge', 'badgePresetId', 'badgeShape', 'innerShadowBlur', 'innerShadowColor', 'innerShadowOffsetX', 
            'innerShadowOffsetY', 'charSpacing', 'lineHeight', 'shadow', 'fakePriceCard', 'priceCard', 
            'fakePriceMonths', 'priceMonths', 'isDiscountBadgeRect', 'isDiscountBadgeText', 'showDiscountBadge'
        ];
        const canvasData = activeCanvas.toJSON(serializationProps);

        // Manter o mesmo tamanho da página original
        const pageW = activeCanvas.originalW || activePreset.w;
        const pageH = activeCanvas.originalH || activePreset.h;

        // Criar elemento canvas no DOM inserindo imediatamente após o atual
        const canvasId = `canvas-${Date.now()}`;
        const newCanvasEl = document.createElement('canvas');
        newCanvasEl.id = canvasId;
        currentContainer.parentNode.insertBefore(newCanvasEl, currentContainer.nextSibling);

        // Inicializar instância do Fabric.js
        const newCanvas = new fabric.Canvas(canvasId, {
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
            width: pageW,
            height: pageH
        });
        newCanvas.originalW = pageW;
        newCanvas.originalH = pageH;

        setupCanvas();

        // Vincular eventos do Fabric.js ao novo canvas
        newCanvas.on('selection:created', () => this.onSelection(newCanvas));
        newCanvas.on('selection:updated', () => this.onSelection(newCanvas));
        newCanvas.on('mouse:down', () => this.onSelection(newCanvas));
        newCanvas.on('object:modified', () => history.save());
        newCanvas.on('object:added', () => history.save());
        newCanvas.on('object:removed', () => history.save());

        // Inserir o novo canvas no array de estado logo após o índice ativo
        state.canvases.splice(activeIndex + 1, 0, newCanvas);
        
        // Selecionar o novo canvas
        state.setActiveCanvas(activeIndex + 1);

        // Redimensionar e aplicar zoom em todos os canvases
        resizeCanvas();

        // Carregar conteúdo serializado no novo canvas
        newCanvas.loadFromJSON(canvasData, () => {
            newCanvas.renderAll();

            setTimeout(() => {
                const container = newCanvas.getElement().parentNode;
                container.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }, 100);

            this.updateUI();
            history.save();
        });
    },

    onSelection(canvasInstance) {
        // Durante o modo de recorte (js/tools/properties.js), qualquer clique no
        // retângulo de recorte passaria por aqui e forçaria a aba "Propriedades"
        // de volta ao estado genérico, destruindo o painel "Modo de Recorte Ativo".
        if (state.cropModeActive) return;

        const index = state.canvases.indexOf(canvasInstance);
        if (index !== -1) {
            state.setActiveCanvas(index);
            this.updateUI();

            // Centralizar a página ativa no viewport do canvas
            const container = canvasInstance.getElement().parentNode;
            if (container) {
                container.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }

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
        if (!state.canvases || state.canvases.length === 0) {
            console.error("Nenhuma página encontrada para exportar.");
            return;
        }

        const originalIndex = state.activeCanvasIndex;
        for (let i = 0; i < state.canvases.length; i++) {
            const canvas = state.canvases[i];
            if (!canvas) continue;

            canvas.discardActiveObject();
            canvas.renderAll();
            
            try {
                const dataURL = canvas.toDataURL({
                    format: format === 'jpg' ? 'jpeg' : format,
                    quality: 1.0,
                    multiplier: 4 // Alta resolução (4x)
                });

                const link = document.createElement('a');
                
                const filenameInput = document.getElementById('export-filename');
                let baseName = (filenameInput && filenameInput.value.trim() !== '') ? filenameInput.value.trim() : 'Allu_Creative_Lab_Page';
                
                let finalName = baseName;
                
                // Remover extensões se colado sem querer
                if(finalName.endsWith('.png')) finalName = finalName.slice(0, -4);
                if(finalName.endsWith('.jpg')) finalName = finalName.slice(0, -4);

                if (canvas.formatName) {
                    // Adiciona o nome do formato como sufixo final (ex: IMG_..._#001_Feed)
                    finalName = `${finalName}_${canvas.formatName.replace(/\s+/g, '')}`;
                } else {
                    const match = finalName.match(/(.*[#_])(\d+)$/);
                    if (match) {
                        const prefix = match[1];
                        const numLen = match[2].length;
                        const paddedNum = String(i + 1).padStart(numLen, '0');
                        finalName = `${prefix}${paddedNum}`;
                    } else if (state.canvases.length > 1) {
                        finalName = `${finalName}_${i + 1}`;
                    }
                }

                link.download = `${finalName}.${format}`;
                link.href = dataURL;
                link.click();
            } catch (err) {
                console.error(`Erro ao exportar página ${i + 1}:`, err);
                // Continuar para as próximas páginas mesmo se uma falhar
            }
            
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
                container.style.opacity = '1';
            } else {
                container.style.outline = '1px solid rgba(255,255,255,0.1)';
                container.style.outlineOffset = '8px';
                container.style.boxShadow = 'none';
                container.style.opacity = '0.2';
            }
            container.style.display = 'block';
            container.style.marginBottom = '0'; // Remove margem vertical
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
                        // Resgatar originalW salvo no state ou do preset atual
                        const w = canvas.originalW || width;
                        const h = canvas.originalH || height;
                        canvas.originalW = w;
                        canvas.originalH = h;
                        canvas.setDimensions({ width: w, height: h });
                        canvas.renderAll();
                        resolve();
                    });
                });
            } else {
                this.addPage(width, height);
                const canvas = state.getCanvas();
                await new Promise(resolve => {
                    canvas.loadFromJSON(pagesData[i], () => {
                        canvas.renderAll();
                        resolve();
                    });
                });
            }
        }
        state.setActiveCanvas(0);
        resizeCanvas();
        this.updateUI();
    }
};

export function setupCarousel() {
    const btnAddPage = document.getElementById('btn-add-page');
    if (btnAddPage) btnAddPage.onclick = () => carousel.addPage();

    const btnDuplicatePage = document.getElementById('btn-duplicate-page');
    if (btnDuplicatePage) btnDuplicatePage.onclick = () => carousel.duplicatePage();

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
