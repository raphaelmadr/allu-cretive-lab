import { state } from '../state.js';

export function renderDemandasTools(sidebarContent) {
    const div = document.createElement('div');
    div.className = 'animate-fade';
    div.innerHTML = `
        <div class="smart-paste-container" style="background:rgba(255,255,255,0.02); padding:16px; border-radius:12px; border:1px solid var(--glass-border); margin-bottom:20px;">
            <p style="font-size:0.75rem; font-weight:800; margin-bottom:10px; color:white; display:flex; align-items:center; gap:6px;"><i class="fa-solid fa-wand-magic-sparkles" style="color:var(--accent);"></i> Allu Smart Paste</p>
            <textarea id="notion-paste-area" placeholder="Cole a descrição da task do Notion aqui (Ctrl+V)..." style="width:100%; height:80px; background:rgba(0,0,0,0.2); border:1px solid var(--glass-border); border-radius:8px; padding:10px; color:white; font-size:0.75rem; outline:none; resize:vertical; margin-bottom:10px; font-family:inherit; transition:all 0.2s;" onfocus="this.style.borderColor='var(--accent)';" onblur="this.style.borderColor='var(--glass-border)';"></textarea>
            <button id="btn-parse-notion" class="btn-primary" style="width:100%; padding:10px; border-radius:8px; background:var(--accent); color:white; border:none; cursor:pointer; font-weight:700; font-size:0.8rem; display:flex; justify-content:center; align-items:center; gap:8px; transition:all 0.2s;">
                <i class="fa-solid fa-magnifying-glass"></i> Analisar Texto
            </button>
            <div id="parsed-results" style="display:none; margin-top:15px; border-top:1px solid var(--glass-border); padding-top:15px; flex-direction:column; gap:10px;">
            </div>
        </div>
    `;

    sidebarContent.appendChild(div);

    const btnParse = document.getElementById('btn-parse-notion');
    if (btnParse) {
        btnParse.onclick = async () => {
            const rawText = document.getElementById('notion-paste-area').value;
            if (!rawText.trim()) return;
            
            const btnOriginal = btnParse.innerHTML;
            btnParse.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';
            
            setTimeout(async () => {
                const data = { filename: '', hook: '', body: '', cta: '' };
                
                const filenameMatch = rawText.match(/Nome do arquivo final =\s*[\`']?([^(\`'\n]+)[\`']?/i);
                if (filenameMatch) data.filename = filenameMatch[1].trim();

                const copySectionParts = rawText.split(/### Copy aprovada/i);
                const copySection = copySectionParts.length > 1 ? copySectionParts[1] : rawText;

                const extractCopyBlock = (keyword) => {
                    const regex = new RegExp(`\\\\*\\\\*${keyword}[^\\\\*]*\\\\*\\\\*:\\s*([\\\\s\\\\S]*?)(?=\\\\*\\\\*|$)`, 'i');
                    const match = copySection.match(regex);
                    return match ? match[1].trim() : '';
                };

                data.hook = extractCopyBlock('Hook');
                data.body = extractCopyBlock('Body');
                data.cta = extractCopyBlock('CTA');

                if (data.filename) {
                    const filenameInput = document.getElementById('export-filename');
                    if (filenameInput) filenameInput.value = data.filename;
                    const { notifications } = await import('../ui/notifications.js');
                    notifications.toast('Nome do arquivo configurado!');
                }

                const resultsDiv = document.getElementById('parsed-results');
                resultsDiv.style.display = 'flex';
                resultsDiv.innerHTML = '<p style="font-size:0.65rem; color:var(--text-secondary); margin-bottom:5px;">Clique em um bloco para adicionar à arte:</p>';

                const createBlock = (title, content, size, weight) => {
                    if (!content) return;
                    const block = document.createElement('div');
                    block.style.cssText = 'background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:8px; padding:10px; cursor:pointer; transition:all 0.2s; position:relative;';
                    block.onmouseover = () => { block.style.borderColor = 'var(--accent)'; block.style.background = 'rgba(255,255,255,0.08)'; };
                    block.onmouseout = () => { block.style.borderColor = 'var(--glass-border)'; block.style.background = 'rgba(255,255,255,0.05)'; };
                    
                    block.innerHTML = `
                        <div style="font-size:0.6rem; color:var(--accent); font-weight:800; text-transform:uppercase; margin-bottom:4px; letter-spacing:0.05em;">${title}</div>
                        <div style="font-size:0.75rem; color:white; line-height:1.4;">${content.replace(/\n/g, '<br>')}</div>
                        <div style="position:absolute; top:10px; right:10px; opacity:0.3;"><i class="fa-solid fa-plus"></i></div>
                    `;
                    
                    block.onclick = () => {
                        const activeCanvas = state.getCanvas();
                        if (!activeCanvas) return;
                        const center = activeCanvas.getVpCenter();
                        const textObj = new window.fabric.IText(content, {
                            left: center.x,
                            top: center.y,
                            originX: 'center',
                            originY: 'center',
                            fontFamily: 'Plus Jakarta Sans',
                            fill: '#0F190A', // default preto-allu
                            fontSize: size,
                            fontWeight: weight,
                            textAlign: 'center'
                        });
                        activeCanvas.add(textObj);
                        activeCanvas.setActiveObject(textObj);
                        activeCanvas.renderAll();
                        import('../history.js').then(h => h.history.save());
                    };
                    resultsDiv.appendChild(block);
                };

                createBlock('Hook (Headline)', data.hook, 66, 'bold');
                createBlock('Body / Prova', data.body, 36, '400');
                createBlock('CTA', data.cta, 26, 'bold');

                if (!data.hook && !data.body && !data.cta) {
                    resultsDiv.innerHTML = '<div style="font-size:0.7rem; color:var(--text-secondary); text-align:center;">Não foi possível encontrar blocos formatados de copy (Hook/Body/CTA) no texto colado. Verifique o padrão da Task.</div>';
                }
                
                btnParse.innerHTML = btnOriginal;
            }, 300);
        };
    }
}
