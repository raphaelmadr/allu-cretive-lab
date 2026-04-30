// js/tools/layers.js
import { state } from '../state.js';
import { history } from '../history.js';

export function renderLayersTools(sidebarContent) {
    const canvas = state.getCanvas();
    if (!canvas) return;

    const div = document.createElement('div');
    div.className = 'animate-fade';
    
    let layersHTML = `
        <p class="subtitle">Organizar elementos</p>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:20px;">
            <button id="layer-up" class="btn-tool" style="width:100%; border:1px solid var(--glass-border); padding:15px; height:auto; flex-direction:column;">
                <i class="fa-solid fa-layer-group"></i>
                <span style="font-size:0.7rem; margin-top:5px;">Trazer para Frente</span>
            </button>
            <button id="layer-down" class="btn-tool" style="width:100%; border:1px solid var(--glass-border); padding:15px; height:auto; flex-direction:column;">
                <i class="fa-solid fa-layer-group" style="transform: scaleY(-1)"></i>
                <span style="font-size:0.7rem; margin-top:5px;">Enviar para Trás</span>
            </button>
        </div>
        
        <p class="subtitle">Lista de Camadas</p>
        <div id="layers-list" style="display:flex; flex-direction:column; gap:8px; max-height:400px; overflow-y:auto; padding-right:5px;">
    `;

    const objects = canvas.getObjects().slice().reverse(); // Topmost first
    
    if (objects.length === 0) {
        layersHTML += `<p style="font-size:0.75rem; color:var(--text-secondary); text-align:center; padding:20px;">Nenhum elemento no canvas</p>`;
    }

    objects.forEach((obj, idx) => {
        const type = obj.type;
        let icon = 'fa-shapes';
        let name = obj.id || `Camada ${objects.length - idx}`;
        
        if (type === 'i-text' || type === 'text' || type === 'textbox') {
            icon = 'fa-font';
            name = obj.text ? (obj.text.substring(0, 15) + (obj.text.length > 15 ? '...' : '')) : 'Texto';
        } else if (type === 'image') {
            icon = 'fa-image';
            if (obj.productData) name = obj.productData.name;
        } else if (obj.isAlluCard) {
            icon = 'fa-address-card';
            name = "Card de Produto";
        } else if (obj.isAlluTable) {
            icon = 'fa-table-list';
            name = "Tabela de Preços";
        }

        const isActive = canvas.getActiveObject() === obj;
        const isVisible = obj.visible !== false;
        const isLocked = obj.lockMovementX === true;

        layersHTML += `
            <div class="layer-item ${isActive ? 'active' : ''}" data-index="${objects.length - 1 - idx}" style="display:flex; align-items:center; gap:10px; background:${isActive ? 'rgba(39, 174, 96, 0.2)' : 'rgba(255,255,255,0.05)'}; padding:10px; border-radius:8px; border:1px solid ${isActive ? 'var(--accent)' : 'var(--glass-border)'}; cursor:pointer; transition:all 0.2s;">
                <i class="fa-solid ${icon}" style="font-size:0.8rem; color:${isActive ? 'var(--accent)' : 'var(--text-secondary)'}; width:20px; text-align:center;"></i>
                <span style="font-size:0.75rem; color:white; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</span>
                <div style="display:flex; gap:8px;">
                    <i class="fa-solid ${isVisible ? 'fa-eye' : 'fa-eye-slash'} btn-layer-vis" title="Alternar Visibilidade" style="font-size:0.75rem; color:var(--text-secondary); cursor:pointer;"></i>
                    <i class="fa-solid ${isLocked ? 'fa-lock' : 'fa-lock-open'} btn-layer-lock" title="Bloquear/Desbloquear" style="font-size:0.75rem; color:var(--text-secondary); cursor:pointer;"></i>
                </div>
            </div>
        `;
    });

    layersHTML += `</div>`;
    
    layersHTML += `
        <button id="delete-element" class="btn-primary" style="width:100%; margin-top:20px; padding:12px; border-radius:8px; background:#ff4444; color:white; border:none; cursor:pointer; font-weight:700;">
            <i class="fa-solid fa-trash"></i> Excluir Selecionado
        </button>
    `;
    
    div.innerHTML = layersHTML;
    
    // Eventos
    div.querySelectorAll('.layer-item').forEach(item => {
        const idx = parseInt(item.dataset.index);
        const obj = canvas.getObjects()[idx];

        item.onclick = (e) => {
            if (e.target.classList.contains('btn-layer-vis') || e.target.classList.contains('btn-layer-lock')) return;
            canvas.setActiveObject(obj);
            canvas.renderAll();
            
            sidebarContent.innerHTML = '';
            renderLayersTools(sidebarContent); // Re-render to show active state
        };

        const btnVis = item.querySelector('.btn-layer-vis');
        if (btnVis) {
            btnVis.onclick = (e) => {
                e.stopPropagation();
                obj.set('visible', !obj.visible);
                canvas.renderAll();
                sidebarContent.innerHTML = '';
                renderLayersTools(sidebarContent);
                history.save();
            };
        }

        const btnLock = item.querySelector('.btn-layer-lock');
        if (btnLock) {
            btnLock.onclick = (e) => {
                e.stopPropagation();
                const lock = !obj.lockMovementX;
                obj.set({
                    lockMovementX: lock,
                    lockMovementY: lock,
                    lockRotation: lock,
                    lockScalingX: lock,
                    lockScalingY: lock,
                    hasControls: !lock
                });
                canvas.renderAll();
                sidebarContent.innerHTML = '';
                renderLayersTools(sidebarContent);
                history.save();
            };
        }
    });

    const btnLayerUp = div.querySelector('#layer-up');
    if (btnLayerUp) {
        btnLayerUp.onclick = () => {
            const active = canvas.getActiveObject();
            if(active) {
                canvas.bringForward(active);
                canvas.renderAll();
                sidebarContent.innerHTML = '';
                renderLayersTools(sidebarContent);
                history.save();
            }
        };
    }

    const btnLayerDown = div.querySelector('#layer-down');
    if (btnLayerDown) {
        btnLayerDown.onclick = () => {
            const active = canvas.getActiveObject();
            if(active) {
                canvas.sendBackwards(active);
                canvas.renderAll();
                sidebarContent.innerHTML = '';
                renderLayersTools(sidebarContent);
                history.save();
            }
        };
    }

    const btnDelete = div.querySelector('#delete-element');
    if (btnDelete) {
        btnDelete.onclick = () => {
            const active = canvas.getActiveObject();
            if(active) {
                canvas.remove(active);
                canvas.discardActiveObject();
                canvas.renderAll();
                sidebarContent.innerHTML = '';
                renderLayersTools(sidebarContent);
                history.save();
            }
        };
    }

    sidebarContent.appendChild(div);
}
