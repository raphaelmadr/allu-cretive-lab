// js/ui/onboarding.js
import { presets, networkPresets, templatesList } from '../config.js';
import { resizeCanvas } from '../canvas.js';
import { history } from '../history.js';
import { state } from '../state.js';
import { loadDesign } from '../tools/models.js';
import { notifications } from './notifications.js';

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

    // ── Configurar Importação de arquivo .allu no Onboarding ──
    const importZone = document.getElementById('onboarding-import-zone');
    const importInput = document.getElementById('onboarding-import-input');

    if (importZone && importInput) {
        // Clique na zona ativa a seleção de arquivos
        importZone.addEventListener('click', () => {
            importInput.click();
        });

        // Evento ao selecionar o arquivo manualmente
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImportFile(file);
            }
        });

        // Eventos de Drag & Drop
        importZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            importZone.classList.add('dragover');
        });

        ['dragleave', 'dragend'].forEach(type => {
            importZone.addEventListener(type, () => {
                importZone.classList.remove('dragover');
            });
        });

        importZone.addEventListener('drop', (e) => {
            e.preventDefault();
            importZone.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                handleImportFile(file);
            }
        });
    }

    function handleImportFile(file) {
        // Verificar extensão do arquivo
        const nameLower = file.name.toLowerCase();
        if (!nameLower.endsWith('.allu') && !nameLower.endsWith('.json')) {
            notifications.alert('Arquivo Inválido', 'O arquivo selecionado não é do tipo .allu ou .json.', 'fa-circle-xmark');
            if (importInput) importInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (!parsed.pagesData || !Array.isArray(parsed.pagesData)) {
                    throw new Error('Formato de arquivo .allu inválido.');
                }
                
                await loadDesign({
                    id: 'd-imported-' + Date.now(),
                    name: parsed.name || 'Projeto Importado',
                    width: parsed.width || 1080,
                    height: parsed.height || 1080,
                    pagesData: parsed.pagesData
                });
                
                notifications.toast('Projeto importado com sucesso!');
                if (modal) modal.style.display = 'none';
            } catch (err) {
                console.error(err);
                notifications.alert('Erro ao Importar', 'Não foi possível ler o arquivo. Verifique se é um arquivo .allu ou JSON válido.', 'fa-circle-xmark');
            }
        };
        reader.readAsText(file);
        if (importInput) importInput.value = '';
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
                state.setActivePreset(p);
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
