// js/tools/background.js
import { state } from '../state.js';
import { backgroundColors } from '../config.js';
import { history } from '../history.js';

export function renderBrandTools(sidebarContent) {
    const canvas = state.getCanvas();
    if (!canvas) return;

    const div = document.createElement('div');
    div.className = 'animate-fade';

    // ── Aplicar cor ao canvas ou elemento selecionado ──────────────────────
    const applyColor = (hex) => {
        const active = canvas.getActiveObject();
        if (active) {
            if (active.isAlluCard || active.isAlluTable) {
                const bg = active.item(0);
                bg.set('fill', hex);
                if (hex !== 'transparent') {
                    const isDark = (parseInt(hex.replace('#', ''), 16) < 0xffffff / 2);
                    active.forEachObject(obj => {
                        if (obj.type === 'text' || obj.type === 'i-text') {
                            if (obj.fill !== '#00D1FF' && obj.fill !== '#27AE60') {
                                obj.set('fill', isDark ? '#ffffff' : '#161617');
                            }
                        }
                    });
                }
                canvas.renderAll();
            } else if (active.type === 'i-text' || active.type === 'text') {
                active.set('fill', hex);
                canvas.renderAll();
            } else if (active.type === 'image') {
                active.set('backgroundColor', hex);
                canvas.renderAll();
            } else if (['rect', 'circle', 'polygon', 'triangle'].includes(active.type)) {
                active.set('fill', hex);
                canvas.renderAll();
            } else {
                canvas.setBackgroundColor(hex, canvas.renderAll.bind(canvas));
            }
        } else {
            canvas.setBackgroundColor(hex, canvas.renderAll.bind(canvas));
        }
        history.save();

        // Atualizar estado visual dos cartões
        div.querySelectorAll('.bg-color-card').forEach(card => {
            const isActive = card.dataset.hex.toUpperCase() === hex.toUpperCase();
            card.style.outline = isActive ? '2px solid var(--accent)' : '1px solid var(--glass-border)';
            card.style.transform = isActive ? 'scale(1.03)' : 'scale(1)';
        });
    };

    // ── HTML: cabeçalho ────────────────────────────────────────────────────
    div.innerHTML = `
        <p class="subtitle" style="margin-bottom: 16px;">Cor de Fundo da Arte</p>
        <div id="bg-color-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 24px;"></div>

        <div style="border-top: 1px solid var(--glass-border); padding-top: 20px; margin-top: 4px;">
            <p class="subtitle" style="margin-bottom: 12px;">Remover Cor</p>
            <button id="btn-clear-bg" style="
                width: 100%; padding: 12px; border-radius: 10px;
                background: transparent; border: 1px solid var(--glass-border);
                color: var(--text-secondary); cursor: pointer; font-size: 0.82rem;
                font-weight: 600; display: flex; align-items: center; justify-content: center;
                gap: 8px; transition: all 0.2s; font-family: inherit;
            ">
                <i class="fa-solid fa-droplet-slash"></i> Branco (padrão)
            </button>
        </div>
    `;

    // ── Renderizar cartões de cor ─────────────────────────────────────────
    const grid = div.querySelector('#bg-color-grid');
    const currentBg = (canvas.backgroundColor || '#ffffff').toUpperCase();

    backgroundColors.forEach(({ hex, label }) => {
        const card = document.createElement('div');
        card.className = 'bg-color-card';
        card.dataset.hex = hex;

        const isActive = currentBg === hex.toUpperCase();
        const isLight = (parseInt(hex.replace('#', ''), 16) > 0x808080 * 3); // heurística simples
        const textColor = isLight ? '#161617' : '#ffffff';

        card.style.cssText = `
            height: 72px;
            border-radius: 12px;
            background-color: ${hex};
            cursor: pointer;
            display: flex;
            align-items: flex-end;
            padding: 8px 10px;
            transition: all 0.18s ease;
            outline: ${isActive ? '2px solid var(--accent)' : '1px solid var(--glass-border)'};
            transform: ${isActive ? 'scale(1.03)' : 'scale(1)'};
            position: relative;
            overflow: hidden;
        `;

        card.innerHTML = `
            <span style="font-size: 0.68rem; font-weight: 700; color: ${textColor}; opacity: 0.85; text-shadow: 0 1px 3px rgba(0,0,0,0.3); line-height: 1.2;">${label}</span>
            ${isActive ? `<i class="fa-solid fa-check" style="position:absolute; top:8px; right:8px; font-size:0.7rem; color:${textColor}; opacity:0.9;"></i>` : ''}
        `;

        card.onmouseenter = () => { if (!isActive) card.style.outline = '1px solid rgba(255,255,255,0.4)'; };
        card.onmouseleave = () => { if (!isActive) card.style.outline = '1px solid var(--glass-border)'; };
        card.onclick = () => applyColor(hex);

        grid.appendChild(card);
    });

    // ── Botão limpar ──────────────────────────────────────────────────────
    div.querySelector('#btn-clear-bg').onclick = () => {
        canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
        history.save();
        div.querySelectorAll('.bg-color-card').forEach(c => {
            c.style.outline = '1px solid var(--glass-border)';
            c.style.transform = 'scale(1)';
        });
    };
    div.querySelector('#btn-clear-bg').onmouseenter = (e) => {
        e.target.style.borderColor = 'var(--accent)';
        e.target.style.color = 'white';
    };
    div.querySelector('#btn-clear-bg').onmouseleave = (e) => {
        e.target.style.borderColor = 'var(--glass-border)';
        e.target.style.color = 'var(--text-secondary)';
    };

    sidebarContent.appendChild(div);
}
