// js/zoom.js
import { state } from './state.js';
import { presets } from './config.js';
import { drawSafeGuides, updateZoomDisplay } from './canvas.js';

// Níveis de zoom fixos para snap (Cmd+/- e botões)
const ZOOM_STEPS = [0.1, 0.15, 0.2, 0.25, 0.33, 0.5, 0.67, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0];
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 3.0;

function getActivePreset() {
    const formatDisplay = document.getElementById('format-display');
    const formatStr = formatDisplay ? formatDisplay.innerText.split(' (')[0] : 'Instagram Feed';
    return Object.values(presets).find(p => p.name === formatStr) || { w: 1080, h: 1080 };
}

function applyZoom(newScale) {
    if (state.canvases.length === 0) return;
    newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newScale));

    const { w, h } = getActivePreset();

    state.canvases.forEach(canvas => {
        canvas.setDimensions({
            width: w * newScale,
            height: h * newScale
        }, { backstoreOnly: false });

        canvas.setZoom(newScale);

        const container = canvas.getElement().parentNode;
        container.style.width  = Math.round(w * newScale) + 'px';
        container.style.height = Math.round(h * newScale) + 'px';

        drawSafeGuides(canvas, w, h, newScale);
        canvas.renderAll();
    });

    updateZoomDisplay(newScale);
}

function stepZoomIn() {
    if (state.canvases.length === 0) return;
    const current = state.canvases[0].getZoom();
    const next = ZOOM_STEPS.find(s => s > current + 0.001);
    applyZoom(next ?? ZOOM_MAX);
}

function stepZoomOut() {
    if (state.canvases.length === 0) return;
    const current = state.canvases[0].getZoom();
    const prev = [...ZOOM_STEPS].reverse().find(s => s < current - 0.001);
    applyZoom(prev ?? ZOOM_MIN);
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
    applyZoom(scale);
}

function resetZoom() {
    applyZoom(1.0);
}

export function setupZoom() {
    // ── Botões da toolbar ──────────────────────────────────────────────────────
    const btnZoomIn  = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const zoomDisplay = document.getElementById('zoom-display');

    if (btnZoomIn)  btnZoomIn.onclick  = stepZoomIn;
    if (btnZoomOut) btnZoomOut.onclick = stepZoomOut;

    const btnZoomFit = document.getElementById('btn-zoom-fit');
    if (btnZoomFit) btnZoomFit.onclick = fitToScreen;

    // Clique no percentual → reset para 100%
    if (zoomDisplay) {
        zoomDisplay.style.cursor = 'pointer';
        zoomDisplay.title = 'Clique para 100% · Duplo clique para ajustar à tela';
        zoomDisplay.onclick = resetZoom;
        zoomDisplay.ondblclick = fitToScreen;
    }

    // ── Scroll do mouse / trackpad no canvas-wrapper ───────────────────────────
    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper) {
        wrapper.addEventListener('wheel', (e) => {
            // Só interfere no zoom se Cmd (Mac) ou Ctrl (Win/Linux) estiver pressionado
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();

            if (state.canvases.length === 0) return;
            const current = state.canvases[0].getZoom();
            // deltaY > 0 = scroll para baixo = zoom out
            const delta = e.deltaY < 0 ? 0.05 : -0.05;
            applyZoom(current + delta);
        }, { passive: false });
    }

    // ── Atalhos de teclado ─────────────────────────────────────────────────────
    // Cmd/Ctrl + =  ou  Cmd/Ctrl + +  → Zoom In
    // Cmd/Ctrl + -                     → Zoom Out
    // Cmd/Ctrl + 0                     → Fit to screen
    // Cmd/Ctrl + 1                     → 100%
    document.addEventListener('keydown', (e) => {
        const isMod = e.metaKey || e.ctrlKey; // Cmd no Mac, Ctrl no Win
        if (!isMod) return;

        // Não capturar quando o foco está em um input/textarea
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;

        switch (e.key) {
            case '=':
            case '+':
                e.preventDefault();
                stepZoomIn();
                break;
            case '-':
                e.preventDefault();
                stepZoomOut();
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

// Expõe funções para uso externo (ex: resizeCanvas no canvas.js)
export { applyZoom, fitToScreen, resetZoom };
