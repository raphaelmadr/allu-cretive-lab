import { callAIWithFallback } from './ai-orchestrator.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { rawText } = req.body;

    const prompt = `Você é um Copywriter Sênior da Allu.
Sua missão é pegar esse texto bruto copiado de uma tabela do Notion e estruturá-lo em JSON.
O texto provavelmente contém um Hook (Título chamativo), um Body (Texto descritivo / argumentos) e um CTA (Chamada para Ação).
Além disso, identifique qual PRODUTO o anúncio está vendendo (ex: "iPhone 16", "S24 Ultra", "Macbook Air M2").
Se houver palavras que merecem DESTAQUE visual (como o nome do produto ou uma dor forte), coloque essas palavras em **negrito** (Markdown).

TEXTO BRUTO:
"""
${rawText}
"""

Retorne APENAS um JSON válido no seguinte formato:
{
  "hook": "Sua chance de ter um **iPhone**",
  "body": "Não fique preso em contratos longos. Assine hoje mesmo.",
  "cta": "Assinar agora",
  "productName": "iPhone 17"
}`;

    try {
        const parsedData = await callAIWithFallback(prompt);
        return res.status(200).json(parsedData);
    } catch (error) {
        console.error('Error in Orchestrator (Parse Copy):', error);
        return res.status(500).json({ error: error.message || 'Failed to parse copy' });
    }
}
