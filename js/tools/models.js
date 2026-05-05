// js/tools/models.js
// Gerencia o catálogo de artes, pastas e usuários com lógica de templates compartilhados.

import { state } from '../state.js';
import { history } from '../history.js';
import * as storage from '../storage.js';

// ── View State ─────────────────────────────────────────────────────────────────
let currentView = 'USERS'; // USERS, FOLDERS, DESIGNS
let selectedUserId = null;
let selectedFolderId = null;

// ── Core Functions ─────────────────────────────────────────────────────────────
async function saveCurrentCanvas(name, folderId) {
    const canvas = state.getCanvas();
    if (!canvas) return null;

    const canvasJSON = canvas.toJSON(['isBadge', 'badgePresetId', 'badgeShape',
        'isAlluCard', 'isAlluTable', 'productData', 'currentMode']);

    const thumbScale = 160 / Math.max(canvas.width, canvas.height);
    const thumb = canvas.toDataURL({ format: 'png', quality: 0.6, multiplier: thumbScale });

    const designId = state.activeDesignId;
    const existing = designId ? storage.getDesignById(designId) : null;

    // Se é o dono do design, atualiza. Senão, cria novo (cópia).
    const isOwner = existing && existing.userId === state.currentUser.id;
    
    const designData = {
        id: isOwner ? designId : ('d-' + Date.now()),
        name,
        folderId: folderId || (storage.getFolders(state.currentUser.id)[0]?.id),
        userId: state.currentUser.id,
        width: canvas.width,
        height: canvas.height,
        thumbnail: thumb,
        canvasData: canvasJSON,
    };

    const savedId = storage.saveDesign(designData);
    state.activeDesignId = savedId;
    return savedId;
}

function loadDesign(design) {
    const canvas = state.getCanvas();
    if (!canvas || !design.canvasData) return;

    canvas.loadFromJSON(design.canvasData, () => {
        canvas.setDimensions({ width: design.width, height: design.height }, { backstoreOnly: false });
        canvas.renderAll();
        state.activeDesignId = design.id;
        history.save();
    });
}

// ── UI Rendering ───────────────────────────────────────────────────────────────
export function renderModelsTools(sidebarContent) {
    const div = document.createElement('div');
    div.className = 'animate-fade';
    sidebarContent.appendChild(div);
    rebuildUI(div);
}

function rebuildUI(container) {
    container.innerHTML = '';
    
    // Header & Breadcrumbs
    renderHeader(container);

    const mainArea = document.createElement('div');
    mainArea.style.marginTop = '12px';
    container.appendChild(mainArea);

    if (currentView === 'USERS') {
        renderUsers(mainArea);
    } else if (currentView === 'FOLDERS') {
        renderFolders(mainArea);
    } else if (currentView === 'DESIGNS') {
        renderDesigns(mainArea);
    }

    // Floating Save Action (if canvas has content)
    renderSaveAction(container);
}

function renderHeader(container) {
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--glass-border);';
    
    const crumbs = [{ label: 'Catálogos', view: 'USERS' }];
    if (selectedUserId) {
        const u = storage.getUsers().find(u => u.id === selectedUserId);
        crumbs.push({ label: u.name.split(' ')[0], view: 'FOLDERS' });
    }
    if (selectedFolderId) {
        const f = storage.getFolders().find(f => f.id === selectedFolderId);
        crumbs.push({ label: f.name, view: 'DESIGNS' });
    }

    crumbs.forEach((c, i) => {
        const span = document.createElement('span');
        span.textContent = c.label;
        span.style.cssText = `font-size:.7rem;font-weight:700;cursor:pointer;opacity:${i === crumbs.length - 1 ? 1 : 0.5};`;
        if (i < crumbs.length - 1) {
            span.onclick = () => {
                currentView = c.view;
                if (c.view === 'USERS') { selectedUserId = null; selectedFolderId = null; }
                if (c.view === 'FOLDERS') { selectedFolderId = null; }
                rebuildUI(container.parentElement);
            };
            const sep = document.createElement('span');
            sep.textContent = ' / ';
            sep.style.cssText = 'font-size:.6rem;opacity:.3;margin:0 4px;';
            header.appendChild(span);
            header.appendChild(sep);
        } else {
            header.appendChild(span);
        }
    });

    container.appendChild(header);
}

function renderUsers(container) {
    const users = storage.getUsers();
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';

    users.forEach(u => {
        const card = document.createElement('div');
        card.style.cssText = `
            background:rgba(255,255,255,.03);border:1px solid var(--glass-border);
            border-radius:12px;padding:12px;text-align:center;cursor:pointer;transition:all .2s;
        `;
        card.innerHTML = `
            <div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.05);margin:0 auto 8px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid var(--accent-low);">
                ${u.avatar ? `<img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover;">` : `<i class="fa-solid fa-user" style="opacity:.3;"></i>`}
            </div>
            <div style="font-size:.72rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.name}</div>
            <div style="font-size:.58rem;opacity:.5;margin-top:2px;">${storage.getFolders(u.id).length} Pastas</div>
        `;
        card.onclick = () => {
            selectedUserId = u.id;
            currentView = 'FOLDERS';
            rebuildUI(container.parentElement);
        };
        grid.appendChild(card);
    });
    container.appendChild(grid);
}

function renderFolders(container) {
    const folders = storage.getFolders(selectedUserId);
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr;gap:8px;';

    folders.forEach(f => {
        const card = document.createElement('div');
        card.style.cssText = `
            background:rgba(255,255,255,.03);border:1px solid var(--glass-border);
            border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all .15s;
        `;
        card.innerHTML = `
            <i class="fa-solid fa-folder" style="color:var(--accent);font-size:.9rem;opacity:.8;"></i>
            <div style="flex:1;">
                <div style="font-size:.75rem;font-weight:700;">${f.name}</div>
                <div style="font-size:.58rem;opacity:.5;">${storage.getDesigns(f.id).length} modelos</div>
            </div>
            <i class="fa-solid fa-chevron-right" style="font-size:.6rem;opacity:.2;"></i>
        `;
        card.onclick = () => {
            selectedFolderId = f.id;
            currentView = 'DESIGNS';
            rebuildUI(container.parentElement);
        };
        grid.appendChild(card);
    });

    if (selectedUserId === state.currentUser.id) {
        const addBtn = document.createElement('button');
        addBtn.style.cssText = 'width:100%;padding:10px;border-radius:10px;border:1px dashed var(--glass-border);background:transparent;color:var(--text-secondary);font-size:.68rem;cursor:pointer;margin-top:8px;';
        addBtn.innerHTML = '<i class="fa-solid fa-plus" style="margin-right:6px;"></i> Nova Pasta';
        addBtn.onclick = () => {
            const name = prompt('Nome da pasta:');
            if (name) {
                storage.createFolder(name, state.currentUser.id);
                rebuildUI(container.parentElement);
            }
        };
        grid.appendChild(addBtn);
    }

    container.appendChild(grid);
}

function renderDesigns(container) {
    const designs = storage.getDesigns(selectedFolderId);
    if (designs.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:30px;opacity:.3;font-size:.75rem;">Pasta vazia</div>`;
        return;
    }

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';

    designs.forEach(d => {
        const card = document.createElement('div');
        card.style.cssText = `
            background:rgba(255,255,255,.02);border:1px solid var(--glass-border);
            border-radius:12px;overflow:hidden;cursor:pointer;transition:all .2s;
        `;
        card.innerHTML = `
            <div style="aspect-ratio:1;background:rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;">
                <img src="${d.thumbnail}" style="max-width:90%;max-height:90%;object-fit:contain;">
            </div>
            <div style="padding:8px 10px;">
                <div style="font-size:.68rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.name}</div>
                <div style="font-size:.55rem;opacity:.5;margin-top:2px;">${d.width}x${d.height}</div>
            </div>
        `;
        card.onclick = () => {
            if (confirm(`Abrir "${d.name}"?`)) {
                loadDesign(d);
            }
        };
        grid.appendChild(card);
    });
    container.appendChild(grid);
}

function renderSaveAction(container) {
    const designId = state.activeDesignId;
    const existing = designId ? storage.getDesignById(designId) : null;
    const isOwner = existing && existing.userId === state.currentUser.id;

    const div = document.createElement('div');
    div.style.cssText = 'margin-top:24px;padding-top:16px;border-top:1px solid var(--glass-border);';
    
    div.innerHTML = `
        <p style="font-size:.6rem;text-transform:uppercase;opacity:.5;margin-bottom:10px;font-weight:800;letter-spacing:0.05em;">Salvar Arte Atual</p>
        <div style="display:flex;gap:8px;">
            <input id="save-name" type="text" placeholder="Nome da arte…" value="${existing ? existing.name : ''}"
                style="flex:1;padding:10px;border-radius:10px;border:1px solid var(--glass-border);background:rgba(255,255,255,.05);color:white;font-size:.8rem;font-family:inherit;outline:none;">
            <button id="btn-save-main" style="padding:10px 16px;border-radius:10px;background:var(--accent);color:white;border:none;cursor:pointer;font-size:.8rem;font-weight:800;display:flex;align-items:center;gap:6px;">
                <i class="fa-solid ${isOwner ? 'fa-floppy-disk' : 'fa-copy'}"></i>
            </button>
        </div>
        ${!isOwner && designId ? `<p style="font-size:.55rem;color:var(--accent);margin-top:8px;font-weight:600;"><i class="fa-solid fa-circle-info"></i> Você está visualizando um modelo. O salvamento criará uma cópia na sua pasta.</p>` : ''}
    `;

    div.querySelector('#btn-save-main').onclick = async () => {
        const nameInput = div.querySelector('#save-name');
        const name = nameInput.value.trim() || 'Nova Arte';
        const savedId = await saveCurrentCanvas(name, isOwner ? existing.folderId : null);
        if (savedId) {
            alert(isOwner ? 'Alterações salvas!' : 'Cópia criada com sucesso na sua pasta!');
            rebuildUI(container);
        }
    };

    container.appendChild(div);
}
