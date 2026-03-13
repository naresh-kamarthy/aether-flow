import { memo } from 'react';
import { motion } from 'framer-motion';
import SpotlightCard from '../../components/ui/SpotlightCard';
import DecryptedText from '../../components/ui/DecryptedText';
import { useAgentState } from '../../store/orchestratorStore';
import type { AgentCardProps } from '../../types';

const STATUS_CONFIG = {
    idle: { color: 'rgba(100, 116, 139, 0.3)', label: 'Standby', dotClass: 'bg-slate-500' },
    running: { color: 'rgba(59, 130, 246, 0.4)', label: 'Processing', dotClass: 'bg-blue-500' },
    success: { color: 'rgba(34, 197, 94, 0.35)', label: 'Complete', dotClass: 'bg-green-500' },
    error: { color: 'rgba(239, 68, 68, 0.35)', label: 'Failed', dotClass: 'bg-red-500' },
};

function AgentCard({ agentId, title, icon, description }: AgentCardProps) {
    const agent = useAgentState(agentId);
    const config = STATUS_CONFIG[agent.status];

    return (
        <SpotlightCard spotlightColor={config.color} className="agent-card">
            <div className="agent-card-header">
                <div className="agent-icon">{icon}</div>
                <div className="agent-info">
                    <h3 className="agent-title">{title}</h3>
                    <p className="agent-description">{description}</p>
                </div>
                <div className="agent-status">
                    <span className={`status-dot ${config.dotClass} ${agent.status === 'running' ? 'animate-pulse' : ''}`} />
                    <span className="status-label" data-testid={`status-${agentId}`}>
                        {config.label}
                    </span>
                </div>
            </div>

            {agent.status === 'running' && (
                <motion.div
                    className="agent-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    data-testid={`loading-${agentId}`}
                >
                    <div className="loading-bar">
                        <motion.div
                            className="loading-bar-fill"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </div>
                    <span className="loading-text">Analyzing data streams...</span>
                </motion.div>
            )}

            {agent.output && (
                <motion.div
                    className="agent-output"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    data-testid={`output-${agentId}`}
                >
                    <DecryptedText
                        text={agent.output}
                        speed={15}
                        maxIterations={3}
                        sequential={true}
                        reveal={agent.status !== 'running'}
                        className="output-text"
                    />
                </motion.div>
            )}

            {agent.error && (
                <motion.div
                    className="agent-error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    data-testid={`error-${agentId}`}
                >
                    <span className="error-icon">⚠</span>
                    <span className="error-message">{agent.error}</span>
                </motion.div>
            )}
        </SpotlightCard>
    );
}

export default memo(AgentCard);
