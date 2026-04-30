// js/tools/shapes.js
import { state } from '../state.js';
import { history } from '../history.js';

export function renderShapesTools(sidebarContent) {
    const canvas = state.getCanvas();
    const div = document.createElement('div');
    div.className = 'animate-fade';
    div.innerHTML = `
        <p class="subtitle">Selecione uma forma para adicionar ao canvas</p>
        <div class="preset-grid" style="grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div class="preset-card shape-btn" data-type="rect" style="padding:20px; display:flex; flex-direction:column; align-items:center; gap:12px; cursor:pointer; background:rgba(255,255,255,0.05); border-radius:16px; border:1px solid var(--glass-border);">
                <div style="width:45px; height:45px; background:white; border:2px solid var(--accent); border-radius:4px;"></div>
                <span style="font-size:0.75rem; font-weight:700; color:white;">Retângulo</span>
            </div>
            <div class="preset-card shape-btn" data-type="circle" style="padding:20px; display:flex; flex-direction:column; align-items:center; gap:12px; cursor:pointer; background:rgba(255,255,255,0.05); border-radius:16px; border:1px solid var(--glass-border);">
                <div style="width:45px; height:45px; background:white; border:2px solid var(--accent); border-radius:50%;"></div>
                <span style="font-size:0.75rem; font-weight:700; color:white;">Círculo</span>
            </div>
            <div class="preset-card shape-btn" data-type="triangle" style="padding:20px; display:flex; flex-direction:column; align-items:center; gap:12px; cursor:pointer; background:rgba(255,255,255,0.05); border-radius:16px; border:1px solid var(--glass-border);">
                <div style="width: 0; height: 0; border-left: 22px solid transparent; border-right: 22px solid transparent; border-bottom: 45px solid var(--accent);"></div>
                <span style="font-size:0.75rem; font-weight:700; color:white;">Triângulo</span>
            </div>
            <div class="preset-card shape-btn" data-type="line" style="padding:20px; display:flex; flex-direction:column; align-items:center; gap:12px; cursor:pointer; background:rgba(255,255,255,0.05); border-radius:16px; border:1px solid var(--glass-border);">
                <div style="width:45px; height:4px; background:var(--accent); margin: 20px 0;"></div>
                <span style="font-size:0.75rem; font-weight:700; color:white;">Linha</span>
            </div>
        </div>
        
        <div style="margin-top:20px; padding:15px; background:rgba(39, 174, 96, 0.1); border-radius:12px; border:1px solid var(--accent);">
            <p style="font-size:0.7rem; color:var(--text-secondary); margin:0; line-height:1.4;">
                <i class="fa-solid fa-circle-info"></i> Selecione a forma para alterar cores e bordas na aba <b>Propriedades</b>.
            </p>
        </div>
    `;

    div.querySelectorAll('.shape-btn').forEach(btn => {
        btn.onclick = () => {
            if (!canvas) return;
            const type = btn.dataset.type;
            let shape;
            const common = {
                left: 200,
                top: 200,
                fill: '#D9D9D9',
                stroke: '#000000',
                strokeWidth: 0,
                originX: 'center',
                originY: 'center',
                cornerColor: 'var(--accent)',
                cornerStyle: 'circle',
                transparentCorners: false
            };

            if (type === 'rect') shape = new fabric.Rect({ ...common, width: 200, height: 200 });
            if (type === 'circle') shape = new fabric.Circle({ ...common, radius: 100 });
            if (type === 'triangle') shape = new fabric.Triangle({ ...common, width: 200, height: 200 });
            if (type === 'line') shape = new fabric.Rect({ ...common, width: 400, height: 4, fill: '#000000' });

            canvas.add(shape);
            canvas.centerObject(shape);
            canvas.setActiveObject(shape);
            canvas.renderAll();
            history.save();
        };
    });

    sidebarContent.appendChild(div);
}
