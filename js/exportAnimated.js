// js/exportAnimated.js
// Exportação de GIF e MP4 a partir das animações de entrada definidas no
// canvas (js/animationEngine.js). Renderiza a timeline quadro a quadro (não
// em tempo real) para garantir frames determinísticos, depois codifica com
// bibliotecas carregadas sob demanda (gif.js / ffmpeg.wasm via CDN), seguindo
// o mesmo padrão de dependências externas já usado no projeto (Fabric.js,
// jsPDF carregados via <script> no index.html).
import { state } from './state.js';
import { notifications } from './ui/notifications.js';
import { getTimelineDuration, buildSnapshots, applyFrame, restoreSnapshots } from './animationEngine.js';

const HOLD_MS = 500; // segura no quadro final um pouco antes de encerrar o loop/arquivo
const MIN_TOTAL_DURATION_MS = 8000; // duração mínima do vídeo/gif exportado, para servir como anúncio completo

function getFilenameBase() {
    const input = document.getElementById('export-filename');
    return (input && input.value.trim() !== '') ? input.value.trim() : 'Allu_Creative_Lab_Animado';
}

function getExportDimensions(canvas) {
    const preset = state.getActivePreset();
    const w = canvas.originalW || (preset ? preset.w : canvas.getWidth());
    const h = canvas.originalH || (preset ? preset.h : canvas.getHeight());
    return { w, h };
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function noAnimationWarning() {
    notifications.alert(
        'Nenhuma animação definida',
        'Adicione uma animação de entrada a pelo menos um objeto do canvas (botão "Animar" na barra flutuante, ou seção "Animação de Entrada" em Propriedades) antes de exportar em GIF/MP4.',
        'fa-film'
    );
}

async function renderFrames(canvas, fps) {
    const duration = getTimelineDuration(canvas);
    if (duration <= 0) return null;

    const dims = getExportDimensions(canvas);
    const multiplier = dims.w / canvas.getWidth();
    // O vídeo/gif sempre dura pelo menos MIN_TOTAL_DURATION_MS: a animação de
    // entrada pode levar só 1-2s, mas o anúncio precisa ficar visível tempo
    // suficiente para o público ler as informações depois que ela termina.
    const totalMs = Math.max(duration + HOLD_MS, MIN_TOTAL_DURATION_MS);
    const frameCount = Math.max(1, Math.round((totalMs / 1000) * fps));
    const snapshots = buildSnapshots(canvas);
    const frames = [];

    try {
        for (let i = 0; i < frameCount; i++) {
            const t = (i / fps) * 1000;
            applyFrame(canvas, t, snapshots);
            // Espera o próximo paint para garantir que o frame já foi desenhado antes de capturar
            await new Promise((resolve) => requestAnimationFrame(resolve));
            frames.push(canvas.toDataURL({ format: 'png', multiplier }));
        }
    } finally {
        restoreSnapshots(canvas, snapshots);
    }
    return { frames, width: Math.round(dims.w), height: Math.round(dims.h) };
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

let gifJsPromise = null;
function loadGifJs() {
    if (window.GIF) return Promise.resolve();
    if (gifJsPromise) return gifJsPromise;
    gifJsPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Falha ao carregar gif.js'));
        document.head.appendChild(script);
    });
    return gifJsPromise;
}

export async function exportAsGif(fps = 15) {
    const canvas = state.getCanvas();
    if (!canvas) return;
    if (getTimelineDuration(canvas) <= 0) {
        noAnimationWarning();
        return;
    }

    await loadGifJs();

    canvas.discardActiveObject();
    canvas.renderAll();

    const result = await renderFrames(canvas, fps);
    if (!result) return;

    const images = await Promise.all(result.frames.map(loadImage));

    await new Promise((resolve, reject) => {
        const gif = new window.GIF({
            workers: 2,
            quality: 10,
            width: result.width,
            height: result.height,
            workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js',
        });

        images.forEach((img) => gif.addFrame(img, { delay: Math.round(1000 / fps) }));

        gif.on('finished', (blob) => {
            downloadBlob(blob, `${getFilenameBase()}.gif`);
            resolve();
        });
        gif.on('abort', () => reject(new Error('Geração do GIF abortada')));

        gif.render();
    });
}

let ffmpegInstance = null;
async function loadFfmpeg() {
    if (ffmpegInstance) return ffmpegInstance;
    const { FFmpeg } = await import('https://esm.sh/@ffmpeg/ffmpeg@0.12.10');
    const { toBlobURL } = await import('https://esm.sh/@ffmpeg/util@0.12.1');

    const ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
}

export async function exportAsVideo(fps = 30) {
    const canvas = state.getCanvas();
    if (!canvas) return;
    if (getTimelineDuration(canvas) <= 0) {
        noAnimationWarning();
        return;
    }

    const [ffmpeg, { fetchFile }] = await Promise.all([
        loadFfmpeg(),
        import('https://esm.sh/@ffmpeg/util@0.12.1'),
    ]);

    canvas.discardActiveObject();
    canvas.renderAll();

    const result = await renderFrames(canvas, fps);
    if (!result) return;

    for (let i = 0; i < result.frames.length; i++) {
        const name = `frame${String(i).padStart(5, '0')}.png`;
        await ffmpeg.writeFile(name, await fetchFile(result.frames[i]));
    }

    await ffmpeg.exec([
        '-framerate', String(fps),
        '-i', 'frame%05d.png',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        'output.mp4',
    ]);

    const data = await ffmpeg.readFile('output.mp4');
    downloadBlob(new Blob([data.buffer], { type: 'video/mp4' }), `${getFilenameBase()}.mp4`);

    // Limpa os arquivos da instância do ffmpeg para a próxima exportação
    for (let i = 0; i < result.frames.length; i++) {
        await ffmpeg.deleteFile(`frame${String(i).padStart(5, '0')}.png`);
    }
    await ffmpeg.deleteFile('output.mp4');
}
