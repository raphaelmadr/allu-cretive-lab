import fs from 'fs';
import path from 'path';
import { INGESTOR_PROMPT } from '../IA_PROMPTS.js';

// Utilizando fetch nativo do Node.js (v18+)
const API_KEY = process.env.GEMINI_API_KEY;
const TARGET_DIR = path.resolve('./REFERENCIAS');
const OUTPUT_FILE = path.resolve('./assets/design_system.json');

// Dimensões conhecidas baseadas no sufixo (para ajudar a IA)
const FORMAT_MAP = {
    '': { w: 1080, h: 1080, name: 'Feed' },
    '-1': { w: 1080, h: 1920, name: 'Stories' },
    '-2': { w: 1200, h: 628, name: 'Google H' },
    '-3': { w: 1200, h: 1500, name: 'Google V' }
};

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function analyzeImage(filePath, baseName, suffix) {
    if (!API_KEY) throw new Error("GEMINI_API_KEY não configurada no ambiente. Rode o comando com GEMINI_API_KEY=sua_chave node scripts/art_director.js");
    
    const formatInfo = FORMAT_MAP[suffix] || { w: 1080, h: 1080, name: 'Custom' };
    const prompt = INGESTOR_PROMPT
        .replace('{FORMAT_NAME}', formatInfo.name)
        .replace('{W}', formatInfo.w)
        .replace('{H}', formatInfo.h);

    const base64Data = fs.readFileSync(filePath, { encoding: 'base64' });

    console.log(`[Art Director] Analisando: ${baseName}${suffix} (${formatInfo.name})`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: "image/png",
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        console.error(`Erro da API:`, err);
        return null;
    }

    const data = await response.json();
    let jsonText = data.candidates[0].content.parts[0].text;
    
    try {
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Falha ao parsear JSON:", jsonText);
        return null;
    }
}

async function main() {
    console.log("Iniciando Allu Art Director (Knowledge Base Ingestor)...");

    let knowledgeBase = {};
    if (fs.existsSync(OUTPUT_FILE)) {
        knowledgeBase = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
        console.log(`Knowledge Base carregada com ${Object.keys(knowledgeBase).length} estilos existentes.`);
    }

    const files = fs.readdirSync(TARGET_DIR).filter(f => f.endsWith('.png'));
    let newItemsAdded = 0;

    for (const file of files) {
        // Exemplo: IMG_allu-ads_iphone17_assinar-mais-inteligente_banner-offer_perene_h1_v01_#001-1.png
        // Extrair o "nome base" (estilo) e o "sufixo" (formato)
        let nameWithoutExt = file.replace('.png', '');
        
        let suffix = '';
        const match = nameWithoutExt.match(/(-\d)$/);
        if (match) {
            suffix = match[1]; // ex: "-1"
            nameWithoutExt = nameWithoutExt.replace(/(-\d)$/, '');
        }

        const styleKey = nameWithoutExt;

        if (!knowledgeBase[styleKey]) {
            knowledgeBase[styleKey] = { formats: {} };
        }

        // Se esse formato específico ainda não foi mapeado pela IA
        if (!knowledgeBase[styleKey].formats[suffix]) {
            const layoutData = await analyzeImage(path.join(TARGET_DIR, file), styleKey, suffix);
            
            if (layoutData) {
                knowledgeBase[styleKey].formats[suffix] = layoutData;
                newItemsAdded++;
                // Salvar a cada sucesso para não perder dados se a API cair
                fs.writeFileSync(OUTPUT_FILE, JSON.stringify(knowledgeBase, null, 2));
                console.log(`[+] Mapeamento salvo para ${styleKey} (Formato: ${suffix || 'Feed'})`);
            }
            
            // Pausa de 3 segundos para não estourar Rate Limit da API do Gemini
            await delay(3000);
        }
    }

    console.log(`\\n=================================`);
    console.log(`Ingestão concluída!`);
    console.log(`Novos mapeamentos de layout aprendidos: ${newItemsAdded}`);
    console.log(`Base de Conhecimento salva em: ${OUTPUT_FILE}`);
}

main().catch(console.error);
