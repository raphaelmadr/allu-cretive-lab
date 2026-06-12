import { callAIWithFallback } from './api/ai-orchestrator.js';

async function test() {
    process.env.GEMINI_API_KEY = "AQ.Ab8RN6Jhnpxf7lemlW7YvFPzSE--aPZIAG2TXwO0aMCwc9_GoA";
    
    console.log("Testing Orchestrator...");
    try {
        const res = await callAIWithFallback(`Retorne um JSON com a propriedade "hello" e o valor "world"`);
        console.log("SUCCESS:", res);
    } catch (e) {
        console.error("ERROR:", e);
    }
}

test();
