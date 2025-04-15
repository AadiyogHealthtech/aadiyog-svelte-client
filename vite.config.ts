// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    optimizeDeps: {
        include: ['@tensorflow-models/pose-detection', '@mediapipe/pose']
    },
    build: {
        commonjsOptions: {
            include: [/node_modules/]
        },
        rollupOptions: {
            external: [],
            output: {
                globals: {
                    '@mediapipe/pose': 'MediaPipePose'
                },
                manualChunks: {
                    worker: ['src/lib/worker.js'] // Updated to worker.js
                }
            }
        }
    },
    worker: {
        format: 'es'
    }
});