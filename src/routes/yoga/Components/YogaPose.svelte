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
    let drawerState: 'closed' | 'partial' | 'full' = 'partial';
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
    function handleDrawerToggle() {
        switch (drawerState) {
            case 'closed': drawerState = 'partial'; break;
            case 'partial': drawerState = 'full'; break;
            case 'full': drawerState = 'closed'; break;
        }
    }

    $: drawerTranslation = { 'closed': '90%', 'partial': '62%', 'full': '0%' }[drawerState];

    // Video constraints for mobile and desktop with height priority
    function updateVideoConstraints() {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        return {
  audio: false,
  video: {
    width: { min: 270, max: 375 },
    height: { min: 667, max: 667},
  },
};
    }

    function handleBack() {
        if (browser) window.history.length > 2 ? window.history.go(-1) : goto('/');
    }

    function handlePlay() {
        if (status === 'stopped') {
            sessionStartTime = Date.now();
            totalPausedTime = 0;
            pauseStartTime = null;
            progressValue = 0;
            elapsedMs = 0;
            startCamera();
            status = 'playing';
            progressInterval = setInterval(() => {
                if (status === 'playing' && sessionStartTime !== null) {
                    const elapsed = Date.now() - sessionStartTime - totalPausedTime;
                    elapsedMs = elapsed;
                    progressValue = Math.min((elapsed / PROGRESS_DURATION) * 100, 100);
                    if (progressValue >= 100) {
                        clearInterval(progressInterval!);
                        status = 'stopped';
                    }
                }
            }, 100);
        } else if (status === 'paused') {
            if (pauseStartTime !== null) {
                totalPausedTime += Date.now() - pauseStartTime;
                pauseStartTime = null;
            }
            webcam.play();
            status = 'playing';
        }
    }

    function handlePause() {
        if (status === 'playing') {
            pauseStartTime = Date.now();
            webcam.pause();
            status = 'paused';
        }
    }

    function handleStop() {
        status = 'stopped';
        if (progressInterval) clearInterval(progressInterval);
        progressInterval = null;
        stopCamera();
        goto('/yoga/3');
    }

    // Set up video element properly
    function setupVideo() {
        // Set intrinsic sizing attributes
        webcam.setAttribute('height', '100%');
        
        // Add an event listener for loadedmetadata to adjust as needed
        webcam.addEventListener('loadedmetadata', () => {
            // Reset canvas dimensions
            output_canvas.width = webcam.videoWidth;
            output_canvas.height = webcam.videoHeight;
            
            // Apply forced aspect ratio if needed
            const videoAspect = webcam.videoWidth / webcam.videoHeight;
            const containerAspect = containerElement.clientWidth / containerElement.clientHeight;
            
            if (videoAspect > containerAspect) {
                // Video is wider than container - force height priority
                const scaleFactor = containerElement.clientHeight / webcam.videoHeight;
                const newWidth = webcam.videoWidth * scaleFactor;
                
                // Center the video horizontally
                webcam.style.height = '100%';
                webcam.style.width = `${newWidth}px`;
                webcam.style.left = `${(containerElement.clientWidth - newWidth) / 2}px`;
                webcam.style.transform = 'scaleX(-1)';
                
                // Match canvas
                output_canvas.style.height = '100%';
                output_canvas.style.width = `${newWidth}px`;
                output_canvas.style.left = `${(containerElement.clientWidth - newWidth) / 2}px`;
                output_canvas.style.transform = 'scaleX(-1)';
            }
            
            console.log('Video metadata loaded and dimensions adjusted', 
                webcam.videoWidth, 'x', webcam.videoHeight);
        });
    }

    async function startCamera() {
        if (!poseLandmarker) {
            console.log('PoseLandmarker not loaded yet.');
            return;
        }

        const constraints = updateVideoConstraints();
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            webcam.srcObject = stream;
            console.log('Webcam stream obtained:', stream);

            webcam.addEventListener('loadedmetadata', () => {
                output_canvas.width = webcam.videoWidth;
                output_canvas.height = webcam.videoHeight;
                console.log('Canvas size set to:', output_canvas.width, 'x', output_canvas.height);
                applyFullScreenVideoFitting();
                webcam.play().then(() => console.log('Webcam is playing')).catch(err => console.error('Error playing webcam:', err));
            });
        } catch (error) {
            console.error('Error accessing webcam:', error);
        }
    }

    // Apply full-screen video fitting prioritizing height
    function applyFullScreenVideoFitting() {
        // Make sure container fills the viewport
        containerElement.style.height = '100vh';
        containerElement.style.width = '100vw';
        containerElement.style.position = 'relative';
        containerElement.style.backgroundColor = 'black';
        containerElement.style.overflow = 'hidden';

        // Force video to fill height and center horizontally
        webcam.style.height = '100%';
        webcam.style.width = 'auto'; // Auto width to maintain aspect ratio
        webcam.style.position = 'absolute';
        webcam.style.objectFit = 'none'; // Don't use object-fit, we'll position manually
        webcam.style.left = '50%';
        webcam.style.top = '0';
        webcam.style.transform = 'translateX(-50%) scaleX(-1)'; // Center horizontally and mirror
        webcam.style.minHeight = '100vh';
        webcam.style.maxWidth = 'none';

        // Match canvas to video
        output_canvas.style.height = '100%';
        output_canvas.style.width = 'auto';
        output_canvas.style.position = 'absolute';
        output_canvas.style.left = '50%';
        output_canvas.style.top = '0';
        output_canvas.style.transform = 'translateX(-50%) scaleX(-1)';
        output_canvas.style.minHeight = '100vh';
        output_canvas.style.maxWidth = 'none';

        console.log('Applied forced full height video fitting');
    }

    function stopCamera() {
        if (webcam.srcObject) {
            webcam.srcObject.getTracks().forEach((track) => track.stop());
            webcam.srcObject = null;
        }
        if (canvasCtx) canvasCtx.clearRect(0, 0, output_canvas.width, output_canvas.height);
        progressValue = 0;
        if (animationFrame) cancelAnimationFrame(animationFrame);
    }

    // Helper function to format time
    function formatTime(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function handleResize() {
        if (!webcam || !output_canvas) return;
        output_canvas.width = webcam.videoWidth;
        output_canvas.height = webcam.videoHeight;
        applyFullScreenVideoFitting();
        console.log('Resized: Canvas dimensions set to', output_canvas.width, 'x', output_canvas.height);
    }

    onMount(() => {
        webcam = document.getElementById('webcam') as HTMLVideoElement;
        output_canvas = document.getElementById('output_canvas') as HTMLCanvasElement;
        canvasCtx = output_canvas.getContext('2d')!;
        containerElement = document.getElementById('webcam-container') as HTMLDivElement;
        
        poseLandmarkerStore.subscribe((value) => {
            poseLandmarker = value;
            console.log('PoseLandmarker loaded:', poseLandmarker);
        });

        // Add the setup function
        setupVideo();
        
        // Initial application of full-screen fitting
        applyFullScreenVideoFitting();

        // Add resize and orientation event listeners
        window.addEventListener('resize', () => {
            handleResize();
            // Reapply our forced sizing after a short delay to ensure dimensions are updated
            setTimeout(applyFullScreenVideoFitting, 100);
        });
        window.addEventListener('orientationchange', () => {
            handleResize();
            // Reapply with a longer delay for orientation changes
            setTimeout(applyFullScreenVideoFitting, 500);
        });
    });

    onDestroy(() => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        if (webcam?.srcObject) webcam.srcObject.getTracks().forEach((track) => track.stop());
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
        <video
            id="webcam"
            autoplay
            playsinline
        ></video>
        <canvas
            id="output_canvas"
            class="pointer-events-none"
        ></canvas>

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

    <!-- Drawer content -->
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