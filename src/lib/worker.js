// src/lib/worker.js
const workerId = Math.random().toString(36).slice(2, 8);
console.log(`Worker [${workerId}]: Initializing`);
// Import Controller
import { Controller } from './yoga-tracker-1/controller/controller.js';

console.log('All worker dependencies imported');

// Worker state
let controller = null;
let operationId = 0;
let currentTime = 0;

self.onmessage = async function (e) {
    console.log(`Worker [${workerId}]: Received message`, e.data);
    const { type, op, data } = e.data;

    if (type === 'init') {
        operationId = op || operationId + 1;
        try {
            // Instantiate Controller
            const exercisePlan = {
                "Anuvittasana": {
                    "json_path": "/man_keypoints_data_normalized.json",
                    "reps": 3
                }
            };
            controller = new Controller(exercisePlan);
            console.log(`Worker [${workerId}]: Controller instantiated`, controller.currentExercise);

            // Initialize Controller
            await controller.initialize();
            console.log(`Worker [${workerId}]: Controller initialized`);

            // Start exercise sequence
            controller.startExerciseSequence();
            console.log(`Worker [${workerId}]: Exercise sequence started`);

            // Send confirmation
            self.postMessage({
                type: 'init_done',
                value: { exercise: controller.currentExercise, reps: controller.targetReps },
                operation: operationId
            });
        } catch (error) {
            console.error(`Worker [${workerId}]: Init failed`, error);
            self.postMessage({ type: 'error', error: error.message, operation: operationId });
        }
    } else if (type === 'process_frame') {
        operationId = op || operationId + 1;
        try {
            if (!controller) {
                throw new Error('Controller not initialized');
            }

            // Transform PoseLandmarker results
            const transformedResults = {
                poseLandmarks: data.results.landmarks?.[0] || []
            };
            console.log(`Worker [${workerId}]: Transformed pose results`, {
                landmarkCount: transformedResults.poseLandmarks.length,
                sample: transformedResults.poseLandmarks.slice(0, 5)
            });

            // Update controller
            controller.updateFrame(transformedResults);

            // Process exercise state
            currentTime += 1 / 60;
            const [currentPhase, exerciseName, repCount, totalReps, feedback] = controller.processExercise(currentTime);
            const score = Math.round(repCount / totalReps * 100);
            console.log(`Worker [${workerId}]: Exercise state`, {
                currentPhase,
                exerciseName,
                repCount,
                totalReps,
                score,
                feedback
            });

            // Send results back
            self.postMessage({
                type: 'frame_result',
                value: {
                    exerciseName,
                    repCount,
                    totalReps,
                    score,
                    currentPhase,
                    feedback
                },
                operation: operationId
            });
        } catch (error) {
            console.error(`Worker [${workerId}]: Frame processing failed`, error);
            self.postMessage({ type: 'error', error: error.message, operation: operationId });
        }
    } else {
        console.warn(`Worker [${workerId}]: Unknown message type`, type);
    }
};

self.onerror = function (error) {
    console.error(`Worker [${workerId}]: Unhandled error`, error);
};