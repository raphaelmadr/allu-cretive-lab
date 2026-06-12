import { FALLBACK_API_PROMPT } from '../IA_PROMPTS.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { imageBase64, creativeData, dimensions } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });
    }

    const prompt = FALLBACK_API_PROMPT
        .replace('{HOOK}', creativeData.hook || '')
        .replace('{BODY}', creativeData.body || '')
        .replace('{CTA}', creativeData.cta || '')
        .replace('{W}', dimensions.w)
        .replace('{H}', dimensions.h);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: "image/png",
                                data: imageBase64.split(',')[1] // remove prefix 'data:image/png;base64,'
                            }
                        }
                    ]
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
            const parsedLayout = JSON.parse(jsonText);
            return res.status(200).json(parsedLayout);
        } catch (parseError) {
            console.error("Erro ao parsear JSON da IA:", jsonText);
            return res.status(500).json({ error: "IA retornou formato inválido" });
        }
        
    } catch (error) {
        console.error('Error connecting to Gemini:', error);
        return res.status(500).json({ error: 'Failed to generate layout' });
    }
}
