import { NOTION_GENERATOR_PROMPT } from '../IA_PROMPTS.js';
import { callAIWithFallback } from './ai-orchestrator.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { creativeData, dimensions } = req.body;

    const prompt = NOTION_GENERATOR_PROMPT
        .replace('{HOOK}', creativeData.hook || '')
        .replace('{BODY}', creativeData.body || '')
        .replace('{PRODUCT}', creativeData.productName || '')
        .replace('{W}', dimensions.w)
        .replace('{H}', dimensions.h);

    try {
        const parsedLayout = await callAIWithFallback(prompt);
        return res.status(200).json(parsedLayout);
    } catch (error) {
        console.error('Error in Orchestrator (Generate Notion Layout):', error);
        return res.status(500).json({ error: error.message || 'Failed to generate layout from notion' });
    }
}
