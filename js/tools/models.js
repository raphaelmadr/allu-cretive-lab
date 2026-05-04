// js/tools/models.js
// Salva e carrega artes completas (canvas inteiro) como modelos reutilizáveis.
import { state } from '../state.js';
import { history } from '../history.js';

const LS_KEY = 'allu-canvas-models';

// ── Storage ────────────────────────────────────────────────────────────────────
function getModels() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
    catch { return []; }
}
function saveModels(models) {
    localStorage.setItem(LS_KEY, JSON.stringify(models));
}

// ── Salvar arte atual ──────────────────────────────────────────────────────────
function saveCurrentCanvas(name) {
    const canvas = state.getCanvas();
    if (!canvas) return null;

    // Serializa todos os objetos + background + dimensões
    const canvasJSON = canvas.toJSON(['isBadge', 'badgePresetId', 'badgeShape',
        'isAlluCard', 'isAlluTable', 'productData', 'currentMode']);

    // Thumbnail (baixa resolução para não pesar o localStorage)
    const thumbScale = 160 / Math.max(canvas.width, canvas.height);
    const thumb = canvas.toDataURL({
        format: 'png',
        quality: 0.6,
        multiplier: thumbScale,
    });

    const model = {
        id: 'model-' + Date.now(),
        name,
        width: canvas.width,
        height: canvas.height,
        thumbnail: thumb,
        canvasData: canvasJSON,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const models = getModels();
    models.unshift(model); // mais recente primeiro
    saveModels(models);
    return model;
}

// ── Carregar arte ──────────────────────────────────────────────────────────────
function loadModel(model) {
    const canvas = state.getCanvas();
    if (!canvas || !model.canvasData) return;

    canvas.loadFromJSON(model.canvasData, () => {
        canvas.setDimensions({ width: model.width, height: model.height }, { backstoreOnly: false });
        canvas.renderAll();
        history.save();
    });
}

// ── Atualizar modelo existente ─────────────────────────────────────────────────
function updateModel(modelId) {
    const canvas = state.getCanvas();
    if (!canvas) return;

    const models = getModels();
    const idx = models.findIndex(m => m.id === modelId);
    if (idx === -1) return;

    const canvasJSON = canvas.toJSON(['isBadge', 'badgePresetId', 'badgeShape',
        'isAlluCard', 'isAlluTable', 'productData', 'currentMode']);

    const thumbScale = 160 / Math.max(canvas.width, canvas.height);
    const thumb = canvas.toDataURL({ format: 'png', quality: 0.6, multiplier: thumbScale });

    models[idx].canvasData = canvasJSON;
    models[idx].thumbnail = thumb;
    models[idx].width = canvas.width;
    models[idx].height = canvas.height;
    models[idx].updatedAt = new Date().toISOString();

    saveModels(models);
}

// ── Sidebar UI ─────────────────────────────────────────────────────────────────
export function renderModelsTools(sidebarContent) {
    const div = document.createElement('div');
    div.className = 'animate-fade';
    sidebarContent.appendChild(div);
    rebuildUI(div);
}

function rebuildUI(container) {
    const models = getModels();
    container.innerHTML = '';

    // ── Botão Salvar Arte Atual ─────────────────────────────────────────────
    const saveSection = document.createElement('div');
    saveSection.style.cssText = 'margin-bottom:20px;';
    saveSection.innerHTML = `
        <div style="display:flex;gap:8px;">
            <input id="mdl-name" type="text" placeholder="Nome do modelo…"
                style="flex:1;padding:10px 12px;border-radius:8px;border:1px solid var(--glass-border);background:rgba(255,255,255,.05);color:white;font-size:.82rem;font-family:inherit;outline:none;">
            <button id="mdl-save" title="Salvar" style="padding:10px 16px;border-radius:8px;background:var(--accent);color:white;border:none;cursor:pointer;font-size:.82rem;font-weight:800;font-family:inherit;display:flex;align-items:center;gap:6px;transition:all .2s;">
                <i class="fa-solid fa-floppy-disk"></i>
            </button>
        </div>
    `;
    container.appendChild(saveSection);

    saveSection.querySelector('#mdl-save').onclick = () => {
        const nameInput = saveSection.querySelector('#mdl-name');
        const name = nameInput.value.trim() || ('Arte ' + new Date().toLocaleDateString('pt-BR'));
        const saved = saveCurrentCanvas(name);
        if (saved) {
            nameInput.value = '';
            rebuildUI(container);
        }
    };

    // ── Grid de modelos ────────────────────────────────────────────────────
    if (models.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'text-align:center;padding:40px 16px;color:var(--text-secondary);';
        empty.innerHTML = `
            <i class="fa-solid fa-folder-open" style="font-size:2rem;margin-bottom:12px;display:block;opacity:.35;"></i>
            <p style="font-size:.85rem;font-weight:600;">Nenhum modelo salvo</p>
            <p style="font-size:.72rem;margin-top:6px;line-height:1.5;">Crie sua arte no canvas e clique em <b>Salvar</b> acima.<br>Qualquer pessoa pode abrir e editar.</p>
        `;
        container.appendChild(empty);
    } else {
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;';

        models.forEach(model => {
            const card = document.createElement('div');
            card.style.cssText = `
                position:relative;background:rgba(255,255,255,.03);border:1px solid var(--glass-border);
                border-radius:12px;overflow:hidden;cursor:pointer;transition:all .18s;
            `;
            card.onmouseenter = () => { card.style.borderColor = 'var(--accent)'; card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 6px 20px rgba(39,174,96,.15)'; };
            card.onmouseleave = () => { card.style.borderColor = 'var(--glass-border)'; card.style.transform = ''; card.style.boxShadow = ''; };

            // Thumbnail
            const thumbDiv = document.createElement('div');
            thumbDiv.style.cssText = `width:100%;aspect-ratio:1;background:repeating-conic-gradient(rgba(255,255,255,0.03) 0% 25%, rgba(255,255,255,0.06) 0% 50%) 50% / 10px 10px;display:flex;align-items:center;justify-content:center;overflow:hidden;`;
            if (model.thumbnail) {
                const img = document.createElement('img');
                img.src = model.thumbnail;
                img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
                thumbDiv.appendChild(img);
            } else {
                thumbDiv.innerHTML = `<i class="fa-solid fa-image" style="font-size:1.5rem;color:var(--text-secondary);opacity:.3;"></i>`;
            }
            card.appendChild(thumbDiv);

            // Info bar
            const info = document.createElement('div');
            info.style.cssText = 'padding:8px 10px;';
            const date = new Date(model.updatedAt || model.createdAt);
            const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            info.innerHTML = `
                <div style="font-size:.7rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;">${model.name}</div>
                <div style="font-size:.58rem;color:var(--text-secondary);">${model.width}×${model.height} · ${dateStr}</div>
            `;
            card.appendChild(info);

            // Action buttons (overlay on hover)
            const actions = document.createElement('div');
            actions.style.cssText = `
                position:absolute;top:6px;right:6px;display:flex;gap:4px;opacity:0;transition:opacity .15s;
            `;
            actions.innerHTML = `
                <button class="mdl-update" data-id="${model.id}" title="Atualizar com a arte atual" style="width:24px;height:24px;border-radius:6px;background:rgba(39,174,96,.9);color:white;border:none;cursor:pointer;font-size:.55rem;display:flex;align-items:center;justify-content:center;">
                    <i class="fa-solid fa-arrows-rotate"></i>
                </button>
                <button class="mdl-del" data-id="${model.id}" title="Excluir" style="width:24px;height:24px;border-radius:6px;background:rgba(255,68,68,.9);color:white;border:none;cursor:pointer;font-size:.55rem;display:flex;align-items:center;justify-content:center;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;
            card.appendChild(actions);
            card.onmouseenter = () => { actions.style.opacity = '1'; card.style.borderColor = 'var(--accent)'; card.style.transform = 'translateY(-2px)'; };
            card.onmouseleave = () => { actions.style.opacity = '0'; card.style.borderColor = 'var(--glass-border)'; card.style.transform = ''; };

            // Click → load
            card.onclick = (e) => {
                if (e.target.closest('.mdl-del') || e.target.closest('.mdl-update')) return;
                if (confirm(`Abrir "${model.name}"? A arte atual será substituída.`)) {
                    loadModel(model);
                }
            };

            grid.appendChild(card);
        });

        container.appendChild(grid);

        // Wire action buttons
        container.querySelectorAll('.mdl-del').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                if (confirm('Excluir este modelo?')) {
                    const models = getModels().filter(m => m.id !== btn.dataset.id);
                    saveModels(models);
                    rebuildUI(container);
                }
            };
        });
        container.querySelectorAll('.mdl-update').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                if (confirm('Atualizar este modelo com a arte atual?')) {
                    updateModel(btn.dataset.id);
                    rebuildUI(container);
                }
            };
        });
    }

    // ── Export / Import ────────────────────────────────────────────────────
    const foot = document.createElement('div');
    foot.style.cssText = 'border-top:1px solid var(--glass-border);padding-top:14px;display:flex;gap:8px;';
    foot.innerHTML = `
        <button id="mdl-export" style="flex:1;padding:10px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid var(--glass-border);color:white;cursor:pointer;font-size:.72rem;font-weight:700;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;">
            <i class="fa-solid fa-download"></i> Exportar
        </button>
        <button id="mdl-import-btn" style="flex:1;padding:10px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid var(--glass-border);color:white;cursor:pointer;font-size:.72rem;font-weight:700;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;">
            <i class="fa-solid fa-upload"></i> Importar
        </button>
        <input type="file" id="mdl-import-file" accept=".json" style="display:none;">
    `;
    container.appendChild(foot);

    foot.querySelector('#mdl-export').onclick = () => {
        const data = JSON.stringify(getModels(), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'allu-modelos.json';
        a.click();
    };
    foot.querySelector('#mdl-import-btn').onclick = () => foot.querySelector('#mdl-import-file').click();
    foot.querySelector('#mdl-import-file').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (!Array.isArray(imported)) return;
                const existing = getModels();
                const merged = [...imported.map(m => ({ ...m, id: 'import-' + Date.now() + '-' + Math.random().toString(36).slice(2,6) })), ...existing];
                saveModels(merged);
                rebuildUI(container);
            } catch (err) { console.error('Import error:', err); }
        };
        reader.readAsText(file);
    };
}
