import { state } from '../state.js';
import { carousel } from '../carousel.js';
import { presets } from '../config.js';

export function renderDemandasTools(sidebarContent) {
    const div = document.createElement('div');
    div.className = 'animate-fade';
    div.innerHTML = `
        <div class="smart-paste-container" style="background:rgba(255,255,255,0.02); padding:16px; border-radius:12px; border:1px solid var(--glass-border); margin-bottom:20px;">
            <p style="font-size:0.75rem; font-weight:800; margin-bottom:10px; color:white; display:flex; align-items:center; gap:6px;"><i class="fa-solid fa-wand-magic-sparkles" style="color:var(--accent);"></i> Smart Paste (Multi-Criativos)</p>
            <textarea id="notion-paste-area" placeholder="Cole a demanda completa do Notion aqui. Ela pode conter vários criativos..." style="width:100%; height:80px; background:rgba(0,0,0,0.2); border:1px solid var(--glass-border); border-radius:8px; padding:10px; color:white; font-size:0.75rem; outline:none; resize:vertical; margin-bottom:10px; font-family:inherit; transition:all 0.2s;" onfocus="this.style.borderColor='var(--accent)';" onblur="this.style.borderColor='var(--glass-border)';"></textarea>
            <button id="btn-parse-notion" class="btn-primary" style="width:100%; padding:10px; border-radius:8px; background:var(--accent); color:white; border:none; cursor:pointer; font-weight:700; font-size:0.8rem; display:flex; justify-content:center; align-items:center; gap:8px; transition:all 0.2s;">
                <i class="fa-solid fa-magnifying-glass"></i> Analisar Demanda
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
                // Split by "## " which usually denotes a new creative in the user's format
                const blocks = rawText.split(/(?=## \d+\.)|(?=## IMG_)/i).filter(b => b.trim().length > 20);
                
                const creatives = [];
                
                blocks.forEach((blockText, index) => {
                    const data = { id: index + 1, filename: '', hook: '', body: '', cta: '' };
                    
                    const filenameMatch = blockText.match(/Nome do arquivo final =\s*[\`']?([^(\`'\n]+)[\`']?/i);
                    if (filenameMatch) data.filename = filenameMatch[1].trim();

                    const copySectionParts = blockText.split(/### Copy aprovada/i);
                    const copySection = copySectionParts.length > 1 ? copySectionParts[1] : blockText;

                    const extractCopyBlock = (keyword) => {
                        // Tentar extrair considerando que pode ter ou não negrito, e os dois pontos podem estar dentro ou fora do negrito
                        const regex = new RegExp(`(?:\\*\\*)?${keyword}[^:]*:(?:\\*\\*)?\\s*([\\s\\S]*?)(?=(?:\\*\\*)?(?:Hook|Body|CTA|Visual)[^:]*:|$)`, 'i');
                        let match = copySection.match(regex);
                        if (!match) {
                            // Fallback caso não encontre
                            const fallbackRegex = new RegExp(`${keyword}[^:]*:\\s*([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
                            match = copySection.match(fallbackRegex);
                        }
                        
                        let result = match ? match[1].trim() : '';
                        // Limpar eventuais "**" ou ">" residuais no início/fim
                        result = result.replace(/^\\*\\*|\\*\\*$/g, '').trim();
                        result = result.replace(/^>\\s*/gm, '').trim();
                        return result;
                    };

                    data.hook = extractCopyBlock('Hook');
                    data.body = extractCopyBlock('Body');
                    data.cta = extractCopyBlock('CTA');
                    
                    if (data.filename || data.hook || data.body || data.cta) {
                        creatives.push(data);
                    }
                });

                const resultsDiv = document.getElementById('parsed-results');
                resultsDiv.style.display = 'flex';
                resultsDiv.innerHTML = `<p style="font-size:0.7rem; color:var(--accent); font-weight:700; margin-bottom:5px;">${creatives.length} Criativo(s) Encontrado(s)</p>`;

                creatives.forEach((creative, idx) => {
                    const card = document.createElement('div');
                    card.style.cssText = 'background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); border-radius:8px; overflow:hidden;';
                    
                    const header = document.createElement('div');
                    header.style.cssText = 'padding:10px; background:rgba(255,255,255,0.05); cursor:pointer; display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; font-weight:700;';
                    header.innerHTML = `<span><i class="fa-solid fa-folder-open" style="margin-right:6px; color:var(--text-secondary);"></i> Criativo ${idx + 1}</span> <i class="fa-solid fa-chevron-down" style="font-size:0.6rem;"></i>`;
                    
                    const content = document.createElement('div');
                    content.style.cssText = 'padding:10px; display:none; flex-direction:column; gap:8px; border-top:1px solid rgba(255,255,255,0.05);';
                    
                    // Toggle accordion
                    header.onclick = () => {
                        const isHidden = content.style.display === 'none';
                        content.style.display = isHidden ? 'flex' : 'none';
                        header.querySelector('.fa-chevron-down').style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
                    };

                    // Action Button: Auto-Gerar 4 Formatos
                    const btnGenerate = document.createElement('button');
                    btnGenerate.className = 'btn-primary';
                    btnGenerate.style.cssText = 'width:100%; padding:8px; border-radius:6px; background:#27AE60; color:white; border:none; cursor:pointer; font-weight:700; font-size:0.7rem; margin-bottom:10px; transition:all 0.2s;';
                    btnGenerate.innerHTML = '<i class="fa-solid fa-layer-group"></i> Montar 4 Formatos';
                    
                    btnGenerate.onclick = async (e) => {
                        e.stopPropagation();
                        await generateFourFormats(creative);
                    };

                    content.appendChild(btnGenerate);

                    // Display blocks for manual insertion
                    const createMiniBlock = (title, text) => {
                        if (!text) return;
                        const blk = document.createElement('div');
                        blk.style.cssText = 'background:rgba(255,255,255,0.03); border:1px dashed var(--glass-border); border-radius:6px; padding:8px;';
                        blk.innerHTML = `<div style="font-size:0.6rem; color:var(--accent); font-weight:800; text-transform:uppercase; margin-bottom:4px;">${title}</div>
                                         <div style="font-size:0.7rem; color:white;">${text.replace(/\n/g, '<br>')}</div>`;
                        content.appendChild(blk);
                    };

                    createMiniBlock('Filename', creative.filename);
                    createMiniBlock('Hook', creative.hook);
                    createMiniBlock('Body', creative.body);
                    createMiniBlock('CTA', creative.cta);

                    card.appendChild(header);
                    card.appendChild(content);
                    resultsDiv.appendChild(card);
                });

                if (creatives.length === 0) {
                    resultsDiv.innerHTML = '<div style="font-size:0.7rem; color:var(--text-secondary); text-align:center;">Não foi possível processar a task. Verifique se as marcações "## 1. IMG_..." e "### Copy aprovada" estão presentes.</div>';
                } else {
                    const { notifications } = await import('../ui/notifications.js');
                    notifications.toast(`${creatives.length} criativos processados com sucesso!`);
                }
                
                btnParse.innerHTML = btnOriginal;
            }, 300);
        };
    }
}

async function generateFourFormats(creative) {
    const targetFormats = [
        { name: 'Feed', w: 1080, h: 1080 },
        { name: 'Stories', w: 1080, h: 1920 },
        { name: 'Google H', w: 1200, h: 628 },
        { name: 'Google V', w: 1200, h: 1500 }
    ];

    carousel.reset(); 
    
    // Configura filename globalmente
    const filenameInput = document.getElementById('export-filename');
    if (filenameInput && creative.filename) {
        filenameInput.value = creative.filename;
    }

    const { resizeCanvas } = await import('../canvas.js');

    for (let i = 0; i < targetFormats.length; i++) {
        let currentCanvas = state.canvases[i];
        if (!currentCanvas) {
            carousel.addPage(targetFormats[i].w, targetFormats[i].h);
            currentCanvas = state.canvases[i];
        } else {
            currentCanvas.setDimensions({ width: targetFormats[i].w, height: targetFormats[i].h });
            currentCanvas.originalW = targetFormats[i].w;
            currentCanvas.originalH = targetFormats[i].h;
            currentCanvas.clear();
            currentCanvas.backgroundColor = '#ffffff';
        }

        // Metadado para exportação
        currentCanvas.formatName = targetFormats[i].name;
        
        // Tentar carregar background
        if (creative.filename) {
            let baseFilename = creative.filename;
            if(baseFilename.endsWith('.png')) baseFilename = baseFilename.slice(0, -4);
            if(baseFilename.endsWith('.jpg')) baseFilename = baseFilename.slice(0, -4);

            const suffix = i === 0 ? '' : `-${i}`;
            const primaryPath = `assets/templates/${baseFilename}${suffix}.png`;
            const fallbackPath = `assets/templates/${baseFilename}.png`;

            const loadAndApplyImage = (path, isFallback = false) => {
                const nativeImg = new Image();
                nativeImg.crossOrigin = 'anonymous';
                
                nativeImg.onload = () => {
                    const img = new fabric.Image(nativeImg);
                    const scaleX = currentCanvas.originalW / img.width;
                    const scaleY = currentCanvas.originalH / img.height;
                    const scale = Math.max(scaleX, scaleY);
                    
                    img.set({
                        originX: 'center',
                        originY: 'center',
                        left: currentCanvas.originalW / 2,
                        top: currentCanvas.originalH / 2,
                        scaleX: scale,
                        scaleY: scale,
                        selectable: false,
                        evented: false
                    });
                    currentCanvas.add(img);
                    currentCanvas.sendToBack(img);
                    
                    injectTexts(currentCanvas, creative, targetFormats[i]);
                    currentCanvas.renderAll();
                    
                    if (i === targetFormats.length - 1) {
                        resizeCanvas();
                        carousel.updateUI();
                    }
                };

                nativeImg.onerror = () => {
                    if (!isFallback && suffix !== '') {
                        loadAndApplyImage(fallbackPath, true);
                    } else {
                        // Nenhuma imagem encontrada
                        injectTexts(currentCanvas, creative, targetFormats[i]);
                        currentCanvas.renderAll();
                        if (i === targetFormats.length - 1) {
                            resizeCanvas();
                            carousel.updateUI();
                        }
                    }
                };

                nativeImg.src = path;
            };

            loadAndApplyImage(primaryPath);
        } else {
            injectTexts(currentCanvas, creative, targetFormats[i]);
            if (i === targetFormats.length - 1) {
                resizeCanvas();
                carousel.updateUI();
            }
        }
    }
    
    // Voltar para a primeira página
    carousel.switchPage(0);
    const { notifications } = await import('../ui/notifications.js');
    notifications.toast('Magic Resize completo! 4 formatos gerados.');
}

function injectTexts(canvas, creative, formatConfig) {
    const W = formatConfig.w;
    const H = formatConfig.h;
    
    // Posições baseadas no aspecto
    const isHorizontal = W > H;
    const isStories = H / W > 1.7; // 1080x1920

    // Hook
    if (creative.hook) {
        const textHook = new window.fabric.IText(creative.hook, {
            left: W / 2,
            top: isStories ? H * 0.15 : H * 0.20,
            originX: 'center',
            originY: 'center',
            fontFamily: 'Plus Jakarta Sans',
            fill: '#0F190A',
            fontSize: isHorizontal ? 56 : 66,
            fontWeight: 'bold',
            textAlign: 'center',
            width: W * 0.8
        });
        canvas.add(textHook);
    }

    // Body
    if (creative.body) {
        const textBody = new window.fabric.IText(creative.body, {
            left: W / 2,
            top: isStories ? H * 0.60 : H * 0.65,
            originX: 'center',
            originY: 'center',
            fontFamily: 'Plus Jakarta Sans',
            fill: '#0F190A',
            fontSize: isHorizontal ? 26 : 36,
            fontWeight: '400',
            textAlign: 'center',
            width: W * 0.7
        });
        canvas.add(textBody);
    }

    // CTA
    if (creative.cta) {
        const textCta = new window.fabric.IText(creative.cta, {
            left: W / 2,
            top: isStories ? H * 0.85 : H * 0.85,
            originX: 'center',
            originY: 'center',
            fontFamily: 'Plus Jakarta Sans',
            fill: '#0F190A',
            fontSize: 26,
            fontWeight: 'bold',
            textAlign: 'center'
        });
        canvas.add(textCta);
    }
}
