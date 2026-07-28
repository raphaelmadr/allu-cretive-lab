import { callAIWithFallback } from './ai-orchestrator.js';
import { IMAGE_AI_MASTER_PROMPT } from '../IA_PROMPTS.js';
import { BRAND_KNOWLEDGE_DOC } from '../BRAND_KNOWLEDGE.js';

// IDs de seção válidos extraídos direto do documento — nunca ficam dessincronizados
// de BRAND_KNOWLEDGE.js quando uma seção é adicionada/renomeada.
const VALID_DOC_IDS = [...BRAND_KNOWLEDGE_DOC.matchAll(/## (DS-[A-Z]+-\d+)/g)].map(m => m[1]);

function serializeHistory(messages) {
    return messages
        .map(m => `${m.role === 'user' ? 'USUÁRIO' : 'IA (proposta anterior)'}: ${m.content}`)
        .join('\n\n');
}

function buildPrompt(messages, activeFormat) {
    return IMAGE_AI_MASTER_PROMPT
        .replace('{BRAND_KNOWLEDGE_DOC}', BRAND_KNOWLEDGE_DOC)
        .replace('{ACTIVE_FORMAT_NAME}', activeFormat.name)
        .replace('{ACTIVE_FORMAT_W}', activeFormat.w)
        .replace('{ACTIVE_FORMAT_H}', activeFormat.h)
        .replace('{CHAT_HISTORY}', serializeHistory(messages));
}

// Validação leve do schema (sem lib externa — projeto não tem package.json/dependências).
// Não valida hex de color_palette contra nenhuma lista: paleta é de uso livre (DS-CORES-01).
function validateSchema(json) {
    const errors = [];
    if (!json?.generation_prompt || typeof json.generation_prompt !== 'string' || !json.generation_prompt.trim()) {
        errors.push('generation_prompt ausente ou vazio');
    }
    if (!Array.isArray(json?.meta?.consulted_docs) || json.meta.consulted_docs.length === 0) {
        errors.push('meta.consulted_docs deve ser um array não-vazio com os IDs das seções consultadas');
    } else if (!json.meta.consulted_docs.every(id => VALID_DOC_IDS.includes(id))) {
        errors.push(`meta.consulted_docs contém IDs inválidos. IDs válidos: ${VALID_DOC_IDS.join(', ')}`);
    }
    if (!Array.isArray(json?.brand_constraints?.must_avoid)) {
        errors.push('brand_constraints.must_avoid deve ser um array');
    }
    if (!json?.negative_prompt || typeof json.negative_prompt !== 'string' || !json.negative_prompt.trim()) {
        errors.push('negative_prompt ausente ou vazio');
    }
    if (!Array.isArray(json?.style?.color_palette)) {
        errors.push('style.color_palette deve ser um array de códigos hex');
    }
    return errors;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { messages, activeFormat } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Histórico de mensagens vazio.' });
    }

    const format = activeFormat || { name: 'Instagram Feed', w: 1080, h: 1080 };

    try {
        const prompt = buildPrompt(messages, format);
        let structured = await callAIWithFallback(prompt, null, 0.3);
        let errors = validateSchema(structured);

        // Uma tentativa de correção automática antes de desistir (Parte 3 da spec original).
        if (errors.length > 0) {
            console.warn('[Generate Prompt] Schema inválido, tentando correção:', errors);
            const correctionPrompt = `${prompt}\n\n[CORREÇÃO NECESSÁRIA]\nSua resposta anterior tinha os seguintes problemas:\n${errors.join('\n')}\nCorrija e responda novamente APENAS com o JSON, seguindo estritamente o schema da Etapa 4.`;
            structured = await callAIWithFallback(correctionPrompt, null, 0.3);
            errors = validateSchema(structured);
        }

        if (errors.length > 0) {
            return res.status(502).json({ error: `IA retornou um schema inválido mesmo após correção: ${errors.join('; ')}` });
        }

        return res.status(200).json(structured);
    } catch (error) {
        console.error('Error in Orchestrator (Generate Prompt):', error);
        return res.status(500).json({ error: error.message || 'Falha ao gerar o prompt estruturado.' });
    }
}
