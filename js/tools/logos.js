// js/tools/logos.js
import { state } from '../state.js';
import { presets } from '../config.js';
import { history } from '../history.js';

export function renderLogosTools(sidebarContent) {
    const canvas = state.getCanvas();
    const div = document.createElement('div');
    div.className = 'animate-fade';
    
    const logoFiles = [
        "Primario-1.svg", "Primario-2.svg", "Primario-3.svg", "Primario.svg", 
        "logo.allu.empresas.all.green.vert.dir.svg", "logo.allu.empresas.all.green.vert.esq.svg", 
        "logo.allu.empresas.all.white.svg", "logo.allu.empresas.all.white.vert.dir.svg", 
        "logo.allu.empresas.all.white.vert.esq.svg", "logo.allu.empresas.fundos.escuros.svg", 
        "logo.allu.empresas.fundos.escuros.vert.dir.svg", "logo.allu.empresas.fundos.escuros.vert.esq.svg", 
        "logo.allu.empresas.monochrome.svg", "logo.allu.empresas.principal.svg", 
        "logo.allu.empresas.principal.vert.dir.svg", "logo.allu.empresas.principal.vert.esq.svg"
    ];

    let contentHTML = '<p class="subtitle">Selecione uma logo</p><div class="preset-grid">';
    
    logoFiles.forEach(file => {
        contentHTML += `
            <div class="preset-card logo-draggable" data-logo="${file}" style="padding:12px; display:flex; flex-direction:column; gap:8px; cursor:pointer;">
                <div style="height:80px; width:100%; background:var(--allu-161617); border-radius:12px; display:flex; align-items:center; justify-content:center; overflow:hidden; padding:10px; border: 1px solid rgba(255,255,255,0.1);">
                    <img src="./assets/logos/${file}" style="max-height:100%; max-width:100%; object-fit:contain;">
                </div>
                <span style="font-size:0.65rem; font-weight:600; color:white; line-height:1.2; text-align:center; word-break: break-all;">${file.replace('.svg', '')}</span>
            </div>
        `;
    });

    contentHTML += '</div>';
    div.innerHTML = contentHTML;
    
    sidebarContent.appendChild(div);

    div.querySelectorAll('.logo-draggable').forEach(card => {
        card.onclick = () => {
            if (!canvas) return;
            const file = card.dataset.logo;
            const url = "assets/logos/" + file;
            
            const imgElement = new Image();
            imgElement.onload = function() {
                const obj = new fabric.Image(imgElement);
                obj.scaleToWidth(200);
                
                const formatDisplay = document.getElementById('format-display');
                const formatStr = formatDisplay ? formatDisplay.innerText.split(' (')[0] : 'Instagram Feed';
                const activePreset = Object.values(presets).find(p => p.name === formatStr);
                const docW = activePreset ? activePreset.w : 1080;
                const docH = activePreset ? activePreset.h : 1080;
                
                obj.set({
                    left: (docW - obj.getScaledWidth()) / 2,
                    top: (docH - obj.getScaledHeight()) / 2
                });
                
                canvas.add(obj);
                canvas.setActiveObject(obj);
                canvas.renderAll();
                history.save();
            };
            imgElement.onerror = function() {
                console.error("Erro ao carregar logo:", url);
                alert("Não foi possível carregar este logo. Verifique se o arquivo existe em: " + url);
            };
            imgElement.src = url;
        };
    });
}
