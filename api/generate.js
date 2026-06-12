import { FALLBACK_API_PROMPT } from '../IA_PROMPTS.js';
import { callAIWithFallback } from './ai-orchestrator.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { imageBase64, creativeData, dimensions } = req.body;

    const prompt = FALLBACK_API_PROMPT
        .replace('{HOOK}', creativeData.hook || '')
        .replace('{BODY}', creativeData.body || '')
        .replace('{CTA}', creativeData.cta || '')
        .replace('{W}', dimensions.w)
        .replace('{H}', dimensions.h);

    try {
        const parsedLayout = await callAIWithFallback(prompt, imageBase64);
        return res.status(200).json(parsedLayout);
    } catch (error) {
        console.error('Error in Orchestrator (Generate Layout):', error);
        return res.status(500).json({ error: error.message || 'Failed to generate layout' });
    }
}
