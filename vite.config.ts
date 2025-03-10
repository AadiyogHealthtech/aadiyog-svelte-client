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
            external: [], // Ensure MediaPipe isn’t incorrectly externalized
            output: {
                globals: {
                    '@mediapipe/pose': 'MediaPipePose'
                }
            }
        }
    }
});