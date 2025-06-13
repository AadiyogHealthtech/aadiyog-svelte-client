<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
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


  // Variables
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


  // Subscribe to workoutStore
  // Subscribe to workoutStore
  workoutStore.subscribe((workouts) => {
    workoutJson = workouts?.data[0].attributes.excercise?.data.attributes?.json;
    console.log('Workout JSON from store:', workoutJson);
  });

  // Reactively log allWorkouts
  $: {
    console.log("YogaSession -> allWorkouts:", $allWorkouts);
  }

  $: currentWorkout = $allWorkouts.find(workout => workout.title === yogName) || $allWorkouts[0] || null;

  console.log("--->>" , currentWorkout)

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
    const storedLandmarker = $poseLandmarkerStore;
    if (storedLandmarker) {
      poseLandmarker = storedLandmarker;
      console.log('Using stored pose landmarker');
    } else {
      try {
        const vision = await import('@mediapipe/tasks-vision');
        poseLandmarker = await vision.PoseLandmarker.createFromOptions({
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
      y: canvasHeight * 0.02,
      width: canvasWidth * 0.96,
      height: canvasHeight * 0.90
    };
  }

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

    canvasCtx.save();
    canvasCtx.scale(-1, 1);
    canvasCtx.translate(-containerWidth, 0);
    canvasCtx.drawImage(webcam, offsetX, offsetY, drawWidth, drawHeight);
    canvasCtx.restore();

    if (!userInPosition) {
      drawTargetBox();
    }

    if (detectPoseActive && poseLandmarker && drawingUtils) {
      const timestamp = performance.now();
      try {
        const results = poseLandmarker.detectForVideo(webcam, timestamp);

        if (results && results.landmarks && results.landmarks.length > 0) {
          for (const landmarks of results.landmarks) {
            const scaledLandmarks = landmarks.map(landmark => {
              const scaledX = offsetX + landmark.x * drawWidth;
              const scaledY = offsetY + landmark.y * drawHeight;
              return { x: scaledX, y: scaledY, z: landmark.z, visibility: landmark.visibility };
            });

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

            canvasCtx.fillStyle = 'white';
            scaledLandmarks.forEach((landmark, index) => {
              canvasCtx.beginPath();
              canvasCtx.arc(landmark.x, landmark.y, 6, 0, 2 * Math.PI);
              canvasCtx.fill();
            });

            canvasCtx.restore();

            if (userInPosition && worker && controllerInitialized) {
              operationId++;
              worker.postMessage({
                type: 'process_frame',
                data: { results: { landmarks: [landmarks] } },
                operation: operationId
              });
              console.log('Sent pose results to worker', operationId);
            }
          }
        } else {
          console.log('No landmarks detected in this frame');
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

  onMount(async () => {
    if (!browser) return;
    webcam = document.getElementById('webcam') as HTMLVideoElement;
    output_canvas = document.getElementById('output_canvas') as HTMLCanvasElement;
    canvasCtx = output_canvas.getContext('2d')!;
    containerElement = document.getElementById('webcam-container') as HTMLDivElement;

    output_canvas.width = containerElement.clientWidth;
    output_canvas.height = containerElement.clientHeight;
    output_canvas.style.width = `${containerElement.clientWidth}px`;
    output_canvas.style.height = `${containerElement.clientHeight}px`;

    // Initialize worker
    if (browser) {
      console.log('[Svelte] Starting worker initialization');
      const workerPath = import.meta.env.DEV ? 'http://localhost:5173/worker.js' : 'https://aadiyog-client.netlify.app/worker.js';
      console.log(`[Svelte] Worker path set to: ${workerPath}`);
      try {
        worker = new Worker(workerPath, { type: 'module' });
        console.log('[Svelte] Worker created successfully');
      } catch (error) {
        console.error('[Svelte] Failed to create worker:', error);
        dimensions = `Worker creation error: ${error.message}`;
      }
      if (worker) {
        worker.onmessage = (e) => {
          console.log('[Svelte] Worker message received:', e.data);
          const { type, value, error, operation } = e.data;

          if (operation < operationId && type !== 'error') return;

          switch (type) {
            case 'init_done':
              console.log('[Svelte] Controller initialized:', value);
              controllerInitialized = true;
              yogName = value.exerciseName;
              console.log('[Svelte] Updated yogaName to:', yogName);
              dimensions = `Camera active, Controller: ${value.exercise} (${value.reps} reps)`;
              break;
            case 'frame_result':
              console.log('[Svelte] Frame result:', value);
              currentReps = value.repCount;
              currentScore = value.score;
              yogName = value.currentExerciseName;
              console.log('[Svelte] Updated yogaName to:', yogName);
              if (value.currentPhase && value.currentPhase !== lastPhase) {
                lastPhase = value.currentPhase;
                currentPhase = value.currentPhase;
                showPhase = true;
                console.log(`[Svelte] Displaying phase "${currentPhase}"`);
                if (phaseTimeout) clearTimeout(phaseTimeout);
                phaseTimeout = setTimeout(() => {
                  showPhase = false;
                  console.log(`[Svelte] Hiding phase "${currentPhase}"`);
                }, 3000);
              }
              break;
            case 'exercise_name_result':
              yogName = value.exerciseName;
              console.log('[Svelte] Received exercise name:', yogName);
              break;
            case 'transitioning_excercise':
              console.log('Transitioning to ' + value.nextAssan);
              break;
            case 'error':
              console.error('[Svelte] Worker reported error:', error);
              dimensions = `Worker error: ${error}`;
              break;
          }
        };
        worker.onerror = (err) => {
          console.error('[Svelte] Worker error event:', err);
          dimensions = `Worker error: ${err.message}`;
        };
        if (workoutJson) {
          operationId++;
          try {
            worker.postMessage({ type: 'init', data: { jsonData: workoutJson }, operation: operationId });
            console.log('[Svelte] Sent init message to worker with workoutJson', operationId);
          } catch (error) {
            console.error('[Svelte] Failed to send init message:', error);
            dimensions = `Worker postMessage error: ${error.message}`;
          }
        } else {
          console.warn('[Svelte] workoutJson not available yet, waiting for store update');
          const unsubscribe = workoutStore.subscribe((workouts) => {
            workoutJson = workouts?.data[0].attributes.excercise?.data.attributes?.json;
            if (workoutJson) {
              operationId++;
              try {
                worker!.postMessage({ type: 'init', data: { jsonData: workoutJson }, operation: operationId });
                console.log('[Svelte] Sent init message to worker with workoutJson after store update', operationId);
                unsubscribe();
              } catch (error) {
                console.error('[Svelte] Failed to send init message after store update:', error);
                dimensions = `Worker postMessage error: ${error.message}`;
              }
            }
          });
        }
      }
    }

    await initPoseLandmarker();
    await startCamera();
    isInitialized = true;

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 500);
    });
  });

  onDestroy(() => {
    if (!browser) return;
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
  <div id="webcam-container" class="relative bg-black overflow-hidden" bind:this={containerElement}>
    <!-- Existing webcam and canvas setup (unchanged) -->
    <video id="webcam" autoplay playsinline muted style="display: none;"></video>
    <canvas id="output_canvas" class="pointer-events-none"></canvas>

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
  style="bottom: {isInitialized ? Math.max(targetBox.y + targetBox.height * 0.08, targetBox.y + 45) : '20px'}; 
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