// js/zoom.js
import { state } from './state.js';
import { presets } from './config.js';
import { drawSafeGuides, updateZoomDisplay } from './canvas.js';

// Níveis de zoom fixos para snap (Cmd+/- e botões)
const ZOOM_STEPS = [0.1, 0.15, 0.2, 0.25, 0.33, 0.5, 0.67, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0];
const ZOOM_MIN  = 0.1;
const ZOOM_MAX  = 3.0;

// Posição do mouse relativa ao canvas-wrapper (atualizada continuamente)
let mouseInWrapper = { x: 0, y: 0 };

function getActivePreset() {
    const formatDisplay = document.getElementById('format-display');
    const formatStr = formatDisplay ? formatDisplay.innerText.split(' (')[0] : 'Instagram Feed';
    return Object.values(presets).find(p => p.name === formatStr) || { w: 1080, h: 1080 };
}

/**
 * Aplica o zoom centralizando no ponto `anchor` (coordenadas relativas ao
 * viewport do wrapper). Se `anchor` não for fornecido, usa o centro do wrapper.
 */
function applyZoom(newScale, anchor) {
    if (state.canvases.length === 0) return;
    newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newScale));

    const wrapper = document.getElementById('canvas-wrapper');
    const { w, h } = getActivePreset();

    // ── Calcular scroll compensado para "zoom para o cursor" ────────────────
    if (wrapper) {
        const currentScale = state.canvases[0].getZoom();

        // Ponto âncora no viewport do wrapper (default = centro)
        const ax = anchor ? anchor.x : wrapper.clientWidth  / 2;
        const ay = anchor ? anchor.y : wrapper.clientHeight / 2;

        // Posição absoluta no conteúdo (espaço do DOM antes do zoom)
        const contentX = wrapper.scrollLeft + ax;
        const contentY = wrapper.scrollTop  + ay;

        // Posição lógica (independente de escala)
        const logicalX = contentX / currentScale;
        const logicalY = contentY / currentScale;

        // Depois do zoom: onde esse ponto lógico fica no conteúdo
        const newContentX = logicalX * newScale;
        const newContentY = logicalY * newScale;

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

        // Ajustar o scroll para manter o ponto âncora sob o cursor
        wrapper.scrollLeft = newContentX - ax;
        wrapper.scrollTop  = newContentY - ay;

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
    applyZoom(1.0, mouseInWrapper);
}

export function setupZoom() {
    const wrapper = document.getElementById('canvas-wrapper');

    // ── Rastrear posição do mouse dentro do wrapper ────────────────────────
    if (wrapper) {
        wrapper.addEventListener('mousemove', (e) => {
            const rect = wrapper.getBoundingClientRect();
            mouseInWrapper.x = e.clientX - rect.left;
            mouseInWrapper.y = e.clientY - rect.top;
        });
    }

    // ── Botões da toolbar ──────────────────────────────────────────────────
    const btnZoomIn  = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomFit = document.getElementById('btn-zoom-fit');
    const zoomDisplay = document.getElementById('zoom-display');

    if (btnZoomIn)  btnZoomIn.onclick  = () => stepZoomIn(mouseInWrapper);
    if (btnZoomOut) btnZoomOut.onclick = () => stepZoomOut(mouseInWrapper);
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

            const rect = wrapper.getBoundingClientRect();
            const anchor = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
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
                stepZoomIn(mouseInWrapper);
                break;
            case '-':
                e.preventDefault();
                stepZoomOut(mouseInWrapper);
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
