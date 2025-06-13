import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { cpSync } from 'fs'; // For copying JSON

export default defineConfig({
  plugins: [
    sveltekit(),
    {
      // Plugin to copy JSON file during build
      name: 'copy-json',
      writeBundle() {
        cpSync('src/lib/man_keypoints_data_normalized.json', 'dist/man_keypoints_data_normalized.json');
      }
    }
  ],
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
        // Ensure worker.js and dependencies are output to dist/lib/
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'worker.js' || assetInfo.name.endsWith('.js')) {
            return 'lib/[name][extname]';
          }
          return 'assets/[name].[hash][extname]';
        }
      }
    }
  },
  worker: {
    format: 'es' // Ensure worker is ES module
  }
});