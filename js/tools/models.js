// js/tools/models.js
import { state } from '../state.js';
import { history } from '../history.js';
import * as storage from '../storage.js';

let activeFolderId = null;

export function renderModelsTools(sidebarContent) {
    const div = document.createElement('div');
    div.className = 'animate-fade';
    sidebarContent.appendChild(div);

    // Inicializa com a primeira pasta se não houver ativa
    if (!activeFolderId) {
        activeFolderId = storage.getFolders(state.currentUser.id)[0]?.id || storage.getFolders()[0]?.id;
    }

    function rebuild() {
        div.innerHTML = '';
        
        // 1. Lista de Pastas (Abas horizontais)
        const folderNav = document.createElement('div');
        folderNav.style.cssText = 'display:flex;gap:6px;overflow-x:auto;padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid var(--glass-border);scrollbar-width:none;';
        
        storage.getFolders().forEach(f => {
            const btn = document.createElement('button');
            const isActive = f.id === activeFolderId;
            btn.textContent = f.name;
            btn.style.cssText = `
                padding:6px 12px;border-radius:20px;font-size:.65rem;font-weight:700;white-space:nowrap;cursor:pointer;
                border:1px solid ${isActive ? 'var(--accent)' : 'var(--glass-border)'};
                background:${isActive ? 'var(--accent)' : 'rgba(255,255,255,.03)'};
                color:${isActive ? 'white' : 'var(--text-secondary)'};
                transition:all .2s;
            `;
            btn.onclick = () => { activeFolderId = f.id; rebuild(); };
            folderNav.appendChild(btn);
        });

        // Botão Nova Pasta
        const addFolder = document.createElement('button');
        addFolder.innerHTML = '<i class="fa-solid fa-plus"></i>';
        addFolder.style.cssText = 'padding:6px 10px;border-radius:20px;border:1px dashed var(--glass-border);background:transparent;color:var(--text-secondary);cursor:pointer;font-size:.65rem;';
        addFolder.onclick = () => {
            const name = prompt('Nome da nova pasta:');
            if (name) {
                const f = storage.createFolder(name, state.currentUser.id);
                activeFolderId = f.id;
                rebuild();
            }
        };
        folderNav.appendChild(addFolder);
        div.appendChild(folderNav);

        // 2. Grid de Designs
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;';
        
        const designs = storage.getDesigns(activeFolderId);
        if (designs.length === 0) {
            grid.innerHTML = '<div style="grid-column:span 2;text-align:center;padding:20px;opacity:.3;font-size:.7rem;">Pasta vazia</div>';
        }

        designs.forEach(d => {
            const card = document.createElement('div');
            card.style.cssText = 'background:rgba(255,255,255,.03);border:1px solid var(--glass-border);border-radius:12px;overflow:hidden;cursor:pointer;transition:all .2s;';
            card.innerHTML = `
                <div style="aspect-ratio:1.2;background:rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;position:relative;">
                    <img src="${d.thumbnail}" style="max-width:90%;max-height:90%;object-fit:contain;">
                    ${d.userId !== state.currentUser.id ? '<i class="fa-solid fa-lock" title="Modelo Protegido" style="position:absolute;top:5px;right:5px;font-size:.5rem;opacity:.5;"></i>' : ''}
                </div>
                <div style="padding:8px 10px;">
                    <div style="font-size:.68rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.name}</div>
                    <div style="font-size:.55rem;opacity:.5;margin-top:2px;">${new Date(d.updatedAt).toLocaleDateString()}</div>
                </div>
            `;
            card.onclick = () => {
                if (confirm(`Carregar "${d.name}"?`)) {
                    loadDesign(d);
                    rebuild();
                }
            };
            grid.appendChild(card);
        });
        div.appendChild(grid);

        // 3. Rodapé: Salvar Arte
        const activeDesign = state.activeDesignId ? storage.getDesignById(state.activeDesignId) : null;
        const isOwner = activeDesign && activeDesign.userId === state.currentUser.id;

        const saveSection = document.createElement('div');
        saveSection.style.cssText = 'padding-top:16px;border-top:1px solid var(--glass-border);';
        saveSection.innerHTML = `
            <p style="font-size:.6rem;text-transform:uppercase;opacity:.5;margin-bottom:8px;font-weight:800;">Salvar na pasta atual</p>
            <div style="display:flex;gap:6px;">
                <input id="mdl-name" type="text" placeholder="Nome da arte..." value="${activeDesign ? activeDesign.name : ''}"
                    style="flex:1;padding:10px;border-radius:10px;border:1px solid var(--glass-border);background:rgba(255,255,255,.05);color:white;font-size:.8rem;outline:none;">
                <button id="mdl-save" style="padding:10px 14px;border-radius:10px;background:var(--accent);color:white;border:none;cursor:pointer;font-size:.8rem;">
                    <i class="fa-solid ${isOwner ? 'fa-floppy-disk' : 'fa-plus'}"></i>
                </button>
            </div>
            ${!isOwner && state.activeDesignId ? '<p style="font-size:.55rem;color:var(--accent);margin-top:6px;font-weight:600;">Salvando como novo arquivo (cópia)</p>' : ''}
        `;

        saveSection.querySelector('#mdl-save').onclick = async () => {
            const name = saveSection.querySelector('#mdl-name').value.trim() || 'Nova Arte';
            const canvas = state.getCanvas();
            const thumbScale = 160 / Math.max(canvas.width, canvas.height);
            
            const designData = {
                id: isOwner ? state.activeDesignId : ('d-' + Date.now()),
                name,
                folderId: activeFolderId,
                userId: state.currentUser.id,
                width: canvas.width,
                height: canvas.height,
                thumbnail: canvas.toDataURL({ format: 'png', quality: 0.6, multiplier: thumbScale }),
                canvasData: canvas.toJSON(['isBadge', 'badgePresetId', 'badgeShape', 'isAlluCard', 'isAlluTable', 'productData'])
            };

            state.activeDesignId = storage.saveDesign(designData);
            rebuild();
        };
        div.appendChild(saveSection);
    }

    function loadDesign(design) {
        const canvas = state.getCanvas();
        canvas.loadFromJSON(design.canvasData, () => {
            canvas.setDimensions({ width: design.width, height: design.height });
            canvas.renderAll();
            state.activeDesignId = design.id;
            history.save();
        });
    }

    rebuild();
}
