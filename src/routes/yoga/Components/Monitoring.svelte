<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import Back from '$lib/icons/BackIcon.svelte'; // Adjust path as needed
    import Button from '$lib/components/Button/Button.svelte'; // Adjust path as needed
    import CircularCountdown from '$lib/components/countdown/CircularCountdown.svelte'; // Adjust path as needed
    import { goto } from '$app/navigation';
    import { initialiseUserDataRequest } from '$lib/store/userSignupRequestStore'; // Adjust path as needed
    import * as poseDetection from '@tensorflow-models/pose-detection';
    import '@mediapipe/pose'; // Ensure this is included for MediaPipe runtime

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

    function drawKeypoint(ctx: CanvasRenderingContext2D, keypoint: any) {
        if (keypoint && keypoint.score > 0.5) {
            const radius = 8;
            
            // Draw outer circle for better visibility
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, radius + 2, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fill();
            
            // Draw inner circle
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, radius, 0, 2 * Math.PI);
            
            // Color-code points (all green as per your working version)
            ctx.fillStyle = '#00FF00';
            ctx.fill();
            
            // Add keypoint name for debugging (optional)
            if (keypoint.name) {
                ctx.font = '12px Arial';
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 1;
                ctx.textAlign = 'center';
                ctx.fillText(keypoint.name, keypoint.x, keypoint.y - radius - 5);
                ctx.strokeText(keypoint.name, keypoint.x, keypoint.y - radius - 5);
            }
        }
    }

    async function initializeMediaPipe() {
        try {
            const model = poseDetection.SupportedModels.BlazePose;
            const detectorConfig = {
                runtime: 'mediapipe' as const, // Explicitly type runtime
                solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose', // CDN for MediaPipe assets
                modelType: 'full'
            };
            detector = await poseDetection.createDetector(model, detectorConfig);
            console.log('MediaPipe Pose Detector initialized successfully');
        } catch (error) {
            console.error('Failed to initialize MediaPipe Pose Detector:', error);
            throw error; // Re-throw to handle in startCamera
        }
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
            console.error('Error accessing camera or initializing detector:', error);
        }
    }

    async function detectPose() {
        if (!detector || !videoElement || !canvasElement) return;

        const ctx = canvasElement.getContext('2d');
        if (!ctx) return;

        try {
            // Set canvas dimensions to match video display size
            canvasElement.width = videoElement.clientWidth;
            canvasElement.height = videoElement.clientHeight;

            // Detect poses with flipHorizontal: true to match your working localhost version
            const poses = await detector.estimatePoses(videoElement, {
                flipHorizontal: true
            });

            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            if (poses.length > 0) {
                const keypoints = poses[0].keypoints;

                // Check if full body is visible
                isFullBodyVisible = ESSENTIAL_PARTS.every(part => {
                    const keypoint = keypoints.find(k => k.name === part);
                    return keypoint && keypoint.score > 0.5;
                });

                if (isFullBodyVisible) {
                    // Calculate scaling factors based on video and canvas aspect ratios
                    const videoRatio = videoElement.videoWidth / videoElement.videoHeight;
                    const canvasRatio = canvasElement.width / canvasElement.height;

                    let scaleX, scaleY, offsetX = 0, offsetY = 0;

                    if (videoRatio > canvasRatio) {
                        // Video is wider than canvas
                        scaleY = canvasElement.height / videoElement.videoHeight;
                        scaleX = scaleY;
                        const expectedWidth = videoElement.videoWidth * scaleX;
                        offsetX = (canvasElement.width - expectedWidth) / 2;
                    } else {
                        // Video is taller than canvas
                        scaleX = canvasElement.width / videoElement.videoWidth;
                        scaleY = scaleX;
                        const expectedHeight = videoElement.videoHeight * scaleY;
                        offsetY = (canvasElement.height - expectedHeight) / 2;
                    }

                    // Transform keypoints to canvas coordinates and mirror them
                    const canvasWidth = canvasElement.width;
                    const canvasKeypoints = keypoints.map(keypoint => {
                        const scaledX = keypoint.x * scaleX + offsetX;
                        const scaledY = keypoint.y * scaleY + offsetY;
                        return {
                            ...keypoint,
                            x: canvasWidth - scaledX, // Mirror x to align with flipped video
                            y: scaledY
                        };
                    });

                    // Filter essential keypoints
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
        if (detector) {
            detector.dispose(); // Clean up detector
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