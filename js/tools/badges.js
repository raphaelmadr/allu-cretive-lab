// js/tools/badges.js
import { state } from '../state.js';
import { history } from '../history.js';
import { backgroundColors } from '../config.js';

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const ICONS = {
    truck: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="SW" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,
    tag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="SW" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"/></svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="SW" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>`,
    zap: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="SW" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`,
};

// ── Geometry ───────────────────────────────────────────────────────────────────
function polyPoints(outerR, innerR, n) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (Math.PI / n) * i - Math.PI / 2;
        pts.push({ x: outerR + r * Math.cos(a), y: outerR + r * Math.sin(a) });
    }
    return pts;
}

function makeShape(id, size, fill, borderColor, borderWidth) {
    const h = size / 2;
    const base = { fill, stroke: borderColor, strokeWidth: borderWidth };
    switch (id) {
        case 'circle':
            return new fabric.Circle({ radius: h, left: -h, top: -h, originX: 'left', originY: 'top', ...base });
        case 'square':
            return new fabric.Rect({ width: size, height: size, rx: size * 0.1, ry: size * 0.1, left: -h, top: -h, originX: 'left', originY: 'top', ...base });
        case 'star': {
            const pts = polyPoints(h, h * 0.42, 5);
            return new fabric.Polygon(pts, { left: -h, top: -h, originX: 'left', originY: 'top', ...base });
        }
        case 'burst':
        default: {
            const pts = polyPoints(h, h * 0.7, 12);
            return new fabric.Polygon(pts, { left: -h, top: -h, originX: 'left', originY: 'top', ...base });
        }
    }
}

// ── Config ─────────────────────────────────────────────────────────────────────
const SHAPES = [
    { id: 'circle', label: 'Círculo', icon: 'fa-circle' },
    { id: 'star', label: 'Estrela', icon: 'fa-star' },
    { id: 'burst', label: 'Explosão', icon: 'fa-sun' },
    { id: 'square', label: 'Quadrado', icon: 'fa-square' },
];
const PRESETS = [
    { id: 'entrega', label: 'Entrega Rápida', icon: 'truck', lines: ['Entrega', 'Rápida'], shape: 'circle', bg: '#27AE60' },
    { id: 'oferta', label: 'Oferta', icon: 'tag', lines: ['Oferta'], shape: 'burst', bg: '#C01A21' },
    { id: 'novidade', label: 'Novidade', icon: 'sparkles', lines: ['Novidade'], shape: 'star', bg: '#267AB3' },
    { id: 'off', label: '% OFF', icon: 'zap', lines: ['até', '20%'], shape: 'burst', bg: '#0F190A', editable: true },
];

// ── Build badge (shared) ───────────────────────────────────────────────────────
async function buildBadgeObjects(opts, size) {
    const { preset, shape, iconSize, iconStroke, fontSize, lineHeight, letterSpacing, fillColor, borderColor, borderWidth, shadowBlur, shadowColor, textColor } = opts;

    // Shape
    const shapeObj = makeShape(shape, size, fillColor, borderColor, borderWidth);
    if (shadowBlur > 0) {
        shapeObj.set('shadow', new fabric.Shadow({ color: shadowColor, blur: shadowBlur, offsetX: 0, offsetY: shadowBlur * 0.3 }));
    }

    // Icon
    const svgStr = ICONS[preset.icon]
        .replace(/currentColor/g, textColor)
        .replace(/SW/g, String(iconStroke));
    const icoSize = size * (iconSize / 100);
    const iconObj = await new Promise(resolve => {
        fabric.loadSVGFromString(svgStr, (objs, o) => {
            const g = fabric.util.groupSVGElements(objs, o);
            const s = icoSize / Math.max(g.width, g.height);
            g.set({ scaleX: s, scaleY: s, originX: 'center', originY: 'center', left: 0, top: -(size * 0.13) });
            resolve(g);
        });
    });

    // Text
    const lines = preset.lines;
    const lh = lineHeight / 100; // 100 = normal
    const totalH = lines.length * fontSize * lh;
    const startY = size * 0.06;
    const textObjs = lines.map((line, i) => new fabric.Text(line, {
        fontFamily: 'Plus Jakarta Sans', fontSize, fontWeight: '800',
        fill: textColor, charSpacing: letterSpacing * 10,
        originX: 'center', originY: 'top', left: 0,
        top: startY + i * fontSize * lh,
    }));

    return [shapeObj, iconObj, ...textObjs];
}

// ── Sidebar UI ─────────────────────────────────────────────────────────────────
export function renderBadgesTools(sidebarContent) {
    const div = document.createElement('div');
    div.className = 'animate-fade';

    let sel = {
        shape: 'burst', align: 'center', preset: PRESETS[0], pct: '20',
        iconSize: 28, iconStroke: 2.5,
        fontSize: 36, lineHeight: 115, letterSpacing: 2,
        fillColor: '#27AE60', borderColor: '#ffffff', borderWidth: 0,
        shadowBlur: 0, shadowColor: 'rgba(0,0,0,0.5)', textColor: '#ffffff',
    };

    function getLines() {
        return sel.preset.editable ? ['até', `${sel.pct}%`, 'OFF'] : sel.preset.lines;
    }

    const canvas = state.getCanvas();

    // ── Update Logic ────────────────────────────────────────────────────────
    async function updateCanvasBadge(forceAdd = false) {
        if (!canvas) return;
        const activeObj = canvas.getActiveObject();
        const isBadge = (obj) => obj && (obj.isBadge || (obj.get && obj.get('isBadge')));
        const isEditing = isBadge(activeObj);

        if (!isEditing && !forceAdd) return;

        const p = { ...sel.preset, lines: getLines() };
        const objs = await buildBadgeObjects({ ...sel, preset: p }, 300);
        
        if (isEditing) {
            const { left, top, scaleX, scaleY, angle } = activeObj;
            const newBadge = new fabric.Group(objs, {
                left, top, scaleX, scaleY, angle,
                originX: 'center', originY: 'center',
            });
            newBadge.set({ isBadge: true, badgeData: JSON.parse(JSON.stringify(sel)) });
            canvas.remove(activeObj);
            canvas.add(newBadge);
            canvas.setActiveObject(newBadge);
        } else if (forceAdd) {
            const newBadge = new fabric.Group(objs, {
                left: canvas.width / 2, top: canvas.height / 2,
                originX: 'center', originY: 'center',
            });
            newBadge.set({ isBadge: true, badgeData: JSON.parse(JSON.stringify(sel)) });
            canvas.add(newBadge);
            canvas.setActiveObject(newBadge);
            history.save();
        }
        canvas.renderAll();
    }

    function syncSidebarWithBadge(badge) {
        if (!badge || (!badge.isBadge && !badge.get?.('isBadge')) || (!badge.badgeData && !badge.get?.('badgeData'))) return;
        const data = badge.badgeData || badge.get?.('badgeData');
        sel = JSON.parse(JSON.stringify(data));
        updateUIFromState();
    }

    div.syncWithBadge = syncSidebarWithBadge;
    let previewDebounce = null;

    const colorBtn = (hex, cls) => {
        const isLight = parseInt(hex.replace('#', ''), 16) > 0xaaaaaa;
        return `<div class="${cls}" data-hex="${hex}" style="width:26px;height:26px;border-radius:6px;background:${hex};cursor:pointer;border:1px solid var(--glass-border);transition:all .15s;${isLight ? 'box-shadow:inset 0 0 0 1px rgba(0,0,0,0.08);' : ''}" title="${hex}"></div>`;
    };

    const badgeBgColors = ['#27AE60', '#E3292F', '#161617', '#C01A21', '#267AB3', '#0F190A', '#ffffff', '#A8A9B8'];
    const bgColorsHTML = badgeBgColors.map(c => colorBtn(c, 'bcol-fill')).join('');
    const textColorsHTML = ['#ffffff', '#F7F7F9', '#2E2F39', '#0F190A', '#1E8549', '#A8A9B8'].map(h => colorBtn(h, 'bcol-text')).join('');
    const borderColorsHTML = ['#ffffff', '#F7F7F9', '#2E2F39', '#0F190A', '#27AE60', '#A8A9B8'].map(h => colorBtn(h, 'bcol-border')).join('');

    const slider = (id, label, min, max, val, suffix) => `
        <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <p style="font-size:.62rem;text-transform:uppercase;opacity:.5;font-weight:800;letter-spacing:0.05em;">${label}</p>
                <span id="${id}-val" style="font-size:.65rem;font-weight:800;color:var(--accent);">${val}${suffix}</span>
            </div>
            <input id="${id}" type="range" min="${min}" max="${max}" value="${val}" step="${id === 'b-ico-sw' ? '0.5' : '1'}" style="width:100%;height:4px;cursor:pointer;">
        </div>`;

    function updateUIFromState() {
        setGroup('.bsh', sel.shape);
        setGroup('.bpr', sel.preset.id);
        const pctBox = div.querySelector('#b-pct-box');
        if (pctBox) pctBox.style.display = sel.preset.editable ? 'block' : 'none';
        if (div.querySelector('#b-pct')) div.querySelector('#b-pct').value = sel.pct;
        const updateSlider = (id, val) => {
            const inp = div.querySelector('#' + id);
            const span = div.querySelector('#' + id + '-val');
            if (inp) inp.value = val;
            if (span) span.textContent = val + (id.includes('size') || id === 'b-lh' ? '%' : (id === 'b-fs' ? 'px' : ''));
        };
        updateSlider('b-ico-size', sel.iconSize);
        updateSlider('b-ico-sw', sel.iconStroke);
        updateSlider('b-fs', sel.fontSize);
        updateSlider('b-lh', sel.lineHeight);
        updateSlider('b-ls', sel.letterSpacing);
        updateSlider('b-bw', sel.borderWidth);
        updateSlider('b-sh', sel.shadowBlur);
        markColor(div.querySelector('#b-fill-grid'), sel.fillColor);
        markColor(div.querySelector('#b-text-grid'), sel.textColor);
        markColor(div.querySelector('#b-border-grid'), sel.borderColor);
    }

    div.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;">
            ${PRESETS.map((p) => `
                <button class="bpr" data-v="${p.id}" title="${p.label}" style="height:42px;border-radius:12px;border:1px solid var(--glass-border);background:rgba(255,255,255,.03);color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;position:relative;">
                    <span style="width:24px;height:24px;border-radius:50%;background:${p.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
                        <i class="fa-solid ${p.icon === 'truck' ? 'fa-truck' : p.icon === 'tag' ? 'fa-tag' : p.icon === 'sparkles' ? 'fa-wand-magic-sparkles' : 'fa-bolt'}" style="font-size:.65rem;color:white;"></i>
                    </span>
                </button>`).join('')}
        </div>

        <div id="b-pct-box" style="display:none;margin-bottom:20px;">
            <p style="font-size:.6rem;text-transform:uppercase;opacity:.5;margin-bottom:8px;font-weight:800;letter-spacing:0.05em;">Texto Customizado</p>
            <input id="b-pct" type="text" value="20" placeholder="Ex: 20%" style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--glass-border);background:rgba(255,255,255,.05);color:white;font-size:1.1rem;font-weight:800;text-align:center;font-family:inherit;outline:none;border:1px solid var(--accent);">
        </div>

        <div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:16px;border:1px solid var(--glass-border);margin-bottom:20px;box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:15px;">
                <div>
                    <p style="font-size:.6rem;text-transform:uppercase;opacity:.5;margin-bottom:10px;font-weight:800;letter-spacing:0.05em;">Formato</p>
                    <div id="b-shapes" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
                        ${SHAPES.map(s => `<button class="bsh" data-v="${s.id}" title="${s.label}" style="height:32px;border-radius:8px;border:1px solid var(--glass-border);background:rgba(255,255,255,.03);color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;"><i class="fa-solid ${s.icon}" style="font-size:0.9rem;"></i></button>`).join('')}
                    </div>
                </div>
                <div>
                    <p style="font-size:.6rem;text-transform:uppercase;opacity:.5;margin-bottom:10px;font-weight:800;letter-spacing:0.05em;">Cor Base</p>
                    <div id="b-fill-grid" style="display:flex;flex-wrap:wrap;gap:6px;">${bgColorsHTML}</div>
                </div>
            </div>
        </div>

        <div style="padding:0 4px;margin-bottom:15px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px;">
                ${slider('b-ico-size', 'Tam. Ícone', 10, 50, 28, '%')}
                ${slider('b-fs', 'Tam. Texto', 14, 72, 36, 'px')}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px;">
                ${slider('b-ico-sw', 'Traço', 1, 5, 2.5, '')}
                ${slider('b-lh', 'Entrelinha', 60, 180, 115, '%')}
            </div>
        </div>

        <div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:16px;border:1px solid var(--glass-border);margin-bottom:24px;box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
                <div>
                    <p style="font-size:.6rem;text-transform:uppercase;opacity:.5;margin-bottom:10px;font-weight:800;letter-spacing:0.05em;">Conteúdo</p>
                    <div id="b-text-grid" style="display:flex;flex-wrap:wrap;gap:6px;">${textColorsHTML}</div>
                </div>
                <div>
                    <p style="font-size:.6rem;text-transform:uppercase;opacity:.5;margin-bottom:10px;font-weight:800;letter-spacing:0.05em;">Borda</p>
                    <div id="b-border-grid" style="display:flex;flex-wrap:wrap;gap:6px;">${borderColorsHTML}</div>
                </div>
            </div>
            <div style="margin-top:15px;display:flex;align-items:center;gap:12px;">
                <i class="fa-solid fa-border-all" style="font-size:.8rem;opacity:.4;"></i>
                <input id="b-bw" type="range" min="0" max="12" value="0" style="flex:1;height:4px;cursor:pointer;">
            </div>
        </div>

        <button id="b-add" style="width:100%;padding:16px;border-radius:14px;background:var(--accent);color:white;border:none;cursor:pointer;font-size:.9rem;font-weight:800;display:flex;align-items:center;justify-content:center;gap:12px;transition:all .3s;font-family:inherit;box-shadow: 0 8px 24px rgba(39,174,96,0.3);">
            <i class="fa-solid fa-plus-circle" style="font-size:1.2rem;"></i> Inserir Novo Selo
        </button>
    `;

    sidebarContent.appendChild(div);

    function queueUpdate() {
        clearTimeout(previewDebounce);
        previewDebounce = setTimeout(() => updateCanvasBadge(false), 20);
    }

    if (canvas && !canvas._badgeEventsAdded) {
        const globalSync = (e) => {
            const badge = e.selected ? e.selected[0] : null;
            if (badge && (badge.isBadge || badge.get?.('isBadge'))) {
                const activeSidebar = document.querySelector('#sidebar-content > div');
                if (activeSidebar && activeSidebar.syncWithBadge) {
                    activeSidebar.syncWithBadge(badge);
                }
            }
        };
        canvas.on('selection:created', globalSync);
        canvas.on('selection:updated', globalSync);
        canvas._badgeEventsAdded = true;
    }

    const setGroup = (cls, val) => {
        div.querySelectorAll(cls).forEach(b => {
            const a = b.dataset.v === val;
            b.style.border = a ? '2px solid var(--accent)' : '1px solid var(--glass-border)';
            b.style.background = a ? 'rgba(39,174,96,.12)' : 'rgba(255,255,255,.03)';
            b.style.color = a ? 'var(--accent)' : (cls === '.bpr' ? 'white' : 'var(--text-secondary)');
        });
    };
    const markColor = (container, hex) => {
        container.querySelectorAll('[data-hex]').forEach(c => {
            c.style.outline = c.dataset.hex.toUpperCase() === hex.toUpperCase() ? '2px solid var(--accent)' : 'none';
            c.style.outlineOffset = '2px';
        });
    };

    div.querySelectorAll('.bsh').forEach(b => b.onclick = () => { sel.shape = b.dataset.v; setGroup('.bsh', sel.shape); queueUpdate(); });
    div.querySelectorAll('.bpr').forEach(b => b.onclick = () => {
        sel.preset = PRESETS.find(p => p.id === b.dataset.v);
        sel.fillColor = sel.preset.bg;
        sel.shape = sel.preset.shape;
        updateUIFromState();
        queueUpdate();
    });

    const pctIn = div.querySelector('#b-pct');
    if (pctIn) pctIn.oninput = () => { sel.pct = pctIn.value; queueUpdate(); };

    const wireSlider = (id, key, suffix) => {
        const inp = div.querySelector('#' + id);
        const v = div.querySelector('#' + id + '-val');
        if (inp) inp.oninput = () => { sel[key] = parseFloat(inp.value); if(v) v.textContent = inp.value + suffix; queueUpdate(); };
    };
    wireSlider('b-ico-size', 'iconSize', '%');
    wireSlider('b-ico-sw', 'iconStroke', '');
    wireSlider('b-fs', 'fontSize', 'px');
    wireSlider('b-lh', 'lineHeight', '%');
    wireSlider('b-ls', 'letterSpacing', '');
    wireSlider('b-bw', 'borderWidth', '');
    wireSlider('b-sh', 'shadowBlur', '');

    const fillGrid = div.querySelector('#b-fill-grid');
    const textGrid = div.querySelector('#b-text-grid');
    const borderGrid = div.querySelector('#b-border-grid');

    fillGrid.querySelectorAll('[data-hex]').forEach(c => c.onclick = () => { sel.fillColor = c.dataset.hex; markColor(fillGrid, sel.fillColor); queueUpdate(); });
    textGrid.querySelectorAll('[data-hex]').forEach(c => c.onclick = () => { sel.textColor = c.dataset.hex; markColor(textGrid, sel.textColor); queueUpdate(); });
    borderGrid.querySelectorAll('[data-hex]').forEach(c => c.onclick = () => { sel.borderColor = c.dataset.hex; markColor(borderGrid, sel.borderColor); queueUpdate(); });

    const isBadge = (obj) => obj && (obj.isBadge || (obj.get && obj.get('isBadge')));
    const activeObj = canvas.getActiveObject();
    if (isBadge(activeObj)) {
        syncSidebarWithBadge(activeObj);
    } else {
        updateUIFromState();
    }

    const btnAdd = div.querySelector('#b-add');
    btnAdd.onclick = () => updateCanvasBadge(true);
}
