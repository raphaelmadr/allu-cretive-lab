// js/ui/sidebar.js
// Importing tool renderers (We'll create these later, they can be dummy for now or just import)
import { renderProductsTools } from '../tools/products.js';
import { renderShapesTools } from '../tools/shapes.js';
import { renderLogosTools } from '../tools/logos.js';
import { renderTextTools } from '../tools/text.js';
import { renderBrandTools } from '../tools/background.js';
import { renderImageTools } from '../tools/images.js';
import { renderLayersTools } from '../tools/layers.js';
import { renderPropertiesTools } from '../tools/properties.js';

export function setupSidebar() {
    const tabs = document.querySelectorAll('.btn-tool[data-tab]');
    const sidebarTitle = document.getElementById('sidebar-title');
    const sidebarContent = document.getElementById('sidebar-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateSidebar(tab.dataset.tab, sidebarTitle, sidebarContent);
        });
    });

    // Inicializar na aba de Produtos
    const defaultTab = document.querySelector('.btn-tool[data-tab="products"]');
    if(defaultTab) defaultTab.classList.add('active');
    updateSidebar('products', sidebarTitle, sidebarContent);
}

export function updateSidebar(tab, sidebarTitle, sidebarContent) {
    if (!sidebarTitle) sidebarTitle = document.getElementById('sidebar-title');
    if (!sidebarContent) sidebarContent = document.getElementById('sidebar-content');
    
    sidebarContent.innerHTML = '';
    
    switch(tab) {
        case 'products':
            sidebarTitle.innerText = 'Produtos';
            renderProductsTools(sidebarContent);
            break;
        case 'shapes':
            sidebarTitle.innerText = 'Formas Geométricas';
            renderShapesTools(sidebarContent);
            break;
        case 'logos':
            sidebarTitle.innerText = 'Logos da Marca';
            renderLogosTools(sidebarContent);
            break;
        case 'text':
            sidebarTitle.innerText = 'Texto';
            renderTextTools(sidebarContent);
            break;
        case 'brand':
            sidebarTitle.innerText = 'Fundo da Arte';
            renderBrandTools(sidebarContent);
            break;
        case 'images':
            sidebarTitle.innerText = 'Imagens';
            renderImageTools(sidebarContent);
            break;
        case 'layers':
            sidebarTitle.innerText = 'Camadas';
            renderLayersTools(sidebarContent);
            break;
        case 'properties':
            sidebarTitle.innerText = 'Propriedades';
            renderPropertiesTools(sidebarContent);
            break;
    }
}
