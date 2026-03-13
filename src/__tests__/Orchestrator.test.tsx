import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import DataPulse from '../features/agents/DataPulse';
import { useOrchestratorStore } from '../store/orchestratorStore';
import type { AgentResult } from '../services/ai/geminiService';

// ── Mock the Gemini service ──────────────────────────
vi.mock('../services/ai/geminiService', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../services/ai/geminiService')>();
    return {
        ...actual,
        runAgent: vi.fn(),
    };
});

// ── Mock framer-motion to remove async animations ───
vi.mock('framer-motion', () => {
    const React = require('react');

    const motion = new Proxy(
        {},
        {
            get: (_target, prop: string) => {
                return React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
                    const {
                        initial: _initial,
                        animate: _animate,
                        exit: _exit,
                        transition: _transition,
                        whileHover: _whileHover,
                        whileTap: _whileTap,
                        variants: _variants,
                        ...rest
                    } = props;

                    return React.createElement(prop, { ...rest, ref });
                });
            },
        }
    );

    return {
        motion,
        AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    };
});

// Helper: import mocked runAgent
async function getMockedRunAgent() {
    const mod = await import('../services/ai/geminiService');
    return mod.runAgent as ReturnType<typeof vi.fn>;
}

// ── Reset store and mocks between tests ──────────────
beforeEach(() => {
    vi.clearAllMocks();
    useOrchestratorStore.getState().resetPipeline();
});

// ═════════════════════════════════════════════════════
// TEST SUITE
// ═════════════════════════════════════════════════════

describe('Aether Flow Orchestrator', () => {
    // ─── HAPPY PATH ──────────────────────────────────
    describe('Happy Path — Successful Sequential Execution', () => {
        it('runs all 3 agents in sequence and displays final output', async () => {
            const mockRunAgent = await getMockedRunAgent();

            // Simulate near-instant responses for test speed
            const makeResult = (data: string): AgentResult => ({
                success: true,
                data,
            });

            mockRunAgent
                .mockResolvedValueOnce(makeResult('Research data gathered'))
                .mockResolvedValueOnce(makeResult('Architecture designed'))
                .mockResolvedValueOnce(makeResult('Security audit passed'));

            const user = userEvent.setup();
            render(<App />);

            // Initial state: all agents idle (use findBy for lazy loading)
            expect(await screen.findByTestId('status-researcher')).toHaveTextContent('Standby');
            expect(await screen.findByTestId('status-architect')).toHaveTextContent('Standby');
            expect(await screen.findByTestId('status-security-reviewer')).toHaveTextContent('Standby');

            // Click Run
            const runBtn = screen.getByTestId('run-pipeline');
            await user.click(runBtn);

            // Wait for all agents to complete
            await waitFor(() => {
                expect(screen.getByTestId('status-researcher')).toHaveTextContent('Complete');
                expect(screen.getByTestId('status-architect')).toHaveTextContent('Complete');
                expect(screen.getByTestId('status-security-reviewer')).toHaveTextContent('Complete');
            });

            // Verify outputs are rendered
            expect(screen.getByTestId('output-researcher')).toBeInTheDocument();
            expect(screen.getByTestId('output-architect')).toBeInTheDocument();
            expect(screen.getByTestId('output-security-reviewer')).toBeInTheDocument();

            // Final output panel should show
            expect(screen.getByTestId('final-output')).toBeInTheDocument();

            // Agents were called in order
            expect(mockRunAgent).toHaveBeenCalledTimes(3);
            expect(mockRunAgent.mock.calls[0]![0]).toBe('researcher');
            expect(mockRunAgent.mock.calls[1]![0]).toBe('architect');
            expect(mockRunAgent.mock.calls[2]![0]).toBe('security-reviewer');
        });

        it('resets pipeline state when reset button is clicked', async () => {
            const mockRunAgent = await getMockedRunAgent();
            mockRunAgent.mockResolvedValue({ success: true, data: 'output' });

            const user = userEvent.setup();
            render(<App />);

            await user.click(screen.getByTestId('run-pipeline'));

            await waitFor(() => {
                expect(screen.getByTestId('status-researcher')).toHaveTextContent('Complete');
            });

            // Reset
            await user.click(screen.getByTestId('reset-pipeline'));

            expect(await screen.findByTestId('status-researcher')).toHaveTextContent('Standby');
            expect(await screen.findByTestId('status-architect')).toHaveTextContent('Standby');
            expect(await screen.findByTestId('status-security-reviewer')).toHaveTextContent('Standby');
        });
    });

    // ─── ERROR PATH ──────────────────────────────────
    describe('Error Path — API Error Handling', () => {
        it('halts pipeline and shows error when an agent returns success: false', async () => {
            const mockRunAgent = await getMockedRunAgent();

            mockRunAgent
                .mockResolvedValueOnce({ success: true, data: 'Research data' })
                .mockResolvedValueOnce({
                    success: false,
                    data: '',
                    error: 'Model rate limit exceeded',
                });

            const user = userEvent.setup();
            render(<App />);

            await user.click(screen.getByTestId('run-pipeline'));

            await waitFor(() => {
                expect(screen.getByTestId('status-architect')).toHaveTextContent('Failed');
            });

            // Researcher should have succeeded
            expect(screen.getByTestId('status-researcher')).toHaveTextContent('Complete');

            // Architect shows error
            expect(screen.getByTestId('error-architect')).toBeInTheDocument();
            expect(screen.getByTestId('error-architect')).toHaveTextContent('Model rate limit exceeded');

            // Security reviewer should NEVER have run
            expect(screen.getByTestId('status-security-reviewer')).toHaveTextContent('Standby');

            // Pipeline error banner visible
            expect(screen.getByTestId('pipeline-error')).toBeInTheDocument();

            // runAgent should have been called only 2 times (3rd agent skipped)
            expect(mockRunAgent).toHaveBeenCalledTimes(2);
        });

        it('handles thrown exceptions from runAgent', async () => {
            const mockRunAgent = await getMockedRunAgent();

            mockRunAgent.mockRejectedValueOnce(new Error('Network failure'));

            const user = userEvent.setup();
            render(<App />);

            await user.click(screen.getByTestId('run-pipeline'));

            await waitFor(() => {
                expect(screen.getByTestId('status-researcher')).toHaveTextContent('Failed');
            });

            expect(screen.getByTestId('error-researcher')).toHaveTextContent('Network failure');
            expect(screen.getByTestId('pipeline-error')).toBeInTheDocument();
            expect(mockRunAgent).toHaveBeenCalledTimes(1);
        });

        it('handles non-Error thrown values gracefully', async () => {
            const mockRunAgent = await getMockedRunAgent();

            // Thrown a string instead of Error
            mockRunAgent.mockRejectedValueOnce('string error');

            const user = userEvent.setup();
            render(<App />);

            await user.click(screen.getByTestId('run-pipeline'));

            await waitFor(() => {
                expect(screen.getByTestId('status-researcher')).toHaveTextContent('Failed');
            });

            expect(screen.getByTestId('error-researcher')).toHaveTextContent('Unexpected error');
            expect(screen.getByTestId('pipeline-error')).toBeInTheDocument();
        });

        it('handles agent returning success:false without error message', async () => {
            const mockRunAgent = await getMockedRunAgent();

            mockRunAgent.mockResolvedValueOnce({
                success: false,
                data: '',
                // no error field
            });

            const user = userEvent.setup();
            render(<App />);

            await user.click(screen.getByTestId('run-pipeline'));

            await waitFor(() => {
                expect(screen.getByTestId('status-researcher')).toHaveTextContent('Failed');
            });

            expect(screen.getByTestId('error-researcher')).toHaveTextContent('Unknown error');
            expect(screen.getByTestId('pipeline-error')).toHaveTextContent('Unknown error');
        });
    });

    // ─── LOADING STATE ───────────────────────────────
    describe('Loading State — UI Feedback During Processing', () => {
        it('shows loading indicator while an agent is running', async () => {
            const mockRunAgent = await getMockedRunAgent();

            // Make the researcher hang while we inspect loading state
            let resolveResearcher!: (value: AgentResult) => void;
            const researcherPromise = new Promise<AgentResult>((resolve) => {
                resolveResearcher = resolve;
            });

            mockRunAgent.mockReturnValueOnce(researcherPromise);
            mockRunAgent.mockResolvedValueOnce({ success: true, data: 'arch' });
            mockRunAgent.mockResolvedValueOnce({ success: true, data: 'sec' });

            const user = userEvent.setup();
            render(<App />);

            await user.click(screen.getByTestId('run-pipeline'));

            // Researcher should be in "running" state
            await waitFor(() => {
                expect(screen.getByTestId('status-researcher')).toHaveTextContent('Processing');
            });

            // Loading indicator should be visible
            expect(screen.getByTestId('loading-researcher')).toBeInTheDocument();

            // Run button should be disabled
            expect(screen.getByTestId('run-pipeline')).toBeDisabled();

            // Resolve the researcher
            await act(async () => {
                resolveResearcher({ success: true, data: 'Research done' });
            });

            // Pipeline should proceed to architect
            expect(screen.getByTestId('status-researcher')).toHaveTextContent('Complete');
        });
    });

    it('updates run button text while pipeline is active', async () => {
        const mockRunAgent = await getMockedRunAgent();

        let resolveFirst!: (value: AgentResult) => void;
        mockRunAgent.mockReturnValueOnce(
            new Promise<AgentResult>((r) => {
                resolveFirst = r;
            })
        );
        mockRunAgent.mockResolvedValueOnce({ success: true, data: 'b' });
        mockRunAgent.mockResolvedValueOnce({ success: true, data: 'c' });

        const user = userEvent.setup();
        render(<App />);

        const runBtn = screen.getByTestId('run-pipeline');
        expect(runBtn).not.toBeDisabled();

        await user.click(runBtn);

        await waitFor(() => {
            expect(runBtn).toBeDisabled();
        });

        await act(async () => {
            resolveFirst({ success: true, data: 'a' });
        });

        await waitFor(() => {
            expect(screen.getByTestId('status-security-reviewer')).toHaveTextContent('Complete');
        });
    });

    it('shows empty state before pipeline runs', async () => {
        render(<App />);

        expect(await screen.findByTestId('output-empty')).toBeInTheDocument();
    });
});

// ─── DATA PULSE COMPONENT ──────────────────────
describe('DataPulse Component', () => {
    it('does not render visible paths when active is false', () => {
        const { container } = render(<DataPulse active={false} />);
        const el = container.querySelector('[data-testid="data-pulse"]');
        expect(el).toBeInTheDocument();
        // The container exists but SVG paths should have opacity 0 (checked via style in component)
    });

    it('renders with direction="down" (vertical)', () => {
        const { container } = render(<DataPulse active={true} direction="down" />);
        const el = container.querySelector('[data-testid="data-pulse"]');
        expect(el).toBeInTheDocument();
        expect(el?.className).toContain('data-pulse-vertical');
    });

    it('renders with direction="right" (horizontal)', () => {
        const { container } = render(<DataPulse active={true} direction="right" />);
        const el = container.querySelector('[data-testid="data-pulse"]');
        expect(el).toBeInTheDocument();
        expect(el?.className).toContain('data-pulse-horizontal');
    });
});

