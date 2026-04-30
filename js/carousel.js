// js/carousel.js
import { state } from './state.js';
import { history } from './history.js';

export const carousel = {
    pages: [],
    currentIndex: 0,
    active: false,
    
    init() {
        const canvas = state.getCanvas();
        if (!canvas) return;
        this.pages = [ { json: canvas.toJSON(['productData', 'currentMode', 'isAlluCard', 'isAlluTable', 'selectable', 'hasControls', 'id']) } ];
        this.currentIndex = 0;
        this.active = true;
        
        const manager = document.getElementById('carousel-manager');
        if (manager) {
            manager.style.visibility = 'visible';
            manager.style.display = 'flex';
        }
        this.updateUI();
    },
    
    addPage() {
        const canvas = state.getCanvas();
        if (!canvas) return;

        // Salvar estado da página atual antes de mudar
        this.pages[this.currentIndex].json = canvas.toJSON(['productData', 'currentMode', 'isAlluCard', 'isAlluTable', 'selectable', 'hasControls', 'id']);
        
        // Nova página mantém o fundo da anterior
        const bgColor = canvas.backgroundColor;
        canvas.clear();
        canvas.setBackgroundColor(bgColor, canvas.renderAll.bind(canvas));
        
        this.pages.push({ json: canvas.toJSON(['productData', 'currentMode', 'isAlluCard', 'isAlluTable', 'selectable', 'hasControls', 'id']) });
        this.currentIndex = this.pages.length - 1;
        this.updateUI();
        history.save();
    },

    deletePage(index) {
        const canvas = state.getCanvas();
        if (!canvas) return;

        if (this.pages.length <= 1) return; // Não deleta a última
        if (!confirm('Deseja excluir esta página?')) return;
        
        this.pages.splice(index, 1);
        if (this.currentIndex >= this.pages.length) {
            this.currentIndex = this.pages.length - 1;
        }
        
        canvas.loadFromJSON(this.pages[this.currentIndex].json, () => {
            canvas.renderAll();
            this.updateUI();
        });
    },
    
    switchPage(index) {
        const canvas = state.getCanvas();
        if (!canvas) return;

        if (index === this.currentIndex) return;
        // Salvar estado da página atual
        this.pages[this.currentIndex].json = canvas.toJSON(['productData', 'currentMode', 'isAlluCard', 'isAlluTable', 'selectable', 'hasControls', 'id']);
        
        this.currentIndex = index;
        canvas.loadFromJSON(this.pages[index].json, () => {
            canvas.renderAll();
            this.updateUI();
        });
    },

    async exportAll(format = 'png') {
        const canvas = state.getCanvas();
        if (!canvas) return;

        const originalIndex = this.currentIndex;
        this.pages[this.currentIndex].json = canvas.toJSON(['productData', 'currentMode', 'isAlluCard', 'isAlluTable', 'selectable', 'hasControls', 'id']);
        
        for (let i = 0; i < this.pages.length; i++) {
            await new Promise(resolve => {
                canvas.loadFromJSON(this.pages[i].json, () => {
                    canvas.renderAll();
                    const dataURL = canvas.toDataURL({
                        format: format === 'jpg' ? 'jpeg' : format,
                        quality: 0.9,
                        multiplier: 2 // Alta resolução
                    });
                    
                    const link = document.createElement('a');
                    link.download = `Allu_Creative_Lab_Page_${i + 1}.${format}`;
                    link.href = dataURL;
                    link.click();
                    setTimeout(resolve, 500); // Pequeno delay para evitar sobrecarga de download
                });
            });
        }
        
        // Voltar para a página original
        canvas.loadFromJSON(this.pages[originalIndex].json, () => {
            canvas.renderAll();
            this.updateUI();
        });
    },
    
    updateUI() {
        const container = document.getElementById('carousel-pages');
        const countDisplay = document.getElementById('carousel-count');
        if (!container || !countDisplay) return;
        
        container.innerHTML = '';
        this.pages.forEach((page, index) => {
            const item = document.createElement('div');
            item.style.position = 'relative';
            
            const thumb = document.createElement('div');
            const isActive = index === this.currentIndex;
            thumb.className = `carousel-thumb ${isActive ? 'active' : ''}`;
            thumb.style.cssText = `
                width: 50px; height: 50px; background: ${isActive ? 'rgba(39, 174, 96, 0.1)' : 'rgba(255,255,255,0.05)'}; 
                border-radius: 12px; border: 2px solid ${isActive ? 'var(--accent)' : 'var(--glass-border)'}; 
                cursor: pointer; display: flex; align-items: center; justify-content: center; 
                font-size: 0.85rem; font-weight: 800; color: ${isActive ? 'var(--accent)' : 'white'};
                transition: all 0.2s; flex-shrink: 0; position: relative;
            `;
            thumb.innerText = index + 1;
            thumb.onclick = () => this.switchPage(index);

            // Botão de Deletar (apenas se tiver mais de 1 página)
            if (this.pages.length > 1) {
                const delBtn = document.createElement('div');
                delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                delBtn.style.cssText = `
                    position: absolute; top: -4px; right: -4px; width: 18px; height: 18px; 
                    background: #ff4444; color: white; border-radius: 50%; display: flex !important; 
                    align-items: center; justify-content: center; font-size: 10px; 
                    cursor: pointer; border: 1.5px solid #161617; z-index: 10;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                `;
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.deletePage(index);
                };
                item.appendChild(delBtn);
            }

            item.appendChild(thumb);
            container.appendChild(item);
        });
        countDisplay.innerText = `${this.currentIndex + 1} / ${this.pages.length}`;
    }
};

export function setupCarousel() {
    const btnAddPage = document.getElementById('btn-add-page');
    if (btnAddPage) {
        btnAddPage.onclick = () => carousel.addPage();
    }
}
