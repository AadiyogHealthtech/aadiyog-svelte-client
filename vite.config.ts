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
                // Ensure worker.js is output to dist/lib/worker.js
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name === 'worker.js') {
                        return 'lib/worker.js';
                    }
                    return 'assets/[name].[hash][extname]';
                }
            }
        }
    },
    worker: {
        format: 'es'
    }
});