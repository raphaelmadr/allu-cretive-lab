// js/tools/images.js
import { state } from '../state.js';
import { history } from '../history.js';

export function renderImageTools(sidebarContent) {
    const canvas = state.getCanvas();
    if (!canvas) return;

    const div = document.createElement('div');
    div.className = 'animate-fade';
    div.innerHTML = `
        <input type="file" id="img-upload" style="display:none">
        <button class="btn-primary" onclick="document.getElementById('img-upload').click()" style="width:100%; padding:12px; border-radius:8px; background:var(--accent); color:white; border:none; cursor:pointer; margin-bottom:20px;">
            Upload de Imagem
        </button>
        <div id="image-controls" style="display:none;">
            <p class="subtitle">Estilo da Imagem</p>
            <label style="font-size:0.8rem">Arredondar Cantos</label>
            <input type="range" id="img-radius" min="0" max="100" value="0" style="width:100%; margin-bottom:15px;">
        </div>
    `;
    const imgUpload = div.querySelector('#img-upload');
    if (imgUpload) {
        imgUpload.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (f) => {
                fabric.Image.fromURL(f.target.result, (img) => {
                    img.scaleToWidth(400);
                    canvas.add(img);
                    canvas.centerObject(img);
                    canvas.setActiveObject(img);
                    canvas.renderAll();
                    history.save();
                });
            };
            reader.readAsDataURL(file);
        };
    }
    sidebarContent.appendChild(div);
}
