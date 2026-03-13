import { useCallback } from 'react';
import { useOrchestratorStore } from '../../store/orchestratorStore';
import { runAgent } from '../../services/ai/geminiService';
import type { AgentType, SharedContext } from '../../services/ai/geminiService';

const AGENT_SEQUENCE: AgentType[] = ['researcher', 'architect', 'security-reviewer'];

export function useOrchestrator() {
    const {
        startPipeline,
        setAgentStatus,
        setAgentOutput,
        setAgentError,
        setPipelineError,
        setIsRunning,
        resetPipeline,
        isRunning,
    } = useOrchestratorStore();

    const run = useCallback(async () => {
        startPipeline();

        const sharedContext: SharedContext = {
            researcherOutput: '',
            architectOutput: '',
            securityReviewerOutput: '',
        };

        for (const agentType of AGENT_SEQUENCE) {
            setAgentStatus(agentType, 'running');

            try {
                const result = await runAgent(agentType, '', sharedContext);

                if (!result.success) {
                    setAgentError(agentType, result.error ?? 'Unknown error');
                    setPipelineError(`Agent "${agentType}" failed: ${result.error ?? 'Unknown error'}`);
                    setIsRunning(false);
                    return;
                }

                setAgentOutput(agentType, result.data);
                setAgentStatus(agentType, 'success');

                // Update shared context for next agent
                const contextKeyMap: Record<AgentType, keyof SharedContext> = {
                    researcher: 'researcherOutput',
                    architect: 'architectOutput',
                    'security-reviewer': 'securityReviewerOutput',
                };
                sharedContext[contextKeyMap[agentType]] = result.data;
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Unexpected error';
                setAgentError(agentType, message);
                setPipelineError(`Agent "${agentType}" threw: ${message}`);
                setIsRunning(false);
                return;
            }
        }

        setIsRunning(false);
    }, [startPipeline, setAgentStatus, setAgentOutput, setAgentError, setPipelineError, setIsRunning]);

    const reset = useCallback(() => {
        resetPipeline();
    }, [resetPipeline]);

    return { run, reset, isRunning };
}
