

/**
 * AI Orchestrator
 * Gerencia a chamada para os LLMs (Gemini e OpenAI).
 * Contém lógica de redundância:
 * 1. Tenta múltiplos modelos do Gemini em cascata.
 * 2. Faz Rotação de Chaves (Key Pooling) se existirem chaves secundárias.
 * 3. Faz Fallback final para a OpenAI se todas as alternativas do Google falharem.
 */
export async function callAIWithFallback(prompt, imageBase64 = null, temperature = null) {
    // 1. Mapear todas as chaves do Gemini disponíveis nas envs
    const geminiKeys = [];
    if (process.env.GEMINI_API_KEY) geminiKeys.push(process.env.GEMINI_API_KEY);
    if (process.env.GEMINI_API_KEY_2) geminiKeys.push(process.env.GEMINI_API_KEY_2);
    if (process.env.GEMINI_API_KEY_3) geminiKeys.push(process.env.GEMINI_API_KEY_3);

    // Cascata de modelos do Google
    const geminiModels = [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
    ];

    let lastError = null;

    // Tentar todas as chaves do Gemini
    for (const key of geminiKeys) {
        // Para cada chave, tentar a cascata de modelos
        for (const model of geminiModels) {
            try {
                console.log(`[Orchestrator] Tentando Google Gemini (${model}) com a chave terminada em ...${key.slice(-4)}`);
                const result = await callGemini(model, key, prompt, imageBase64, temperature);
                return result; // Se der certo, retorna imediatamente!
            } catch (error) {
                console.warn(`[Orchestrator] Falha no Gemini (${model}):`, error.message);
                lastError = error;
                // Continua para o próximo modelo/chave
            }
        }
    }

    // Se chegou até aqui, todo o pool do Google falhou (provavelmente limite de cota nas contas gratuitas)
    console.error("[Orchestrator] Alerta Vermelho: Todas as alternativas do Google Gemini falharam.");

    // Tentar Fallback Final: OpenAI (ChatGPT)
    if (process.env.OPENAI_API_KEY) {
        try {
            console.log(`[Orchestrator] Acionando protocolo de emergência: OpenAI (gpt-4o)`);
            const openaiResult = await callOpenAI(process.env.OPENAI_API_KEY, prompt, imageBase64, temperature);
            return openaiResult;
        } catch (openaiError) {
            console.error(`[Orchestrator] Falha fatal também na OpenAI:`, openaiError.message);
            throw new Error('Todas as IAs (Google e OpenAI) falharam ou estouraram a cota.');
        }
    }

    // Nenhuma alternativa funcionou
    throw new Error('Falha total nas IAs. Verifique os Rate Limits e as chaves de API (' + lastError.message + ')');
}

async function callGemini(model, apiKey, prompt, imageBase64, temperature = null) {
    let parts = [{ text: prompt }];

    if (imageBase64) {
        // Remover prefixo base64 se houver
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        parts.push({
            inline_data: {
                mime_type: "image/png",
                data: base64Data
            }
        });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
                responseMimeType: "application/json",
                ...(temperature !== null && { temperature })
            }
        })
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error?.message || `HTTP error ${response.status}`);
    }

    let jsonText = data.candidates[0].content.parts[0].text;
    
    // Limpar markdown backticks se a IA teimar em enviá-los
    jsonText = jsonText.replace(/^```json/im, '').replace(/```$/im, '').trim();

    // Validar se o parse passa
    try {
        return JSON.parse(jsonText);
    } catch (parseError) {
        throw new Error("IA retornou JSON inválido");
    }
}

async function callOpenAI(apiKey, prompt, imageBase64, temperature = null) {
    let messages = [
        {
            role: "user",
            content: [
                { type: "text", text: prompt }
            ]
        }
    ];

    if (imageBase64) {
        // Garantir que tem o prefixo data URI
        const dataUri = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;
        messages[0].content.push({
            type: "image_url",
            image_url: {
                url: dataUri
            }
        });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o', // Modelo principal rápido e multimodal
            messages: messages,
            response_format: { type: "json_object" },
            ...(temperature !== null && { temperature })
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || `HTTP error ${response.status}`);
    }

    let jsonText = data.choices[0].message.content;

    try {
        return JSON.parse(jsonText);
    } catch (parseError) {
        throw new Error("OpenAI retornou JSON inválido");
    }
}
