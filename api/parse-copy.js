import { callAIWithFallback } from './ai-orchestrator.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { rawText } = req.body;

    const prompt = `Você é um Copywriter Sênior da Allu — marca de assinatura de eletrônicos.
Sua missão: pegar o texto bruto abaixo e estruturá-lo em JSON.

REGRAS:
1. "hook" = a frase mais chamativa e impactante (max 2 linhas). Separe linhas com \\n.
2. "body" = texto descritivo com nome do produto e preço por mês. Ex: "Smartwatch Garmin Forerunner 165 na allu.\\nA partir de R$170,91/mês."
3. "cta" = a chamada para ação. Se não houver, use "Assina agora".
4. "productName" = nome comercial exato do produto (ex: "iPhone 17 256GB", "Garmin Forerunner 165 Music").
5. No campo "hook", coloque em **negrito** (Markdown) a palavra ou frase que representa a DOR ou o BENEFÍCIO mais forte.
   Exemplos de destaque: "Você treina.\\n**Seu relógio não acompanha.**" / "**Todo mundo trocou** de celular. Menos você."
6. Preserve quebras de linha originais no hook se fizerem sentido visual.

TEXTO BRUTO:
"""
${rawText}
"""

Retorne APENAS JSON válido:
{
  "hook": "Você treina.\\n**Seu relógio não acompanha.**",
  "body": "Smartwatch Garmin Forerunner 165 Music na allu.\\nA partir de R$170,91/mês.",
  "cta": "Assina agora",
  "productName": "Garmin Forerunner 165 Music"
}`;

    try {
        const parsedData = await callAIWithFallback(prompt);
        return res.status(200).json(parsedData);
    } catch (error) {
        console.error('Error in Orchestrator (Parse Copy):', error);
        return res.status(500).json({ error: error.message || 'Failed to parse copy' });
    }
}
