// Gera a imagem final via DALL-E 3 a partir do `generation_prompt` estruturado
// (ver api/generate-prompt.js). Reaproveita OPENAI_API_KEY já existente no projeto
// (hoje usada só para chat/vision em api/ai-orchestrator.js), apontando para o
// endpoint de geração de imagem (nunca chamado em nenhum outro lugar do projeto).

// Vercel usa timeout default de 10s — DALL-E 3 rotineiramente leva 10-30s.
export const config = { maxDuration: 60 };

// O tamanho enviado à API é calculado a partir das dimensões REAIS do canvas ativo,
// não do `aspect_ratio` livre da IA — o DALL-E 3 só aceita 3 tamanhos exatos, e
// confiar num enum de LLM pra bater exatamente uma dessas strings é frágil.
function sizeFromDimensions(w, h) {
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

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt, activeFormat } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: 'Prompt de geração vazio.' });
    }
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OPENAI_API_KEY não configurada.' });
    }

    const format = activeFormat || { w: 1080, h: 1080 };
    const size = sizeFromDimensions(format.w, format.h);

    try {
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

        return res.status(200).json({
            b64Json: data.data[0].b64_json,
            revisedPrompt: data.data[0].revised_prompt || null
        });
    } catch (error) {
        console.error('Error in Generate Image (DALL-E 3):', error);
        return res.status(500).json({ error: error.message || 'Falha ao gerar a imagem.' });
    }
}
