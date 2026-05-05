// js/tools/icons.js
import { state } from '../state.js';
import { history } from '../history.js';

// ── Lucide Icons Data ──────────────────────────────────────────────────────────
const LUCIDE_ICONS = [
    'user', 'users', 'mail', 'phone', 'map-pin', 'globe', 'send', 'info', 'alert-circle', 'check-circle', 'help-circle',
    'instagram', 'facebook', 'twitter', 'linkedin', 'github', 'youtube', 'whatsapp', 'music', 'mic', 'video',
    'search', 'settings', 'bell', 'calendar', 'clock', 'camera', 'volume-2',
    'shield', 'lock', 'key', 'trash-2', 'edit-2', 'copy', 'share-2', 'external-link', 'download', 'upload',
    'plus', 'minus', 'x', 'check', 'arrow-right', 'arrow-left', 'chevron-right', 'chevron-left',
    'heart', 'star', 'thumbs-up', 'message-square', 'layout', 'grid', 'list', 'menu',
    'shopping-cart', 'credit-card', 'bank-note', 'tag', 'gift', 'package', 'truck',
    'zap', 'flame', 'sparkles', 'sun', 'moon', 'cloud', 'leaf', 'coffee', 'utensils',
    'smartphone', 'monitor', 'laptop', 'tablet', 'headphones', 'mouse', 'keyboard',
    'file-text', 'folder', 'archive', 'clipboard', 'bookmark', 'paperclip', 'link', 'briefcase', 'database', 'code'
];

const SHAPES = [
    { id: 'none', label: 'Nenhum', icon: 'fa-ban' },
    { id: 'circle', label: 'Círculo', icon: 'fa-circle' },
    { id: 'square', label: 'Quadrado', icon: 'fa-square' },
    { id: 'rounded', label: 'Arredondado', icon: 'fa-square-check' },
];

// ── Core Logic ─────────────────────────────────────────────────────────────────
// Cache para evitar requests repetidos ao mesmo ícone
const SVG_CACHE = new Map();

// ── Core Logic ─────────────────────────────────────────────────────────────────
async function buildIconObject(opts) {
    const { iconName, shape, iconColor, bgColor, iconSize, strokeWidth, padding } = opts;
    const url = `https://unpkg.com/lucide-static@latest/icons/${iconName}.svg`;

    return new Promise((resolve) => {
        const processSVG = (objects, options) => {
            const iconObj = fabric.util.groupSVGElements(objects, options);
            
            // Apply colors and stroke
            iconObj.getObjects().forEach(obj => {
                if (obj.stroke) obj.set('stroke', iconColor);
                if (obj.fill && obj.fill !== 'none') obj.set('fill', iconColor);
                obj.set('strokeWidth', strokeWidth);
            });

            // Scale icon to desired size
            const scale = iconSize / Math.max(iconObj.width, iconObj.height);
            iconObj.scale(scale);
            iconObj.set({ originX: 'center', originY: 'center', left: 0, top: 0 });

            if (shape === 'none') {
                iconObj.set({
                    isIcon: true,
                    iconData: JSON.parse(JSON.stringify(opts))
                });
                resolve(iconObj);
                return;
            }

            // Create Background Shape
            const bgSize = iconSize + (padding * 2);
            let bgObj;
            const bgBase = {
                fill: bgColor,
                originX: 'center',
                originY: 'center',
                left: 0,
                top: 0,
                width: bgSize,
                height: bgSize
            };

            if (shape === 'circle') {
                bgObj = new fabric.Circle({ ...bgBase, radius: bgSize / 2 });
            } else if (shape === 'square') {
                bgObj = new fabric.Rect({ ...bgBase });
            } else { // rounded
                bgObj = new fabric.Rect({ ...bgBase, rx: bgSize * 0.2, ry: bgSize * 0.2 });
            }

            const group = new fabric.Group([bgObj, iconObj], {
                originX: 'center',
                originY: 'center',
                isIcon: true,
                iconData: JSON.parse(JSON.stringify(opts))
            });

            resolve(group);
        };

        if (SVG_CACHE.has(url)) {
            const { objects, options } = SVG_CACHE.get(url);
            // Clonar para evitar mutar o original do cache
            processSVG(objects.map(o => fabric.util.object.clone(o)), { ...options });
        } else {
            fabric.loadSVGFromURL(url, (objects, options) => {
                SVG_CACHE.set(url, { objects, options });
                processSVG(objects, options);
            });
        }
    });
}

// ── UI Rendering ───────────────────────────────────────────────────────────────
export function renderIconsTools(sidebarContent) {
    const div = document.createElement('div');
    div.className = 'animate-fade';

    let sel = {
        iconName: 'heart',
        shape: 'circle',
        iconColor: '#ffffff',
        bgColor: '#27AE60',
        iconSize: 40,
        strokeWidth: 2,
        padding: 15
    };

    const canvas = state.getCanvas();
    let previewDebounce = null;
    let isInternalUpdate = false;

    function queueUpdate() {
        clearTimeout(previewDebounce);
        previewDebounce = setTimeout(() => updateCanvasIcon(false), 10);
    }

    async function updateCanvasIcon(forceAdd = false) {
        if (!canvas) return;
        const activeObj = canvas.getActiveObject();
        const isIcon = (obj) => obj && (obj.isIcon || (obj.get && obj.get('isIcon')));
        const isEditing = isIcon(activeObj);

        if (!isEditing && !forceAdd) return;

        isInternalUpdate = true; // Bloqueia o sync reverso durante o update
        const iconObj = await buildIconObject(sel);
        
        if (isEditing) {
            const { left, top, scaleX, scaleY, angle } = activeObj;
            iconObj.set({ left, top, scaleX, scaleY, angle });
            canvas.remove(activeObj);
            canvas.add(iconObj);
            canvas.setActiveObject(iconObj);
        } else if (forceAdd) {
            iconObj.set({ left: canvas.width / 2, top: canvas.height / 2 });
            canvas.add(iconObj);
            canvas.setActiveObject(iconObj);
            history.save();
        }
        canvas.renderAll();
        setTimeout(() => { isInternalUpdate = false; }, 100);
    }

    function syncSidebarWithIcon(obj) {
        if (isInternalUpdate || !obj) return;
        const data = obj.iconData || (obj.get && obj.get('iconData'));
        if (!data) return;
        sel = JSON.parse(JSON.stringify(data));
        updateUIFromState();
    }

    div.syncWithIcon = syncSidebarWithIcon;

    const colorBtn = (hex, cls) => `<div class="${cls}" data-hex="${hex}" style="width:24px;height:24px;border-radius:6px;background:${hex};cursor:pointer;border:1px solid var(--glass-border);transition:all .15s;"></div>`;
    const iconColors = ['#ffffff', '#000000', '#27AE60', '#E3292F', '#267AB3', '#F39C12'];
    const bgColors = ['#27AE60', '#E3292F', '#161617', '#267AB3', '#ffffff', '#F39C12'];

    const slider = (id, label, min, max, val, suffix) => `
        <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <p style="font-size:.62rem;text-transform:uppercase;opacity:.5;font-weight:800;">${label}</p>
                <span id="${id}-val" style="font-size:.65rem;font-weight:800;color:var(--accent);">${val}${suffix}</span>
            </div>
            <input id="${id}" type="range" min="${min}" max="${max}" value="${val}" step="${id === 'i-sw' ? '0.5' : '1'}" style="width:100%;height:4px;cursor:pointer;">
        </div>`;

    div.innerHTML = `
        <div style="margin-bottom:15px;">
            <input id="i-search" type="text" placeholder="Pesquisar ícones..." style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.05);color:white;font-size:0.85rem;outline:none;font-family:inherit;">
        </div>

        <div id="i-grid" style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;max-height:180px;overflow-y:auto;padding-right:4px;margin-bottom:20px;scrollbar-width:thin;">
            ${LUCIDE_ICONS.map(name => `
                <button class="i-btn" data-v="${name}" title="${name}" style="aspect-ratio:1;border-radius:8px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.03);color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;">
                    <img src="https://unpkg.com/lucide-static@latest/icons/${name}.svg" style="width:18px;height:18px;filter:invert(1);">
                </button>
            `).join('')}
        </div>

        <div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:16px;border:1px solid var(--glass-border);margin-bottom:20px;">
            <p style="font-size:.6rem;text-transform:uppercase;opacity:.5;margin-bottom:10px;font-weight:800;">Forma de Fundo</p>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
                ${SHAPES.map(s => `<button class="ish" data-v="${s.id}" title="${s.label}" style="height:36px;border-radius:8px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.03);color:var(--text-secondary);cursor:pointer;"><i class="fa-solid ${s.icon}"></i></button>`).join('')}
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:20px;">
            <div>
                <p style="font-size:.6rem;text-transform:uppercase;opacity:.5;margin-bottom:10px;font-weight:800;">Cor Ícone</p>
                <div id="i-color-grid" style="display:flex;flex-wrap:wrap;gap:6px;">${iconColors.map(c => colorBtn(c, 'icol-icon')).join('')}</div>
            </div>
            <div>
                <p style="font-size:.6rem;text-transform:uppercase;opacity:.5;margin-bottom:10px;font-weight:800;">Cor Fundo</p>
                <div id="i-bg-grid" style="display:flex;flex-wrap:wrap;gap:6px;">${bgColors.map(c => colorBtn(c, 'icol-bg')).join('')}</div>
            </div>
        </div>

        <div style="padding:0 4px;margin-bottom:20px;">
            ${slider('i-size', 'Tamanho', 12, 120, 40, 'px')}
            ${slider('i-sw', 'Traço (Stroke)', 0.5, 5, 2, '')}
            ${slider('i-pad', 'Preenchimento (Padding)', 0, 60, 15, 'px')}
        </div>

        <button id="i-add" style="width:100%;padding:14px;border-radius:12px;background:var(--accent);color:white;border:none;cursor:pointer;font-size:.85rem;font-weight:800;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .3s;">
            <i class="fa-solid fa-plus-circle"></i> Inserir Ícone
        </button>
    `;

    sidebarContent.appendChild(div);

    // ── Logic / Events ────────────────────────────────────────────────────────
    function updateUIFromState() {
        div.querySelectorAll('.i-btn').forEach(b => {
            const a = b.dataset.v === sel.iconName;
            b.style.border = a ? '2px solid var(--accent)' : '1px solid var(--glass-border)';
            b.style.background = a ? 'rgba(39,174,96,0.1)' : 'rgba(255,255,255,0.03)';
        });
        div.querySelectorAll('.ish').forEach(b => {
            const a = b.dataset.v === sel.shape;
            b.style.border = a ? '2px solid var(--accent)' : '1px solid var(--glass-border)';
            b.style.color = a ? 'var(--accent)' : 'var(--text-secondary)';
        });
        const markColor = (container, hex) => {
            container.querySelectorAll('[data-hex]').forEach(c => {
                c.style.outline = c.dataset.hex.toLowerCase() === hex.toLowerCase() ? '2px solid var(--accent)' : 'none';
                c.style.outlineOffset = '2px';
            });
        };
        markColor(div.querySelector('#i-color-grid'), sel.iconColor);
        markColor(div.querySelector('#i-bg-grid'), sel.bgColor);

        const updateSlider = (id, val, suffix) => {
            const inp = div.querySelector('#' + id);
            const span = div.querySelector('#' + id + '-val');
            if (inp) inp.value = val;
            if (span) span.textContent = val + suffix;
        };
        updateSlider('i-size', sel.iconSize, 'px');
        updateSlider('i-sw', sel.strokeWidth, '');
        updateSlider('i-pad', sel.padding, 'px');

        div.querySelector('#i-bg-grid').parentElement.style.opacity = sel.shape === 'none' ? '0.3' : '1';
        div.querySelector('#i-pad').disabled = sel.shape === 'none';
    }

    div.querySelectorAll('.i-btn').forEach(b => b.onclick = () => { sel.iconName = b.dataset.v; updateUIFromState(); queueUpdate(); });
    div.querySelectorAll('.ish').forEach(b => b.onclick = () => { sel.shape = b.dataset.v; updateUIFromState(); queueUpdate(); });
    div.querySelector('#i-color-grid').querySelectorAll('[data-hex]').forEach(c => c.onclick = () => { sel.iconColor = c.dataset.hex; updateUIFromState(); queueUpdate(); });
    div.querySelector('#i-bg-grid').querySelectorAll('[data-hex]').forEach(c => c.onclick = () => { sel.bgColor = c.dataset.hex; updateUIFromState(); queueUpdate(); });

    const wireSlider = (id, key, suffix) => {
        const inp = div.querySelector('#' + id);
        inp.oninput = () => { sel[key] = parseFloat(inp.value); updateUIFromState(); queueUpdate(); };
    };
    wireSlider('i-size', 'iconSize', 'px');
    wireSlider('i-sw', 'strokeWidth', '');
    wireSlider('i-pad', 'padding', 'px');

    div.querySelector('#i-search').oninput = (e) => {
        const q = e.target.value.toLowerCase();
        div.querySelectorAll('.i-btn').forEach(b => {
            b.style.display = b.dataset.v.includes(q) ? 'flex' : 'none';
        });
    };

    div.querySelector('#i-add').onclick = () => updateCanvasIcon(true);

    if (canvas && !canvas._iconEventsAdded) {
        const sync = (e) => {
            const obj = e.selected ? e.selected[0] : null;
            if (obj && (obj.isIcon || (obj.get && obj.get('isIcon')))) {
                const activeSidebar = document.querySelector('#sidebar-content > div');
                if (activeSidebar && activeSidebar.syncWithIcon) activeSidebar.syncWithIcon(obj);
            }
        };
        canvas.on('selection:created', sync);
        canvas.on('selection:updated', sync);
        canvas._iconEventsAdded = true;
    }

    // Inicialização se já houver ícone selecionado
    const activeObj = canvas ? canvas.getActiveObject() : null;
    if (activeObj && (activeObj.isIcon || (activeObj.get && activeObj.get('isIcon')))) {
        syncSidebarWithIcon(activeObj);
    } else {
        updateUIFromState();
    }
}
