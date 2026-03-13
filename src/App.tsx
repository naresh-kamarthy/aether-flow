import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { DataPulse, useOrchestrator } from './features/agents';
import GlassSurface from './components/ui/GlassSurface';
import { useOrchestratorStore, useIsRunning, usePipelineError, useAgentStatus } from './store/orchestratorStore';

// Lazy load heavy UI components
const AgentCard = lazy(() => import('./features/agents/AgentCard'));
const DecryptedText = lazy(() => import('./components/ui/DecryptedText'));

const AGENTS = ['researcher', 'architect', 'security-reviewer'] as const;

function App() {
    const { run, reset } = useOrchestrator();
    const isRunning = useIsRunning();
    const pipelineError = usePipelineError();

    // Granular selectors to prevent re-rendering when other state changes
    const researcherStatus = useAgentStatus('researcher');
    const architectStatus = useAgentStatus('architect');
    const securityStatus = useAgentStatus('security-reviewer');
    const securityOutput = useOrchestratorStore((s) => s.agents['security-reviewer'].output);

    const showPulse1 = researcherStatus === 'success' && architectStatus === 'running';
    const showPulse2 = architectStatus === 'success' && securityStatus === 'running';

    const pipelineComplete =
        researcherStatus === 'success' &&
        architectStatus === 'success' &&
        securityStatus === 'success';

    return (
        <div className="app-container">
            {/* Background ambient effects */}
            <div className="ambient-bg" />

            {/* Header */}
            <header className="app-header">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="header-content"
                >
                    <div className="header-logo">
                        <span className="logo-icon">◈</span>
                        <h1 className="logo-text">Aether Flow</h1>
                    </div>
                    <p className="header-subtitle">Autonomous Multi-Agent AI Orchestrator</p>
                </motion.div>
            </header>

            {/* 3-Column Command Center */}
            <main className="command-center">
                {/* Column 1: Sidebar — Pipeline Controls */}
                <GlassSurface className="sidebar-panel">
                    <div className="sidebar-content">
                        <h2 className="panel-title">
                            <span className="title-icon">⚡</span>
                            Pipeline Control
                        </h2>

                        <div className="pipeline-controls">
                            <button
                                onClick={run}
                                disabled={isRunning}
                                className="btn-primary"
                                data-testid="run-pipeline"
                            >
                                {isRunning ? (
                                    <>
                                        <span className="btn-spinner" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <span className="btn-icon">▶</span>
                                        Run Pipeline
                                    </>
                                )}
                            </button>

                            <button
                                onClick={reset}
                                className="btn-secondary"
                                data-testid="reset-pipeline"
                            >
                                <span className="btn-icon">↺</span>
                                Reset
                            </button>
                        </div>

                        {pipelineError && (
                            <motion.div
                                className="pipeline-error"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                data-testid="pipeline-error"
                            >
                                <span className="error-badge">ERROR</span>
                                <p>{pipelineError}</p>
                            </motion.div>
                        )}

                        <div className="context-log">
                            <h3 className="context-title">Shared Context</h3>
                            <div className="context-entries">
                                {AGENTS.map((id) => (
                                    <AgentContextEntry key={id} id={id} />
                                ))}
                            </div>
                        </div>

                        <div className="pipeline-stages">
                            <h3 className="context-title">Execution Flow</h3>
                            <div className="stage-flow">
                                <div className={`stage-node ${researcherStatus !== 'idle' ? 'stage-node-active' : ''}`}>
                                    R
                                </div>
                                <div className={`stage-connector ${showPulse1 ? 'stage-connector-active' : ''}`} />
                                <div className={`stage-node ${architectStatus !== 'idle' ? 'stage-node-active' : ''}`}>
                                    A
                                </div>
                                <div className={`stage-connector ${showPulse2 ? 'stage-connector-active' : ''}`} />
                                <div className={`stage-node ${securityStatus !== 'idle' ? 'stage-node-active' : ''}`}>
                                    S
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassSurface>

                <div className="agents-column">
                    <Suspense fallback={<div className="agent-card-skeleton" />}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <AgentCard
                                agentId="researcher"
                                title="Researcher Agent"
                                icon="🔬"
                                description="Gathers and analyzes initial data streams"
                            />
                        </motion.div>

                        <DataPulse active={showPulse1} direction="down" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <AgentCard
                                agentId="architect"
                                title="Architect Agent"
                                icon="🏗️"
                                description="Processes data into structured blueprints"
                            />
                        </motion.div>

                        <DataPulse active={showPulse2} direction="down" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <AgentCard
                                agentId="security-reviewer"
                                title="Security Reviewer"
                                icon="🛡️"
                                description="Audits output for security compliance"
                            />
                        </motion.div>
                    </Suspense>
                </div>

                {/* Column 3: Final Output Panel */}
                <GlassSurface className="output-panel">
                    <div className="output-content">
                        <h2 className="panel-title">
                            <span className="title-icon">📋</span>
                            Pipeline Output
                        </h2>

                        {!pipelineComplete && !pipelineError && (
                            <div className="output-empty" data-testid="output-empty">
                                <div className="empty-icon">◇</div>
                                <p>Run the pipeline to see agent outputs here</p>
                            </div>
                        )}

                        {pipelineComplete && (
                            <motion.div
                                className="output-final"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6 }}
                                data-testid="final-output"
                            >
                                <Suspense fallback={<div className="output-loading">Loading output viewer...</div>}>
                                    <div className="output-section">
                                        <h3 className="output-section-title">
                                            <span>🔬</span> Research Findings
                                        </h3>
                                        <div className="output-section-body">
                                            <AgentOutputText agentId="researcher" />
                                        </div>
                                    </div>

                                    <div className="output-section">
                                        <h3 className="output-section-title">
                                            <span>🏗️</span> Architecture Blueprint
                                        </h3>
                                        <div className="output-section-body">
                                            <AgentOutputText agentId="architect" />
                                        </div>
                                    </div>

                                    <div className="output-section">
                                        <h3 className="output-section-title">
                                            <span>🛡️</span> Security Audit
                                        </h3>
                                        <div className="output-section-body">
                                            <DecryptedText
                                                text={securityOutput}
                                                speed={10}
                                                maxIterations={2}
                                                reveal={true}
                                                className="output-section-text"
                                            />
                                        </div>
                                    </div>
                                </Suspense>

                                <div className="output-badge">
                                    <span className="badge-icon">✓</span>
                                    Pipeline Complete
                                </div>
                            </motion.div>
                        )}
                    </div>
                </GlassSurface>
            </main>
        </div>
    );
}

// Helper components for granular re-rendering
function AgentContextEntry({ id }: { id: typeof AGENTS[number] }) {
    const status = useAgentStatus(id);
    return (
        <div className={`context-entry ${status === 'success' ? 'context-entry-active' : ''}`}>
            <span className="context-agent-name">
                {id === 'researcher' ? '🔬 Researcher' : id === 'architect' ? '🏗️ Architect' : '🛡️ Security'}
            </span>
            <span className={`context-status context-status-${status}`}>
                {status.toUpperCase()}
            </span>
        </div>
    );
}

function AgentOutputText({ agentId }: { agentId: typeof AGENTS[number] }) {
    const output = useOrchestratorStore((s) => s.agents[agentId].output);
    return (
        <DecryptedText
            text={output}
            speed={10}
            maxIterations={2}
            reveal={true}
            className="output-section-text"
        />
    );
}

export default App;
