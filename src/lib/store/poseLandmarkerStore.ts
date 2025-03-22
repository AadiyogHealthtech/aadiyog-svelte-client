import { writable } from 'svelte/store';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';

export const poseLandmarkerStore = writable<PoseLandmarker | undefined>(undefined);