import { state } from '../state.js';
import { carousel } from '../carousel.js';
import { presets } from '../config.js';

// =====================================================================
// ALLU BRAND LAYOUT ENGINE
// Motor determinístico de layout baseado no Repertório Visual da allu.
// Não depende de IA — garante output 100% fiel à identidade da marca.
// =====================================================================

function isColorDark(hex) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return false;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
}

function fuzzyMatchProduct(productName, products) {
    if (!productName || !products || !products.length) return null;
    const normalize = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '');
    const query = normalize(productName);
    const words = query.split(/\s+/).filter(w => w.length > 2);
    let best = null, bestScore = 0;
    for (const p of products) {
        const name = normalize(p.name || '');
        const score = words.reduce((acc, w) => acc + (name.includes(w) ? 1 : 0), 0);
        if (score > bestScore) { bestScore = score; best = p; }
    }
    return bestScore >= 1 ? best : null;
}

function detectProductScale(productName) {
    const n = (productName || '').toLowerCase();
    if (/watch|forerunner|fenix|vivoactive|vivosmart|band|pulseira|galaxy watch|apple watch/.test(n)) return 0.62;
    if (/airpods|fone|headphone|earbuds|buds|wh-|wf-|soundlink|charge|flip|boombox|caixa/.test(n)) return 0.60;
    if (/macbook|notebook|laptop|predator|rog|helios|ideapad|thinkpad|aspire|vivobook/.test(n)) return 0.82;
    if (/ipad|tab s|galaxy tab|surface/.test(n)) return 0.76;
    if (/drone|dji/.test(n)) return 0.65;
    if (/tv |monitor|tela/.test(n)) return 0.80;
    return 0.72;
}

function detectBackground(creative) {
    const all = ((creative.hook || '') + ' ' + (creative.body || '') + ' ' + (creative.productName || '')).toLowerCase();
    if (/iphone\s*(1[5-9]|[2-9]\d)/.test(all)) {
        return { type: 'linear_gradient', color1: '#1D1D1F', color2: '#2C2C2C', gradientAngle: 180 };
    }
    return { type: 'solid', color1: '#F5F5F7' };
}

function buildBrandLayout(creative, formatConfig) {
    const W = formatConfig.w;
    const H = formatConfig.h;
    const isStories = H / W > 1.5;
    const isHorizontal = W > H;

    const bg = detectBackground(creative);
    const isDark = bg.type !== 'solid' || isColorDark(bg.color1);
    const productScale = detectProductScale(creative.productName);

    const hook = creative.hook || '';
    const hookLen = hook.replace(/\*\*/g, '').replace(/\n/g, ' ').length;

    // Tamanho alvo em px por formato, escalado pelo comprimento do hook
    const hookTargetPx = isHorizontal ? 54 : isStories ? 68 : 50;
    const fontScale = hookLen <= 35 ? 1.20 : hookLen <= 55 ? 1.05 : hookLen <= 80 ? 1.00 : hookLen <= 110 ? 0.85 : 0.70;
    const hookFontSizeRatio = (hookTargetPx / H) * fontScale;
    const bodyFontSizeRatio = isHorizontal ? 28 / H : isStories ? 26 / H : 22 / H;

    let cfg;
    if (isHorizontal) {
        cfg = {
            hookPos: { x: 0.22, y: 0.18 }, hookAlign: 'left',
            bodyPos: { x: 0.22, y: 0.58 }, bodyAlign: 'left',
            ctaPos: { x: 0.22, y: 0.75 }, ctaAlign: 'left',
            productPos: { x: 0.72, y: 0.50 }, productScale: productScale * 1.4,
            badgePos: { x: 0.87, y: 0.62 }
        };
    } else {
        cfg = {
            hookPos: { x: 0.5, y: isStories ? 0.10 : 0.14 }, hookAlign: 'center',
            bodyPos: { x: 0.5, y: isStories ? 0.26 : 0.30 }, bodyAlign: 'center',
            ctaPos: { x: 0.5, y: isStories ? 0.36 : 0.42 }, ctaAlign: 'center',
            productPos: { x: 0.5, y: 0.95 }, productScale: isStories ? productScale * 0.92 : productScale,
            badgePos: { x: 0.77, y: isStories ? 0.62 : 0.65 }
        };
    }

    return {
        background: bg,
        productImage: { scalePercent: cfg.productScale, position: cfg.productPos, rotation: 0 },
        texts: [
            {
                role: 'hook', fontFamily: 'Plus Jakarta Sans', fontWeight: '800',
                fill: isDark ? '#FFFFFF' : '#1D1D1F',
                fontSizeRatio: hookFontSizeRatio,
                position: cfg.hookPos, textAlign: cfg.hookAlign,
                richTextTemplate: hook, highlightColor: '#27AE60',
                effects: { innerShadow: false }
            },
            {
                role: 'body', fontFamily: 'Plus Jakarta Sans', fontWeight: '400',
                fill: isDark ? 'rgba(255,255,255,0.72)' : '#828392',
                fontSizeRatio: bodyFontSizeRatio,
                position: cfg.bodyPos, textAlign: cfg.bodyAlign,
                effects: { innerShadow: false }
            },
            {
                role: 'cta', fontFamily: 'Plus Jakarta Sans', fontWeight: '800',
                fill: '#FFFFFF', fontSizeRatio: isHorizontal ? 40 / H : 0.025,
                position: cfg.ctaPos, textAlign: cfg.ctaAlign,
                effects: { innerShadow: false }
            }
        ],
        badges: [{
            type: 'info', text: 'novidade na allu.',
            position: cfg.badgePos,
            widthRatio: 0.22, heightRatio: 0.055, borderRadius: 100,
            backgroundColor: isDark ? '#F5F5F7' : '#1D1D1F',
            textColor: isDark ? '#1D1D1F' : '#FFFFFF',
            fontSizeRatio: 0.018, fontWeight: 'bold', textAlign: 'center'
        }]
    };
}

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
                
                for (let index = 0; index < blocks.length; index++) {
                    const blockText = blocks[index];
                    const data = { id: index + 1, filename: '', hook: '', body: '', cta: '', productName: '' };
                    
                    const filenameMatch = blockText.match(/Nome do arquivo final =\s*[\`']?([^(\`'\n]+)[\`']?/i);
                    if (filenameMatch) data.filename = filenameMatch[1].trim();

                    const copySectionParts = blockText.split(/### Copy aprovada/i);
                    const copySection = copySectionParts.length > 1 ? copySectionParts[1] : blockText;

                    try {
                        const response = await fetch('/api/parse-copy', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ rawText: copySection })
                        });
                        
                        if (response.ok) {
                            const parsedAi = await response.json();
                            data.hook = parsedAi.hook || '';
                            data.body = parsedAi.body || '';
                            data.cta = parsedAi.cta || '';
                            data.productName = parsedAi.productName || '';
                        } else {
                            const errData = await response.json().catch(() => ({}));
                            throw new Error(errData.error || 'Erro ' + response.status);
                        }
                    } catch (e) {
                        console.error('Falha ao usar AI para parsear copy:', e);
                        const { notifications } = await import('../ui/notifications.js');
                        await notifications.alert("Falha ao iniciar IA", "Ocorreu um erro ao ler a sua demanda do Notion. Motivo: " + e.message);
                        
                        // Aborta o processo. Não cria nada se a IA falhou.
                        btnParse.innerHTML = btnOriginal;
                        return; 
                    }
                    
                    if (data.filename || data.hook || data.body || data.cta) {
                        creatives.push(data);
                    }
                }

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
                    createMiniBlock('Product', creative.productName);
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
    const { notifications } = await import('../ui/notifications.js');
    
    // 1. Criar os 4 quadros imediatamente com Skeletons de Carregamento
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
        }

        currentCanvas.formatName = targetFormats[i].name;
        currentCanvas.backgroundColor = '#F7F7F9'; // Fundo Skeleton
        
        // Desenhar Skeletons
        const W = targetFormats[i].w;
        const H = targetFormats[i].h;
        
        const skeletonImg = new fabric.Rect({
            left: W/2, top: H/2, originX: 'center', originY: 'center',
            width: W * 0.6, height: W * 0.6, rx: 20, ry: 20, fill: '#E0E0E0'
        });
        
        const skeletonTitle = new fabric.Rect({
            left: W/2, top: H * 0.2, originX: 'center', originY: 'center',
            width: W * 0.8, height: 40, rx: 8, ry: 8, fill: '#E0E0E0'
        });

        const skeletonBody = new fabric.Rect({
            left: W/2, top: H * 0.8, originX: 'center', originY: 'center',
            width: W * 0.7, height: 20, rx: 8, ry: 8, fill: '#E0E0E0'
        });

        currentCanvas.add(skeletonImg, skeletonTitle, skeletonBody);
        currentCanvas.renderAll();
        
        if (i === targetFormats.length - 1) {
            resizeCanvas();
            carousel.updateUI();
        }
    }
    
    carousel.switchPage(0);
    notifications.toast('⚡ Aplicando layout da marca...', 'info');

    // Garantir CTA padrão caso não venha na demanda
    creative.cta = creative.cta || 'Assina agora';

    // 2. Limpar Skeletons e Montar os 4 quadros com layout da marca
    for (let i = 0; i < targetFormats.length; i++) {
        let currentCanvas = state.canvases[i];
        currentCanvas.clear();
        currentCanvas.backgroundColor = '#ffffff';

        // Layout determinístico por formato — sem IA, 100% fiel ao design system
        const formatLayout = buildBrandLayout(creative, targetFormats[i]);
        await renderAILayout(currentCanvas, formatLayout, targetFormats[i], creative);

        if (i === targetFormats.length - 1) {
            resizeCanvas();
        }
    }

    notifications.toast('✅ Criativos gerados!', 'success');
}

async function renderAILayout(canvas, layout, formatConfig, creative) {
    const W = formatConfig.w;
    const H = formatConfig.h;
    
    // 1. Background
    if (layout.background) {
        if (layout.background.type === 'solid') {
            canvas.backgroundColor = layout.background.color1 || '#ffffff';
        } else if (layout.background.type === 'linear_gradient' || layout.background.type === 'gradient') {
            const grad = new fabric.Gradient({
                type: 'linear',
                coords: { x1: 0, y1: 0, x2: 0, y2: H }, // Fixo top-bottom por enquanto, pode ser expandido com gradientAngle
                colorStops: [
                    { offset: 0, color: layout.background.color1 || '#ffffff' },
                    { offset: 1, color: layout.background.color2 || '#000000' }
                ]
            });
            canvas.backgroundColor = grad;
        } else if (layout.background.type === 'radial_gradient') {
            const grad = new fabric.Gradient({
                type: 'radial',
                coords: { 
                    x1: W/2, y1: H/2, r1: 0, 
                    x2: W/2, y2: H/2, r2: Math.max(W, H)/1.5 
                },
                colorStops: [
                    { offset: 0, color: layout.background.color1 || '#ffffff' },
                    { offset: 1, color: layout.background.color2 || '#000000' }
                ]
            });
            canvas.backgroundColor = grad;
        }
    }

    // 1.5 Logo da Allu (SVG Oficial) — detecção por luminância, não por hex exato
    const isDarkBgForLogo = layout.background && (
        layout.background.type !== 'solid' ||
        isColorDark(layout.background.color1 || '#ffffff')
    );
    const logoSrc = isDarkBgForLogo ? './assets/logos/Primario.svg' : './assets/logos/Primario-2.svg';

    await new Promise(resolve => {
        fabric.Image.fromURL(logoSrc, (img) => {
            if (img) {
                const targetW = Math.max(W * 0.12, 70);
                const scale = targetW / img.width;
                img.set({
                    left: W / 2,
                    top: H * 0.06,
                    originX: 'center',
                    originY: 'center',
                    scaleX: scale,
                    scaleY: scale,
                    selectable: true,
                    evented: true
                });
                canvas.add(img);
            }
            resolve();
        });
    });

    // O Produto foi movido para o final do fluxo para posicionamento dinâmico
    // 3. Flow Layout Engine (Textos e Badges)
    let flowY = H * 0.12; // Começa abaixo da logo

    if (layout.texts && layout.texts.length > 0) {
        // Ordena para desenhar na ordem lógica: hook -> body -> cta
        const sortedTexts = [...layout.texts].sort((a, b) => {
            const order = { 'hook': 1, 'body': 2, 'cta': 3 };
            return (order[a.role] || 99) - (order[b.role] || 99);
        });

        sortedTexts.forEach(t => {
            const textContent = creative[t.role];
            if (!textContent) return;
            
            let effects = t.effects || {};
            let fontSize = (t.fontSizeRatio || 0.05) * H;
            if (fontSize > 150) fontSize = 150;
            
            const { plainText, styles } = parseMarkdownToFabric(textContent, t.fill || '#0F190A', t.highlightColor || t.fill || '#0F190A', t.fontWeight || '400');
            
            const isHoriz = W > H;

            if (t.role === 'cta') {
                const btnWidth = isHoriz ? W * 0.32 : W * 0.45;
                const btnHeight = Math.max(H * 0.07, 50);
                const isDarkBg = isColorDark(layout.background?.color1 || '#ffffff') || layout.background?.type !== 'solid';
                const btnFill = isDarkBg ? '#ffffff' : '#1D1D1F';
                const textFill = isDarkBg ? '#1D1D1F' : '#ffffff';

                const rect = new fabric.Rect({
                    width: btnWidth,
                    height: btnHeight,
                    fill: btnFill,
                    rx: btnHeight / 2,
                    ry: btnHeight / 2,
                    originX: 'center',
                    originY: 'center'
                });
                const arrowText = plainText.includes('→') ? plainText : plainText + ' →';
                const btnText = new fabric.Text(arrowText, {
                    fontFamily: t.fontFamily || 'Plus Jakarta Sans',
                    fontSize: btnHeight * 0.35,
                    fontWeight: '800',
                    fill: textFill,
                    originX: 'center',
                    originY: 'center'
                });
                const ctaLeft = isHoriz ? W * 0.22 : W * (t.position?.x || 0.5);
                const group = new fabric.Group([rect, btnText], {
                    left: ctaLeft,
                    top: flowY + (btnHeight / 2) + 20,
                    originX: isHoriz ? 'left' : 'center',
                    originY: 'center',
                    selectable: true,
                    evented: true
                });
                canvas.add(group);
                flowY += btnHeight + 40;
                return;
            }

            // Normal text (Hook / Body)
            const textMarginTop = t.role === 'hook' ? 30 : 20;
            flowY += textMarginTop;

            const textWidth = isHoriz ? W * 0.38 : W * 0.82;
            const textLeft = isHoriz ? W * 0.10 : W * (t.position?.x || 0.5);
            const originX = isHoriz ? 'left' : (t.textAlign === 'right' ? 'right' : 'center');

            const textObj = new fabric.Textbox(plainText, {
                width: textWidth,
                left: textLeft,
                top: flowY,
                originX: originX,
                originY: 'top',
                fontFamily: t.fontFamily || 'Plus Jakarta Sans',
                fontSize: fontSize,
                fontWeight: t.fontWeight || 'bold',
                fill: t.fill || '#0F190A',
                textAlign: isHoriz ? 'left' : (t.textAlign || 'center'),
                styles: styles,
                shadow: null,
                selectable: true,
                evented: true
            });

            canvas.add(textObj);
            flowY += textObj.getScaledHeight();
        });
    }

    // 4. Product Image — match fuzzy + posicionamento por formato
    const isHorizontalCanvas = W > H;
    let productTopY = flowY + 20;

    if (layout.productImage && creative.productName) {
        const apiProds = window.alluProducts || [];
        const match = fuzzyMatchProduct(creative.productName, apiProds);

        if (match && (match.local_img || match.img)) {
            const imgSrc = (match.local_img && match.local_img.startsWith('./'))
                ? match.local_img.substring(2)
                : (match.local_img || match.img);

            await new Promise(resolve => {
                fabric.Image.fromURL(imgSrc, (img) => {
                    if (img) {
                        const targetW = W * (layout.productImage.scalePercent || 0.6);
                        const scale = targetW / img.width;

                        if (isHorizontalCanvas) {
                            // Horizontal: produto centralizado na metade direita
                            img.set({
                                originX: 'center',
                                originY: 'center',
                                left: W * (layout.productImage.position?.x || 0.72),
                                top: H * 0.50,
                                scaleX: scale,
                                scaleY: scale,
                                angle: layout.productImage.rotation || 0,
                                selectable: true,
                                evented: true
                            });
                            productTopY = H * 0.30; // referência para o badge no horizontal
                        } else {
                            // Vertical: produto na base, abaixo do fluxo de texto
                            let finalTopY = Math.max(productTopY, H * 0.45);
                            productTopY = finalTopY;
                            img.set({
                                originX: 'center',
                                originY: 'top',
                                left: W * (layout.productImage.position?.x || 0.5),
                                top: finalTopY,
                                scaleX: scale,
                                scaleY: scale,
                                angle: layout.productImage.rotation || 0,
                                selectable: true,
                                evented: true
                            });
                        }
                        canvas.add(img);
                    }
                    resolve();
                }, { crossOrigin: 'anonymous' });
            });
        }
    }

    // 5. Badges — posição absoluta via b.position.y (respeitado agora)
    if (layout.badges && layout.badges.length > 0) {
        layout.badges.forEach(b => {
            const bWidth = W * (b.widthRatio || 0.2);
            const bHeight = H * (b.heightRatio || 0.05);

            const rect = new fabric.Rect({
                width: bWidth,
                height: bHeight,
                fill: b.backgroundColor || '#1D1D1F',
                rx: b.borderRadius || 20,
                ry: b.borderRadius || 20,
                originX: 'center',
                originY: 'center'
            });

            const label = new fabric.IText(b.text || 'allu.', {
                fontFamily: 'Plus Jakarta Sans',
                fontSize: H * (b.fontSizeRatio || 0.02),
                fontWeight: b.fontWeight || 'bold',
                fill: b.textColor || '#ffffff',
                originX: 'center',
                originY: 'center'
            });

            // Usa b.position.y se definido; caso contrário, flutua ao lado do produto
            const badgeTop = b.position?.y ? H * b.position.y : productTopY + 50;

            const group = new fabric.Group([rect, label], {
                left: W * (b.position?.x || 0.77),
                top: badgeTop,
                originX: 'center',
                originY: 'center',
                selectable: true,
                evented: true
            });

            canvas.add(group);
        });
    }

    canvas.renderAll();
}

function parseMarkdownToFabric(text, baseColor, highlightColor, baseWeight) {
    const lines = text.split('\n');
    let plainTextArray = [];
    let styles = {};

    for (let l = 0; l < lines.length; l++) {
        let line = lines[l];
        let plainLine = "";
        let lineStyles = {};
        
        let isBold = false;
        let charIndex = 0;
        
        // Match `**` parts
        const parts = line.split('**');
        for (let p = 0; p < parts.length; p++) {
            const part = parts[p];
            if (p % 2 === 1) { // Inside ** **
                for (let c = 0; c < part.length; c++) {
                    lineStyles[charIndex + c] = { 
                        fontWeight: 'bold', // Forçar negrito no destaque
                        fill: highlightColor
                    };
                }
            } else {
                for (let c = 0; c < part.length; c++) {
                    lineStyles[charIndex + c] = { 
                        fontWeight: baseWeight,
                        fill: baseColor
                    };
                }
            }
            plainLine += part;
            charIndex += part.length;
        }
        
        plainTextArray.push(plainLine);
        styles[l] = lineStyles;
    }

    return { plainText: plainTextArray.join('\n'), styles };
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
