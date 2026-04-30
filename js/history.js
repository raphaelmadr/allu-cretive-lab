// js/history.js
import { state } from './state.js';
import { resizeCanvas } from './canvas.js';

export const history = {
    undoStack: [],
    redoStack: [],
    isProcessing: false,
    limit: 50,
    
    save() {
        const canvas = state.getCanvas();
        if (!canvas || this.isProcessing) return;
        const stateJSON = JSON.stringify(canvas.toJSON(['productData', 'currentMode', 'isAlluCard', 'isAlluTable', 'selectable', 'hasControls', 'id']));
        
        // Evitar duplicatas consecutivas
        if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === stateJSON) return;
        
        this.undoStack.push(stateJSON);
        this.redoStack = []; 
        
        if (this.undoStack.length > this.limit) this.undoStack.shift();
        this.updateButtons();
        this.autoSave(stateJSON);
    },
    
    undo() {
        const canvas = state.getCanvas();
        if (!canvas || this.undoStack.length <= 1) return;
        this.isProcessing = true;
        
        const currentState = this.undoStack.pop();
        this.redoStack.push(currentState);
        
        const prevState = this.undoStack[this.undoStack.length - 1];
        canvas.loadFromJSON(prevState, () => {
            canvas.renderAll();
            this.isProcessing = false;
            this.updateButtons();
            this.autoSave(prevState);
        });
    },
    
    redo() {
        const canvas = state.getCanvas();
        if (!canvas || this.redoStack.length === 0) return;
        this.isProcessing = true;
        
        const stateJSON = this.redoStack.pop();
        this.undoStack.push(stateJSON);
        
        canvas.loadFromJSON(stateJSON, () => {
            canvas.renderAll();
            this.isProcessing = false;
            this.updateButtons();
            this.autoSave(stateJSON);
        });
    },
    
    updateButtons() {
        const btnUndo = document.getElementById('btn-undo');
        const btnRedo = document.getElementById('btn-redo');
        if(btnUndo) btnUndo.style.opacity = this.undoStack.length <= 1 ? '0.3' : '1';
        if(btnRedo) btnRedo.style.opacity = this.redoStack.length === 0 ? '0.3' : '1';
    },

    autoSave(stateJSON) {
        localStorage.setItem('allu_canvas_draft', stateJSON);
        const formatDisplay = document.getElementById('format-display');
        if (formatDisplay) {
            localStorage.setItem('allu_canvas_format', formatDisplay.innerText);
        }
    },

    loadDraft() {
        const canvas = state.getCanvas();
        if (!canvas) return;

        const draft = localStorage.getItem('allu_canvas_draft');
        if (draft) {
            // Pequeno delay para garantir que os presets e outros carregaram
            setTimeout(() => {
                if (confirm('Encontramos um rascunho anterior. Deseja recuperá-lo?')) {
                    this.isProcessing = true;
                    canvas.loadFromJSON(draft, () => {
                        const format = localStorage.getItem('allu_canvas_format');
                        if(format) {
                            const formatDisplay = document.getElementById('format-display');
                            if (formatDisplay) formatDisplay.innerText = format;
                            
                            const match = format.match(/\((\d+)x(\d+)\)/);
                            if(match) {
                                const w = parseInt(match[1]);
                                const h = parseInt(match[2]);
                                resizeCanvas(w, h);
                            }
                        }
                        canvas.renderAll();
                        this.isProcessing = false;
                        this.undoStack = [draft];
                        this.updateButtons();
                        // Esconder modal se estiver visível
                        const modal = document.getElementById('onboarding-modal');
                        if(modal) modal.style.display = 'none';
                    });
                } else {
                    localStorage.removeItem('allu_canvas_draft');
                }
            }, 100);
        }
    }
};

export function setupHistoryEvents() {
    const canvas = state.getCanvas();
    if (!canvas) return;

    ['object:modified', 'object:added', 'object:removed'].forEach(event => {
        canvas.on(event, () => history.save());
    });

    const btnUndoElem = document.getElementById('btn-undo');
    const btnRedoElem = document.getElementById('btn-redo');
    if(btnUndoElem) btnUndoElem.onclick = () => history.undo();
    if(btnRedoElem) btnRedoElem.onclick = () => history.redo();

    // Atalhos de Teclado
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            if (e.shiftKey) history.redo();
            else history.undo();
            e.preventDefault();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            history.redo();
            e.preventDefault();
        }
        
        // Atalho Delete
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const active = canvas.getActiveObject();
            if (active && !active.isEditing) {
                canvas.remove(active);
                canvas.discardActiveObject();
                canvas.renderAll();
            }
        }
    });

    setTimeout(() => {
        history.save();
        // history.loadDraft(); // Alerta removido conforme solicitado pelo usuário
    }, 1000);
}
