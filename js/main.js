// js/main.js
import { state } from './state.js';
import { presets } from './config.js';
import { setupCanvas, resizeCanvas } from './canvas.js';
import { setupHistoryEvents } from './history.js';
import { carousel, setupCarousel } from './carousel.js';
import { setupOnboarding } from './ui/onboarding.js';
import { setupSidebar, updateSidebar } from './ui/sidebar.js';
import { setupExport } from './export.js';
import { setupAlignment } from './align.js';
import { setupZoom } from './zoom.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicialização do Canvas
    const canvas = new fabric.Canvas('main-canvas', {
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        width: 1080,
        height: 1080
    });
    
    state.setCanvas(canvas);
    setupCanvas();

    // 2. Setup Modules
    setupOnboarding();
    setupSidebar();
    setupCarousel();
    setupExport();
    setupAlignment();
    setupZoom();
    setupHistoryEvents(); // Initializes history tracking and shortcuts

    // 3. Global Event Listeners
    window.addEventListener('resize', () => {
        const formatDisplay = document.getElementById('format-display');
        const formatStr = formatDisplay ? formatDisplay.innerText.split(' (')[0] : 'Instagram Feed';
        const activePreset = Object.values(presets).find(p => p.name === formatStr);
        if(activePreset) resizeCanvas(activePreset.w, activePreset.h);
    });

    // Auto-switch to properties tab when ANY object is selected
    canvas.on('selection:created', (e) => {
        if (e.selected && e.selected[0]) {
            const propBtn = document.querySelector('.btn-tool[data-tab="properties"]');
            if (propBtn) propBtn.click();
        }
    });

    canvas.on('selection:updated', (e) => {
        if (e.selected && e.selected[0]) {
            const propBtn = document.querySelector('.btn-tool[data-tab="properties"]');
            if (propBtn) propBtn.click();
        }
    });

    canvas.on('selection:cleared', (e) => {
        const propBtn = document.querySelector('.btn-tool[data-tab="properties"]');
        if (propBtn) propBtn.click();
    });

    // Sync button
    const btnSync = document.getElementById('btn-sync');
    if (btnSync) {
        btnSync.onclick = () => {
            const icon = btnSync.querySelector('i');
            if(icon) icon.classList.add('fa-spin');
            btnSync.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color:var(--accent);"></i> Atualizando...';
            
            // Exibir um alerta informando que agora é automático via GitHub Actions
            alert("✅ Sincronização Automática Ativa!\\n\\nOs preços e produtos são atualizados automaticamente a cada 1 hora via GitHub Actions.\\n\\nSe você acabou de fazer uma mudança no GitHub, aguarde alguns minutos e recarregue a página para ver as novidades.");
            
            setTimeout(() => {
                window.location.reload();
            }, 500);
        };
    }

    // 4. Force initial format check
    const formatDisplay = document.getElementById('format-display');
    if (formatDisplay) {
        const initialPreset = Object.values(presets).find(p => formatDisplay.innerText.includes(p.name));
        if (initialPreset) resizeCanvas(initialPreset.w, initialPreset.h);
    }
});
