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
import { initStorage } from './storage.js';
import { notifications } from './ui/notifications.js';
import { initFloatingToolbar } from './ui/floatingToolbar.js';
import { playPreview, stopPreview, isPreviewing } from './animationEngine.js';






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

    // Initialize Storage
    initStorage();




    // 2. Setup Modules
    setupOnboarding();
    setupSidebar();
    setupCarousel();
    setupExport();
    setupAlignment();
    setupZoom();
    setupHistoryEvents(); // Initializes history tracking and shortcuts
    initFloatingToolbar(canvas);
    
    // 3. Initialize Multi-page (Carousel) manager for all formats
    carousel.init();


    // 3. Global Event Listeners
    window.addEventListener('resize', () => {
        const formatDisplay = document.getElementById('format-display');
        const formatStr = formatDisplay ? formatDisplay.innerText.split(' (')[0] : 'Instagram Feed';
        const activePreset = Object.values(presets).find(p => p.name === formatStr);
        if(activePreset) resizeCanvas(activePreset.w, activePreset.h);
    });

    // Auto-switch is disabled to prioritize the new Canva-like floating context toolbar
    canvas.on('selection:created', (e) => {
        // Redirection to sidebar properties/badges is disabled
    });

    canvas.on('selection:updated', (e) => {
        // Redirection to sidebar properties/badges is disabled
    });

    canvas.on('selection:cleared', (e) => {
        // Redirection to sidebar properties/badges is disabled
    });

    // Deselect all when clicking on the workspace (grey area)
    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper) {
        wrapper.addEventListener('mousedown', (e) => {
            if (e.target === wrapper) {
                state.canvases.forEach(c => {
                    c.discardActiveObject();
                    c.renderAll();
                });
            }
        });
    }


    // Botão de Prévia (roda a linha do tempo de animações em tempo real)
    const btnPreview = document.getElementById('btn-preview-animation');
    if (btnPreview) {
        const originalPreviewHTML = btnPreview.innerHTML;
        btnPreview.onclick = () => {
            const activeCanvas = state.getCanvas();
            if (!activeCanvas) return;

            if (isPreviewing()) {
                stopPreview();
                btnPreview.innerHTML = originalPreviewHTML;
                return;
            }

            const started = playPreview(activeCanvas, {
                onDone: () => { btnPreview.innerHTML = originalPreviewHTML; }
            });
            if (!started) {
                notifications.toast('Nenhuma animação definida neste canva ainda.', 'error');
                return;
            }
            btnPreview.innerHTML = '<i class="fa-solid fa-stop"></i> Parar';
        };
    }

    // Sync button
    const btnSync = document.getElementById('btn-sync');
    if (btnSync) {
        btnSync.onclick = async () => {
            const originalHTML = btnSync.innerHTML;
            const icon = btnSync.querySelector('i');
            if(icon) icon.classList.add('fa-spin');
            btnSync.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color:var(--accent);"></i> Atualizando...';
            
            try {
                const module = await import('./tools/products.js');
                const count = await module.syncProductsWithAPI();
                
                btnSync.innerHTML = originalHTML;
                
                if (count > 0) {
                    notifications.alert('Sincronização Concluída', `✅ ${count} produtos atualizados com sucesso via API da Allugator!`, 'fa-cloud-arrow-down');
                    // If the active tab is products, update the sidebar to show the new prices

                    const activeTab = document.querySelector('.btn-tool.active');
                    if (activeTab && activeTab.dataset.tab === 'products') {
                        import('./ui/sidebar.js').then(sidebarModule => {
                            sidebarModule.updateSidebar('products');
                        });
                    }
                } else {
                    notifications.toast("✨ Preços já estão atualizados.");
                }
            } catch (err) {
                console.error('Erro ao sincronizar produtos:', err);
                btnSync.innerHTML = originalHTML;
                notifications.alert('Erro na API', "❌ Ocorreu um erro ao conectar com a API.", 'fa-circle-xmark');
            }

        };
    }

    // 4. Force initial format check
    const formatDisplay = document.getElementById('format-display');
    if (formatDisplay) {
        const initialPreset = Object.values(presets).find(p => formatDisplay.innerText.includes(p.name));
        if (initialPreset) resizeCanvas(initialPreset.w, initialPreset.h);
    }
});
