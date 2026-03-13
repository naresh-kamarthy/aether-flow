import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test-setup.ts'],
        css: true,
        coverage: {
            provider: 'v8',
            include: [
                'src/features/agents/useOrchestrator.ts',
                'src/features/agents/AgentCard.tsx',
                'src/features/agents/DataPulse.tsx',
                'src/store/orchestratorStore.ts',
            ],
            exclude: ['src/**/*.test.*', 'src/test-setup.ts', 'src/**/index.ts'],
            thresholds: {
                lines: 100,
                functions: 100,
                branches: 100,
                statements: 100
            },
        },
    },
});
