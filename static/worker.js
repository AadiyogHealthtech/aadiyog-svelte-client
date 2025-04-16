const workerId = Math.random().toString(36).slice(2, 8);
console.log(`[Worker ${workerId}] Initializing`);
import { Controller } from '$lib/yoga-tracker-2/controller/controller.js';
console.log(`[Worker ${workerId}] Controller imported successfully`);

// Worker state
let controller = null;
let operationId = 0;
let currentTime = 0;

self.onmessage = async function (e) {
  console.log(`[Worker ${workerId}] Received message:`, e.data);
  const { type, op, data } = e.data;

  if (type === 'init') {
    operationId = op || operationId + 1;
    console.log(`[Worker ${workerId}] Processing init, operation: ${operationId}`);
    try {
      // Use the JSON data passed from the Svelte component
      const exercisePlan = {
        "Anuvittasana": {
          "json_data": data.jsonData, // JSON data containing frames and segments
          "reps": 3
        }
      };
      console.log(`[Worker ${workerId}] Exercise plan created:`, exercisePlan);
      controller = new Controller(exercisePlan);
      console.log(`[Worker ${workerId}] Controller instantiated:`, controller.currentExercise);
      await controller.initialize();
      console.log(`[Worker ${workerId}] Controller initialized successfully`);
      controller.startExerciseSequence();
      console.log(`[Worker ${workerId}] Exercise sequence started`);
      self.postMessage({
        type: 'init_done',
        value: { exercise: controller.currentExercise, reps: controller.targetReps },
        operation: operationId
      });
      console.log(`[Worker ${workerId}] Sent init_done message`);
    } catch (error) {
      console.error(`[Worker ${workerId}] Init failed:`, error);
      self.postMessage({ type: 'error', error: error.message, operation: operationId });
    }
  } else if (type === 'process_frame') {
    operationId = op || operationId + 1;
    console.log(`[Worker ${workerId}] Processing frame, operation: ${operationId}`);
    try {
      if (!controller) {
        throw new Error('Controller not initialized');
      }
      const transformedResults = {
        poseLandmarks: data.results.landmarks?.[0] || []
      };
      console.log(`[Worker ${workerId}] Transformed pose results:`, {
        landmarkCount: transformedResults.poseLandmarks.length
      });
      controller.updateFrame(transformedResults);
      currentTime += 1 / 60;
      const [currentPhase, exerciseName, repCount, totalReps, feedback] = controller.processExercise(currentTime);
      const score = Math.round(repCount / totalReps * 100);
      console.log(`[Worker ${workerId}] Exercise state:`, {
        currentPhase,
        exerciseName,
        repCount,
        totalReps,
        score
      });
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
      console.log(`[Worker ${workerId}] Sent frame_result message`);
    } catch (error) {
      console.error(`[Worker ${workerId}] Frame processing failed:`, error);
      self.postMessage({ type: 'error', error: error.message, operation: operationId });
    }
  } else {
    console.warn(`[Worker ${workerId}] Unknown message type:`, type);
  }
};

self.onerror = function (error) {
  console.error(`[Worker ${workerId}] Unhandled error:`, error);
};