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

/**
 * Aplica o zoom centralizando no ponto `anchor` (coordenadas de tela clientX/clientY).
 * Se `anchor` for 'center', centraliza o zoom no canvas ativo.
 */
function getCanvasLogical(canvas) {
    // Use per-canvas stored dimensions (set by generateFourFormats / carousel)
    // Fallback to active preset for single-canvas mode
    if (canvas.originalW && canvas.originalH) {
        return { w: canvas.originalW, h: canvas.originalH };
    }
    return getActivePreset();
}

function applyZoom(newScale, anchor) {
    if (state.canvases.length === 0) return;
    newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newScale));

    const wrapper = document.getElementById('canvas-wrapper');

    // Max logical width across all canvases — used for centering the wrapper
    const maxLogicalW = Math.max(...state.canvases.map(c => getCanvasLogical(c).w));

    if (wrapper) {
        const currentScale = state.canvases[0].getZoom();
        const wrapperRect = wrapper.getBoundingClientRect();

        let pt = null;
        if (anchor && anchor !== 'center') {
            pt = anchor;
        } else {
            const activeCanvas = state.getCanvas();
            if (activeCanvas) {
                const activeContainer = activeCanvas.getElement().parentNode;
                if (activeContainer) {
                    const r = activeContainer.getBoundingClientRect();
                    pt = {
                        clientX: r.left + r.width / 2,
                        clientY: r.top + r.height / 2
                    };
                }
            }
        }

        if (!pt) {
            pt = {
                clientX: wrapperRect.left + wrapperRect.width / 2,
                clientY: wrapperRect.top + wrapperRect.height / 2
            };
        }

        // 1. Obter padding atual do wrapper
        const style = window.getComputedStyle(wrapper);
        const currentPaddingLeft = parseFloat(style.paddingLeft) || 0;
        const currentPaddingTop = parseFloat(style.paddingTop) || 0;

        // 2. Calcular coordenada relativa ao início do conteúdo (após padding)
        const xInContent = wrapper.scrollLeft + pt.clientX - wrapperRect.left - currentPaddingLeft;
        const yInContent = wrapper.scrollTop + pt.clientY - wrapperRect.top - currentPaddingTop;

        // 3. Aplicar dimensões e zoom em cada canvas usando suas próprias dimensões lógicas
        state.canvases.forEach(canvas => {
            const { w: cw, h: ch } = getCanvasLogical(canvas);
            canvas.setDimensions(
                { width: cw * newScale, height: ch * newScale },
                { backstoreOnly: false }
            );
            canvas.setZoom(newScale);

            const container = canvas.getElement().parentNode;
            container.style.width  = Math.round(cw * newScale) + 'px';
            container.style.height = Math.round(ch * newScale) + 'px';

            drawSafeGuides(canvas, cw, ch, newScale);
            canvas.renderAll();
        });

        // 4. Calcular o novo padding horizontal dinâmico baseado no canvas mais largo
        const canvasWidth = Math.round(maxLogicalW * newScale);
        const newPaddingLeft = Math.max(100, Math.round((wrapper.clientWidth - canvasWidth) / 2));

        wrapper.style.paddingLeft = `${newPaddingLeft}px`;
        wrapper.style.paddingRight = `${newPaddingLeft}px`;
        wrapper.style.paddingTop = '100px';
        wrapper.style.paddingBottom = '100px';

        // 5. Escalonar coordenadas e adicionar novo padding
        const scaleFactor = newScale / currentScale;
        const newXInContent = xInContent * scaleFactor + newPaddingLeft;
        const newYInContent = yInContent * scaleFactor + 100; // paddingTop é fixo em 100px

        // 6. Definir novos offsets de rolagem para alinhar o ponto sob o cursor
        wrapper.scrollLeft = newXInContent - (pt.clientX - wrapperRect.left);
        wrapper.scrollTop  = newYInContent - (pt.clientY - wrapperRect.top);
    } else {
        // Fallback sem wrapper
        state.canvases.forEach(canvas => {
            const { w: cw, h: ch } = getCanvasLogical(canvas);
            canvas.setDimensions(
                { width: cw * newScale, height: ch * newScale },
                { backstoreOnly: false }
            );
            canvas.setZoom(newScale);
            const container = canvas.getElement().parentNode;
            container.style.width  = Math.round(cw * newScale) + 'px';
            container.style.height = Math.round(ch * newScale) + 'px';
            drawSafeGuides(canvas, cw, ch, newScale);
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
    // Use widest canvas width for horizontal fit; no vertical constraint (user can scroll)
    const maxW = Math.max(...state.canvases.map(c => getCanvasLogical(c).w));
    const padding = 120;
    const scale = Math.min(
        (wrapper.clientWidth - padding) / maxW,
        1
    );
    applyZoom(scale, 'center');
}

function resetZoom() {
    // 100% centralizado no active canvas
    applyZoom(1.0, 'center');
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

    if (btnZoomIn)  btnZoomIn.onclick  = () => stepZoomIn('center');
    if (btnZoomOut) btnZoomOut.onclick = () => stepZoomOut('center');
    if (btnZoomFit) btnZoomFit.onclick = fitToScreen;
 
    // Clique no percentual → 100% centrado no active canvas
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
    // ⌘ =  /  ⌘ +  → Zoom In  (âncora = centro do documento)
    // ⌘ -          → Zoom Out (âncora = centro do documento)
    // ⌘ 0          → Fit to screen
    // ⌘ 1          → 100% centrado no active canvas
    document.addEventListener('keydown', (e) => {
        const isMod = e.metaKey || e.ctrlKey;
        if (!isMod) return;
 
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
 
        switch (e.key) {
            case '=':
            case '+':
                e.preventDefault();
                stepZoomIn('center');
                break;
            case '-':
                e.preventDefault();
                stepZoomOut('center');
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
