<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import { poseLandmarkerStore } from '$lib/store/poseLandmarkerStore';
    import target from '$lib/Images/target.svg';
    import award from '$lib/Images/award.svg';
    import pause from '$lib/Images/pause-circle.svg';

    // UI variables
    let progressValue = 0;
    let drawerState: 'partial' | 'full' = 'partial';
    let elapsedMs = 0;
    let dimensions: string = "Waiting for camera...";

    // Core variables
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

    // Progress control
    let progressInterval: number | null = null;
    const PROGRESS_DURATION = 60000; // 60 seconds

    // Session state
    let status: 'stopped' | 'playing' | 'paused' = 'stopped';
    let sessionStartTime: number | null = null;
    let totalPausedTime = 0;
    let pauseStartTime: number | null = null;
    
    // User position tracking
    let userInPosition = false;
    let targetBox = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };

    // Reps and score
    let currentReps = 0;
    let currentScore = 0;

    // Flag to control pose detection - set to true by default to show landmarks from start
    let detectPoseActive = true;

    // Asanas data
    const asanas = [
        { name: 'Wheel Pose', duration: '20 min', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b', reps: 3, score: 98 },
        { name: 'Warrior II', duration: '40 min', image: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8eW9nYXxlbnwwfHwwfHx8MA%3D%3D', reps: 0, score: 0 },
        { name: 'Tree Pose', duration: '15 min', image: 'https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHlvZ2F8ZW58MHx8MHx8fDA%3D', reps: 9, score: 76 },
        { name: 'Cobra Pose', duration: '25 min', image: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHlvZ2F8ZW58MHx8MHx8fDA%3D', reps: 5, score: 34 }
    ];

    // Drawer control
    const drawerTranslationMap = {
        partial: '92%',
        full: '0%'
    };

    $: drawerTranslation = drawerTranslationMap[drawerState];
    $: p = parseFloat(drawerTranslation.replace('%', ''));
    $: visibleHeightPercentage = 90 * (1 - p / 100);

    // Modal state
    let showModal = false;

    function detectMobileDevice(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    function getConstraints(): MediaStreamConstraints {
        isMobile = detectMobileDevice();
        if (isMobile) {
            return {
                video: { facingMode: "user" },
                audio: false
            };
        } else {
            return {
                video: { facingMode: "user" },
                audio: false
            };
        }
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
            console.log("Using stored pose landmarker");
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
                console.log("New pose landmarker created");
            } catch (error) {
                console.error("Error initializing pose landmarker:", error);
                dimensions = "Pose landmarker error: " + (error as Error).message;
            }
        }

        if (canvasCtx && !drawingUtils) {
            drawingUtils = new DrawingUtils(canvasCtx);
            console.log("DrawingUtils initialized");
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
            dimensions = "Camera active";
            console.log("Camera started, video playing");

            setupTargetBox();
            detectPoseActive = true;
            renderFrame();
        } catch (error) {
            console.error('Error accessing the camera:', error);
            dimensions = "Camera error: " + (error as Error).message;
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
            height: canvasHeight * 0.96
        };
    }

    function renderFrame() {
        if (!webcam || !canvasCtx || webcam.readyState !== 4) {
            console.log("Render frame skipped: Webcam not ready", { readyState: webcam?.readyState });
            animationFrame = requestAnimationFrame(renderFrame);
            return;
        }

        const containerWidth = output_canvas.width;
        const containerHeight = output_canvas.height;
        const videoWidth = webcam.videoWidth;
        const videoHeight = webcam.videoHeight;

        console.log("Canvas dimensions:", { containerWidth, containerHeight });
        console.log("Video dimensions:", { videoWidth, videoHeight });

        const videoRatio = videoWidth / videoHeight;
        const containerRatio = containerWidth / containerHeight;

        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

        if (containerRatio < 1) { // Portrait
            drawHeight = containerHeight;
            drawWidth = containerHeight * videoRatio;
            offsetX = (containerWidth - drawWidth) / 2;
            offsetY = 0;
        } else { // Landscape
            drawWidth = containerWidth;
            drawHeight = containerWidth / videoRatio;
            offsetY = (containerHeight - drawHeight) / 2;
        }

        console.log("Draw parameters:", { drawWidth, drawHeight, offsetX, offsetY });

        // Clear the entire canvas
        canvasCtx.clearRect(0, 0, containerWidth, containerHeight);

        // 1. Draw the video feed (bottom layer)
        canvasCtx.save();
        canvasCtx.scale(-1, 1); // Flip horizontally
        canvasCtx.translate(-containerWidth, 0);
        canvasCtx.drawImage(webcam, offsetX, offsetY, drawWidth, drawHeight);
        canvasCtx.restore();
        console.log("Video drawn");

        // 2. Draw the target box (middle layer) if user is not in position
        if (!userInPosition) {
            drawTargetBox();
            console.log("Target box drawn");
        }

        // 3. Draw pose landmarks (top layer) if detection is active
        if (detectPoseActive && poseLandmarker && drawingUtils) {
            const timestamp = performance.now();
            try {
                const results = poseLandmarker.detectForVideo(webcam, timestamp);
                console.log("Pose detection results:", { landmarks: results?.landmarks?.length || 0 });

                if (results && results.landmarks && results.landmarks.length > 0) {
                    for (const landmarks of results.landmarks) {
                        const scaledLandmarks = landmarks.map(landmark => {
                            const scaledX = offsetX + landmark.x * drawWidth;
                            const scaledY = offsetY + landmark.y * drawHeight;
                            return { x: scaledX, y: scaledY, z: landmark.z, visibility: landmark.visibility };
                        });

                        console.log("Scaled landmarks (all):", scaledLandmarks);

                        // Check user position (does not affect rendering)
                        checkUserPosition(scaledLandmarks);

                        // Draw with transformations
                        canvasCtx.save();
                        canvasCtx.scale(-1, 1); // Flip context to match video
                        canvasCtx.translate(-containerWidth, 0);

                        // Draw connectors
                        drawingUtils.drawConnectors(scaledLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
                            color: userInPosition ? '#00FF00' : '#FF0000',
                            lineWidth: 4
                        });
                        console.log("Connectors drawn with DrawingUtils");

                        // Draw landmarks with DrawingUtils
                        drawingUtils.drawLandmarks(scaledLandmarks, {
                            color: '#FFFF00', // Bright yellow
                            lineWidth: 8,
                            radius: 6
                        });
                        console.log("Landmarks drawn with DrawingUtils");

                        // Fallback: Manually draw all landmarks in cyan for debugging
                        canvasCtx.fillStyle = 'white'; // Cyan for visibility
                        scaledLandmarks.forEach((landmark, index) => {
                            canvasCtx.beginPath();
                            canvasCtx.arc(landmark.x, landmark.y, 6, 0, 2 * Math.PI);
                            canvasCtx.fill();
                            if (index === 0) {
                                console.log("Manual nose dot:", { x: landmark.x, y: landmark.y });
                            }
                        });
                        console.log("Manual cyan dots drawn for all landmarks");

                        // Draw test dot at nose (magenta)
                        const nose = scaledLandmarks[0];
                        canvasCtx.fillStyle = '#FF00FF'; // Magenta
                        canvasCtx.beginPath();
                        // canvasCtx.arc(nose.x, nose.y, 10, 0, 2 * Math.PI);
                        canvasCtx.fill();
                        console.log("Test dot drawn at nose:", { x: nose.x, y: nose.y });

                        canvasCtx.restore();
                    }
                } else {
                    console.log("No landmarks detected in this frame");
                }
            } catch (error) {
                console.error('Error detecting pose:', error);
            }
        } else {
            console.log("Pose detection skipped:", {
                detectPoseActive,
                poseLandmarker: !!poseLandmarker,
                drawingUtils: !!drawingUtils
            });
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
        canvasCtx.fillText('Position yourself inside the box', targetBox.x + targetBox.width/2, targetBox.y + 30);
        canvasCtx.restore();
    }

    // Updated to check if full body is inside the red box
    function checkUserPosition(landmarks) {
        if (!landmarks || landmarks.length === 0) return;
        
        // Check all main body landmarks instead of just the torso
        // MediaPipe returns 33 landmarks for the full body
        // We'll check key landmarks that represent the full body
        const keyLandmarks = [
            landmarks[0],   // nose
            landmarks[11],  // left shoulder
            landmarks[12],  // right shoulder
            landmarks[23],  // left hip
            landmarks[24],  // right hip
            landmarks[27],  // left ankle
            landmarks[28],  // right ankle
            landmarks[15],  // left wrist
            landmarks[16]   // right wrist
        ];
        
        // Count how many key landmarks are inside the box
        let pointsInBox = 0;
        const totalPoints = keyLandmarks.length;
        
        keyLandmarks.forEach(point => {
            if (point && 
                point.x >= targetBox.x && 
                point.x <= targetBox.x + targetBox.width &&
                point.y >= targetBox.y && 
                point.y <= targetBox.y + targetBox.height) {
                pointsInBox++;
            }
        });
        
        // Consider user in position only when all key points are in the box
        // This ensures full body is inside the red box
        if (pointsInBox === totalPoints && !userInPosition) {
            userInPosition = true;
            // Set initial values when user first gets in position
            currentReps = 3;
            currentScore = 98;
            console.log("Full body in position!");
            
            // Start session if not already started
            if (status === 'stopped') {
                handlePlay();
            }
        } else if (pointsInBox < totalPoints && userInPosition) {
            userInPosition = false;
            console.log("User moved out of position!");
        }
    }

    function handleResize() {
        if (webcam && webcam.videoWidth && containerElement && output_canvas) {
            output_canvas.width = containerElement.clientWidth;
            output_canvas.height = containerElement.clientHeight;
            output_canvas.style.width = `${containerElement.clientWidth}px`;
            output_canvas.style.height = `${containerElement.clientHeight}px`;
            
            // Update drawingUtils with the new context
            if (canvasCtx) {
                drawingUtils = new DrawingUtils(canvasCtx);
            }
            
            setupTargetBox();
        }
    }

    function handlePlay() {
        status = 'playing';
        sessionStartTime = Date.now();
        progressInterval = setInterval(updateProgress, 100);
        detectPoseActive = true; // Keep pose detection enabled
        
        // Force a redraw to immediately show landmarks once detection starts
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        renderFrame();
    }

    function handlePause() {
        if (status === 'playing') {
            status = 'paused';
            pauseStartTime = Date.now();
            if (progressInterval) clearInterval(progressInterval);
            // Important: Don't disable pose detection when pausing
        } else if (status === 'paused') {
            status = 'playing';
            if (pauseStartTime) {
                totalPausedTime += Date.now() - pauseStartTime;
                pauseStartTime = null;
            }
            progressInterval = setInterval(updateProgress, 100);
        }
        // Keep detectPoseActive true while paused
    }

    function handleStop() {
        showModal = true; // Show the modal instead of immediate action
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
        // Keep pose detection active even when stopped
        // detectPoseActive = true;
        userInPosition = false;
        goto('/yoga/3');
        showModal = false; // Hide the modal after confirmation
    }

    function cancelStop() {
        showModal = false; // Hide the modal if canceled
    }

    function updateProgress() {
        if (status !== 'playing' || !sessionStartTime) return;
        const now = Date.now();
        elapsedMs = now - sessionStartTime - totalPausedTime;
        progressValue = Math.min((elapsedMs / PROGRESS_DURATION) * 100, 100);
        if (progressValue >= 100) handleStop(); // Trigger modal when progress completes
    }

    function handleBack() {
        goto('/home');
    }

    onMount(async () => {
        webcam = document.getElementById('webcam') as HTMLVideoElement;
        output_canvas = document.getElementById('output_canvas') as HTMLCanvasElement;
        canvasCtx = output_canvas.getContext('2d')!;
        containerElement = document.getElementById('webcam-container') as HTMLDivElement;

        output_canvas.width = containerElement.clientWidth;
        output_canvas.height = containerElement.clientHeight;
        output_canvas.style.width = `${containerElement.clientWidth}px`;
        output_canvas.style.height = `${containerElement.clientHeight}px`;

        await initPoseLandmarker();
        await startCamera();

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 500);
        });
    });

    onDestroy(() => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        if (stream) stream.getTracks().forEach(track => track.stop());
        if (progressInterval) clearInterval(progressInterval);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
    });
</script>


<div class="h-screen flex flex-col overflow-hidden relative w-full">
    <!-- Video Container -->
    <div id="webcam-container" class="relative bg-black overflow-hidden" bind:this={containerElement}>
        <video id="webcam" autoplay playsinline muted style="display: none;"></video>
        <canvas id="output_canvas" class="pointer-events-none"></canvas>

        <!-- Show Play/Stop buttons at bottom of red box when user is not in position -->
        {#if !userInPosition && !dimensions.startsWith("Camera error") && !dimensions.startsWith("Pose landmarker error")}
        <div class="absolute left-1/2 transform -translate-x-1/2 z-20 flex justify-between items-center w-full px-4" 
             style="bottom: {targetBox.y + 20}px">
            <!-- Image as a button -->
            <button class="h-16 w-16 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500">
                <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b" alt="Media button" class="h-full w-full object-cover">
            </button>
            
            <!-- Media control buttons -->
           
                <button 
                    on:click={handlePlay} 
                    class="bg-white p-4 rounded-full shadow-lg focus:outline-none hover:bg-gray-100"
                >
                    <svg class="w-10 h-10 text-black" viewBox="0 0 24 24">
                        <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
                    </svg>
                </button>
                <button 
                    on:click={handleStop} 
                    class="bg-white p-4 rounded-full shadow-lg focus:outline-none hover:bg-gray-100"
                >
                    <svg class="w-10 h-10 text-black" viewBox="0 0 24 24">
                        <rect x="8" y="8" width="8" height="8" fill="currentColor" />
                    </svg>
                </button>
                
        </div>
        {/if}

        <!-- Show controls, reps, and score when user is in position (full body in red box) -->
        {#if userInPosition}
        <div class="user-in-position-container">
            <!-- Score and Reps at the top -->
            <div class="score-reps-container">
                <div class="flex items-center px-4 py-3 rounded-lg border-2 border-orange-500 bg-white bg-opacity-80">
                    <div class="flex flex-col mr-8">
                        <div class="text-3xl"><img src={target} alt="Target"></div>
                        <div class="text-xl text-gray-800">Reps</div>
                    </div>
                    <div class="text-5xl ml-4 text-gray-800">{currentReps}</div>
                </div>
                <div class="flex items-center border-2 border-orange-400 px-2 py-1 rounded-lg bg-white bg-opacity-80">
                    <div class="flex flex-col mr-8">
                        <div class="text-3xl"><img src={award} alt="Award"></div>
                        <div class="text-xl text-gray-800">Score</div>
                    </div>
                    <div class="text-5xl ml-2 text-gray-800">{currentScore}</div>
                </div>
            </div>
            
            <!-- Progress Bar at the bottom -->
            <div class="progress-container bg-gray-100">
                <div class="yoga-name ">Anuvittasana</div>
                <div class="custom-progress-bar">
                    <div class="progress-bg">
                        <div 
                            class="progress-fill"
                            style="width: {progressValue}%"
                        ></div>
                    </div>
                </div>
            </div>
        </div>
        {/if}
    </div>

    <!-- Spacer Div -->
    <div style="height: {visibleHeightPercentage}%; transition: height 300ms;"></div>

    <!-- Drawer -->
    <div 
        class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 w-full border-t-1 border-b flex flex-col z-30"
        style="transform: translateY({drawerTranslation}); height: 90%;"
    >
        <div class="w-full h-8 flex justify-center items-center cursor-pointer" on:click={handleDrawerToggle}>
            <div class="w-32 h-1 bg-gray-700 rounded-full"></div>
        </div>

        {#if drawerState === 'full'}
            <div class="flex flex-col flex-grow overflow-hidden items-center">
                <h2 class="text-lg font-semibold mb-4 mt-2 font-sans border-b-2 text-center w-[90vw] border-gray-200 py-2">
                    5 Asanas Remaining
                </h2>
                <div class="space-y-4 flex-grow overflow-y-auto">
                    {#each asanas as asana}
                        <div class="flex items-center space-x-4 p-4 rounded-lg">
                            <img 
                                src={asana.image} 
                                alt={asana.name} 
                                class="w-32 h-32 object-cover rounded-md"
                            />
                            <div class="flex-grow">
                                <h3 class="text-md font-medium">Lorem ipsum dolor sit amet consectetur.</h3>
                                <div class="flex flex-col text-gray-600">
                                    <span class="text-md mt-1 mb-3">{asana.reps} reps</span>
                                    <span class="text-md">{asana.duration}</span>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>

    <!-- Modal for Stop Confirmation -->
    {#if showModal}
    <div class="fixed inset-0  flex items-center justify-center z-50">
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
</div>

<style>
   /* Existing styles remain unchanged */
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

.h-screen {
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

/* New styles for user-in-position elements */
.user-in-position-container {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    pointer-events: none; /* Allow clicks to pass through to canvas */
}

.user-in-position-container > * {
    pointer-events: auto; /* Re-enable clicks for child elements */
}

.score-reps-container {
    width: 100%;
    padding: 16px;
    display: flex;
    justify-content: space-between;
}

.progress-container {
    width: 100%;
    padding: 16px;
    background-color: rgba(40, 39, 39, 0.5);
    /* opacity: 50%; */
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
    background-color: #fff; /* Gray background to match the image */
    border-radius: 16px;
    overflow: hidden;
    height: 20px; /* Thinner height */
    position: relative;
    border: 1px solid #ccc; /* Subtle border for definition */
}

.progress-bg {
    width: 100%;
    height: 100%;
    background-color: #fff; /* White background for the progress bar */
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background-color: #32cd32; /* Green fill to match the image (LimeGreen) */
    transition: width 0.3s ease-in-out;
}

/* Modal styles */
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
</style>