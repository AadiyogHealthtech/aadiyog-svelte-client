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
    let isFullBodyVisible = true;
    let drawerState: 'partial' | 'full' = 'partial';
    let elapsedMs = 0;

    // Core variables
    let poseLandmarker: PoseLandmarker | undefined;
    let runningMode: 'VIDEO' = 'VIDEO';
    let webcam: HTMLVideoElement;
    let output_canvas: HTMLCanvasElement;
    let canvasCtx: CanvasRenderingContext2D;
    let lastVideoTime = -1;
    let animationFrame: number;
    let containerElement: HTMLDivElement;

    // Progress control
    let progressInterval: number | null = null;
    const PROGRESS_DURATION = 60000; // 60 seconds

    // Session state
    let status: 'stopped' | 'playing' | 'paused' = 'stopped';
    let sessionStartTime: number | null = null;
    let totalPausedTime = 0;
    let pauseStartTime: number | null = null;

    // Smoothing variables (for future use)
    let previousLandmarksBuffer: any[] = [];
    const SMOOTHING_FACTOR = 0.7;
    const BUFFER_SIZE = 3;
    const VISIBILITY_THRESHOLD = 0.5;

    const ESSENTIAL_PARTS = [
        'left_knee', 'right_knee', 'left_elbow', 'right_elbow',
        'left_wrist', 'right_wrist', 'left_ankle', 'right_ankle',
        'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'
    ];

    const POSE_CONNECTIONS = PoseLandmarker.POSE_CONNECTIONS;

    // Asanas data
    const asanas = [
        { name: 'Wheel Pose', duration: '20 min', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b', reps: 3, score: 98 },
        { name: 'Warrior II', duration: '40 min', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b', reps: 0, score: 0 },
        { name: 'Tree Pose', duration: '15 min', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b', reps: 0, score: 0 },
        { name: 'Cobra Pose', duration: '25 min', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b', reps: 0, score: 0 }
    ];

    // Drawer control
    const drawerTranslationMap = {
        partial: '62%',
        full: '0%'
    };

    $: drawerTranslation = drawerTranslationMap[drawerState];
    $: p = parseFloat(drawerTranslation.replace('%', ''));
    $: visibleHeightPercentage = 90 * (1 - p / 100);

    function handleDrawerToggle() {
        drawerState = drawerState === 'partial' ? 'full' : 'partial';
    }

    function updateVideoConstraints() {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        return {
            audio: false,
            video: isMobile
                ? { facingMode: 'user', width: { min: 270, ideal: 375 }, height: { min: 480 } }
                : { width: { min: 640, ideal: 1280 }, height: { min: 480, ideal: 720 } }
        };
    }

    function formatTime(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    }

    async function setupVideo() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('Browser does not support getUserMedia');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia(updateVideoConstraints());
            webcam.srcObject = stream;
            await webcam.play();

            output_canvas.width = webcam.videoWidth;
            output_canvas.height = webcam.videoHeight;

            webcam.style.width = '100%';
            webcam.style.height = '100%';
            webcam.style.objectFit = 'cover';

            output_canvas.style.width = '100%';
            output_canvas.style.height = '100%';
            output_canvas.style.position = 'absolute';
            output_canvas.style.top = '0';
            output_canvas.style.left = '0';

            startLandmarkDetection();
        } catch (err) {
            console.error('Error accessing webcam:', err);
        }
    }

    function startLandmarkDetection() {
        if (!poseLandmarker) {
            console.log('PoseLandmarker not loaded yet');
            return;
        }
        detectPose();
    }

    function detectPose() {
        if (!webcam || !poseLandmarker || !canvasCtx) return;

        const nowInMs = performance.now();
        if (lastVideoTime !== webcam.currentTime) {
            lastVideoTime = webcam.currentTime;
            const results = poseLandmarker.detectForVideo(webcam, nowInMs);
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, output_canvas.width, output_canvas.height);
            const drawingUtils = new DrawingUtils(canvasCtx);

            if (results.landmarks && results.landmarks.length > 0) {
                for (const landmark of results.landmarks) {
                    drawingUtils.drawLandmarks(landmark, { color: '#FF0000', lineWidth: 2 });
                    drawingUtils.drawConnectors(landmark, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
                }
                checkFullBodyVisibility(results.landmarks[0]);
            }

            canvasCtx.restore();
        }

        animationFrame = requestAnimationFrame(detectPose);
    }

    function checkFullBodyVisibility(landmarks: any) {
        if (!landmarks) {
            isFullBodyVisible = false;
            return;
        }

        const visibility = ESSENTIAL_PARTS.every((part) => {
            const idx = POSE_LANDMARKS[part.toUpperCase()];
            return landmarks[idx] && landmarks[idx].visibility > VISIBILITY_THRESHOLD;
        });
        isFullBodyVisible = visibility;
    }

    function applyFullScreenVideoFitting() {
        if (!webcam || !containerElement) return;

        const containerWidth = containerElement.clientWidth;
        const containerHeight = containerElement.clientHeight;
        const videoAspectRatio = webcam.videoWidth / webcam.videoHeight;

        let targetWidth = containerWidth;
        let targetHeight = targetWidth / videoAspectRatio;

        if (targetHeight < containerHeight) {
            targetHeight = containerHeight;
            targetWidth = targetHeight * videoAspectRatio;
        }

        webcam.style.width = `${targetWidth}px`;
        webcam.style.height = `${targetHeight}px`;
        webcam.style.left = `${(containerWidth - targetWidth) / 2}px`;
        webcam.style.top = `${(containerHeight - targetHeight) / 2}px`;

        output_canvas.style.width = `${targetWidth}px`;
        output_canvas.style.height = `${targetHeight}px`;
        output_canvas.style.left = `${(containerWidth - targetWidth) / 2}px`;
        output_canvas.style.top = `${(containerHeight - targetHeight) / 2}px`;
    }

    function handleResize() {
        if (output_canvas && webcam) {
            output_canvas.width = webcam.videoWidth;
            output_canvas.height = webcam.videoHeight;
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

        if (progressValue >= 100) {
            handleStop();
        }
    }

    function handleBack() {
        goto('/home');
    }

    const POSE_LANDMARKS = {
        NOSE: 0,
        LEFT_EYE_INNER: 1,
        LEFT_EYE: 2,
        LEFT_EYE_OUTER: 3,
        RIGHT_EYE_INNER: 4,
        RIGHT_EYE: 5,
        RIGHT_EYE_OUTER: 6,
        LEFT_EAR: 7,
        RIGHT_EAR: 8,
        LEFT_MOUTH: 9,
        RIGHT_MOUTH: 10,
        LEFT_SHOULDER: 11,
        RIGHT_SHOULDER: 12,
        LEFT_ELBOW: 13,
        RIGHT_ELBOW: 14,
        LEFT_WRIST: 15,
        RIGHT_WRIST: 16,
        LEFT_PINKY: 17,
        RIGHT_PINKY: 18,
        LEFT_INDEX: 19,
        RIGHT_INDEX: 20,
        LEFT_THUMB: 21,
        RIGHT_THUMB: 22,
        LEFT_HIP: 23,
        RIGHT_HIP: 24,
        LEFT_KNEE: 25,
        RIGHT_KNEE: 26,
        LEFT_ANKLE: 27,
        RIGHT_ANKLE: 28,
        LEFT_HEEL: 29,
        RIGHT_HEEL: 30,
        LEFT_FOOT_INDEX: 31,
        RIGHT_FOOT_INDEX: 32
    };

    onMount(() => {
        webcam = document.getElementById('webcam') as HTMLVideoElement;
        output_canvas = document.getElementById('output_canvas') as HTMLCanvasElement;
        canvasCtx = output_canvas.getContext('2d')!;
        containerElement = document.getElementById('webcam-container') as HTMLDivElement;
        
        poseLandmarkerStore.subscribe((value) => {
            poseLandmarker = value;
            console.log('PoseLandmarker loaded:', poseLandmarker);
        });

        setupVideo();
        applyFullScreenVideoFitting();

        window.addEventListener('resize', () => {
            handleResize();
            setTimeout(applyFullScreenVideoFitting, 100);
        });
        window.addEventListener('orientationchange', () => {
            handleResize();
            setTimeout(applyFullScreenVideoFitting, 500);
        });
    });

    onDestroy(() => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        if (webcam?.srcObject) {
            (webcam.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
        }
        if (progressInterval) clearInterval(progressInterval);
        if (browser) {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        }
    });
</script>

<div class="h-screen flex flex-col overflow-hidden relative w-full">
    <!-- Video Container -->
    <div id="webcam-container" class="flex-grow relative bg-black overflow-hidden">
        <video id="webcam" autoplay playsinline></video>
        <canvas id="output_canvas" class="pointer-events-none"></canvas>

        {#if status === 'stopped'}
            <button 
                on:click={handlePlay} 
                class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-white p-4 rounded-full shadow-lg"
            >
                <svg class="w-12 h-12 text-black" viewBox="0 0 24 24">
                    <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
                </svg>
            </button>
        {/if}

        {#if !isFullBodyVisible}
            <div class="absolute top-4 left-0 right-0 flex justify-center">
                <div class="bg-red-500/90 text-white rounded-lg shadow-lg p-3 mx-4 max-w-sm">
                    <div class="flex items-center justify-center space-x-2">
                        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                        <span class="text-sm md:text-base text-center">
                            Please ensure your full body is visible in the frame
                        </span>
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
        on:click={handleDrawerToggle}
    >
        <div class="w-full h-8 flex justify-center items-center cursor-pointer">
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
                    {#each asanas as asana, index}
                        <div class="flex items-center space-x-4 p-4 rounded-lg">
                            <img 
                                src={asana.image} 
                                alt={asana.name} 
                                class="w-32 h-32 object-cover rounded-md"
                            />
                            <div class="flex-grow">
                                <p></p>
                                <h3 class="text-md font-medium">Lorem ipsum dolor sit amet consectetur.</h3>
                                <div class="flex flex-col text-gray-600">
                                    <span class="text-md mt-1 mb-3">{asana.reps} reps</span>
                                    <span class="text-md m-y">{asana.duration}</span>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>