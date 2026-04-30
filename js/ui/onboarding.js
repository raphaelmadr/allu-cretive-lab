// js/ui/onboarding.js
import { presets, networkPresets, templatesList } from '../config.js';
import { resizeCanvas } from '../canvas.js';
import { history } from '../history.js';
// TODO: import loadTemplate when it's moved

export function setupOnboarding() {
    const modal = document.getElementById('onboarding-modal');
    const step1 = document.getElementById('onboarding-step-1');
    const step2 = document.getElementById('onboarding-step-2');
    const step1Dot = document.getElementById('step-1-dot');
    const step2Dot = document.getElementById('step-2-dot');
    const onboardingPresets = document.getElementById('onboarding-presets');

    document.querySelectorAll('.network-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const network = btn.dataset.network;
            showStep2(network);
        });
    });

    const btnOnboardingBack = document.getElementById('btn-onboarding-back');
    if(btnOnboardingBack) {
        btnOnboardingBack.onclick = () => {
            step2.style.display = 'none';
            step1.style.display = 'block';
            step2Dot.classList.remove('active');
            step1Dot.classList.add('active');
        };
    }

    function showStep2(network) {
        step1.style.display = 'none';
        step2.style.display = 'block';
        step1Dot.classList.remove('active');
        step2Dot.classList.add('active');

        onboardingPresets.innerHTML = '';
        
        // 1. Mostrar Formatos em Branco
        const allowed = networkPresets[network] || [];
        allowed.forEach(key => {
            const p = presets[key];
            if (!p) return;
            const card = document.createElement('div');
            card.className = 'preset-card';
            card.innerHTML = `
                <div style="font-size: 1.2rem; margin-bottom: 5px; opacity: 0.5;"><i class="fa-regular fa-square"></i></div>
                <span style="font-weight:700;">${p.name}</span>
                <span class="size">${p.w}x${p.h}</span>
                <span style="font-size: 0.6rem; margin-top: 5px; color: var(--accent); font-weight:700;">DOCUMENTO EM BRANCO</span>
            `;
            card.onclick = () => {
                const formatDisplay = document.getElementById('format-display');
                if (formatDisplay) formatDisplay.innerText = `${p.name} (${p.w}x${p.h})`;
                resizeCanvas(p.w, p.h);
                if (modal) modal.style.display = 'none';
                history.save();
            };
            onboardingPresets.appendChild(card);
        });

        // 2. Mostrar Modelos Prontos (Templates)
        const matchedTemplates = templatesList.filter(t => t.network === network);
        matchedTemplates.forEach(tpl => {
            const card = document.createElement('div');
            card.className = 'preset-card';
            card.style.border = '1px solid var(--accent)';
            card.style.background = 'rgba(39, 174, 96, 0.05)';
            card.innerHTML = `
                <div style="font-size: 1.2rem; margin-bottom: 5px; color: var(--accent);"><i class="fa-solid ${tpl.icon}"></i></div>
                <span style="font-weight:700;">${tpl.name}</span>
                <span class="size">Modelo Pronto</span>
                <span style="font-size: 0.6rem; margin-top: 5px; color: var(--accent); font-weight:700;">CARREGAR MODELO</span>
            `;
            card.onclick = () => {
                // TODO: loadTemplate(tpl.id);
                console.log('Load template', tpl.id);
                if (modal) modal.style.display = 'none';
            };
            onboardingPresets.appendChild(card);
        });
    }
}
