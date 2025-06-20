<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { FilesetResolver, PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { poseLandmarkerStore } from '$lib/store/poseLandmarkerStore';
  import target from '$lib/Images/target.svg';
  import award from '$lib/Images/award.svg';
  import pause from '$lib/Images/pause-circle.svg';
  import stop from '$lib/Images/stop-circle.svg';
  import nexticon from "$lib/Images/nexticon.svg"
  import { workoutStore} from '$lib/store/workoutStore';
  import {allWorkouts} from '$lib/store/allWorkouts';
	import { all } from '@tensorflow/tfjs-core';
	import { fetchAltExercises } from '$lib/utils/api/fetchAllExercises';
	import { workoutDetails } from '$lib/store/workoutDetailsStore';
	import { updateExerciseState } from '$lib/store/exercise';
  import { exerciseState } from '$lib/store/exercise';
	// import type { Exercise } from '$lib/utils/api/types';
	// import { fetchExercises } from '$lib/utils/api/exercises';
  // import man_keypoints from '../../../../static/assets/man_keypoints_data_normalized.json'

  // Variables
  let showTransitionLoading = false;
  let nextExerciseTitle = '';
  let transitionProgress = 0;
  const TRANSITION_DURATION = 5000; // 5 seconds
  let transitionTimeout: NodeJS.Timeout | null = null;
  let analysisPaused = false; 

  let loadingProgress = 0;
  let loadingTotal = 1; // Default to avoid division by zero
  let showProgressBar = false;
  let lastWorkerSendTime = 0;
  const WORKER_SEND_INTERVAL = 1;
  let progressValue = 0;
  let drawerState: 'partial' | 'full' = 'partial';
  let elapsedMs = 0;
  let dimensions: string = 'Waiting for camera...';
  let poseLandmarker: PoseLandmarker | undefined;
  let runningMode: 'VIDEO' = 'VIDEO';
  let webcam: HTMLVideoElement;
  let output_canvas: HTMLCanvasElement;
  let canvasCtx: CanvasRenderingContext2D;
  let animationFrame: number;
  let containerElement: HTMLDivElement;
  let stream: MediaStream | null = null;
  let isMobile: boolean = false;
  let drawingUtils: DrawingUtils | null = null;
  let worker: Worker | null = null;
  let operationId = 0;
  let controllerInitialized = false;
  let progressInterval: number | null = null;
  const PROGRESS_DURATION = 300000; // 5 minutes
  let status: 'stopped' | 'playing' | 'paused' = 'stopped';
  let sessionStartTime: number | null = null;
  let totalPausedTime = 0;
  let pauseStartTime: number | null = null;
  let userInPosition = false;
  let targetBox = { x: 0, y: 0, width: 0, height: 0 };
  let currentReps = 0;
  let currentScore = 0;
  let detectPoseActive = true;
  let lastPhase: string | null = null;
  let currentPhase: string | null = null;
  let showPhase: boolean = false;
  let phaseTimeout: NodeJS.Timeout | null = null;
  let showModal = false;
  let isInitialized = false;
  let workoutJson = null;
  let yogName = "YogaName";
  let showInstructionalModal = false; // New state to toggle the instructional modal
  let exerciseData: Array<{ name: string; reps: number; altData: any }> = [];
  let filteredExercises: Array<{ name: string; reps: number; altData: any }> = [];  
  
  const exerciseStats = {};
  // let transitionKeypoints;

  // Subscribe to workoutStore
  // Subscribe to workoutStore
  workoutStore.subscribe((workouts) => {
    workoutJson = workouts?.data[0].attributes.excercise?.data.attributes?.json;
    console.log('Workout JSON from store:', workouts);
  });

  // Reactively log allWorkouts
  $: {
    console.log("YogaSession -> allWorkouts:", $allWorkouts);
  }

  $: currentWorkout = $allWorkouts.find(workout => workout.title === yogName) || $allWorkouts[0] || null;

  console.log("--->>" , currentWorkout)

  function drawSelectedKeypointsAndLines(ctx, keypoints, indices, opts = {}) {
    const {
      color       = 'red',
      lineType    = 'solid',
      pointRadius = 5
    } = opts;

    // bail if no data or nothing to draw
    if (
      !keypoints ||
      !Array.isArray(keypoints) ||
      !indices ||
      !Array.isArray(indices) ||
      indices.length < 1
    ) {
      return;
    }

    const canvas = ctx.canvas;
    const W = canvas.width;
    const H = canvas.height;

    // --- Draw points ---
    ctx.fillStyle = color;
    for (const idx of indices) {
      const pt = keypoints[idx];
      if (!pt) continue;
      const [nx, ny] = pt;
      const cx = nx * W;
      const cy = ny * H;
      ctx.beginPath();
      ctx.arc(cx, cy, pointRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Draw connecting line ---
    if (indices.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;

      // dashed or solid?
      if (lineType === 'dotted') {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      let first = true;
      for (const idx of indices) {
        const pt = keypoints[idx];
        if (!pt) continue;
        const [nx, ny] = pt;
        const cx = nx * W;
        const cy = ny * H;
        if (first) {
          ctx.moveTo(cx, cy);
          first = false;
        } else {
          ctx.lineTo(cx, cy);
        }
      }
      ctx.stroke();

      // reset dash back to solid for future draws
      ctx.setLineDash([]);
    }
  }

  function requestExerciseName() {
    if (worker && controllerInitialized) {
      operationId++;
      worker.postMessage({
        type: 'get_exercise_name',
        operation: operationId
      });
      console.log('[Svelte] Requested exercise name from worker', operationId);
    }
  }

  const asanas = [
    { name: 'Wheel Pose', duration: '20 min', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b', reps: 3, score: 98 },
    { name: 'Warrior II', duration: '40 min', image: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8eW9nYXxlbnwwfHwwfHx8MA%3D%3D', reps: 0, score: 0 },
    { name: 'Tree Pose', duration: '15 min', image: 'https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHlvZ2F8ZW58MHx8MHx8fDA%3D', reps: 9, score: 76 },
    { name: 'Cobra Pose', duration: '25 min', image: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHlvZ2F8ZW58MHx8MHx8fDA%3D', reps: 5, score: 34 }
  ];

  const drawerTranslationMap = {
    partial: '94%',
    full: '0%'
  };

  $: drawerTranslation = drawerTranslationMap[drawerState];
  $: p = parseFloat(drawerTranslation.replace('%', ''));
  $: visibleHeightPercentage = 90 * (1 - p / 100);

  // Functions
  function handlePlay() {
    status = 'playing';
    sessionStartTime = Date.now();
    progressInterval = setInterval(updateProgress, 100);
    detectPoseActive = true;

    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    renderFrame();
  }

  function detectMobileDevice(): boolean {
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  function getConstraints(): MediaStreamConstraints {
    isMobile = detectMobileDevice();
    return {
      video: { facingMode: 'user' },
      audio: false
    };
  }

  function handleDrawerToggle() {
    drawerState = drawerState === 'partial' ? 'full' : 'partial';
  }

  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }

  async function initPoseLandmarker() {
    const wasmFileset = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
    );
    const storedLandmarker = $poseLandmarkerStore;
    if (storedLandmarker) {
      poseLandmarker = storedLandmarker;
      console.log('Using stored pose landmarker');
    } else {
      try {
        const vision = await import('@mediapipe/tasks-vision');
        poseLandmarker = await vision.PoseLandmarker.createFromOptions(
        wasmFileset,  
        {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1
        });
        poseLandmarkerStore.set(poseLandmarker);
        console.log('New pose landmarker created');
      } catch (error) {
        console.error('Error initializing pose landmarker:', error);
        dimensions = 'Pose landmarker error: ' + (error as Error).message;
      }
    }

    if (canvasCtx && !drawingUtils) {
      drawingUtils = new DrawingUtils(canvasCtx);
      console.log('DrawingUtils initialized');
    }
  }

  async function startCamera(): Promise<void> {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (!output_canvas || !canvasCtx || !webcam) {
        console.error('Canvas, context, or webcam not available');
        return;
      }

      isMobile = detectMobileDevice();
      const constraints = getConstraints();

      stream = await navigator.mediaDevices.getUserMedia(constraints).catch(err => {
        console.warn('Failed with initial constraints, falling back to basic config:', err);
        return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      });

      webcam.srcObject = stream;
      await webcam.play();
      dimensions = 'Camera active';
      console.log('Camera started, video playing');

      setupTargetBox();
      detectPoseActive = true;
      renderFrame();
    } catch (error) {
      console.error('Error accessing the camera:', error);
      dimensions = 'Camera error: ' + (error as Error).message;
    }
  }

  function setupTargetBox() {
    if (!output_canvas) return;

    const canvasWidth = output_canvas.width;
    const canvasHeight = output_canvas.height;

    targetBox = {
      x: canvasWidth * 0.02,
      y: canvasHeight * 0.08,
      width: canvasWidth * 0.96,
      height: canvasHeight * 0.90
    };
  }

  // function renderFrame() {
  //   if (!webcam || !canvasCtx || webcam.readyState !== 4 || !isInitialized) {
  //     console.log('Render frame skipped: Not ready', { readyState: webcam?.readyState, isInitialized });
  //     animationFrame = requestAnimationFrame(renderFrame);
  //     return;
  //   }

  //   const containerWidth = output_canvas.width;
  //   const containerHeight = output_canvas.height;
  //   const videoWidth = webcam.videoWidth;
  //   const videoHeight = webcam.videoHeight;

  //   const videoRatio = videoWidth / videoHeight;
  //   const containerRatio = containerWidth / containerHeight;

  //   let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

  //   if (containerRatio < 1) {
  //     drawHeight = containerHeight;
  //     drawWidth = containerHeight * videoRatio;
  //     offsetX = (containerWidth - drawWidth) / 2;
  //     offsetY = 0;
  //   } else {
  //     drawWidth = containerWidth;
  //     drawHeight = containerWidth / videoRatio;
  //     offsetY = (containerHeight - drawHeight) / 2;
  //   }

  //   canvasCtx.clearRect(0, 0, containerWidth, containerHeight);

  //   canvasCtx.save();
  //   canvasCtx.scale(-1, 1);
  //   canvasCtx.translate(-containerWidth, 0);
  //   canvasCtx.drawImage(webcam, offsetX, offsetY, drawWidth, drawHeight);

  //   canvasCtx.restore();


  //   if (!userInPosition) {
  //     drawTargetBox();
  //   }

  //   if (detectPoseActive && poseLandmarker && drawingUtils) {
  //     const timestamp = performance.now();
  //     try {
  //       const results = poseLandmarker.detectForVideo(webcam, timestamp);

  //       if (results && results.landmarks && results.landmarks.length > 0) {
  //         for (const landmarks of results.landmarks) {
  //           const scaledLandmarks = landmarks.map(landmark => {
  //             const scaledX = offsetX + landmark.x * drawWidth;
  //             const scaledY = offsetY + landmark.y * drawHeight;
  //             return { x: scaledX, y: scaledY, z: landmark.z, visibility: landmark.visibility };
  //           });

  //           // console.log("Landmarks of user are here: ", results.landmarks);
  //           checkUserPosition(scaledLandmarks);

  //           canvasCtx.save();
  //           canvasCtx.scale(-1, 1);
  //           canvasCtx.translate(-containerWidth, 0);

  //           drawingUtils.drawConnectors(scaledLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
  //             color: userInPosition ? '#00FF00' : '#FF0000',
  //             lineWidth: 4
  //           });

  //           drawingUtils.drawLandmarks(scaledLandmarks, {
  //             color: '#FFFF00',
  //             lineWidth: 8,
  //             radius: 6
  //           });

  //           const keyIndices = [
  //             11, // left shoulder
  //             12, // right shoulder
  //             23, // left hip
  //             24, // right hip
  //             25, // left knee
  //             26, // right knee
  //             27, // left ankle
  //             28, // right ankle
  //             15, // left wrist
  //             16,  // right wrist
  //             13, //left elbow
  //             14, //right elbow

  //           ];

  //           // 2. Extract the corresponding scaled landmarks:
  //           const keyLandmarks = keyIndices.map(i => scaledLandmarks[i]);

  //           // 3. Draw only those points:
  //           canvasCtx.fillStyle = 'white';
  //           keyLandmarks.forEach(({x, y}) => {
  //             canvasCtx.beginPath();
  //             canvasCtx.arc(x, y, 6, 0, 2 * Math.PI);
  //             canvasCtx.fill();
  //           });

  //           const boneConnections = [
  //             [11, 12],
  //             [11, 23],
  //             [12, 24],
  //             [23, 24],
  //             [24, 26],
  //             [26, 28],
  //             [23, 25],
  //             [25, 27],
  //             [12, 14],
  //             [14, 16],
  //             [11, 13],
  //             [13, 15]
  //           ];

  //           // 2) Style your line (white, dashed):
  //           canvasCtx.strokeStyle = 'white';
  //           canvasCtx.lineWidth   = 2;
  //           canvasCtx.setLineDash([8, 4]);  // 8px dash, 4px gap

  //           // 3) Draw them all in one path:
  //           canvasCtx.beginPath();
  //           boneConnections.forEach(([i, j]) => {
  //             const a = scaledLandmarks[i];
  //             const b = scaledLandmarks[j];
  //             canvasCtx.moveTo(a.x, a.y);
  //             canvasCtx.lineTo(b.x, b.y);
  //           });
  //           canvasCtx.stroke();

  //           // 4) Reset dash if you need solid lines later:
  //           canvasCtx.setLineDash([]);

  //           canvasCtx.restore();

  //           if (userInPosition && worker && controllerInitialized ) {
  //           // if (userInPosition && worker && controllerInitialized && 
  //           // Date.now() - lastWorkerSendTime > WORKER_SEND_INTERVAL) {
  //             operationId++;
  //             worker.postMessage({
  //               type: 'process_frame',
  //               data: { results: { landmarks: [landmarks] } },
  //               operation: operationId
  //             });
  //             console.log('Sent pose results to worker', operationId);
  //           }
  //         }
  //       } else {
  //         console.log('No landmarks detected in this frame');
  //       }
  //     } catch (error) {
  //       console.error('Error detecting pose:', error);
  //     }
  //   }

  //   animationFrame = requestAnimationFrame(renderFrame);
  // }

  function renderFrame() {
  if (!webcam || !canvasCtx || webcam.readyState !== 4 || !isInitialized) {
    console.log('Render frame skipped: Not ready', { readyState: webcam?.readyState, isInitialized });
    animationFrame = requestAnimationFrame(renderFrame);
    return;
  }

  const containerWidth = output_canvas.width;
  const containerHeight = output_canvas.height;
  const videoWidth = webcam.videoWidth;
  const videoHeight = webcam.videoHeight;

  const videoRatio = videoWidth / videoHeight;
  const containerRatio = containerWidth / containerHeight;

  let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

  if (containerRatio < 1) {
    drawHeight = containerHeight;
    drawWidth = containerHeight * videoRatio;
    offsetX = (containerWidth - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = containerWidth;
    drawHeight = containerWidth / videoRatio;
    offsetY = (containerHeight - drawHeight) / 2;
  }

  canvasCtx.clearRect(0, 0, containerWidth, containerHeight);

  // Always render camera feed (even when paused)
  canvasCtx.save();
  canvasCtx.scale(-1, 1);
  canvasCtx.translate(-containerWidth, 0);
  canvasCtx.drawImage(webcam, offsetX, offsetY, drawWidth, drawHeight);
  canvasCtx.restore();

  if (!userInPosition) {
    drawTargetBox();
  }

  // Skip pose detection and analysis when paused
  if (!analysisPaused && detectPoseActive && poseLandmarker && drawingUtils) {
    const timestamp = performance.now();
    try {
      const results = poseLandmarker.detectForVideo(webcam, timestamp);

      if (results?.landmarks?.length > 0) {
        for (const landmarks of results.landmarks) {
          const scaledLandmarks = landmarks.map(landmark => ({
            x: offsetX + landmark.x * drawWidth,
            y: offsetY + landmark.y * drawHeight,
            z: landmark.z,
            visibility: landmark.visibility
          }));

          checkUserPosition(scaledLandmarks);

          canvasCtx.save();
          canvasCtx.scale(-1, 1);
          canvasCtx.translate(-containerWidth, 0);

          drawingUtils.drawConnectors(scaledLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
            color: userInPosition ? '#00FF00' : '#FF0000',
            lineWidth: 4
          });

          drawingUtils.drawLandmarks(scaledLandmarks, {
            color: '#FFFF00',
            lineWidth: 8,
            radius: 6
          });

          // Key points rendering
          const keyIndices = [11, 12, 23, 24, 25, 26, 27, 28, 15, 16, 13, 14];
          const keyLandmarks = keyIndices.map(i => scaledLandmarks[i]);
          
          canvasCtx.fillStyle = 'white';
          keyLandmarks.forEach(({x, y}) => {
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 6, 0, 2 * Math.PI);
            canvasCtx.fill();
          });

          // Bone connections
          const boneConnections = [
            [11, 12], [11, 23], [12, 24], [23, 24],
            [24, 26], [26, 28], [23, 25], [25, 27],
            [12, 14], [14, 16], [11, 13], [13, 15]
          ];

          canvasCtx.strokeStyle = 'white';
          canvasCtx.lineWidth = 2;
          canvasCtx.setLineDash([8, 4]);
          canvasCtx.beginPath();
          
          boneConnections.forEach(([i, j]) => {
            const a = scaledLandmarks[i];
            const b = scaledLandmarks[j];
            canvasCtx.moveTo(a.x, a.y);
            canvasCtx.lineTo(b.x, b.y);
          });
          
          canvasCtx.stroke();
          canvasCtx.setLineDash([]);
          canvasCtx.restore();

          // Send to worker only when not paused
          if (userInPosition && worker && controllerInitialized) {
            operationId++;
            worker.postMessage({
              type: 'process_frame',
              data: { results: { landmarks: [landmarks] } },
              operation: operationId
            });
          }
        }
      }
    } catch (error) {
      console.error('Error detecting pose:', error);
    }
  }

  animationFrame = requestAnimationFrame(renderFrame);
}

  function drawTargetBox() {
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.fillStyle = 'rgba(255, 0, 0, 0)';
    canvasCtx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    canvasCtx.lineWidth = 2;
    canvasCtx.fillRect(targetBox.x, targetBox.y, targetBox.width, targetBox.height);
    canvasCtx.strokeRect(targetBox.x, targetBox.y, targetBox.width, targetBox.height);

    canvasCtx.fillStyle = 'white';
    canvasCtx.font = '20px Arial';
    canvasCtx.textAlign = 'center';
    canvasCtx.restore();
  }

  function checkUserPosition(landmarks) {
    if (!isInitialized) return;
    if (!landmarks || landmarks.length === 0) return;

    const keyLandmarks = [
      landmarks[0], // nose
      landmarks[11], // left shoulder
      landmarks[12], // right shoulder
      landmarks[23], // left hip
      landmarks[24], // right hip
      landmarks[27], // left ankle
      landmarks[28], // right ankle
      landmarks[15], // left wrist
      landmarks[16] // right wrist
    ];

    let pointsInBox = 0;
    const totalPoints = keyLandmarks.length;

    keyLandmarks.forEach(point => {
      if (
        point &&
        point.x >= targetBox.x &&
        point.x <= targetBox.x + targetBox.width &&
        point.y >= targetBox.y &&
        point.y <= targetBox.y + targetBox.height
      ) {
        pointsInBox++;
      }
    });

    if (pointsInBox === totalPoints && !userInPosition) {
      userInPosition = true;
      console.log('Full body in position!');
      if (status === 'stopped') {
        handlePlay();
      }
    } else if (pointsInBox < totalPoints && userInPosition) {
      userInPosition = false;
      console.log('User moved out of position!');
    }
  }

  function handleResize() {
  // For main camera canvas
  if (webcam && webcam.videoWidth && containerElement && output_canvas) {
    output_canvas.width = containerElement.clientWidth;
    output_canvas.height = containerElement.clientHeight;
    output_canvas.style.width = `${containerElement.clientWidth}px`;
    output_canvas.style.height = `${containerElement.clientHeight}px`;
    
    if (canvasCtx) {
      drawingUtils = new DrawingUtils(canvasCtx);
    }
    setupTargetBox();
  }

  // For overlay canvas
  safeWidth = window.innerWidth;
  safeHeight = window.innerHeight;
  const overlayCanvas = document.getElementById('overlayCanvas') as HTMLCanvasElement | null;
  if (overlayCanvas) {
    overlayCanvas.width = safeWidth;
    overlayCanvas.height = safeHeight;
    if (transitionKeypoints) drawTransitionKeypoints();
  }
}

  function handlePause() {
    if (status === 'playing') {
      status = 'paused';
      pauseStartTime = Date.now();
      if (progressInterval) clearInterval(progressInterval);
    } else if (status === 'paused') {
      status = 'playing';
      if (pauseStartTime) {
        totalPausedTime += Date.now() - pauseStartTime;
        pauseStartTime = null;
      }
      progressInterval = setInterval(updateProgress, 100);
    }
  }

  function handleStop() {
    showModal = true;
  }

  function confirmStop() {
    status = 'stopped';
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = null;
    progressValue = 0;
    elapsedMs = 0;
    totalPausedTime = 0;
    sessionStartTime = null;
    pauseStartTime = null;
    userInPosition = false;
    goto('/yoga/3');
    showModal = false;
  }

  function cancelStop() {
    showModal = false;
  }

  function updateProgress() {
    if (status !== 'playing' || !sessionStartTime) return;
    const now = Date.now();
    elapsedMs = now - sessionStartTime - totalPausedTime;
    progressValue = Math.min((elapsedMs / PROGRESS_DURATION) * 100, 100);
    if (progressValue >= 100) handleStop();
  }

  function handleBack() {
    goto('/home');
  }

  function handleVideoButtonClick() {
    showInstructionalModal = true; // Show the instructional modal
  }

  function closeInstructionalModal() {
    showInstructionalModal = false; // Close the instructional modal
  }
  let transitionKeypoints:any = null;
  let canvasContext: CanvasRenderingContext2D | null = null;
  let safeWidth = window.innerWidth;
  let safeHeight = window.innerHeight;

  // Convert normalized coords to pixels and draw green points
  // function drawTransitionKeypoints() {
  //   if (!transitionKeypoints || !canvasContext) return;

  //   // Clear canvas (but keep it transparent)
  //   canvasContext.clearRect(0, 0, safeWidth, safeHeight);

  //   // Define keypoints (adjust indices based on your model)
  //   const keypointIndices = {
  //     leftWrist: transitionKeypoints[15],
  //     rightWrist: transitionKeypoints[16],
  //     leftShoulder: transitionKeypoints[11],
  //     rightShoulder: transitionKeypoints[12],
  //     leftHip: transitionKeypoints[23],
  //     rightHip: transitionKeypoints[24],
  //     leftKnee: transitionKeypoints[25],
  //     rightKnee: transitionKeypoints[26],
  //     leftAnkle: transitionKeypoints[27],
  //     rightAnkle: transitionKeypoints[28],
  //   };

  //   // Styling for keypoints
  //   canvasContext.fillStyle = "#00FF00"; // Bright green
  //   canvasContext.strokeStyle = "#000000"; // Black outline for contrast
  //   canvasContext.lineWidth = 1;

  //   // Draw each point
  //   Object.entries(keypointIndices).forEach(([name, point]) => {
  //     if (!point) return;

  //     // Convert normalized (-1 to 1) to pixel coordinates
  //     const x = (point.x + 1) * safeWidth / 2;
  //     const y = (point.y + 1) * safeHeight / 2;

  //     // Draw a filled circle with outline
  //     canvasContext.beginPath();
  //     canvasContext.arc(x, y, 8, 0, Math.PI * 2); // Larger dot (8px radius)
  //     canvasContext.fill();
  //     canvasContext.stroke();

  //     // Optional: Label the point (if needed)
  //     canvasContext.fillStyle = "#FFFFFF"; // White text
  //     canvasContext.font = "12px Arial";
  //     canvasContext.fillText(name, x + 12, y - 5);
  //     canvasContext.fillStyle = "#00FF00"; // Reset to green
  //   });
  // }

//   function drawTransitionKeypoints() {
//   if (!transitionKeypoints || !canvasContext) return;

//   // Clear overlay canvas (transparent)
//   canvasContext.clearRect(0, 0, safeWidth, safeHeight);

//   // Style for transition points
//   canvasContext.fillStyle = "#00AAFF"; // Blue
//   canvasContext.strokeStyle = "#FFFFFF"; // White outline
//   canvasContext.lineWidth = 2;

//   // Draw all transition points
//   transitionKeypoints.forEach(([nx, ny]) => {
//     // Convert normalized to screen coordinates (no mirroring on overlay)
//     const x = nx * safeWidth;
//     const y = ny * safeHeight;

//     // Draw point
//     canvasContext.beginPath();
//     canvasContext.arc(x, y, 6, 0, Math.PI * 2);
//     canvasContext.fill();
//     canvasContext.stroke();
//   });

//   // Draw connections between key points
//   const keyIndices = [11, 12, 23, 24]; // Shoulders and hips
//   const keyPoints = keyIndices.map(i => transitionKeypoints[i]);

//   canvasContext.strokeStyle = "#00AAFF";
//   canvasContext.lineWidth = 3;
//   canvasContext.setLineDash([5, 3]);
//   canvasContext.beginPath();

//   // Draw connections between shoulders and hips
//   if (keyPoints[0] && keyPoints[2]) { // Left shoulder to left hip
//     canvasContext.moveTo(keyPoints[0][0] * safeWidth, keyPoints[0][1] * safeHeight);
//     canvasContext.lineTo(keyPoints[2][0] * safeWidth, keyPoints[2][1] * safeHeight);
//   }
//   if (keyPoints[1] && keyPoints[3]) { // Right shoulder to right hip
//     canvasContext.moveTo(keyPoints[1][0] * safeWidth, keyPoints[1][1] * safeHeight);
//     canvasContext.lineTo(keyPoints[3][0] * safeWidth, keyPoints[3][1] * safeHeight);
//   }

//   canvasContext.stroke();
//   canvasContext.setLineDash([]);
// }

function drawTransitionKeypoints() {
  if (!transitionKeypoints || !canvasContext) return;

  // Clear overlay canvas (transparent)
  canvasContext.clearRect(0, 0, safeWidth, safeHeight);

  // Define the connections we want to draw
  const connections = [
    [11, 12], // Shoulders
    [23, 24], // Hips
    [11, 23], // Left shoulder to left hip
    [12, 24], // Right shoulder to right hip
    [23, 25], [25, 27], // Left leg
    [24, 26], [26, 28], // Right leg
    [11, 13], [13, 15], // Left arm
    [12, 14], [14, 16]  // Right arm
  ];

  // Style for transition visualization
  const transitionStyle = {
    lineColor: '#00AAFF', // Blue for transition lines
    lineWidth: 3,
    lineDash: [5, 3], // Dashed lines
    pointColor: '#00AAFF', // Blue points
    pointRadius: 5,
    pointOutline: '#FFFFFF', // White outline
    pointOutlineWidth: 1
  };

  // First draw all the connecting lines
  canvasContext.strokeStyle = transitionStyle.lineColor;
  canvasContext.lineWidth = transitionStyle.lineWidth;
  canvasContext.setLineDash(transitionStyle.lineDash);

  canvasContext.beginPath();
  connections.forEach(([i, j]) => {
    const start = transitionKeypoints[i];
    const end = transitionKeypoints[j];
    
    if (start && end) {
      const startX = start[0] * safeWidth;
      const startY = start[1] * safeHeight;
      const endX = end[0] * safeWidth;
      const endY = end[1] * safeHeight;
      
      canvasContext.moveTo(startX, startY);
      canvasContext.lineTo(endX, endY);
    }
  });
  canvasContext.stroke();

  // Then draw all the points in the connections
  const pointsToDraw = new Set();
  connections.forEach(([i, j]) => {
    pointsToDraw.add(i);
    pointsToDraw.add(j);
  });

  Array.from(pointsToDraw).forEach(i => {
    const point = transitionKeypoints[i];
    if (!point) return;

    const [nx, ny] = point;
    const x = nx * safeWidth;
    const y = ny * safeHeight;

    // Draw point with outline
    canvasContext.fillStyle = transitionStyle.pointColor;
    canvasContext.strokeStyle = transitionStyle.pointOutline;
    canvasContext.lineWidth = transitionStyle.pointOutlineWidth;
    
    canvasContext.beginPath();
    canvasContext.arc(x, y, transitionStyle.pointRadius, 0, Math.PI * 2);
    canvasContext.fill();
    canvasContext.stroke();
  });

  // Reset line dash
  canvasContext.setLineDash([]);
}


  onMount(() => {
  if (!browser) return;
  const canvas = document.getElementById('overlayCanvas') as HTMLCanvasElement | null;
    if (canvas) {
      canvasContext = canvas.getContext('2d');
      handleResize(); // Initialize size
    }
  let unsubscribe: () => void;

  (async () => {
    // 1. Get exercise IDs from store
    let titlesToFetch:string[]=[]
    unsubscribe = workoutDetails.subscribe((data) => {
      if (data?.exercises) {
        titlesToFetch = data.exercises.data.map((ex) => ex.attributes.title.trim());
        // storeExercises = data.exercises.data;
        console.log("titles to fetch",titlesToFetch)
      }
    });

    // 2. Fetch all exercises
    let fetchedCount = 0;
    let totalCount = 0;
    exerciseData = await fetchAltExercises(titlesToFetch, (count, total) => {
    loadingProgress = count;
    loadingTotal = total;
    showProgressBar = true
    
    fetchedCount = count;
    totalCount = total;
    console.log(`Progress: ${count}/${total}`);
    if (count === total) {
      setTimeout(() => showProgressBar = false, 500);
    }
});
filteredExercises = exerciseData;
    // console.log('[Svelte] Filtered exercises:', exerciseData);
    // const titlesToMatch = storeExercises.map((ex) => ex.attributes.title.trim().toLowerCase());

    // 3. Filter only exercises matching the workout
  //   filteredExercises = exerciseData.filter((ex) =>
  //   // titlesToMatch.includes(ex.name.trim().toLowerCase())
  // );

  console.log('[Svelte] Filtered exercises:', filteredExercises);
    // 4. DOM Setup
    webcam = document.getElementById('webcam') as HTMLVideoElement;
    output_canvas = document.getElementById('output_canvas') as HTMLCanvasElement;
    canvasCtx = output_canvas.getContext('2d')!;
    containerElement = document.getElementById('webcam-container') as HTMLDivElement;

    output_canvas.width = containerElement.clientWidth;
    output_canvas.height = containerElement.clientHeight;
    output_canvas.style.width = `${containerElement.clientWidth}px`;
    output_canvas.style.height = `${containerElement.clientHeight}px`;

    // 5. Worker setup
    const workerPath = import.meta.env.DEV
      ? 'http://localhost:5173/worker.js'
      : 'https://aadiyog-client.netlify.app/worker.js';

    try {
      worker = new Worker(workerPath, { type: 'module' });
      console.log('[Svelte] Worker created');
    } catch (error) {
      console.error('[Svelte] Worker creation failed:', error);
      dimensions = `Worker creation error: ${error.message}`;
    }

    if (worker) {
      
      worker.onmessage = (e) => {
        if (analysisPaused && !['transition_keypoints', 'error'].includes(e.data.type)) {
    return;
  }
        console.log('[Svelte] Worker message received:', e.data); 
        const { type, value, operation } = e.data;
        if (operation < operationId && type !== 'error') return;
        
        const cw = canvasCtx.canvas.width;
        const ch = canvasCtx.canvas.height;
        canvasCtx.fillStyle    = 'yellow';
        canvasCtx.font         = '30px Arial';
        canvasCtx.textAlign    = 'center';
        canvasCtx.textBaseline = 'middle';
        canvasCtx.fillText(`Reps: ${value.repCount}`,   cw/2, ch/2 - 20);
        
        switch (type) {
          case 'init_done':
            controllerInitialized = true;
            yogName = value.exerciseName;

            dimensions = `Camera active, Controller: ${value.exercise} (${value.reps} reps)`;
            break;
          case 'frame_result':

            currentReps = value.repCount;
            currentScore = value.score;
            yogName = value.currentExerciseName;
            if (!exerciseStats[currentExerciseName]) {
              exerciseStats[currentExerciseName] = {
                rep_done: 0,
                score: 0
              };
            }

            exerciseStats[currentExerciseName].rep_done = currentReps;
            exerciseStats[currentExerciseName].score    = currentScore;
            if (value.currentPhase && value.currentPhase !== lastPhase) {
              lastPhase = value.currentPhase;
              currentPhase = value.currentPhase;
              showPhase = true;
              if (phaseTimeout) clearTimeout(phaseTimeout);
              phaseTimeout = setTimeout(() => {
                showPhase = false;
              }, 3000);
            }
            break;
          case 'exercise_name_result':
            yogName = value.exerciseName;
            break;
          case 'transitioning_excercise':
            console.log('Transitioning to ' + value.nextAssan);
            nextExerciseTitle = value.nextAssan;
            showTransitionLoading = true;
            analysisPaused = true; // Pause analysis
            
            if (transitionTimeout) clearTimeout(transitionTimeout);
            transitionTimeout = setTimeout(() => {
              showTransitionLoading = false;
              analysisPaused = false; // Resume analysis
            }, TRANSITION_DURATION);
            break;
          case 'exercise_changed':
              console.log('Transitioning to ' + value.newExercise);
              nextExerciseTitle = value.newExercise;
              showTransitionLoading = true;
              analysisPaused = true; // Pause analysis during transition
              
              if (transitionTimeout) clearTimeout(transitionTimeout);
              transitionTimeout = setTimeout(() => {
                showTransitionLoading = false;
                analysisPaused = false; // Resume analysis
              }, TRANSITION_DURATION);
              break;
          case 'transition_keypoints' :{
            // 1. Get canvas and video dimensions
            const containerWidth = output_canvas.width;
            const containerHeight = output_canvas.height;
            const videoWidth = webcam.videoWidth;
            const videoHeight = webcam.videoHeight;

            // 2. Calculate scaling factors for proper aspect ratio
            const videoRatio = videoWidth / videoHeight;
            const containerRatio = containerWidth / containerHeight;
            let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

            if (containerRatio < 1) {
              drawHeight = containerHeight;
              drawWidth = containerHeight * videoRatio;
              offsetX = (containerWidth - drawWidth) / 2;
              offsetY = 0;
            } else {
              drawWidth = containerWidth;
              drawHeight = containerWidth / videoRatio;
              offsetY = (containerHeight - drawHeight) / 2;
            }

            // 3. Store the transition keypoints
            transitionKeypoints = value;

            // 4. Scale landmarks to canvas coordinates
            const scaledLandmarks = transitionKeypoints.map(([nx, ny, nz]) => ({
              x: offsetX + nx * drawWidth,
              y: offsetY + ny * drawHeight,
              z: nz,
              visibility: 1 // Assume visible for transition points
            }));

            // 5. Check user position against these keypoints
            checkUserPosition(scaledLandmarks);

            // 6. Draw on main canvas (mirrored)
            canvasCtx.save();
            canvasCtx.scale(-1, 1);
            canvasCtx.translate(-containerWidth, 0);

            // Draw connectors with a distinct color for transition
            drawingUtils.drawConnectors(
              scaledLandmarks,
              PoseLandmarker.POSE_CONNECTIONS,
              {
                color: '#00AAFF', // Blue color for transition
                lineWidth: 4
              }
            );

            // Draw landmarks with distinct style
            drawingUtils.drawLandmarks(scaledLandmarks, {
              color: '#00AAFF',
              lineWidth: 4,
              radius: 4
            });

            // Highlight key points
            const keyIndices = [11, 12, 23, 24, 25, 26, 27, 28, 15, 16, 13, 14];
            const keyLandmarks = keyIndices.map(i => scaledLandmarks[i]);

            canvasCtx.fillStyle = '#FFFFFF';
            keyLandmarks.forEach(({ x, y }) => {
              canvasCtx.beginPath();
              canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
              canvasCtx.fill();
            });

            // Draw dashed connections
            const boneConnections = [
              [11, 12], [11, 23], [12, 24], [23, 24],
              [24, 26], [26, 28], [23, 25], [25, 27],
              [12, 14], [14, 16], [11, 13], [13, 15]
            ];

            canvasCtx.strokeStyle = '#FFFFFF';
            canvasCtx.lineWidth = 2;
            canvasCtx.setLineDash([5, 3]);
            canvasCtx.beginPath();
            
            boneConnections.forEach(([i, j]) => {
              const a = scaledLandmarks[i];
              const b = scaledLandmarks[j];
              if (a && b) {
                canvasCtx.moveTo(a.x, a.y);
                canvasCtx.lineTo(b.x, b.y);
              }
            });
            
            canvasCtx.stroke();
            canvasCtx.setLineDash([]);
            canvasCtx.restore();

            // 7. Update overlay canvas dimensions and draw
            safeWidth = containerWidth;
            safeHeight = containerHeight;
            drawTransitionKeypoints();

            console.log('Transition keypoints displayed:', transitionKeypoints);
            break;
          }
          case 'holding_keypoints' :{
            // 1. Get canvas and video dimensions
            const containerWidth = output_canvas.width;
            const containerHeight = output_canvas.height;
            const videoWidth = webcam.videoWidth;
            const videoHeight = webcam.videoHeight;

            // 2. Calculate scaling factors for proper aspect ratio
            const videoRatio = videoWidth / videoHeight;
            const containerRatio = containerWidth / containerHeight;
            let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

            if (containerRatio < 1) {
              drawHeight = containerHeight;
              drawWidth = containerHeight * videoRatio;
              offsetX = (containerWidth - drawWidth) / 2;
              offsetY = 0;
            } else {
              drawWidth = containerWidth;
              drawHeight = containerWidth / videoRatio;
              offsetY = (containerHeight - drawHeight) / 2;
            }

            // 3. Store the transition keypoints
            transitionKeypoints = value;

            // 4. Scale landmarks to canvas coordinates
            const scaledLandmarks = transitionKeypoints.map(([nx, ny, nz]) => ({
              x: offsetX + nx * drawWidth,
              y: offsetY + ny * drawHeight,
              z: nz,
              visibility: 1 // Assume visible for transition points
            }));

            // 5. Check user position against these keypoints
            checkUserPosition(scaledLandmarks);

            // 6. Draw on main canvas (mirrored)
            canvasCtx.save();
            canvasCtx.scale(-1, 1);
            canvasCtx.translate(-containerWidth, 0);

            // Draw connectors with a distinct color for transition
            drawingUtils.drawConnectors(
              scaledLandmarks,
              PoseLandmarker.POSE_CONNECTIONS,
              {
                color: '#00AAFF', // Blue color for transition
                lineWidth: 4
              }
            );

            // Draw landmarks with distinct style
            drawingUtils.drawLandmarks(scaledLandmarks, {
              color: '#00AAFF',
              lineWidth: 4,
              radius: 4
            });

            // Highlight key points
            const keyIndices = [11, 12, 23, 24, 25, 26, 27, 28, 15, 16, 13, 14];
            const keyLandmarks = keyIndices.map(i => scaledLandmarks[i]);

            canvasCtx.fillStyle = '#FFFFFF';
            keyLandmarks.forEach(({ x, y }) => {
              canvasCtx.beginPath();
              canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
              canvasCtx.fill();
            });

            // Draw dashed connections
            const boneConnections = [
              [11, 12], [11, 23], [12, 24], [23, 24],
              [24, 26], [26, 28], [23, 25], [25, 27],
              [12, 14], [14, 16], [11, 13], [13, 15]
            ];

            canvasCtx.strokeStyle = '#FFFFFF';
            canvasCtx.lineWidth = 2;
            canvasCtx.setLineDash([5, 3]);
            canvasCtx.beginPath();
            
            boneConnections.forEach(([i, j]) => {
              const a = scaledLandmarks[i];
              const b = scaledLandmarks[j];
              if (a && b) {
                canvasCtx.moveTo(a.x, a.y);
                canvasCtx.lineTo(b.x, b.y);
              }
            });
            
            canvasCtx.stroke();
            canvasCtx.setLineDash([]);
            canvasCtx.restore();

            // 7. Update overlay canvas dimensions and draw
            safeWidth = containerWidth;
            safeHeight = containerHeight;
            drawTransitionKeypoints();

            console.log('Transition keypoints displayed:', transitionKeypoints);
            break;
          }

          case 'workout_complete':
            const {
              total_time,
              relaxation_time,
              transition_time,
              holding_time
            } = value;

            // 2) merge them into your existing exerciseStats map
            exerciseStats.total_time      = total_time;
            exerciseStats.holding_time    = holding_time;
            exerciseStats.relaxation_time = relaxation_time;
            exerciseStats.transition_time = transition_time;

          case 'error':
            console.error('[Svelte] Worker error:', error);
            dimensions = `Worker error: ${error}`;
            break;
        }
      };

      worker.onerror = (err) => {
        console.error('[Svelte] Worker error event:', err);
        dimensions = `Worker error: ${err.message}`;
      };

      // 6. Send filtered data to worker
      if (filteredExercises.length > 0) {
        operationId++;
        try {
          worker.postMessage({
            type: 'init',
            data: { exerciseData: filteredExercises },
            operation: operationId
          });
          console.log('[Svelte] Sent filtered exercises to worker');
        } catch (error) {
          console.error('[Svelte] Failed to send init message:', error);
          dimensions = `Worker postMessage error: ${error.message}`;
        }
      } else {
        console.warn('[Svelte] No filtered exercises to send to worker');
      }
    }

    // 7. Start media + pose
    await initPoseLandmarker();
    await startCamera();
    isInitialized = true;

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 500);
    });
  })();

  return () => {
    if (unsubscribe) unsubscribe();
  };
});

const jsonDump = JSON.stringify(exerciseStats, null, 2);
console.log(jsonDump);

  onDestroy(() => {
    if (!browser) return;
    if (transitionTimeout) clearTimeout(transitionTimeout);
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (stream) stream.getTracks().forEach(track => track.stop());
    if (progressInterval) clearInterval(progressInterval);
    if (worker) {
      console.log('Terminating worker');
      worker.terminate();
      worker = null;
    }
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    if (phaseTimeout) clearTimeout(phaseTimeout);
  });
</script>

<div class="h-surface flex flex-col overflow-hidden relative w-full">
  <!-- Add this near your other overlays -->
{#if showTransitionLoading}
<div class="fixed inset-0 flex items-center justify-center z-[9998] bg-black bg-opacity-70">
  <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center animate-fade-in">
    <div class="animate-pulse mb-6">
      <svg class="w-16 h-16 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    </div>
    <h3 class="text-xl font-medium mb-2">Preparing Next Exercise</h3>
    <h2 class="text-3xl font-bold text-blue-600 mb-6">{nextExerciseTitle}</h2>
    <div class="w-full bg-gray-200 rounded-full h-2">
      <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
           style={`width: ${(elapsedMs % TRANSITION_DURATION) / TRANSITION_DURATION * 100}%`}>
      </div>
    </div>
  </div>
</div>
{/if}

  {#if showProgressBar}
  <div class="fixed top-0 inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-80 shadow-xl">
      <div class="flex items-center justify-center mb-4">
        <svg class="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <div class="text-center mb-2 font-medium text-gray-700">
        Loading Exercises...
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
          style={`width: ${(loadingProgress / loadingTotal) * 100}%`}
        ></div>
      </div>
      <div class="flex justify-between mt-2 text-sm text-gray-600">
        <span>{loadingProgress}/{loadingTotal} loaded</span>
        <span>{Math.round((loadingProgress / loadingTotal) * 100)}%</span>
      </div>
    </div>
  </div>
{/if}
  <div id="webcam-container" class="relative bg-black overflow-hidden" bind:this={containerElement}>
    <!-- Existing webcam and canvas setup (unchanged) -->
    <video id="webcam" autoplay playsinline muted style="display: none;"></video>
    <canvas id="output_canvas" class="pointer-events-none"></canvas>
    <canvas id="overlayCanvas" class="pointer-events-none absolute top-0 left-0 z-10"></canvas>
    <!-- Loading animation (unchanged) -->
    {#if dimensions === 'Waiting for camera...' }
      <div class="loading-container">
        <div class="loading-text">Get ready...</div>
        <div class="loading-bar">
          <div class="loading-bar-fill"></div>
        </div>
      </div>
    {/if}

    <!-- Control buttons (unchanged except for image source) -->
{#if !userInPosition && !dimensions.startsWith('Camera error') && !dimensions.startsWith('Pose landmarker error')}
<div
  class="absolute left-1/2 transform -translate-x-1/2 z-20 flex justify-between items-center w-full px-4"
  style="bottom: 5%; 
       max-width: {isInitialized ? targetBox.width : '90%'};"
>
  <!-- Buttons remain the same -->
  <button on:click={handleVideoButtonClick} class="h-16 w-16 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500">
    <img
      src={currentWorkout?.src || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b'}
      alt="Media button"
      class="h-full w-full object-cover"
    />
  </button>

  <button on:click={handlePlay} class="bg-white p-4 rounded-full relative shadow-lg focus:outline-none hover:bg-gray-100">
    <svg class="w-10 h-10 text-black" viewBox="0 0 24 24">
      <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
    </svg>
  </button>
  <button on:click={handleStop} class="bg-white p-4 rounded-full shadow-lg focus:outline-none hover:bg-gray-100">
    <img src={stop} alt="stop" class="w-6 h-6 z-10">
  </button>
</div>
{/if}

    <!-- User in position UI (unchanged) -->
    {#if userInPosition}
      <div class="user-in-position-container">
        <div class="score-reps-container">
          <div class="flex items-center px-4 py-3 rounded-lg border-2 border-orange-500 bg-white bg-opacity-80">
            <div class="flex flex-col mr-8">
              <div class="text-3xl"><img src={target} alt="Target" /></div>
              <div class="text-xl text-gray-800">Reps</div>
            </div>
            <div class="text-5xl ml-4 text-gray-800">{currentReps}</div>
            <!-- <div class="text-5xl ml-4 text-gray-800">
              {$exerciseState.reps} 
            </div> -->
          </div>
          <div class="flex items-center border-2 border-orange-400 px-2 py-1 rounded-lg bg-white bg-opacity-80">
            <div class="flex flex-col mr-8">
              <div class="text-3xl"><img src={award} alt="Award" /></div>
              <div class="text-xl text-gray-800">Score</div>
            </div>
            <div class="text-5xl ml-2 text-gray-800">{currentScore}</div>
          </div>
        </div>

        <div class="progress-container bg-gray-100">
          <div class="yoga-name">{yogName}</div>
          <div class="custom-progress-bar">
            <div class="progress-bg">
              <div class="progress-fill" style="width: {progressValue}%" />
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if showPhase && currentPhase}
      <div class="phase-display">
        {currentPhase}
      </div>
    {/if}
  </div>
  
  <div style="height: {visibleHeightPercentage}%; transition: height 300ms;"></div>

  <!-- Drawer: Use allWorkouts instead of hardcoded asanas -->
  <div
    class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 w-full border-t-1 border-b flex flex-col z-30"
    style="transform: translateY({drawerTranslation}); height: 90%;"
  >
    <div class="w-full h-8 flex justify-center items-center cursor-pointer" on:click={handleDrawerToggle}>
      <div class="w-32 h-1 bg-gray-700 rounded-full"></div>
    </div>

    {#if drawerState === 'full'}
      <div class="flex flex-col flex-grow overflow-hidden items-center z-60">
        <h2 class="text-xl  mb-4 mt-2 font-sans border-b-2  w-[90vw] border-gray-200 py-2">
          {$allWorkouts.length} Asanas Remaining
        </h2>
        <div class=" flex-grow overflow-y-auto">
          {#each $allWorkouts as workout}
            <div class="flex  space-x-4 p-2 px-4 rounded-lg items-center min-w-[100vw]" >
              <img src={workout.src} alt={workout.title} class="w-28 h-28 object-cover rounded-md" />
              <div class="flex-grow">
                <h3 class="text-md font-medium">{workout.description}</h3>
                <div class="flex flex-col text-gray-600">
                  <span class="text-md mt-1 mb-3">{workout.extraData?.reps || 3} reps</span>
                  <span class="text-md">{workout.extraData?.duration || '20 min'}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Stop confirmation modal (unchanged) -->
  {#if showModal}
    <div class="fixed inset-0 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h2 class="text-xl font-bold mb-4">Confirm Stop</h2>
        <p class="mb-4">Do you want to finish the exercise?</p>
        <div class="flex justify-end space-x-4">
          <button on:click={cancelStop} class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
          <button on:click={confirmStop} class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Yes</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Instructional Modal: Use allWorkouts data -->
  {#if showInstructionalModal}
    <div class="fixed inset-0 flex items-center justify-center z-50 p-2 mb-8">
      <div class="bg-white p-6 shadow-lg w-[96vw] h-[92vh] overflow-hidden instructional-modal flex flex-col">
        <!-- Scrollable content -->
        <div class="flex-grow overflow-y-auto hide-scrollbar">
          <video
            src={currentWorkout?.videoUrl || 'https://example.com/anuvittasana-instructional-video.mp4'}
            controls
            autoplay
            class="w-full h-48 rounded-lg mb-8 border-2 border-orange-500"
          ></video>
          <div class="w-full flex flex-row justify-between mb-6 items-center">
            <h2 class="text-2xl mb-4">{currentWorkout?.title || yogName}</h2>
            <div>
              <div class="text-gray-600">{currentWorkout?.extraData?.reps || 3} reps</div>
              <div class="text-gray-600">{currentWorkout?.extraData?.duration || '20 min'}</div>
            </div>
          </div>

          <div class="w-full pb-20 font-sans">
            <!-- Instructional Text -->
            <div class="text-gray-800">
              {#if currentWorkout?.extraData}
                {#each currentWorkout.extraData.sections as section}
                  <h3 class="text-2xl mb-2">{section.section_title}:</h3>
                  <ol class="list-decimal pl-5 mb-6 text-2xl ">
                    {#each section.items as item}
                      <li >{item}</li>
                    {/each}
                  </ol>
                {/each}
              {:else}
                <h3 class="text-lg font-semibold mb-2">Instructions:</h3>
                <p>No detailed instructions available for {currentWorkout?.title || yogName}.</p>
              {/if}
            </div>
          </div>
        </div>

        <!-- Fixed buttons at the bottom -->
        <div class="fixed bottom-4 left-0 right-0 flex justify-between items-center px-4 py-2 bg-gray-500">
          <button on:click={handleVideoButtonClick} class="h-16 w-16 overflow-hidden focus:outline-none bg-white shadow-xl hover:bg-gray-100 rounded-full">
            <img
              src={nexticon}
              alt="Next button"
              class="h-full w-full object-cover rounded-full"
            />
          </button>

          <button on:click={closeInstructionalModal} class="bg-white p-4 rounded-full shadow-xl focus:outline-none hover:bg-gray-100">
            <svg class="w-10 h-10 text-black" viewBox="0 0 24 24">
              <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
            </svg>
          </button>
          <button on:click={handleStop} class="bg-white p-4 rounded-full shadow-xl focus:outline-none hover:bg-gray-100">
            <img src={stop} alt="" class="w-6 h-6">
          </button>
        </div>
      </div>
    </div>
  {/if}
  <!-- <canvas 
  id="overlayCanvas" 
  class="absolute top-0 left-0 pointer-events-none z-10"
  style="width: 100%; height: 100%;"
></canvas> -->
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  

  :global(body) {
    overflow: hidden;
    background-color: #000;
    height: 100vh;
    width: 100vw;
    margin: 0;
  }

 
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  .animate-pulse {
    animation: pulse 1.5s infinite;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }


  .hide-scrollbar {
    -ms-overflow-style: none; /* Internet Explorer 10+ */
    scrollbar-width: none; /* Firefox */
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
  }

  .h-surface {
    height: 100vh;
    width: 100vw;
  }

  #webcam-container {
    width: 100vw;
    height: 100vh;
    position: relative;
    overflow: hidden;
    background-color: #000;
  }

  #output_canvas {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }

  .user-in-position-container {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    pointer-events: none;
  }

  .user-in-position-container > * {
    pointer-events: auto;
  }

  .score-reps-container {
    width: 100%;
    padding: 16px;
    display: flex;
    justify-content: space-between;
  }

  .anuvittasana-text {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: 20px;
    text-align: center;
    background-color: rgba(77, 74, 74, 0.5);
    padding: 4px 2px;
    border-radius: 8px;
    width: 100vw;
  }

  .suggestion-text {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 15px;
    text-align: center;
    background-color: rgba(233, 229, 229, 0.8);
    padding: 4px 2px;
    border-radius: 4px;
    width: 95vw;
    font-family: sans-serif;
    color: rgb(69, 69, 69);
  }

  .progress-container {
    width: 100%;
    padding: 16px;
    background-color: rgba(40, 39, 39, 0.5);
  }

  .yoga-name {
    font-size: 20px;
    font-weight: bold;
    color: #f3ecec;
    text-align: center;
    margin-bottom: 8px;
  }

  .custom-progress-bar {
    width: 100%;
    background-color: #fff;
    border-radius: 16px;
    overflow: hidden;
    height: 20px;
    position: relative;
    border: 1px solid #ccc;
  }

  .progress-bg {
    width: 100%;
    height: 100%;
    background-color: #fff;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: #32cd32;
    transition: width 0.3s ease-in-out;
  }

  .loading-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 20;
  }

  .loading-text {
    color: white;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 16px;
    text-align: center;
  }

  .loading-bar {
    width: 200px;
    height: 20px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    overflow: hidden;
  }

  .loading-bar-fill {
    width: 0;
    height: 100%;
    background-color: #32cd32;
    animation: loading 2s infinite ease-in-out;
  }

  @keyframes loading {
    0% {
      width: 0;
    }
    50% {
      width: 100%;
    }
    100% {
      width: 0;
    }
  }

  .fixed {
    position: fixed;
  }

  .inset-0 {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  .z-50 {
    z-index: 50;
  }

  .flex {
    display: flex;
  }

  .items-center {
    align-items: center;
  }

  .justify-center {
    justify-content: center;
  }

  .bg-black {
    background-color: #000;
  }

  .bg-opacity-50 {
    opacity: 0.5;
  }

  .bg-white {
    background-color: #fff;
  }

  .p-6 {
    padding: 1.5rem;
  }

  .rounded-lg {
    border-radius: 0.5rem;
  }

  .shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .text-xl {
    font-size: 1.25rem;
  }

  .font-bold {
    font-weight: 700;
  }

  .mb-4 {
    margin-bottom: 1rem;
  }

  .justify-end {
    justify-content: flex-end;
  }

  .space-x-4 > :not([hidden]) ~ :not([hidden]) {
    margin-left: 1rem;
  }

  .px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .py-2 {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .bg-gray-300 {
    background-color: #d1d5db;
  }

  .hover\:bg-gray-400:hover {
    background-color: #9ca3af;
  }

  .bg-red-500 {
    background-color: #ef4444;
  }

  .text-white {
    color: #fff;
  }

  .hover\:bg-red-600:hover {
    background-color: #dc2626;
  }

  .rounded {
    border-radius: 0.25rem;
  }

  .phase-display {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 16px 32px;
    border-radius: 8px;
    font-size: 24px;
    font-weight: bold;
    text-transform: capitalize;
    z-index: 20;
    pointer-events: none;
  }

  /* Instructional Modal Styles */
  .instructional-modal {
    position: relative;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: white;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    padding: 16px;
    max-width: 100%;
    max-height: 100vh;
    overflow-y: auto;
    z-index: 60;
    box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(100%);
    animation: slideUp 0.3s ease-out forwards;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .instructional-modal video {
    width: 100%;
    max-height: 200px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .instructional-modal h2 {
    font-size: 20px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 16px;
  }

  .instructional-modal h3 {
    font-size: 16px;
    font-weight: 500;
    margin-top: 12px;
    margin-bottom: 8px;
  }

  .instructional-modal p,
  .instructional-modal li {
    font-size: 16px;
    font-weight: 400;
    color: #333;
    line-height: 1.5;
  }


</style>