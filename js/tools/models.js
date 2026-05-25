// js/tools/models.js
import { state } from '../state.js';
import { history } from '../history.js';
import * as storage from '../storage.js';
import { carousel } from '../carousel.js';
import { notifications } from '../ui/notifications.js';

let activeFolderId = null;

export function renderModelsTools(sidebarContent) {
    const div = document.createElement('div');
    div.className = 'animate-fade';
    sidebarContent.appendChild(div);

    if (!activeFolderId) {
        activeFolderId = storage.getFolders()[0]?.id;
    }

    function rebuild() {
        div.innerHTML = '';
        
        // 1. Pastas (Tabs)
        const folderNav = document.createElement('div');
        folderNav.style.cssText = 'display:flex;gap:6px;overflow-x:auto;padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid var(--glass-border);scrollbar-width:none;';
        
        storage.getFolders().forEach(f => {
            const btn = document.createElement('button');
            const isActive = f.id === activeFolderId;
            btn.textContent = f.name;
            btn.style.cssText = `
                padding:6px 14px;border-radius:20px;font-size:.68rem;font-weight:700;white-space:nowrap;cursor:pointer;
                border:1px solid ${isActive ? 'var(--accent)' : 'var(--glass-border)'};
                background:${isActive ? 'var(--accent)' : 'rgba(255,255,255,.03)'};
                color:${isActive ? 'white' : 'var(--text-secondary)'};
                transition:all .2s;
            `;
            btn.onclick = () => { activeFolderId = f.id; rebuild(); };
            folderNav.appendChild(btn);
        });

        const addFolder = document.createElement('button');
        addFolder.innerHTML = '<i class="fa-solid fa-plus"></i>';
        addFolder.style.cssText = 'padding:6px 12px;border-radius:20px;border:1px dashed var(--glass-border);background:transparent;color:var(--text-secondary);cursor:pointer;';
        addFolder.onclick = async () => {
            const name = await notifications.prompt('Nova Pasta', 'Escolha um nome para o seu novo catálogo:', '', 'Ex: Assinaturas 2024');
            if (name) {
                const f = storage.createFolder(name);
                activeFolderId = f.id;
                notifications.toast(`Pasta "${name}" criada!`);
                rebuild();
            }
        };
        folderNav.appendChild(addFolder);
        div.appendChild(folderNav);

        // 2. Grid de Designs
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;';
        
        const designs = storage.getDesigns(activeFolderId);
        if (designs.length === 0) {
            grid.innerHTML = '<div style="grid-column:span 2;text-align:center;padding:30px;opacity:.3;font-size:.7rem;">Nenhuma arte nesta pasta.</div>';
        }

        designs.forEach(d => {
            const card = document.createElement('div');
            card.style.cssText = 'background:rgba(255,255,255,.03);border:1px solid var(--glass-border);border-radius:14px;overflow:hidden;cursor:pointer;transition:all .2s;position:relative;';
            card.innerHTML = `
                <div style="aspect-ratio:1.2;background:rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;">
                    <img src="${d.thumbnail}" style="max-width:90%;max-height:90%;object-fit:contain;">
                    ${d.isShared ? '<div style="position:absolute;top:8px;right:8px;background:var(--accent);color:white;font-size:.5rem;padding:2px 6px;border-radius:10px;font-weight:800;box-shadow:0 2px 5px rgba(0,0,0,0.2);">COMPARTILHADO</div>' : ''}
                    ${d.pagesData && d.pagesData.length > 1 ? `<div style="position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,0.6);color:white;font-size:.55rem;padding:2px 6px;border-radius:6px;">${d.pagesData.length} páginas</div>` : ''}
                </div>
                <div style="padding:10px;">
                    <div style="font-size:.7rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.name}</div>
                    <div style="font-size:.58rem;opacity:.5;margin-top:2px;">Editado em ${new Date(d.updatedAt).toLocaleDateString()}</div>
                </div>
            `;
            card.onclick = async () => {
                if (d.isShared) {
                    await notifications.alert('Modelo Compartilhado', '📢 Atenção: Você está abrindo um MODELO COMPARTILHADO. Qualquer alteração que você fizer e salvar afetará o arquivo original para todos os usuários.', 'fa-bullhorn');
                }
                loadDesign(d);
                rebuild();
            };
            grid.appendChild(card);
        });
        div.appendChild(grid);

        // 3. Área de Salvamento
        const activeDesign = state.activeDesignId ? storage.getDesignById(state.activeDesignId) : null;

        const saveCard = document.createElement('div');
        saveCard.style.cssText = 'background:rgba(255,255,255,0.02);padding:16px;border-radius:16px;border:1px solid var(--glass-border);';
        saveCard.innerHTML = `
            <p style="font-size:.6rem;text-transform:uppercase;opacity:.5;margin-bottom:12px;font-weight:800;letter-spacing:0.05em;">Salvar Projeto</p>
            
            <input id="save-name" type="text" placeholder="Dê um nome para o projeto..." value="${activeDesign ? activeDesign.name : ''}"
                style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--glass-border);background:rgba(255,255,255,.05);color:white;font-size:.85rem;outline:none;margin-bottom:12px;">
            
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:8px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.05);">
                <input type="checkbox" id="save-shared" ${activeDesign?.isShared ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer;">
                <label for="save-shared" style="font-size:.7rem;color:var(--text-secondary);cursor:pointer;user-select:none;">
                    Compartilhar com a comunidade
                </label>
            </div>

            <button id="btn-save-final" style="width:100%;padding:14px;border-radius:12px;background:var(--accent);color:white;border:none;cursor:pointer;font-size:.85rem;font-weight:800;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .2s;">
                <i class="fa-solid fa-floppy-disk"></i> 
                ${activeDesign ? 'Atualizar Projeto' : 'Salvar Novo Projeto'}
            </button>
            
            <div style="display:flex; gap:8px; margin-top:12px;">
                <button id="btn-export-allu" style="flex:1; padding:10px; border-radius:10px; background:rgba(255,255,255,0.05); color:white; border:1px solid var(--glass-border); cursor:pointer; font-size:0.72rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='var(--accent)';" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.borderColor='var(--glass-border)';">
                    <i class="fa-solid fa-file-export"></i> Exportar (.allu)
                </button>
                <button id="btn-import-allu" style="flex:1; padding:10px; border-radius:10px; background:rgba(255,255,255,0.05); color:white; border:1px solid var(--glass-border); cursor:pointer; font-size:0.72rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='var(--accent)';" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.borderColor='var(--glass-border)';">
                    <i class="fa-solid fa-file-import"></i> Importar (.allu)
                </button>
            </div>
            <input type="file" id="input-import-allu" accept=".allu,.json" style="display:none;">
            
            <p style="font-size:.55rem;opacity:.4;margin-top:10px;text-align:center;">${state.canvases.length} página(s) serão salvas.</p>
        `;

        saveCard.querySelector('#btn-save-final').onclick = async () => {
            const name = saveCard.querySelector('#save-name').value.trim() || 'Sem nome';
            const isShared = saveCard.querySelector('#save-shared').checked;
            
            if (isShared && !activeDesign?.isShared) {
                const ok = await notifications.confirm('Compartilhar Arte?', '⚠️ Ao compartilhar, esta arte poderá ser editada por qualquer pessoa. O arquivo original será modificado por quem usá-lo. Deseja continuar?', 'fa-triangle-exclamation');
                if (!ok) return;
            }

            const mainCanvas = state.canvases[0];
            const zoom = mainCanvas.getZoom() || 1;
            const logicalW = mainCanvas.width / zoom;
            const logicalH = mainCanvas.height / zoom;
            const thumbScale = 160 / Math.max(mainCanvas.width, mainCanvas.height);
            
            const pagesData = state.canvases.map(c => c.toJSON(['productData', 'currentMode', 'isAlluCard', 'isAlluTable', 'selectable', 'hasControls', 'id', 'isBadge', 'badgePresetId', 'badgeShape', 'innerShadowBlur', 'innerShadowColor', 'innerShadowOffsetX', 'innerShadowOffsetY', 'charSpacing', 'lineHeight', 'shadow', 'fakePriceCard', 'priceCard', 'fakePriceMonths', 'priceMonths', 'isDiscountBadgeRect', 'isDiscountBadgeText', 'showDiscountBadge']));

            const designData = {
                id: state.activeDesignId || ('d-' + Date.now()),
                name,
                folderId: activeFolderId,
                isShared,
                width: logicalW,
                height: logicalH,
                thumbnail: mainCanvas.toDataURL({ format: 'png', quality: 0.6, multiplier: thumbScale }),
                pagesData: pagesData
            };

            state.activeDesignId = storage.saveDesign(designData);
            notifications.toast('Projeto salvo com sucesso!');
            rebuild();
        };

        saveCard.querySelector('#btn-export-allu').onclick = () => {
            const name = saveCard.querySelector('#save-name').value.trim() || 'Sem nome';
            const mainCanvas = state.canvases[0];
            if (!mainCanvas) return;

            const zoom = mainCanvas.getZoom() || 1;
            const logicalW = mainCanvas.width / zoom;
            const logicalH = mainCanvas.height / zoom;

            const pagesData = state.canvases.map(c => c.toJSON(['productData', 'currentMode', 'isAlluCard', 'isAlluTable', 'selectable', 'hasControls', 'id', 'isBadge', 'badgePresetId', 'badgeShape', 'innerShadowBlur', 'innerShadowColor', 'innerShadowOffsetX', 'innerShadowOffsetY', 'charSpacing', 'lineHeight', 'shadow', 'fakePriceCard', 'priceCard', 'fakePriceMonths', 'priceMonths', 'isDiscountBadgeRect', 'isDiscountBadgeText', 'showDiscountBadge']));
            
            const exportData = {
                version: '1.0',
                name,
                width: logicalW,
                height: logicalH,
                pagesData: pagesData
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `${name.replace(/\s+/g, '_') || 'projeto'}.allu`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            notifications.toast('Projeto exportado com sucesso!');
        };

        const fileInput = saveCard.querySelector('#input-import-allu');
        saveCard.querySelector('#btn-import-allu').onclick = () => {
            fileInput.click();
        };

        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const parsed = JSON.parse(event.target.result);
                    if (!parsed.pagesData || !Array.isArray(parsed.pagesData)) {
                        throw new Error('Formato de arquivo .allu inválido.');
                    }
                    
                    await loadDesign({
                        id: 'd-imported-' + Date.now(),
                        name: parsed.name || 'Projeto Importado',
                        width: parsed.width || 1080,
                        height: parsed.height || 1080,
                        pagesData: parsed.pagesData
                    });
                    
                    notifications.toast('Projeto importado com sucesso!');
                    rebuild();
                } catch (err) {
                    console.error(err);
                    notifications.alert('Erro ao Importar', 'Não foi possível ler o arquivo. Verifique se é um arquivo .allu ou JSON válido.', 'fa-circle-xmark');
                }
            };
            reader.readAsText(file);
            fileInput.value = '';
        };

        div.appendChild(saveCard);
    }

    function normalizeDesignDimensions(design) {
        if (!design.width || !design.height) return;
        const ratio = design.width / design.height;
        
        let closestPreset = null;
        let minDiff = Infinity;
        
        const standardPresets = [
            { w: 1080, h: 1080 }, // Instagram Feed / Carousel
            { w: 1080, h: 1920 }, // Instagram Stories / WhatsApp Status
            { w: 1080, h: 1350 }, // WhatsApp Feed
            { w: 1200, h: 627 },  // LinkedIn Post
            { w: 1200, h: 675 },  // X Post
            { w: 600, h: 200 }    // Email Header
        ];
        
        standardPresets.forEach(p => {
            const pratio = p.w / p.h;
            const diff = Math.abs(ratio - pratio);
            if (diff < minDiff) {
                minDiff = diff;
                closestPreset = p;
            }
        });
        
        if (closestPreset && minDiff < 0.1) {
            design.width = closestPreset.w;
            design.height = closestPreset.h;
        } else {
            design.width = Math.round(design.width);
            design.height = Math.round(design.height);
        }
    }

    async function loadDesign(design) {
        normalizeDesignDimensions(design);
        state.setActivePreset({ w: design.width, h: design.height, name: design.name });
        
        // Atualiza o display de formato no topo
        const formatDisplay = document.getElementById('format-display');
        if (formatDisplay) {
            formatDisplay.innerText = `${design.name || 'Personalizado'} (${design.width}x${design.height})`;
        }

        if (design.pagesData && design.pagesData.length > 0) {
            await carousel.loadPages(design.pagesData, design.width, design.height);
        } else if (design.canvasData) {
            await carousel.loadPages([design.canvasData], design.width, design.height);
        }

        // Garante que o canvas seja redimensionado visualmente para o novo formato
        import('../canvas.js').then(module => {
            module.resizeCanvas(design.width, design.height);
        });
        
        state.activeDesignId = design.id;
        notifications.toast(`Projeto "${design.name}" carregado`);
    }

    rebuild();
}
