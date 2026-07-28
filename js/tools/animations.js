// js/tools/animations.js
// Controles de animação de entrada compartilhados entre o painel de
// Propriedades (js/tools/properties.js) e a barra flutuante
// (js/ui/floatingToolbar.js) — mesma marcação/wiring, evitando duplicar a
// grade de presets e os sliders de duração/atraso em dois lugares.
import { history } from '../history.js';
import { ANIMATION_PRESETS, DEFAULT_DURATION, DEFAULT_DELAY, playPreview } from '../animationEngine.js';

export function animationControlsHTML(obj, idPrefix, compact = false) {
    const data = obj.animationData || { preset: 'none', duration: DEFAULT_DURATION, delay: DEFAULT_DELAY };
    const cols = compact ? 5 : 5;
    const gridHTML = ANIMATION_PRESETS.map((p) => `
        <button type="button" class="${idPrefix}-preset-btn" data-preset="${p.id}" title="${p.label}"
            style="display:flex; flex-direction:column; align-items:center; gap:4px; padding:${compact ? '8px 2px' : '10px 4px'}; border-radius:8px; cursor:pointer; font-family:inherit;
                   border:1px solid ${data.preset === p.id ? 'var(--accent)' : 'var(--glass-border)'};
                   background:${data.preset === p.id ? 'rgba(39,174,96,0.15)' : 'rgba(255,255,255,0.02)'};
                   color:${data.preset === p.id ? 'var(--accent)' : 'var(--text-secondary)'};">
            <i class="fa-solid ${p.icon}" style="font-size:${compact ? '0.85rem' : '1rem'};"></i>
            <span style="font-size:0.6rem; font-weight:600; text-align:center; line-height:1.1;">${p.label}</span>
        </button>
    `).join('');

    return `
        <div style="display:grid; grid-template-columns:repeat(${cols}, 1fr); gap:6px;">${gridHTML}</div>
        <div id="${idPrefix}-timing" style="display:${data.preset === 'none' ? 'none' : 'flex'}; flex-direction:column; gap:10px; margin-top:12px;">
            <div style="display:flex; flex-direction:column; gap:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <label style="font-size:0.72rem; color:var(--text-secondary);">Duração</label>
                    <span id="${idPrefix}-duration-val" style="font-size:0.7rem; color:var(--text-secondary);">${data.duration || DEFAULT_DURATION}ms</span>
                </div>
                <input type="range" id="${idPrefix}-duration" min="200" max="3000" step="50" value="${data.duration || DEFAULT_DURATION}" style="width:100%;">
            </div>
            <div style="display:flex; flex-direction:column; gap:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <label style="font-size:0.72rem; color:var(--text-secondary);">Atraso (Delay)</label>
                    <span id="${idPrefix}-delay-val" style="font-size:0.7rem; color:var(--text-secondary);">${data.delay || DEFAULT_DELAY}ms</span>
                </div>
                <input type="range" id="${idPrefix}-delay" min="0" max="3000" step="50" value="${data.delay || DEFAULT_DELAY}" style="width:100%;">
            </div>
            <button type="button" id="${idPrefix}-preview" style="width:100%; padding:9px; border-radius:8px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; cursor:pointer; font-size:0.75rem; font-weight:600; display:flex; align-items:center; justify-content:center; gap:6px;">
                <i class="fa-solid fa-play"></i> Testar Animação
            </button>
        </div>
    `;
}

export function wireAnimationControls(container, canvas, obj, idPrefix) {
    const timingBox = container.querySelector(`#${idPrefix}-timing`);

    const ensureData = () => {
        if (!obj.animationData) obj.animationData = { preset: 'none', duration: DEFAULT_DURATION, delay: DEFAULT_DELAY };
        return obj.animationData;
    };

    container.querySelectorAll(`.${idPrefix}-preset-btn`).forEach((btn) => {
        btn.onclick = () => {
            const data = ensureData();
            data.preset = btn.dataset.preset;
            if (!data.duration) data.duration = DEFAULT_DURATION;
            if (data.delay === undefined) data.delay = DEFAULT_DELAY;

            container.querySelectorAll(`.${idPrefix}-preset-btn`).forEach((b) => {
                const active = b === btn;
                b.style.border = `1px solid ${active ? 'var(--accent)' : 'var(--glass-border)'}`;
                b.style.background = active ? 'rgba(39,174,96,0.15)' : 'rgba(255,255,255,0.02)';
                b.style.color = active ? 'var(--accent)' : 'var(--text-secondary)';
            });
            if (timingBox) timingBox.style.display = data.preset === 'none' ? 'none' : 'flex';

            canvas.renderAll();
            history.save();
        };
    });

    const durationInput = container.querySelector(`#${idPrefix}-duration`);
    const durationVal = container.querySelector(`#${idPrefix}-duration-val`);
    if (durationInput) {
        durationInput.oninput = (e) => {
            const val = parseInt(e.target.value);
            durationVal.innerText = val + 'ms';
            ensureData().duration = val;
        };
        durationInput.onchange = () => history.save();
    }

    const delayInput = container.querySelector(`#${idPrefix}-delay`);
    const delayVal = container.querySelector(`#${idPrefix}-delay-val`);
    if (delayInput) {
        delayInput.oninput = (e) => {
            const val = parseInt(e.target.value);
            delayVal.innerText = val + 'ms';
            ensureData().delay = val;
        };
        delayInput.onchange = () => history.save();
    }

    const previewBtn = container.querySelector(`#${idPrefix}-preview`);
    if (previewBtn) {
        previewBtn.onclick = () => playPreview(canvas);
    }
}
