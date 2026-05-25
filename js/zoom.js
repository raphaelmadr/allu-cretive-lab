// js/zoom.js
import { state } from './state.js';
import { presets } from './config.js';
import { drawSafeGuides, updateZoomDisplay } from './canvas.js';

// Níveis de zoom fixos para snap (Cmd+/- e botões)
const ZOOM_STEPS = [0.1, 0.15, 0.2, 0.25, 0.33, 0.5, 0.67, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0];
const ZOOM_MIN  = 0.1;
const ZOOM_MAX  = 3.0;

// Posição do mouse relativa ao viewport
let mouseClientPos = null;

function getActivePreset() {
    const formatDisplay = document.getElementById('format-display');
    const formatStr = formatDisplay ? formatDisplay.innerText.split(' (')[0] : 'Instagram Feed';
    return Object.values(presets).find(p => p.name === formatStr) || { w: 1080, h: 1080 };
}

function getAnchor(anchor) {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return null;
    
    const rect = wrapper.getBoundingClientRect();
    
    const target = anchor || mouseClientPos;
    if (target && 
        target.clientX >= rect.left && target.clientX <= rect.right &&
        target.clientY >= rect.top && target.clientY <= rect.bottom) {
        return target;
    }
    
    return {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
    };
}

/**
 * Aplica o zoom centralizando no ponto `anchor` (coordenadas de tela clientX/clientY).
 * Se `anchor` não for fornecido, usa o cursor do mouse ou o centro do wrapper.
 */
function applyZoom(newScale, anchor) {
    if (state.canvases.length === 0) return;
    newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newScale));

    const wrapper = document.getElementById('canvas-wrapper');
    const { w, h } = getActivePreset();

    if (wrapper) {
        const currentScale = state.canvases[0].getZoom();
        const pt = getAnchor(anchor);
        const wrapperRect = wrapper.getBoundingClientRect();

        const containers = Array.from(wrapper.querySelectorAll('.canvas-container'));
        const targetContainer = containers.find(c => {
            const r = c.getBoundingClientRect();
            return pt.clientX >= r.left && pt.clientX <= r.right &&
                   pt.clientY >= r.top && pt.clientY <= r.bottom;
        }) || containers[0];

        if (targetContainer) {
            const idx = containers.indexOf(targetContainer);
            const containerRect = targetContainer.getBoundingClientRect();
            
            const mouseXInContainer = pt.clientX - containerRect.left;
            const mouseYInContainer = pt.clientY - containerRect.top;

            const newMouseXInContainer = mouseXInContainer * (newScale / currentScale);
            const newMouseYInContainer = mouseYInContainer * (newScale / currentScale);

            // Aplicar dimensões e zoom em todos os canvases
            state.canvases.forEach(canvas => {
                canvas.setDimensions(
                    { width: w * newScale, height: h * newScale },
                    { backstoreOnly: false }
                );
                canvas.setZoom(newScale);

                const container = canvas.getElement().parentNode;
                container.style.width  = Math.round(w * newScale) + 'px';
                container.style.height = Math.round(h * newScale) + 'px';

                drawSafeGuides(canvas, w, h, newScale);
                canvas.renderAll();
            });

            // Ajustar o scroll para manter o ponto sob o cursor
            const fixedOffset = 100 + idx * 80;
            wrapper.scrollLeft = fixedOffset + idx * w * newScale - pt.clientX + newMouseXInContainer + wrapperRect.left;
            wrapper.scrollTop  = 100 - pt.clientY + wrapperRect.top + newMouseYInContainer;
        }
    } else {
        // Fallback sem wrapper
        state.canvases.forEach(canvas => {
            canvas.setDimensions(
                { width: w * newScale, height: h * newScale },
                { backstoreOnly: false }
            );
            canvas.setZoom(newScale);
            const container = canvas.getElement().parentNode;
            container.style.width  = Math.round(w * newScale) + 'px';
            container.style.height = Math.round(h * newScale) + 'px';
            drawSafeGuides(canvas, w, h, newScale);
            canvas.renderAll();
        });
    }

    updateZoomDisplay(newScale);
}

function stepZoomIn(anchor) {
    if (state.canvases.length === 0) return;
    const current = state.canvases[0].getZoom();
    const next = ZOOM_STEPS.find(s => s > current + 0.001);
    applyZoom(next ?? ZOOM_MAX, anchor);
}

function stepZoomOut(anchor) {
    if (state.canvases.length === 0) return;
    const current = state.canvases[0].getZoom();
    const prev = [...ZOOM_STEPS].reverse().find(s => s < current - 0.001);
    applyZoom(prev ?? ZOOM_MIN, anchor);
}

function fitToScreen() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper || state.canvases.length === 0) return;
    const { w, h } = getActivePreset();
    const padding = 120;
    const scale = Math.min(
        (wrapper.clientWidth  - padding) / w,
        (wrapper.clientHeight - padding) / h,
        1
    );
    // Fit centraliza — não usa âncora
    applyZoom(scale, null);
}

function resetZoom() {
    // 100% centralizado no cursor atual
    applyZoom(1.0, mouseClientPos);
}

export function setupZoom() {
    const wrapper = document.getElementById('canvas-wrapper');

    // ── Rastrear posição do mouse dentro do wrapper ────────────────────────
    if (wrapper) {
        wrapper.addEventListener('mousemove', (e) => {
            mouseClientPos = { clientX: e.clientX, clientY: e.clientY };
        });
    }

    // ── Botões da toolbar ──────────────────────────────────────────────────
    const btnZoomIn  = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomFit = document.getElementById('btn-zoom-fit');
    const zoomDisplay = document.getElementById('zoom-display');

    if (btnZoomIn)  btnZoomIn.onclick  = () => stepZoomIn(mouseClientPos);
    if (btnZoomOut) btnZoomOut.onclick = () => stepZoomOut(mouseClientPos);
    if (btnZoomFit) btnZoomFit.onclick = fitToScreen;

    // Clique no percentual → 100% centrado no mouse
    // Duplo clique → fit to screen
    if (zoomDisplay) {
        zoomDisplay.style.cursor = 'pointer';
        zoomDisplay.title = 'Clique: 100% · Duplo clique: Ajustar à tela (⌘0)';
        zoomDisplay.onclick    = resetZoom;
        zoomDisplay.ondblclick = fitToScreen;
    }

    // ── Scroll do mouse / trackpad com Cmd/Ctrl → zoom para o cursor ───────
    if (wrapper) {
        wrapper.addEventListener('wheel', (e) => {
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            if (state.canvases.length === 0) return;

            const anchor = {
                clientX: e.clientX,
                clientY: e.clientY,
            };

            const current = state.canvases[0].getZoom();
            // Scroll suave: quanto mais zoomed-in, menor o passo
            const factor = e.deltaY < 0 ? 1.08 : 0.93;
            applyZoom(current * factor, anchor);
        }, { passive: false });
    }

    // ── Atalhos de teclado ─────────────────────────────────────────────────
    // ⌘ =  /  ⌘ +  → Zoom In  (âncora = última posição do mouse)
    // ⌘ -          → Zoom Out (âncora = última posição do mouse)
    // ⌘ 0          → Fit to screen
    // ⌘ 1          → 100% centrado no mouse
    document.addEventListener('keydown', (e) => {
        const isMod = e.metaKey || e.ctrlKey;
        if (!isMod) return;

        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;

        switch (e.key) {
            case '=':
            case '+':
                e.preventDefault();
                stepZoomIn(mouseClientPos);
                break;
            case '-':
                e.preventDefault();
                stepZoomOut(mouseClientPos);
                break;
            case '0':
                e.preventDefault();
                fitToScreen();
                break;
            case '1':
                e.preventDefault();
                resetZoom();
                break;
        }
    });
}

export { applyZoom, fitToScreen, resetZoom };
