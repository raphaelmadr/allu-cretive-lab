// Gera a imagem final a partir do `generation_prompt` estruturado (ver
// api/generate-prompt.js). Provedor PRIMÁRIO: Gemini (reaproveita GEMINI_API_KEY/
// _2/_3, as mesmas chaves já usadas para texto em api/ai-orchestrator.js — mesmo
// key-pooling, mesmo endpoint generateContent, só troca o generationConfig para
// pedir IMAGE em vez de JSON). Fallback OPCIONAL: DALL-E 3, só entra em ação se
// OPENAI_API_KEY estiver configurada (hoje não está).

// Vercel usa timeout default de 10s — geração de imagem rotineiramente leva 10-30s.
export const config = { maxDuration: 60 };

// `gemini-2.0-flash-preview-image-generation` foi removido daqui: a v1beta rejeitou
// com "model not found" em teste real. `gemini-2.5-flash-image` (Nano Banana) é o
// único nome confirmado por múltiplas fontes independentes para generateContent.
const GEMINI_IMAGE_MODELS = ['gemini-2.5-flash-image'];

function aspectRatioFromDimensions(w, h) {
    const ratio = w / h;
    const candidates = [
        { ar: '1:1', ratio: 1 },
        { ar: '9:16', ratio: 9 / 16 },
        { ar: '16:9', ratio: 16 / 9 },
        { ar: '4:5', ratio: 4 / 5 },
        { ar: '3:4', ratio: 3 / 4 },
    ];
    return candidates.reduce((best, c) =>
        Math.abs(c.ratio - ratio) < Math.abs(best.ratio - ratio) ? c : best
    ).ar;
}

// DALL-E 3 só aceita 3 tamanhos exatos — usado apenas no fallback.
function dalleSizeFromDimensions(w, h) {
    const ratio = w / h;
    const candidates = [
        { size: '1024x1024', ratio: 1 },
        { size: '1792x1024', ratio: 1792 / 1024 },
        { size: '1024x1792', ratio: 1024 / 1792 },
    ];
    return candidates.reduce((best, c) =>
        Math.abs(c.ratio - ratio) < Math.abs(best.ratio - ratio) ? c : best
    ).size;
}

async function generateWithGemini(prompt, aspectRatio) {
    const geminiKeys = [];
    if (process.env.GEMINI_API_KEY) geminiKeys.push(process.env.GEMINI_API_KEY);
    if (process.env.GEMINI_API_KEY_2) geminiKeys.push(process.env.GEMINI_API_KEY_2);
    if (process.env.GEMINI_API_KEY_3) geminiKeys.push(process.env.GEMINI_API_KEY_3);

    let lastError = null;
    for (const key of geminiKeys) {
        for (const model of GEMINI_IMAGE_MODELS) {
            try {
                console.log(`[Generate Image] Tentando Gemini (${model}) com a chave terminada em ...${key.slice(-4)}`);
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            responseModalities: ['TEXT', 'IMAGE'],
                            imageConfig: { aspectRatio }
                        }
                    })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error?.message || `HTTP error ${response.status}`);
                }

                const parts = data.candidates?.[0]?.content?.parts || [];
                const imagePart = parts.find((p) => p.inline_data || p.inlineData);
                if (!imagePart) {
                    throw new Error('Resposta do Gemini não contém imagem (inline_data ausente) — possível bloqueio de conteúdo ou modelo sem suporte a geração de imagem.');
                }
                const inline = imagePart.inline_data || imagePart.inlineData;

                return {
                    b64Json: inline.data,
                    revisedPrompt: null
                };
            } catch (error) {
                console.warn(`[Generate Image] Falha no Gemini (${model}):`, error.message);
                lastError = error;
            }
        }
    }
    throw lastError || new Error('Falha desconhecida ao gerar imagem via Gemini.');
}

async function generateWithDallE(prompt, w, h) {
    const size = dalleSizeFromDimensions(w, h);
    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'dall-e-3',
            prompt,
            n: 1,
            size,
            quality: 'standard',
            response_format: 'b64_json'
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || `HTTP error ${response.status}`);
    }

    return {
        b64Json: data.data[0].b64_json,
        revisedPrompt: data.data[0].revised_prompt || null
    };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt, activeFormat } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: 'Prompt de geração vazio.' });
    }

    const format = activeFormat || { w: 1080, h: 1080 };

    try {
        let result;
        try {
            result = await generateWithGemini(prompt, aspectRatioFromDimensions(format.w, format.h));
        } catch (geminiError) {
            console.error('[Generate Image] Todas as tentativas no Gemini falharam:', geminiError.message);
            if (process.env.OPENAI_API_KEY) {
                console.log('[Generate Image] Acionando fallback: DALL-E 3');
                result = await generateWithDallE(prompt, format.w, format.h);
            } else {
                throw geminiError;
            }
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in Generate Image:', error);
        return res.status(500).json({ error: error.message || 'Falha ao gerar a imagem.' });
    }
}
