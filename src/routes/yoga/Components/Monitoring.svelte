<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import Back from '$lib/icons/BackIcon.svelte';
    import Button from '$lib/components/Button/Button.svelte';
    import CircularCountdown from '$lib/components/countdown/CircularCountdown.svelte';
    import { goto } from '$app/navigation';
    import { initialiseUserDataRequest } from '$lib/store/userSignupRequestStore';
    import * as poseDetection from '@tensorflow-models/pose-detection';
    import '@mediapipe/pose';

    let progressValue = 80;
    let videoElement: HTMLVideoElement | null = null;
    let canvasElement: HTMLCanvasElement | null = null;
    let detector: poseDetection.PoseDetector | null = null;
    let isFullBodyVisible = false;
    let animationFrame: number;

    // Essential keypoints to track
    const ESSENTIAL_PARTS = [
        'left_knee', 'right_knee',
        'left_elbow', 'right_elbow',
        'left_wrist', 'right_wrist',
        'left_ankle', 'right_ankle'
    ];

    function handleBack() {
        if (window.history.length > 2) {
            history.go(-1);
        } else {
            goto('/');
        }
    }

    function handleClick() {
        goto('/yoga/2');
        goto('/');
    }

    function normalizeKeypointsToCanvas(keypoints: any[], canvasWidth: number, canvasHeight: number) {
    if (!keypoints || keypoints.length === 0) return [];

    try {
        // MediaPipe provides normalized coordinates in range [0, 1]
        // We need to scale these to the canvas dimensions
        return keypoints.map(keypoint => ({
            ...keypoint,
            // Convert from normalized [0,1] coordinates to canvas pixel coordinates
            x: keypoint.x * canvasWidth,
            y: keypoint.y * canvasHeight
        }));
    } catch (error) {
        console.error("Error normalizing keypoints to canvas:", error);
        return keypoints;
    }
}

    function drawKeypoint(ctx: CanvasRenderingContext2D, keypoint: any) {
        if (keypoint && keypoint.score > 0.5) {
            // Draw point
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = '#FF0000';
            ctx.fill();

        }
    }


    async function initializeMediaPipe() {
        const model = poseDetection.SupportedModels.BlazePose;
        const detectorConfig = {
            runtime: 'mediapipe',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose',
            modelType: 'full'
        };
        detector = await poseDetection.createDetector(model, detectorConfig);
    }

    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 1280,
                    height: 720,
                    facingMode: 'user'
                } 
            });
            if (videoElement) {
                videoElement.srcObject = stream;
                await initializeMediaPipe();
                detectPose();
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
        }
    }

    async function detectPose() {
    if (!detector || !videoElement || !canvasElement) return;

    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    try {
        // First, ensure the canvas dimensions match the video display size (not necessarily native size)
        canvasElement.width = videoElement.clientWidth;
        canvasElement.height = videoElement.clientHeight;

        // Estimate poses with flipHorizontal set to true to match the mirrored video display
        const poses = await detector.estimatePoses(videoElement, {
            flipHorizontal: true
        });
        
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        if (poses.length > 0) {
            const keypoints = poses[0].keypoints;
            
            // Check visibility
            isFullBodyVisible = ESSENTIAL_PARTS.every(part => {
                const keypoint = keypoints.find(k => k.name === part);
                return keypoint && keypoint.score > 0.5;
            });

            if (isFullBodyVisible) {
                // Calculate the scale factors accounting for how the video is displayed
                // (object-fit: cover can cause portions to be cropped)
                const videoRatio = videoElement.videoWidth / videoElement.videoHeight;
                const canvasRatio = canvasElement.width / canvasElement.height;
                
                let scaleX, scaleY, offsetX = 0, offsetY = 0;
                
                // Determine scaling based on how video fits into the canvas
                if (videoRatio > canvasRatio) {
                    // Video is wider than canvas, so height is matched
                    scaleY = canvasElement.height / videoElement.videoHeight;
                    scaleX = scaleY;
                    // Center horizontally
                    const expectedWidth = videoElement.videoWidth * scaleX;
                    offsetX = (canvasElement.width - expectedWidth) / 2;
                } else {
                    // Video is taller than canvas, so width is matched
                    scaleX = canvasElement.width / videoElement.videoWidth;
                    scaleY = scaleX;
                    // Center vertically
                    const expectedHeight = videoElement.videoHeight * scaleY;
                    offsetY = (canvasElement.height - expectedHeight) / 2;
                }
                
                // Apply scaling to keypoints
                const canvasKeypoints = keypoints.map(keypoint => ({
                    ...keypoint,
                    x: keypoint.x * scaleX + offsetX,
                    y: keypoint.y * scaleY + offsetY
                }));
                
                // Filter for essential keypoints
                const essentialKeypoints = canvasKeypoints.filter(
                    kp => ESSENTIAL_PARTS.includes(kp.name)
                );


                // Draw keypoints
                essentialKeypoints.forEach(keypoint => {
                    drawKeypoint(ctx, keypoint);
                });
            }
        } else {
            isFullBodyVisible = false;
        }
    } catch (error) {
        console.error('Error in pose detection:', error);
    }

    animationFrame = requestAnimationFrame(detectPose);
}

    onMount(() => {
        initialiseUserDataRequest();
        if (canvasElement && videoElement) {
            const resizeCanvas = () => {
                canvasElement.width = videoElement.clientWidth;
                canvasElement.height = videoElement.clientHeight;
            };
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
        }
        startCamera();
    });

    onDestroy(() => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        if (videoElement?.srcObject) {
            const tracks = (videoElement.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
    });

    const yogName = "Annuvittassan";
</script>

<div class="h-screen flex flex-col items-center justify-center">
    <!-- Header -->
    <div class="px-8 flex flex-row items-center justify-center">
        <div>
            <button class="absolute top-9 left-8 flex items-center space-x-2" on:click={handleBack}>
                <p class="pl-6 text-2xl font-bold">{yogName}</p>
            </button>
        </div>
    </div>

    <!-- Camera Section -->
    <div class="flex justify-between w-full gap-4 relative">
        <!-- Left Progress Bar -->
        <div class="relative w-4 h-[75vh] bg-gray-200 rounded">
            <div class="absolute bottom-0 w-full bg-green-500 rounded" style="height: {progressValue}%"></div>
        </div>

        <!-- Video Element for Camera with mirroring applied -->
        <div class="w-[80vw] h-[75vh] bg-gray-200 rounded-lg flex items-center justify-center relative">
            <video 
                bind:this={videoElement} 
                autoplay 
                playsinline 
                class="w-full h-full object-cover rounded-lg transition-all duration-300"
                style="border: 4px solid {isFullBodyVisible ? '#22c55e' : '#ef4444'}; transform: scaleX(-1);"
            />
            <canvas 
                bind:this={canvasElement}
                class="absolute top-0 left-0 w-full h-full pointer-events-none"
                style="transform: scaleX(-1);"
            />

            {#if !isFullBodyVisible}
                <div class="absolute top-4 left-0 right-0 flex justify-center">
                    <div class="bg-red-500/90 text-white rounded-lg shadow-lg p-3 mx-4 md:mx-0 max-w-sm">
                        <div class="flex items-center justify-center space-x-2">
                            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span class="text-sm md:text-base text-center">Please ensure your full body is visible in the frame</span>
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Right Progress Bar -->
        <div class="relative w-4 h-[75vh] bg-gray-200 rounded">
            <div class="absolute bottom-0 w-full bg-green-500 rounded" style="height: {progressValue=20}%"></div>
        </div>
    </div>

    <!-- Buttons -->
    <div class="absolute bottom-10 flex w-full justify-between px-10">
        <Button
            id="play-btn"
            class="bg-green-500 text-white hover:bg-green-600 px-6 py-3 rounded w-[100px] text-center"
        >
            Play
        </Button>

        <Button
            id="stop-btn"
            class="bg-red-500 text-white hover:bg-red-600 px-6 py-3 rounded w-[100px] text-center"
            on:click={() => goto('/yoga/3')}
        >
            Stop
        </Button>
    </div>
</div>