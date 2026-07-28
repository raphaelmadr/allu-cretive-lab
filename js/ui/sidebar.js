// js/ui/sidebar.js
// Importing tool renderers
import { renderDemandasTools } from '../tools/demandas.js';
import { renderProductsTools } from '../tools/products.js';
import { renderShapesTools } from '../tools/shapes.js';
import { renderLogosTools } from '../tools/logos.js';
import { renderTextTools } from '../tools/text.js';
import { renderBrandTools } from '../tools/background.js';
import { renderImageTools } from '../tools/images.js';
import { renderLayersTools } from '../tools/layers.js';
import { renderPropertiesTools } from '../tools/properties.js';
import { renderBadgesTools } from '../tools/badges.js';
import { renderModelsTools } from '../tools/models.js';
import { renderIconsTools } from '../tools/icons.js';
import { renderAiModeTools } from '../tools/aiMode.js';

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

    // Inicializar na aba de Demandas
    const defaultTab = document.querySelector('.btn-tool[data-tab="demandas"]');
    if(defaultTab) defaultTab.classList.add('active');
    updateSidebar('demandas', sidebarTitle, sidebarContent);
}

export function updateSidebar(tab, sidebarTitle, sidebarContent) {
    if (!sidebarTitle) sidebarTitle = document.getElementById('sidebar-title');
    if (!sidebarContent) sidebarContent = document.getElementById('sidebar-content');
    const sidebarSubtitle = document.querySelector('.sidebar .subtitle');
    
    sidebarContent.innerHTML = '';
    
    switch(tab) {
        case 'demandas':
            sidebarTitle.innerText = 'Demandas (Tasks)';
            if(sidebarSubtitle) sidebarSubtitle.innerText = 'Smart Paste do Notion';
            renderDemandasTools(sidebarContent);
            break;
        case 'products':
            sidebarTitle.innerText = 'Produtos';
            if(sidebarSubtitle) sidebarSubtitle.innerText = 'Gerencie o catálogo Allu';
            renderProductsTools(sidebarContent);
            break;
        case 'shapes':
            sidebarTitle.innerText = 'Formas Geométricas';
            if(sidebarSubtitle) sidebarSubtitle.innerText = 'Adicione elementos visuais';
            renderShapesTools(sidebarContent);
            break;
        case 'logos':
            sidebarTitle.innerText = 'Logos da Marca';
            if(sidebarSubtitle) sidebarSubtitle.innerText = 'Ativos oficiais Allu';
            renderLogosTools(sidebarContent);
            break;
        case 'text':
            sidebarTitle.innerText = 'Texto';
            if(sidebarSubtitle) sidebarSubtitle.innerText = 'Tipografia e estilos';
            renderTextTools(sidebarContent);
            break;
        case 'brand':
            sidebarTitle.innerText = 'Fundo da Arte';
            if(sidebarSubtitle) sidebarSubtitle.innerText = 'Cores e imagens de base';
            renderBrandTools(sidebarContent);
            break;
        case 'images':
            sidebarTitle.innerText = 'Imagens';
            if(sidebarSubtitle) sidebarSubtitle.innerText = 'Upload de arquivos externos';
            renderImageTools(sidebarContent);
            break;
        case 'layers':
            sidebarTitle.innerText = 'Camadas';
            if(sidebarSubtitle) sidebarSubtitle.innerText = 'Organização de objetos';
            renderLayersTools(sidebarContent);
            break;
        case 'properties':
            sidebarTitle.innerText = 'Propriedades';
            if(sidebarSubtitle) sidebarSubtitle.innerText = 'Ajustes finos do elemento';
            renderPropertiesTools(sidebarContent);
            break;
        case 'badges':
            sidebarTitle.innerText = 'Selos';
            if(sidebarSubtitle) sidebarSubtitle.innerText = 'Ofertas e destaques';
            renderBadgesTools(sidebarContent);
            break;
        case 'models':
            sidebarTitle.innerText = 'Modelos';
            if(sidebarSubtitle) sidebarSubtitle.innerText = 'Seus projetos salvos';
            renderModelsTools(sidebarContent);
            break;
        case 'icons':
            sidebarTitle.innerText = 'Ícones';
            if(sidebarSubtitle) sidebarSubtitle.innerText = 'Biblioteca Lucide';
            renderIconsTools(sidebarContent);
            break;
        case 'ai-mode':
            sidebarTitle.innerText = 'Modo IA';
            if(sidebarSubtitle) sidebarSubtitle.innerText = 'Geração de imagens guiada pela marca';
            renderAiModeTools(sidebarContent);
            break;
    }
}
