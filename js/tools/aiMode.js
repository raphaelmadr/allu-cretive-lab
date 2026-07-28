// js/tools/aiMode.js
// Aba "Modo IA" — chat que gera imagens fotográficas alinhadas à marca allu. via
// api/generate-prompt.js (síntese + JSON estruturado) e api/generate-image.js
// (DALL-E 3), inserindo o resultado como imagem editável no canvas ativo.
import { state } from '../state.js';
import { history } from '../history.js';

// Estado em module-scope: sobrevive a `sidebarContent.innerHTML = ''` (que acontece
// toda vez que o usuário troca de aba) porque módulos ES são singletons — o
// histórico do chat continua ali na próxima vez que a aba "Modo IA" for reaberta.
let messages = [];
let isBusy = false;
let msgCounter = 0;
const nextId = () => `m${++msgCounter}`;

function getActiveFormat() {
    const canvas = state.getCanvas();
    const formatDisplay = document.getElementById('format-display');
    const name = formatDisplay ? formatDisplay.innerText.split(' (')[0].trim() : 'Instagram Feed';
    if (canvas && canvas.originalW && canvas.originalH) {
        return { name, w: canvas.originalW, h: canvas.originalH };
    }
    return { name, w: 1080, h: 1080 };
}

function escapeHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMessages() {
    const log = document.getElementById('ai-chat-log');
    if (!log) return;

    log.innerHTML = messages.map(renderMessageHTML).join('');

    log.querySelectorAll('[data-generate-btn]').forEach((btn) => {
        btn.onclick = () => generateImageForMessage(btn.dataset.generateBtn);
    });

    const sidebarContent = document.getElementById('sidebar-content');
    if (sidebarContent) sidebarContent.scrollTop = sidebarContent.scrollHeight;
}

function renderMessageHTML(m) {
    if (m.type === 'text') {
        return `<div class="ai-msg user"><div class="ai-msg-bubble">${escapeHtml(m.text)}</div></div>`;
    }
    if (m.type === 'thinking') {
        return `<div class="ai-msg assistant"><div class="ai-msg-bubble ai-typing-dots"><span></span><span></span><span></span></div></div>`;
    }
    if (m.type === 'error') {
        return `<div class="ai-msg assistant error"><div class="ai-msg-bubble">${escapeHtml(m.text)}</div></div>`;
    }
    if (m.type === 'image') {
        return `
            <div class="ai-msg assistant">
                <div class="ai-msg-bubble">
                    <img src="${m.imageDataUrl}" style="width:100%; border-radius:8px; display:block; margin-bottom:6px;">
                    ✅ Adicionada ao canvas ativo.
                </div>
            </div>`;
    }
    if (m.type === 'proposal') {
        const s = m.structured;
        const docsHTML = (s.meta?.consulted_docs || []).map(id => `<span class="ai-doc-tag">${escapeHtml(id)}</span>`).join('');
        const summary = s.meta?.request_summary || 'Proposta de imagem';
        const details = [s.scene?.subject, s.scene?.environment, s.style?.visual_style, s.style?.mood]
            .filter(Boolean).map(escapeHtml).join(' · ');
        return `
            <div class="ai-msg assistant">
                <div class="ai-msg-bubble ai-proposal-card">
                    <div>${escapeHtml(summary)}</div>
                    ${details ? `<div style="font-size:0.7rem; color:var(--text-secondary);">${details}</div>` : ''}
                    <div>${docsHTML}</div>
                    <button type="button" class="ai-generate-btn" data-generate-btn="${m.id}">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Gerar Imagem
                    </button>
                </div>
            </div>`;
    }
    return '';
}

async function sendMessage() {
    if (isBusy) return;
    const textarea = document.getElementById('ai-chat-input');
    if (!textarea) return;
    const text = textarea.value.trim();
    if (!text) return;

    messages.push({ id: nextId(), role: 'user', type: 'text', text });
    textarea.value = '';
    const thinkingId = nextId();
    messages.push({ id: thinkingId, role: 'assistant', type: 'thinking' });
    isBusy = true;
    renderMessages();

    try {
        const payload = {
            messages: messages
                .filter(m => m.type === 'text' || m.type === 'proposal' || m.type === 'image')
                .map(m => ({
                    role: m.role,
                    content: m.type === 'text' ? m.text : JSON.stringify(m.structured)
                })),
            activeFormat: getActiveFormat()
        };

        const response = await fetch('/api/generate-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await response.json();
        messages = messages.filter(m => m.id !== thinkingId);
        if (!response.ok) throw new Error(json.error || `Erro ${response.status}`);

        messages.push({ id: nextId(), role: 'assistant', type: 'proposal', structured: json });
    } catch (e) {
        messages = messages.filter(m => m.id !== thinkingId);
        messages.push({ id: nextId(), role: 'assistant', type: 'error', text: e.message });
        const { notifications } = await import('../ui/notifications.js');
        notifications.toast('Falha ao consultar a IA: ' + e.message, 'error');
    } finally {
        isBusy = false;
        renderMessages();
    }
}

async function generateImageForMessage(msgId) {
    if (isBusy) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !msg.structured) return;

    isBusy = true;
    const btn = document.querySelector(`[data-generate-btn="${msgId}"]`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gerando imagem...';
    }

    try {
        // Busca o canvas SÓ AGORA (não antes do fetch) — DALL-E leva 10-30s, tempo
        // real o suficiente pro usuário trocar de página do carrossel enquanto espera.
        const activeFormat = getActiveFormat();

        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: msg.structured.generation_prompt, activeFormat })
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || `Erro ${response.status}`);

        const dataUri = `data:image/png;base64,${json.b64Json}`;

        await new Promise((resolve, reject) => {
            fabric.Image.fromURL(dataUri, (img) => {
                // Revalida de novo: o usuário pode ter trocado de página durante o fetch.
                const canvasNow = state.getCanvas();
                if (!canvasNow) { reject(new Error('Nenhum canvas ativo.')); return; }

                const scale = Math.max(canvasNow.getWidth() / img.width, canvasNow.getHeight() / img.height);
                img.set({
                    left: canvasNow.getWidth() / 2,
                    top: canvasNow.getHeight() / 2,
                    originX: 'center',
                    originY: 'center',
                    scaleX: scale,
                    scaleY: scale,
                    selectable: true,
                    evented: true
                });
                canvasNow.add(img);
                canvasNow.sendToBack(img); // imagem de IA é fundo/cena — texto/logo/badge adicionados depois ficam por cima
                canvasNow.renderAll();
                history.save();
                resolve();
            }, { crossOrigin: 'anonymous' });
        });

        messages.push({ id: nextId(), role: 'assistant', type: 'image', imageDataUrl: dataUri, structured: msg.structured });
        const { notifications } = await import('../ui/notifications.js');
        notifications.toast('Imagem adicionada ao canvas!');
    } catch (e) {
        const { notifications } = await import('../ui/notifications.js');
        await notifications.alert('Falha ao gerar imagem', e.message);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Gerar Imagem';
        }
    } finally {
        isBusy = false;
        renderMessages();
    }
}

export function renderAiModeTools(sidebarContent) {
    const canvas = state.getCanvas();
    if (!canvas) return;

    const div = document.createElement('div');
    div.className = 'animate-fade';
    div.innerHTML = `
        <div id="ai-chat-log" class="ai-chat-log"></div>
        <div class="ai-chat-inputbar">
            <textarea id="ai-chat-input" class="ai-chat-textarea" rows="2" placeholder="Descreva a imagem que você precisa..."></textarea>
            <button type="button" id="ai-chat-send" class="ai-chat-send-btn" title="Enviar">
                <i class="fa-solid fa-paper-plane"></i>
            </button>
        </div>
    `;
    sidebarContent.appendChild(div);

    renderMessages();

    const sendBtn = div.querySelector('#ai-chat-send');
    const textarea = div.querySelector('#ai-chat-input');
    sendBtn.onclick = () => sendMessage();
    textarea.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
}
