// js/tools/badges.js
import { state } from '../state.js';
import { history } from '../history.js';

// ── Lucide SVG paths (inline, sem dependência de CDN) ─────────────────────────
const ICONS = {
    truck: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,
    tag:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1.5" fill="white" stroke="none"/></svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`,
    zap:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`,
};

// ── Gerador de pontos da estrela ───────────────────────────────────────────────
function starPoints(cx, cy, outerR, innerR, numPoints) {
    const pts = [];
    for (let i = 0; i < numPoints * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI / numPoints) * i - Math.PI / 2;
        pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
    return pts;
}

// ── Gerador de pontos do starburst (explosão) ──────────────────────────────────
function starburstPoints(cx, cy, outerR, innerR, numPoints) {
    return starPoints(cx, cy, outerR, innerR, numPoints);
}

// ── Configurações das formas ───────────────────────────────────────────────────
const SHAPES = [
    { id: 'circle',    label: 'Círculo',   icon: 'fa-circle' },
    { id: 'star',      label: 'Estrela',   icon: 'fa-star' },
    { id: 'burst',     label: 'Explosão',  icon: 'fa-sun' },
    { id: 'square',    label: 'Quadrado',  icon: 'fa-square' },
];

// ── Presets de selos ───────────────────────────────────────────────────────────
const PRESETS = [
    {
        id: 'entrega',
        label: 'Entrega Rápida',
        icon: 'truck',
        lines: ['Entrega', 'Rápida'],
        shape: 'circle',
        bg: '#27AE60',
        textColor: '#ffffff',
    },
    {
        id: 'oferta',
        label: 'Oferta',
        icon: 'tag',
        lines: ['Oferta', 'Especial'],
        shape: 'burst',
        bg: '#C01A21',
        textColor: '#ffffff',
    },
    {
        id: 'novidade',
        label: 'Novidade',
        icon: 'sparkles',
        lines: ['Novidade', 'na Allu'],
        shape: 'star',
        bg: '#267AB3',
        textColor: '#ffffff',
    },
    {
        id: 'off',
        label: '% OFF',
        icon: 'zap',
        lines: ['até', '19%', 'OFF'],
        shape: 'burst',
        bg: '#0F190A',
        textColor: '#ffffff',
        editable: true,
    },
];

// ── Criação do grupo fabric ────────────────────────────────────────────────────
function createBadgeShape(shapeId, size, fillColor) {
    const half = size / 2;
    switch (shapeId) {
        case 'circle':
            return new fabric.Circle({
                radius: half,
                fill: fillColor,
                stroke: 'rgba(255,255,255,0.15)',
                strokeWidth: size * 0.04,
                originX: 'center', originY: 'center',
                left: 0, top: 0,
            });
        case 'square':
            return new fabric.Rect({
                width: size, height: size,
                rx: size * 0.12, ry: size * 0.12,
                fill: fillColor,
                stroke: 'rgba(255,255,255,0.15)',
                strokeWidth: size * 0.04,
                originX: 'center', originY: 'center',
                left: 0, top: 0,
            });
        case 'star':
            return new fabric.Polygon(
                starPoints(0, 0, half, half * 0.45, 5),
                {
                    fill: fillColor,
                    stroke: 'rgba(255,255,255,0.15)',
                    strokeWidth: size * 0.03,
                    originX: 'center', originY: 'center',
                    left: 0, top: 0,
                }
            );
        case 'burst':
        default:
            return new fabric.Polygon(
                starburstPoints(0, 0, half, half * 0.72, 12),
                {
                    fill: fillColor,
                    stroke: 'rgba(255,255,255,0.12)',
                    strokeWidth: size * 0.025,
                    originX: 'center', originY: 'center',
                    left: 0, top: 0,
                }
            );
    }
}

async function addBadgeToCanvas(preset, shapeId, alignMode, customText) {
    const canvas = state.getCanvas();
    if (!canvas) return;

    const SIZE = 300; // tamanho base do selo em pixels do documento
    const bgColor = preset.bg;
    const textColor = preset.textColor;

    // 1. Forma de fundo
    const shape = createBadgeShape(shapeId, SIZE, bgColor);

    // 2. Ícone SVG
    const iconSvgStr = ICONS[preset.icon].replace('stroke="white"', `stroke="${textColor}"`);
    const iconSize = SIZE * 0.28;

    const iconFabric = await new Promise(resolve => {
        fabric.loadSVGFromString(iconSvgStr, (objects, options) => {
            const group = fabric.util.groupSVGElements(objects, options);
            const scale = iconSize / Math.max(group.width, group.height);
            group.set({
                scaleX: scale, scaleY: scale,
                originX: 'center', originY: 'center',
                left: 0,
                top: -(SIZE * 0.16),
                selectable: false,
            });
            resolve(group);
        });
    });

    // 3. Linhas de texto
    const lines = customText ? [customText] : preset.lines;
    const lineObjects = lines.map((line, i) => {
        const isLarge = lines.length > 1 && i === lines.length - 1;
        const fontSize = isLarge ? SIZE * 0.22 : SIZE * 0.13;
        const topOffset = (SIZE * 0.08) + (i * fontSize * 1.1);
        return new fabric.Text(line, {
            fontFamily: 'Plus Jakarta Sans',
            fontSize,
            fontWeight: i === lines.length - 1 ? '800' : '700',
            fill: textColor,
            originX: 'center',
            originY: 'top',
            left: 0,
            top: topOffset - (lines.length > 2 ? SIZE * 0.04 : 0),
            selectable: false,
        });
    });

    // 4. Montar grupo
    const allObjects = [shape, iconFabric, ...lineObjects];
    const badge = new fabric.Group(allObjects, {
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: 'center',
        originY: 'center',
        subTargetCheck: false,
    });

    // Ajuste de alinhamento
    const preset_ = state.getActivePreset() || { w: canvas.width };
    if (alignMode === 'left') {
        badge.set({ left: SIZE / 2 + 40, originX: 'left' });
    } else if (alignMode === 'right') {
        badge.set({ left: canvas.width - SIZE / 2 - 40, originX: 'right' });
    }

    // Metadados para identificação
    badge.isBadge = true;
    badge.badgePresetId = preset.id;
    badge.badgeShape = shapeId;

    canvas.add(badge);
    canvas.setActiveObject(badge);
    canvas.renderAll();
    history.save();
}

// ── Renderização da sidebar ────────────────────────────────────────────────────
export function renderBadgesTools(sidebarContent) {
    const div = document.createElement('div');
    div.className = 'animate-fade';

    let selectedShape = 'burst';
    let selectedAlign = 'center';
    let selectedPreset = PRESETS[0];
    let customPercent = '19';

    // ── HTML estático da UI ──────────────────────────────────────────────────
    div.innerHTML = `
        <!-- Forma do Selo -->
        <p class="subtitle" style="margin-bottom:10px;">Forma do Selo</p>
        <div id="badge-shapes" style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:20px;">
            ${SHAPES.map(s => `
                <button class="badge-shape-btn" data-shape="${s.id}" title="${s.label}" style="
                    padding:12px 4px; border-radius:10px; border:1px solid var(--glass-border);
                    background:${s.id === 'burst' ? 'rgba(39,174,96,0.15)' : 'rgba(255,255,255,0.04)'};
                    color:${s.id === 'burst' ? 'var(--accent)' : 'var(--text-secondary)'};
                    cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px;
                    transition:all 0.18s; outline:${s.id === 'burst' ? '2px solid var(--accent)' : 'none'};
                    font-family:inherit;
                ">
                    <i class="fa-solid ${s.icon}" style="font-size:1.1rem;"></i>
                    <span style="font-size:0.62rem; font-weight:700;">${s.label}</span>
                </button>
            `).join('')}
        </div>

        <!-- Presets de Selos -->
        <p class="subtitle" style="margin-bottom:10px;">Tipo de Selo</p>
        <div id="badge-presets" style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px;">
            ${PRESETS.map((p, idx) => `
                <button class="badge-preset-btn" data-preset="${p.id}" style="
                    padding:14px 16px; border-radius:12px;
                    border:${idx === 0 ? '2px solid var(--accent)' : '1px solid var(--glass-border)'};
                    background:${idx === 0 ? 'rgba(39,174,96,0.12)' : 'rgba(255,255,255,0.03)'};
                    color:white; cursor:pointer; text-align:left;
                    display:flex; align-items:center; gap:12px; transition:all 0.18s;
                    font-family:inherit;
                ">
                    <span style="width:32px; height:32px; border-radius:50%; background:${p.bg}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <i class="fa-solid ${p.icon === 'truck' ? 'fa-truck' : p.icon === 'tag' ? 'fa-tag' : p.icon === 'sparkles' ? 'fa-sparkles' : 'fa-bolt'}" style="font-size:0.7rem; color:white;"></i>
                    </span>
                    <div>
                        <div style="font-size:0.82rem; font-weight:700;">${p.label}</div>
                        <div style="font-size:0.68rem; color:var(--text-secondary);">${p.lines.join(' · ')}</div>
                    </div>
                    ${p.editable ? `<span id="badge-off-preview" style="margin-left:auto; font-size:0.75rem; font-weight:800; color:var(--accent);">${customPercent}%</span>` : ''}
                </button>
            `).join('')}
        </div>

        <!-- % OFF customizável -->
        <div id="badge-off-config" style="display:none; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:12px; padding:14px; margin-bottom:20px;">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:8px;">Porcentagem de Desconto</label>
            <div style="display:flex; align-items:center; gap:10px;">
                <input id="badge-percent-input" type="number" min="1" max="99" value="19"
                    style="flex:1; padding:10px 12px; border-radius:8px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.06); color:white; font-size:1.1rem; font-weight:800; font-family:inherit; text-align:center; outline:none;">
                <span style="font-size:1.1rem; font-weight:800; color:var(--accent);">%</span>
            </div>
        </div>

        <!-- Alinhamento -->
        <p class="subtitle" style="margin-bottom:10px;">Posição na Arte</p>
        <div id="badge-align" style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:24px;">
            ${[
                { id: 'left',   icon: 'fa-align-left',   label: 'Esquerda' },
                { id: 'center', icon: 'fa-align-center',  label: 'Centro' },
                { id: 'right',  icon: 'fa-align-right',   label: 'Direita' },
            ].map(a => `
                <button class="badge-align-btn" data-align="${a.id}" style="
                    padding:12px 4px; border-radius:10px; border:1px solid var(--glass-border);
                    background:${a.id === 'center' ? 'rgba(39,174,96,0.15)' : 'rgba(255,255,255,0.04)'};
                    color:${a.id === 'center' ? 'var(--accent)' : 'var(--text-secondary)'};
                    cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:5px;
                    transition:all 0.18s; outline:${a.id === 'center' ? '2px solid var(--accent)' : 'none'};
                    font-family:inherit;
                ">
                    <i class="fa-solid ${a.icon}" style="font-size:1rem;"></i>
                    <span style="font-size:0.6rem; font-weight:700;">${a.label}</span>
                </button>
            `).join('')}
        </div>

        <!-- Botão Inserir -->
        <button id="btn-add-badge" style="
            width:100%; padding:16px; border-radius:12px;
            background:var(--accent); color:white; border:none;
            cursor:pointer; font-size:0.9rem; font-weight:800;
            display:flex; align-items:center; justify-content:center; gap:10px;
            transition:all 0.2s; font-family:inherit;
        ">
            <i class="fa-solid fa-stamp"></i> Inserir Selo na Arte
        </button>
    `;

    sidebarContent.appendChild(div);

    // ── Interatividade ───────────────────────────────────────────────────────
    const setActive = (selector, dataAttr, value, accentBg = 'rgba(39,174,96,0.15)') => {
        div.querySelectorAll(selector).forEach(btn => {
            const isActive = btn.dataset[dataAttr] === value;
            btn.style.background = isActive ? accentBg : (selector.includes('preset') ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.04)');
            btn.style.color = isActive ? 'var(--accent)' : 'var(--text-secondary)';
            btn.style.border = isActive ? '2px solid var(--accent)' : '1px solid var(--glass-border)';
            btn.style.outline = 'none';
        });
    };

    // Botões de forma
    div.querySelectorAll('.badge-shape-btn').forEach(btn => {
        btn.onclick = () => {
            selectedShape = btn.dataset.shape;
            setActive('.badge-shape-btn', 'shape', selectedShape);
        };
        btn.onmouseenter = () => { if (btn.dataset.shape !== selectedShape) btn.style.background = 'rgba(255,255,255,0.08)'; };
        btn.onmouseleave = () => { if (btn.dataset.shape !== selectedShape) btn.style.background = 'rgba(255,255,255,0.04)'; };
    });

    // Botões de preset
    div.querySelectorAll('.badge-preset-btn').forEach(btn => {
        btn.onclick = () => {
            selectedPreset = PRESETS.find(p => p.id === btn.dataset.preset);
            setActive('.badge-preset-btn', 'preset', selectedPreset.id, 'rgba(39,174,96,0.12)');
            const offConfig = div.querySelector('#badge-off-config');
            offConfig.style.display = selectedPreset.editable ? 'block' : 'none';
        };
        btn.onmouseenter = () => { if (btn.dataset.preset !== selectedPreset?.id) btn.style.background = 'rgba(255,255,255,0.07)'; };
        btn.onmouseleave = () => { if (btn.dataset.preset !== selectedPreset?.id) btn.style.background = 'rgba(255,255,255,0.03)'; };
    });

    // Input de percentual
    const percentInput = div.querySelector('#badge-percent-input');
    const offPreview = div.querySelector('#badge-off-preview');
    if (percentInput) {
        percentInput.oninput = () => {
            customPercent = percentInput.value;
            if (offPreview) offPreview.textContent = `${customPercent}%`;
        };
    }

    // Botões de alinhamento
    div.querySelectorAll('.badge-align-btn').forEach(btn => {
        btn.onclick = () => {
            selectedAlign = btn.dataset.align;
            setActive('.badge-align-btn', 'align', selectedAlign);
        };
        btn.onmouseenter = () => { if (btn.dataset.align !== selectedAlign) btn.style.background = 'rgba(255,255,255,0.08)'; };
        btn.onmouseleave = () => { if (btn.dataset.align !== selectedAlign) btn.style.background = 'rgba(255,255,255,0.04)'; };
    });

    // Botão inserir
    const btnAdd = div.querySelector('#btn-add-badge');
    btnAdd.onmouseenter = () => { btnAdd.style.filter = 'brightness(1.15)'; btnAdd.style.transform = 'translateY(-1px)'; };
    btnAdd.onmouseleave = () => { btnAdd.style.filter = ''; btnAdd.style.transform = ''; };
    btnAdd.onclick = () => {
        const customText = selectedPreset.editable
            ? [`até`, `${customPercent}%`, 'OFF']
            : null;

        // Substituir lines do preset %OFF pelo texto customizado
        const presetToUse = selectedPreset.editable
            ? { ...selectedPreset, lines: customText }
            : selectedPreset;

        addBadgeToCanvas(presetToUse, selectedShape, selectedAlign, null);
    };
}
