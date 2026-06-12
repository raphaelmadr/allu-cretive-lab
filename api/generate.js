export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { imageBase64, creativeData, dimensions } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });
    }

    const prompt = `Você é um Diretor de Arte Sênior da Allu especializado em anúncios de performance para redes sociais.
Sua missão é atuar como o Motor de Layout do "Allu Creative Lab" (plataforma em Canvas/Fabric.js).

Você receberá:
1. Uma imagem de Referência (que mostra o estilo visual, os recortes de imagens de produto, fundos, brilhos e diagramação).
2. Uma Copy:
   - Hook: "${creativeData.hook}"
   - Body: "${creativeData.body}"
   - CTA: "${creativeData.cta}"
3. O Formato do Canvas: ${dimensions.w} x ${dimensions.h}.

Sua tarefa é DECODIFICAR a direção de arte da imagem de referência e mapeá-la para elementos NATIVOS no Canvas, para este formato específico.
Você deve retornar ESTRITAMENTE um objeto JSON com o schema abaixo (NENHUM TEXTO ADICIONAL FORA DO JSON).

Schema JSON:
{
  "background": {
    "type": "solid" | "gradient",
    "color1": "#HEX",
    "color2": "#HEX", // opcional, apenas para gradiente
    "gradientAngle": 90
  },
  "productImage": {
    "scalePercent": 0.8, // Escala relativa à largura do canvas
    "position": { "x": 0.5, "y": 0.5 }, // 0.5 é no centro
    "rotation": 0 // Rotação em graus, se necessário
  },
  "texts": [
    {
      "content": "String",
      "role": "hook" | "body" | "cta",
      "fontFamily": "Plus Jakarta Sans",
      "fontWeight": "bold" | "400" | "700",
      "fill": "#HEX",
      "fontSizeRatio": 0.08, // Tamanho da fonte relativo à altura do canvas (ex: 0.08 para 8%)
      "position": { "x": 0.5, "y": 0.15 },
      "textAlign": "center" | "left",
      "effects": {
        "innerShadow": true | false,
        "innerShadowColor": "rgba(255,255,255,0.8)",
        "innerShadowBlur": 10
      }
    }
  ],
  "badges": [
     // Caso identifique selos ou tags visuais
     {
        "type": "discount",
        "position": { "x": 0.8, "y": 0.2 },
        "text": "-20%",
        "color": "#02AE57"
     }
  ]
}

REGRAS CRÍTICAS:
- Analise a imagem em anexo. Ela é a referência absoluta para a diagramação.
- Posicione o Hook de acordo com a área do título da referência.
- O Body é o texto auxiliar/descritivo.
- O CTA geralmente é um botão (neste caso, a plataforma irá renderizar o texto como CTA).
- Aplique o efeito de "innerShadow" no texto APENAS se a referência visual tiver textos brilhantes (estilo Glassmorphism / Glass/Vazados).
- Use cores extraídas da própria imagem se possível.
- Posicione o "productImage" no exato local onde a foto do produto/mockup principal aparece na referência.
- Retorne SOMENTE O JSON VÁLIDO. Sem marcações Markdown (sem \`\`\`json).
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
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
