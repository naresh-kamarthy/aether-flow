import { GoogleGenerativeAI } from '@google/generative-ai';

export type AgentType = 'researcher' | 'architect' | 'security-reviewer';

export type AgentStatus = 'idle' | 'running' | 'success' | 'error';

export interface AgentResult {
    success: boolean;
    data: string;
    error?: string;
}

export interface SharedContext {
    researcherOutput: string;
    architectOutput: string;
    securityReviewerOutput: string;
}

// ── Gemini Configuration ────────────────────────────
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ── System Prompts ──────────────────────────────────
const SYSTEM_PROMPTS: Record<AgentType, string> = {
    researcher: `You are the "Aether Researcher". Your role is to analyze initial technical requirements and data streams. 
Provide a high-level technical analysis, identify key metrics, and suggest a core direction. 
Keep your response concise but data-rich (around 2-3 sentences).`,

    architect: `You are the "Aether Architect". Your role is to design a technical blueprint based on the researcher's findings. 
Define the stack, database schema, and scaling strategy. 
Base your design on the following context: {CONTEXT}.
Keep your response concise and structured (around 3-4 sentences).`,

    'security-reviewer': `You are the "Cyber Security Reviewer". Your role is to audit the architect's blueprint for vulnerabilities. 
Identify potential risks (Auth, Data, Injection) and provide actionable advisories. 
Base your audit on the following architect output: {CONTEXT}.
Keep your response concise (3-4 bullet points or sentences).`,
};

export async function runAgent(
    agentType: AgentType,
    input: string,
    sharedContext: Partial<SharedContext>
): Promise<AgentResult> {
    if (!API_KEY) {
        return {
            success: false,
            data: '',
            error: 'Gemini API Key missing. Please set VITE_GEMINI_API_KEY in .env',
        };
    }

    try {
        let systemPrompt = SYSTEM_PROMPTS[agentType];

        // Inject context where necessary
        if (agentType === 'architect') {
            systemPrompt = systemPrompt.replace('{CONTEXT}', sharedContext.researcherOutput || 'No research data provided.');
        } else if (agentType === 'security-reviewer') {
            systemPrompt = systemPrompt.replace('{CONTEXT}', sharedContext.architectOutput || 'No architecture blueprint provided.');
        }

        const userPrompt = input || `Generate the ${agentType} report based on your specialized profile.`;

        const fullPrompt = `${systemPrompt}\n\nTask: ${userPrompt}`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        return {
            success: true,
            data: text.trim(),
        };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown API error';
        return {
            success: false,
            data: '',
            error: message,
        };
    }
}
