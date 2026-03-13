import { create } from 'zustand';
import type { AgentState, OrchestratorState } from '../types';

const createDefaultAgent = (): AgentState => ({
    status: 'idle',
    output: '',
    error: '',
});

const initialAgents = () => ({
    researcher: createDefaultAgent(),
    architect: createDefaultAgent(),
    'security-reviewer': createDefaultAgent(),
});

export const useOrchestratorStore = create<OrchestratorState>((set) => ({
    agents: initialAgents(),
    isRunning: false,
    pipelineError: '',

    startPipeline: () =>
        set({
            agents: initialAgents(),
            isRunning: true,
            pipelineError: '',
        }),

    setAgentStatus: (agentId, status) =>
        set((state) => ({
            agents: {
                ...state.agents,
                [agentId]: { ...state.agents[agentId], status },
            },
        })),

    setAgentOutput: (agentId, output) =>
        set((state) => ({
            agents: {
                ...state.agents,
                [agentId]: { ...state.agents[agentId], output },
            },
        })),

    setAgentError: (agentId, error) =>
        set((state) => ({
            agents: {
                ...state.agents,
                [agentId]: { ...state.agents[agentId], error, status: 'error' },
            },
        })),

    setPipelineError: (error) => set({ pipelineError: error }),

    setIsRunning: (running) => set({ isRunning: running }),

    resetPipeline: () =>
        set({
            agents: initialAgents(),
            isRunning: false,
            pipelineError: '',
        }),
}));

// Optimized selectors — prevent unnecessary rerenders
export const useAgentState = (agentId: keyof OrchestratorState['agents']) =>
    useOrchestratorStore((state) => state.agents[agentId]);

export const useIsRunning = () =>
    useOrchestratorStore((state) => state.isRunning);

export const usePipelineError = () =>
    useOrchestratorStore((state) => state.pipelineError);

export const useAgentStatus = (agentId: keyof OrchestratorState['agents']) =>
    useOrchestratorStore((state) => state.agents[agentId].status);
