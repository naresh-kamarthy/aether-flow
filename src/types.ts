import type { ReactNode } from 'react';
import type { AgentStatus } from './services/ai/geminiService';

export interface DecryptedTextProps {
    text: string;
    speed?: number;
    maxIterations?: number;
    sequential?: boolean;
    className?: string;
    animateOn?: 'view' | 'hover' | 'mount';
    reveal?: boolean;
}

export interface GlassSurfaceProps {
    children: ReactNode;
    className?: string;
}
export interface SpotlightCardProps {
    children: ReactNode;
    spotlightColor?: string;
    className?: string;
}
export interface AgentCardProps {
    agentId: keyof OrchestratorState['agents'];
    title: string;
    icon: string;
    description: string;
}
export interface DataPulseProps {
    active: boolean;
    direction?: 'down' | 'right';
}

export interface AgentState {
    status: AgentStatus;
    output: string;
    error: string;
}

export interface OrchestratorState {
    agents: {
        researcher: AgentState;
        architect: AgentState;
        'security-reviewer': AgentState;
    };
    isRunning: boolean;
    pipelineError: string;

    // Actions
    startPipeline: () => void;
    setAgentStatus: (agentId: keyof OrchestratorState['agents'], status: AgentStatus) => void;
    setAgentOutput: (agentId: keyof OrchestratorState['agents'], output: string) => void;
    setAgentError: (agentId: keyof OrchestratorState['agents'], error: string) => void;
    setPipelineError: (error: string) => void;
    setIsRunning: (running: boolean) => void;
    resetPipeline: () => void;
}