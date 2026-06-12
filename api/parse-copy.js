export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { rawText } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });
    }

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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error('Gemini API Error:', data.error);
            return res.status(500).json({ error: data.error.message });
        }

        let jsonText = data.candidates[0].content.parts[0].text;
        
        try {
            const parsed = JSON.parse(jsonText);
            return res.status(200).json(parsed);
        } catch (parseError) {
            console.error("Erro ao parsear JSON da IA:", jsonText);
            return res.status(500).json({ error: "IA retornou formato inválido" });
        }
        
    } catch (error) {
        console.error('Error connecting to Gemini:', error);
        return res.status(500).json({ error: 'Failed to parse copy' });
    }
}
