// js/animationEngine.js
// Motor de animações de entrada para objetos do canvas (qualquer tipo: imagem,
// texto, selo, forma, grupo). Cada objeto animado carrega `animationData =
// { preset, duration, delay }`. O motor nunca lê/escreve nada além disso e do
// estado "autoral" (left/top/scaleX/scaleY/angle/opacity) que o usuário já
// posicionou no canvas — esse estado autoral É o estado final da animação.

export const ANIMATION_PRESETS = [
    { id: 'none', label: 'Nenhuma', icon: 'fa-ban' },
    { id: 'fadeIn', label: 'Fade In', icon: 'fa-circle-half-stroke' },
    { id: 'slideInLeft', label: 'Deslizar (Esq.)', icon: 'fa-right-to-bracket' },
    { id: 'slideInRight', label: 'Deslizar (Dir.)', icon: 'fa-left-to-bracket' },
    { id: 'slideInTop', label: 'Deslizar (Cima)', icon: 'fa-down-to-bracket' },
    { id: 'slideInBottom', label: 'Deslizar (Baixo)', icon: 'fa-up-to-bracket' },
    { id: 'zoomIn', label: 'Zoom In', icon: 'fa-magnifying-glass-plus' },
    { id: 'zoomOut', label: 'Zoom Out', icon: 'fa-magnifying-glass-minus' },
    { id: 'pop', label: 'Pop', icon: 'fa-burst' },
    { id: 'rotateIn', label: 'Girar', icon: 'fa-rotate' },
];

export const DEFAULT_DURATION = 600;
export const DEFAULT_DELAY = 0;

const lerp = (a, b, p) => a + (b - a) * p;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function computeProgress(animData, tMs) {
    const delay = animData.delay || 0;
    const duration = Math.max(1, animData.duration || DEFAULT_DURATION);
    if (tMs <= delay) return 0;
    if (tMs >= delay + duration) return 1;
    return (tMs - delay) / duration;
}

// Aplica escala/ângulo mantendo o CENTRO do objeto fixo no ponto autoral,
// já que left/top no Fabric ancoram o ponto de origem (por padrão o canto
// superior-esquerdo, não o centro) — sem isso, zoom/rotação "orbitam" a
// partir do canto em vez de pivotar no próprio lugar.
function pinCenter(obj, center) {
    obj.setPositionByOrigin(center, obj.originX, obj.originY);
}

function setByPreset(obj, presetId, rawP, snap) {
    const p = easeOutCubic(rawP);
    switch (presetId) {
        case 'fadeIn':
            obj.set({ opacity: lerp(0, snap.opacity, p) });
            break;
        case 'slideInLeft': {
            const offset = Math.max(60, snap.width * 0.6);
            obj.set({ left: lerp(snap.left - offset, snap.left, p), opacity: lerp(0, snap.opacity, p) });
            break;
        }
        case 'slideInRight': {
            const offset = Math.max(60, snap.width * 0.6);
            obj.set({ left: lerp(snap.left + offset, snap.left, p), opacity: lerp(0, snap.opacity, p) });
            break;
        }
        case 'slideInTop': {
            const offset = Math.max(60, snap.height * 0.6);
            obj.set({ top: lerp(snap.top - offset, snap.top, p), opacity: lerp(0, snap.opacity, p) });
            break;
        }
        case 'slideInBottom': {
            const offset = Math.max(60, snap.height * 0.6);
            obj.set({ top: lerp(snap.top + offset, snap.top, p), opacity: lerp(0, snap.opacity, p) });
            break;
        }
        case 'zoomIn': {
            const factor = lerp(0.5, 1, p);
            obj.set({ scaleX: snap.scaleX * factor, scaleY: snap.scaleY * factor, opacity: lerp(0, snap.opacity, p) });
            pinCenter(obj, snap.center);
            break;
        }
        case 'zoomOut': {
            const factor = lerp(1.5, 1, p);
            obj.set({ scaleX: snap.scaleX * factor, scaleY: snap.scaleY * factor, opacity: snap.opacity });
            pinCenter(obj, snap.center);
            break;
        }
        case 'pop': {
            const factor = easeOutBack(rawP);
            obj.set({
                scaleX: snap.scaleX * factor,
                scaleY: snap.scaleY * factor,
                opacity: lerp(0, snap.opacity, Math.min(1, rawP / 0.6)),
            });
            pinCenter(obj, snap.center);
            break;
        }
        case 'rotateIn': {
            const angleOffset = 25;
            obj.set({ angle: lerp(snap.angle - angleOffset, snap.angle, p), opacity: lerp(0, snap.opacity, p) });
            pinCenter(obj, snap.center);
            break;
        }
        default:
            break;
    }
    obj.setCoords();
}

export function getAnimatedObjects(canvas) {
    if (!canvas) return [];
    return canvas.getObjects().filter((o) => o.animationData && o.animationData.preset && o.animationData.preset !== 'none');
}

export function getTimelineDuration(canvas) {
    const objs = getAnimatedObjects(canvas);
    if (objs.length === 0) return 0;
    return Math.max(...objs.map((o) => (o.animationData.delay || 0) + (o.animationData.duration || DEFAULT_DURATION)));
}

function snapshotState(obj) {
    return {
        left: obj.left,
        top: obj.top,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        angle: obj.angle || 0,
        opacity: obj.opacity === undefined ? 1 : obj.opacity,
        center: obj.getCenterPoint(),
        width: obj.getScaledWidth(),
        height: obj.getScaledHeight(),
    };
}

export function buildSnapshots(canvas) {
    const map = new Map();
    getAnimatedObjects(canvas).forEach((obj) => map.set(obj, snapshotState(obj)));
    return map;
}

export function applyFrame(canvas, tMs, snapshots) {
    snapshots.forEach((snap, obj) => {
        const animData = obj.animationData;
        if (!animData || animData.preset === 'none') return;
        const rawP = computeProgress(animData, tMs);
        setByPreset(obj, animData.preset, rawP, snap);
    });
    canvas.renderAll();
}

export function restoreSnapshots(canvas, snapshots) {
    snapshots.forEach((snap, obj) => {
        obj.set({
            left: snap.left,
            top: snap.top,
            scaleX: snap.scaleX,
            scaleY: snap.scaleY,
            angle: snap.angle,
            opacity: snap.opacity,
        });
        obj.setCoords();
    });
    canvas.renderAll();
}

let previewRAF = null;
let previewSnapshots = null;
let previewCanvas = null;

export function isPreviewing() {
    return previewRAF !== null;
}

// Roda a linha do tempo completa do canvas em tempo real (para o botão de
// Prévia da barra superior). Retorna false se não houver nada animado.
export function playPreview(canvas, { onDone } = {}) {
    stopPreview();
    const duration = getTimelineDuration(canvas);
    if (duration <= 0) return false;

    previewSnapshots = buildSnapshots(canvas);
    previewCanvas = canvas;
    const start = performance.now();

    function tick(now) {
        const t = now - start;
        if (t >= duration) {
            restoreSnapshots(canvas, previewSnapshots);
            previewRAF = null;
            previewSnapshots = null;
            previewCanvas = null;
            if (onDone) onDone();
            return;
        }
        applyFrame(canvas, t, previewSnapshots);
        previewRAF = requestAnimationFrame(tick);
    }
    previewRAF = requestAnimationFrame(tick);
    return true;
}

export function stopPreview() {
    if (previewRAF !== null) {
        cancelAnimationFrame(previewRAF);
        previewRAF = null;
    }
    if (previewSnapshots && previewCanvas) {
        restoreSnapshots(previewCanvas, previewSnapshots);
    }
    previewSnapshots = null;
    previewCanvas = null;
}
