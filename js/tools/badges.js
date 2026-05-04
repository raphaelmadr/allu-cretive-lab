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

const PREVIEW_SIZE = 200;

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

    let previewCanvas = null;
    let previewDebounce = null;

    const colorBtn = (hex, cls) => {
        const isLight = parseInt(hex.replace('#', ''), 16) > 0xaaaaaa;
        return `<div class="${cls}" data-hex="${hex}" style="width:26px;height:26px;border-radius:6px;background:${hex};cursor:pointer;border:1px solid var(--glass-border);transition:all .15s;${isLight ? 'box-shadow:inset 0 0 0 1px rgba(0,0,0,0.08);' : ''}" title="${hex}"></div>`;
    };
    const bgColorsHTML = backgroundColors.map(c => colorBtn(c.hex, 'bcol-fill')).join('');
    const textColorsHTML = ['#ffffff', '#F7F7F9', '#2E2F39', '#0F190A', '#1E8549', '#A8A9B8'].map(h => colorBtn(h, 'bcol-text')).join('');
    const borderColorsHTML = ['#ffffff', '#F7F7F9', '#2E2F39', '#0F190A', '#27AE60', '#A8A9B8'].map(h => colorBtn(h, 'bcol-border')).join('');

    const slider = (id, label, min, max, val, suffix) => `
        <div style="margin-bottom:10px;">
            <p class="subtitle" style="margin-bottom:5px;">${label}</p>
            <div style="display:flex;align-items:center;gap:8px;">
                <input id="${id}" type="range" min="${min}" max="${max}" value="${val}" step="${id === 'b-ico-sw' ? '0.5' : '1'}" style="flex:1;">
                <span id="${id}-val" style="font-size:.72rem;min-width:30px;text-align:right;">${val}${suffix}</span>
            </div>
        </div>`;

    div.innerHTML = `
        <div style="background:repeating-conic-gradient(rgba(255,255,255,0.03) 0% 25%, rgba(255,255,255,0.06) 0% 50%) 50% / 16px 16px;border:1px solid var(--glass-border);border-radius:14px;padding:8px;margin-bottom:14px;display:flex;align-items:center;justify-content:center;">
            <canvas id="badge-preview-canvas" width="${PREVIEW_SIZE}" height="${PREVIEW_SIZE}" style="border-radius:10px;"></canvas>
        </div>

        <p class="subtitle" style="margin-bottom:6px;">Forma</p>
        <div id="b-shapes" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px;">
            ${SHAPES.map(s => `<button class="bsh" data-v="${s.id}" style="padding:10px 0;border-radius:8px;border:${s.id === sel.shape ? '2px solid var(--accent)' : '1px solid var(--glass-border)'};background:${s.id === sel.shape ? 'rgba(39,174,96,.12)' : 'rgba(255,255,255,.03)'};color:${s.id === sel.shape ? 'var(--accent)' : 'var(--text-secondary)'};cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;font-family:inherit;transition:all .15s;"><i class="fa-solid ${s.icon}" style="font-size:1rem;"></i><span style="font-size:.58rem;font-weight:700;">${s.label}</span></button>`).join('')}
        </div>

        <p class="subtitle" style="margin-bottom:6px;">Tipo de Selo</p>
        <div id="b-presets" style="display:flex;flex-direction:column;gap:5px;margin-bottom:12px;">
            ${PRESETS.map((p, i) => `<button class="bpr" data-v="${p.id}" style="padding:9px 12px;border-radius:10px;border:${i === 0 ? '2px solid var(--accent)' : '1px solid var(--glass-border)'};background:${i === 0 ? 'rgba(39,174,96,.1)' : 'rgba(255,255,255,.03)'};color:white;cursor:pointer;text-align:left;display:flex;align-items:center;gap:10px;transition:all .15s;font-family:inherit;"><span style="width:24px;height:24px;border-radius:50%;background:${p.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid ${p.icon === 'truck' ? 'fa-truck' : p.icon === 'tag' ? 'fa-tag' : p.icon === 'sparkles' ? 'fa-wand-magic-sparkles' : 'fa-bolt'}" style="font-size:.5rem;color:white;"></i></span><span style="font-size:.75rem;font-weight:700;">${p.label}</span></button>`).join('')}
        </div>

        <div id="b-pct-box" style="display:none;background:rgba(255,255,255,.03);border:1px solid var(--glass-border);border-radius:10px;padding:10px;margin-bottom:12px;">
            <label style="font-size:.72rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px;display:block;">Desconto (%)</label>
            <input id="b-pct" type="number" min="1" max="99" value="20" style="width:100%;padding:7px;border-radius:6px;border:1px solid var(--glass-border);background:rgba(255,255,255,.05);color:white;font-size:1rem;font-weight:800;text-align:center;font-family:inherit;outline:none;">
        </div>

        <div style="border-top:1px solid var(--glass-border);padding-top:10px;">
            ${slider('b-ico-size', 'Ícone — Tamanho', 10, 50, 28, '%')}
            ${slider('b-ico-sw', 'Ícone — Espessura', 1, 5, 2.5, '')}
            ${slider('b-fs', 'Fonte — Tamanho', 14, 72, 36, 'px')}
            ${slider('b-lh', 'Fonte — Altura da Linha', 60, 180, 115, '%')}
            ${slider('b-ls', 'Fonte — Espaçamento', -5, 20, 2, '')}
        </div>

        <div style="border-top:1px solid var(--glass-border);padding-top:10px;margin-bottom:10px;">
            <p class="subtitle" style="margin-bottom:5px;">Cor da Forma</p>
            <div id="b-fill-grid" style="display:flex;flex-wrap:wrap;gap:6px;">${bgColorsHTML}</div>
        </div>
        <div style="margin-bottom:10px;">
            <p class="subtitle" style="margin-bottom:5px;">Cor do Texto / Ícone</p>
            <div id="b-text-grid" style="display:flex;flex-wrap:wrap;gap:6px;">${textColorsHTML}</div>
        </div>
        <div style="margin-bottom:10px;">
            <p class="subtitle" style="margin-bottom:5px;">Borda</p>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
                <input id="b-bw" type="range" min="0" max="12" value="0" style="flex:1;">
                <span id="b-bw-val" style="font-size:.72rem;width:24px;text-align:right;">0</span>
            </div>
            <div id="b-border-grid" style="display:flex;flex-wrap:wrap;gap:6px;">${borderColorsHTML}</div>
        </div>
        <div style="margin-bottom:14px;">
            ${slider('b-sh', 'Sombra', 0, 40, 0, '')}
        </div>

        <p class="subtitle" style="margin-bottom:5px;">Posição ao Inserir</p>
        <div id="b-align" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px;">
            ${['left|fa-align-left|Esq.','center|fa-align-center|Centro','right|fa-align-right|Dir.'].map(s => { const [id,ic,lb] = s.split('|'); return `<button class="bal" data-v="${id}" style="padding:8px 0;border-radius:8px;border:${id === 'center' ? '2px solid var(--accent)' : '1px solid var(--glass-border)'};background:${id === 'center' ? 'rgba(39,174,96,.12)' : 'rgba(255,255,255,.03)'};color:${id === 'center' ? 'var(--accent)' : 'var(--text-secondary)'};cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;font-family:inherit;"><i class="fa-solid ${ic}" style="font-size:.85rem;"></i><span style="font-size:.55rem;font-weight:700;">${lb}</span></button>`; }).join('')}
        </div>

        <button id="b-add" style="width:100%;padding:14px;border-radius:10px;background:var(--accent);color:white;border:none;cursor:pointer;font-size:.85rem;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s;font-family:inherit;">
            <i class="fa-solid fa-stamp"></i> Inserir Selo
        </button>
    `;

    sidebarContent.appendChild(div);

    // ── Preview canvas ─────────────────────────────────────────────────────
    const previewEl = div.querySelector('#badge-preview-canvas');
    previewCanvas = new fabric.StaticCanvas(previewEl, { width: PREVIEW_SIZE, height: PREVIEW_SIZE, backgroundColor: 'transparent' });

    function getLines() {
        return sel.preset.editable ? ['até', `${sel.pct}%`, 'OFF'] : sel.preset.lines;
    }

    async function refreshPreview() {
        if (!previewCanvas) return;
        previewCanvas.clear();
        const badgeSize = PREVIEW_SIZE * 0.82;
        const scale = badgeSize / 300;
        try {
            const objs = await buildBadgeObjects({
                ...sel,
                preset: { ...sel.preset, lines: getLines() },
                fontSize: sel.fontSize * scale,
            }, badgeSize);
            const group = new fabric.Group(objs, {
                left: PREVIEW_SIZE / 2, top: PREVIEW_SIZE / 2,
                originX: 'center', originY: 'center',
                selectable: false, evented: false,
            });
            previewCanvas.add(group);
            previewCanvas.renderAll();
        } catch (e) { console.warn('Badge preview error:', e); }
    }

    function queuePreview() {
        clearTimeout(previewDebounce);
        previewDebounce = setTimeout(refreshPreview, 50);
    }
    refreshPreview();

    // ── Wiring ─────────────────────────────────────────────────────────────
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

    div.querySelectorAll('.bsh').forEach(b => b.onclick = () => { sel.shape = b.dataset.v; setGroup('.bsh', sel.shape); queuePreview(); });

    div.querySelectorAll('.bpr').forEach(b => b.onclick = () => {
        sel.preset = PRESETS.find(p => p.id === b.dataset.v);
        sel.fillColor = sel.preset.bg;
        sel.shape = sel.preset.shape;
        setGroup('.bpr', sel.preset.id);
        setGroup('.bsh', sel.shape);
        div.querySelector('#b-pct-box').style.display = sel.preset.editable ? 'block' : 'none';
        markColor(div.querySelector('#b-fill-grid'), sel.fillColor);
        queuePreview();
    });

    const pctIn = div.querySelector('#b-pct');
    if (pctIn) pctIn.oninput = () => { sel.pct = pctIn.value; queuePreview(); };

    // Sliders (including new iconStroke and lineHeight)
    const wireSlider = (id, key, suffix) => {
        const inp = div.querySelector('#' + id);
        const v = div.querySelector('#' + id + '-val');
        if (inp) inp.oninput = () => { sel[key] = parseFloat(inp.value); v.textContent = inp.value + suffix; queuePreview(); };
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

    fillGrid.querySelectorAll('[data-hex]').forEach(c => c.onclick = () => { sel.fillColor = c.dataset.hex; markColor(fillGrid, sel.fillColor); queuePreview(); });
    textGrid.querySelectorAll('[data-hex]').forEach(c => c.onclick = () => { sel.textColor = c.dataset.hex; markColor(textGrid, sel.textColor); queuePreview(); });
    borderGrid.querySelectorAll('[data-hex]').forEach(c => c.onclick = () => { sel.borderColor = c.dataset.hex; markColor(borderGrid, sel.borderColor); queuePreview(); });
    markColor(fillGrid, sel.fillColor);
    markColor(textGrid, sel.textColor);

    div.querySelectorAll('.bal').forEach(b => b.onclick = () => { sel.align = b.dataset.v; setGroup('.bal', sel.align); });

    const btnAdd = div.querySelector('#b-add');
    btnAdd.onmouseenter = () => { btnAdd.style.filter = 'brightness(1.15)'; };
    btnAdd.onmouseleave = () => { btnAdd.style.filter = ''; };
    btnAdd.onclick = () => {
        const canvas = state.getCanvas();
        if (!canvas) return;
        const p = { ...sel.preset, lines: getLines() };
        buildBadgeObjects({ ...sel, preset: p }, 300).then(objs => {
            const badge = new fabric.Group(objs, {
                left: canvas.width / 2, top: canvas.height / 2,
                originX: 'center', originY: 'center',
            });
            if (sel.align === 'left') badge.set({ left: 180 });
            else if (sel.align === 'right') badge.set({ left: canvas.width - 180 });
            badge.isBadge = true;
            canvas.add(badge);
            canvas.setActiveObject(badge);
            canvas.renderAll();
            history.save();
        });
    };
}
