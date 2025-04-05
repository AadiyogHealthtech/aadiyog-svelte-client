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

    // Asanas data
    const asanas = [
        { name: 'Wheel Pose', duration: '20 min', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b', reps: 3, score: 98 },
        { name: 'Warrior II', duration: '40 min', image: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8eW9nYXxlbnwwfHwwfHx8MA%3D%3D', reps: 0, score: 0 },
        { name: 'Tree Pose', duration: '15 min', image: 'https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHlvZ2F8ZW58MHx8MHx8fDA%3D', reps: 9, score: 76 },
        { name: 'Cobra Pose', duration: '25 min', image: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHlvZ2F8ZW58MHx8MHx8fDA%3D', reps: 5, score: 34 }
    ];

    // Drawer control
    const drawerTranslationMap = {
        partial: '90%',
        full: '0%'
    };

    $: drawerTranslation = drawerTranslationMap[drawerState];
    $: p = parseFloat(drawerTranslation.replace('%', ''));
    $: visibleHeightPercentage = 90 * (1 - p / 100);

    // Detect if we're on a mobile device
    function detectMobileDevice(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Get camera constraints
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

    // Initialize the pose landmarker
    async function initPoseLandmarker() {
        const storedLandmarker = $poseLandmarkerStore;
        if (storedLandmarker) {
            poseLandmarker = storedLandmarker;
            console.log("Using pose landmarker from store:", poseLandmarker);
        } else {
            try {
                console.log("Creating new pose landmarker");
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
                console.log("Pose landmarker created successfully:", poseLandmarker);
            } catch (error) {
                console.error("Error initializing pose landmarker:", error);
                dimensions = "Pose landmarker error: " + (error as Error).message;
            }
        }

        if (canvasCtx && !drawingUtils) {
            drawingUtils = new DrawingUtils(canvasCtx);
            console.log("DrawingUtils initialized:", drawingUtils);
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
            console.log('Trying camera with constraints:', constraints);

            stream = await navigator.mediaDevices.getUserMedia(constraints).catch(err => {
                console.warn('Failed with initial constraints, falling back to basic config:', err);
                return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            });

            webcam.srcObject = stream;
            await webcam.play();
            console.log("Video playing, starting render loop");
            dimensions = "Camera active";
            renderVideo();

            poseLandmarkerStore.subscribe(value => {
                poseLandmarker = value;
                if (value && drawingUtils && webcam.readyState === 4) {
                    console.log("PoseLandmarker ready, transitioning to detectPose");
                    detectPose();
                }
            });
        } catch (error) {
            console.error('Error accessing the camera:', error);
            dimensions = "Camera error: " + (error as Error).message;
        }
    }

    function renderVideo() {
        if (!webcam || !canvasCtx || webcam.readyState !== 4) {
            console.log("Render video skipped: waiting for webcam", { readyState: webcam?.readyState });
            animationFrame = requestAnimationFrame(renderVideo);
            return;
        }

        const containerWidth = output_canvas.width;
        const containerHeight = output_canvas.height;
        const videoWidth = webcam.videoWidth;
        const videoHeight = webcam.videoHeight;

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

        canvasCtx.clearRect(0, 0, containerWidth, containerHeight);
        canvasCtx.save();
        canvasCtx.scale(-1, 1);
        canvasCtx.translate(-containerWidth, 0);
        canvasCtx.drawImage(webcam, offsetX, offsetY, drawWidth, drawHeight);
        canvasCtx.restore();

        if (!poseLandmarker || !drawingUtils) {
            animationFrame = requestAnimationFrame(renderVideo);
        }
    }

    function detectPose() {
        if (!webcam || !poseLandmarker || !canvasCtx || !drawingUtils || webcam.readyState !== 4) {
            console.log("Pose detection skipped:", { poseLandmarker: !!poseLandmarker, drawingUtils: !!drawingUtils, videoReady: webcam?.readyState });
            animationFrame = requestAnimationFrame(detectPose);
            return;
        }

        const timestamp = performance.now();
        canvasCtx.clearRect(0, 0, output_canvas.width, output_canvas.height);

        const containerWidth = output_canvas.width;
        const containerHeight = output_canvas.height;
        const videoWidth = webcam.videoWidth;
        const videoHeight = webcam.videoHeight;

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

        // Draw the video with transformations
        canvasCtx.save();
        canvasCtx.scale(-1, 1); // Flip horizontally
        canvasCtx.translate(-containerWidth, 0);
        canvasCtx.drawImage(webcam, offsetX, offsetY, drawWidth, drawHeight);
        canvasCtx.restore();

        try {
            const results = poseLandmarker.detectForVideo(webcam, timestamp);
            if (results && results.landmarks && results.landmarks.length > 0) {
                for (const landmarks of results.landmarks) {
                    const scaledLandmarks = landmarks.map(landmark => {
                        const scaledX = offsetX + landmark.x * drawWidth;
                        const scaledY = offsetY + landmark.y * drawHeight;
                        return { x: scaledX, y: scaledY, z: landmark.z, visibility: landmark.visibility };
                    });

                    // Attempt DrawingUtils without transformations
                    canvasCtx.save();
                    drawingUtils.drawLandmarks(scaledLandmarks); // Default styling, no flip
                    drawingUtils.drawConnectors(scaledLandmarks, PoseLandmarker.POSE_CONNECTIONS);
                    canvasCtx.restore();

                    // Apply transformations and try DrawingUtils again
                    canvasCtx.save();
                    canvasCtx.scale(-1, 1);
                    canvasCtx.translate(-containerWidth, 0);
                    drawingUtils.drawLandmarks(scaledLandmarks, {
                        color: 'white',
                        radius: 8,
                        lineWidth: 2
                    });
                    drawingUtils.drawConnectors(scaledLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
                        color: '#00FF00',
                        lineWidth: 3
                    });
                    canvasCtx.restore();

                    // Fallback: Manually draw keypoints to confirm coordinates
                    canvasCtx.save();
                    canvasCtx.scale(-1, 1);
                    canvasCtx.translate(-containerWidth, 0);
                    canvasCtx.fillStyle = 'white'; // Changed to white
                    scaledLandmarks.forEach(landmark => {
                        canvasCtx.beginPath();
                        canvasCtx.arc(landmark.x, landmark.y, 8, 0, 2 * Math.PI); // Increased radius to 8
                        canvasCtx.fill();
                    });
                    // Debug: Red test circle (commented out as per your request, but kept for reference)
                    // canvasCtx.beginPath();
                    // canvasCtx.arc(scaledLandmarks[0].x, scaledLandmarks[0].y, 10, 0, 2 * Math.PI);
                    // canvasCtx.fill();
                    canvasCtx.restore();

                    // console.log("Drawing attempted with DrawingUtils and manual fallback");
                }
            } else {
                console.log("No landmarks detected in this frame");
            }
        } catch (error) {
            console.error('Error detecting pose:', error);
        }

        animationFrame = requestAnimationFrame(detectPose);
    }

    function handleResize() {
        if (webcam && webcam.videoWidth && containerElement && output_canvas) {
            output_canvas.width = containerElement.clientWidth;
            output_canvas.height = containerElement.clientHeight;
            output_canvas.style.width = `${containerElement.clientWidth}px`;
            output_canvas.style.height = `${containerElement.clientHeight}px`;
        }
    }

    function handlePlay() {
        status = 'playing';
        sessionStartTime = Date.now();
        progressInterval = setInterval(updateProgress, 100);
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
        status = 'stopped';
        if (progressInterval) clearInterval(progressInterval);
        progressInterval = null;
        progressValue = 0;
        elapsedMs = 0;
        totalPausedTime = 0;
        sessionStartTime = null;
        pauseStartTime = null;
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

    onMount(async () => {
        webcam = document.getElementById('webcam') as HTMLVideoElement;
        output_canvas = document.getElementById('output_canvas') as HTMLCanvasElement;
        canvasCtx = output_canvas.getContext('2d')!;
        containerElement = document.getElementById('webcam-container') as HTMLDivElement;

        output_canvas.width = containerElement.clientWidth;
        output_canvas.height = containerElement.clientHeight;
        output_canvas.style.width = `${containerElement.clientWidth}px`;
        output_canvas.style.height = `${containerElement.clientHeight}px`;

        initPoseLandmarker();
        startCamera();

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

        {#if status === 'stopped' && !dimensions.startsWith("Camera error") && !dimensions.startsWith("Pose landmarker error")}
            <button 
                on:click={handlePlay} 
                class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-white p-4 rounded-full shadow-lg"
            >
                <svg class="w-12 h-12 text-black" viewBox="0 0 24 24">
                    <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
                </svg>
            </button>
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

        <div class="px-4 py-1 bg-white">
            <div class="relative flex flex-col justify-center w-full bg-gray-200 rounded-lg overflow-hidden border-2 border-orange-500 h-[60px]">
                <div 
                    class="absolute top-0 left-0 h-full bg-green-500 transition-all duration-100" 
                    style="width: {progressValue}%"
                ></div>
                <div class="relative flex items-center justify-between px-4 z-10">
                    <div class="text-black text-3xl">
                        {formatTime(elapsedMs)}
                    </div>
                    <div class="flex items-center">
                        {#if status === 'playing'}
                            <button on:click={handlePause} class="bg-gray-200 p-2 rounded-full mx-2">
                                <img src={pause} alt="Pause">
                            </button>
                        {:else if status === 'paused'}
                            <button on:click={handlePlay} class="bg-gray-200 p-2 rounded-full mx-2">
                                <svg class="w-6 h-6 text-black" viewBox="0 0 24 24">
                                    <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
                                </svg>
                            </button>
                            <button on:click={handleStop} class="bg-gray-200 p-2 rounded-full mx-2">
                                <svg class="w-6 h-6 text-black" viewBox="0 0 24 24">
                                    <rect x="8" y="8" width="8" height="8" fill="currentColor" />
                                </svg>
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
            <div class="flex items-center justify-around mt-4">
                <div class="flex w-full justify-between">
                    <div class="flex items-center px-4 py-3 rounded-lg border-2 border-orange-500">
                        <div class="flex flex-col mr-8">
                            <div class="text-3xl"><img src={target} alt="Target"></div>
                            <div class="text-xl text-gray-800">Reps</div>
                        </div>
                        <div class="text-5xl ml-4 text-gray-800">6</div>
                    </div>
                    <div class="flex items-center border-2 border-orange-400 px-2 py-1 rounded-lg">
                        <div class="flex flex-col mr-8">
                            <div class="text-3xl"><img src={award} alt="Award"></div>
                            <div class="text-xl text-gray-800">Score</div>
                        </div>
                        <div class="text-5xl ml-2 text-gray-800">98</div>
                    </div>
                </div>
            </div>
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
</style>