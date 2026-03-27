import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    root: __dirname,
    plugins: [react()],
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: './test/setup.ts',
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'test/setup.ts'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
