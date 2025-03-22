<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
	// UI variables
	let progressValueLeft = 0; // Left progress bar value
	let progressValueRight = 0; // Right progress bar value
	let isFullBodyVisible = false;

	// Core variables
	let poseLandmarker: PoseLandmarker | undefined;
	let runningMode: 'VIDEO' = 'VIDEO';
	let webcam: HTMLVideoElement;
	let output_canvas: HTMLCanvasElement;
	let canvasCtx: CanvasRenderingContext2D;
	let webcamRunning = false;
	let lastVideoTime = -1;
	let animationFrame: number;
	let containerElement: HTMLDivElement;

	// Progress bar control
	let progressInterval: number | null = null;
	const PROGRESS_DURATION = 60000; // 60 seconds in milliseconds

	// Smoothing variables
	let previousLandmarksBuffer: any[] = [];
	const SMOOTHING_FACTOR = 0.7;
	const BUFFER_SIZE = 3;
	const VISIBILITY_THRESHOLD = 0.5;

	// Essential keypoints for full-body detection
	const ESSENTIAL_PARTS = [
		'left_knee',
		'right_knee',
		'left_elbow',
		'right_elbow',
		'left_wrist',
		'right_wrist',
		'left_ankle',
		'right_ankle',
		'left_shoulder',
		'right_shoulder',
		'left_hip',
		'right_hip'
	];

	const POSE_CONNECTIONS = [
		[0, 1],
		[1, 2],
		[2, 3],
		[3, 7],
		[0, 4],
		[4, 5],
		[5, 6],
		[6, 8],
		[9, 10],
		[11, 12],
		[11, 13],
		[13, 15],
		[15, 17],
		[15, 19],
		[15, 21],
		[17, 19],
		[12, 14],
		[14, 16],
		[16, 18],
		[16, 20],
		[16, 22],
		[18, 20],
		[11, 23],
		[12, 24],
		[23, 24],
		[23, 25],
		[24, 26],
		[25, 27],
		[26, 28],
		[27, 29],
		[28, 30],
		[29, 31],
		[30, 32],
		[27, 31],
		[28, 32]
	];

	function handleBack() {
    console.log('handleBack called');
    if (browser) {
        if (window.history.length > 2) {
            window.history.go(-1);
        } else {
            goto('/');
        }
    }
}

	function handlePlay() {
		if (!webcamRunning) {
			startCamera();
		}
	}

	function handleStop() {
		if (webcamRunning) {
			stopCamera();
		}
		goto('/yoga/3');
	}

	function updateCanvasDimensions() {
		if (!webcam || !output_canvas || !containerElement) return;

		const containerWidth = containerElement.offsetWidth;
		const containerHeight = containerWidth * (16 / 9); // 9:16 ratio

		output_canvas.width = containerWidth;
		output_canvas.height = containerHeight;
	}

	const createPoseLandmarker = async () => {
		const vision = await FilesetResolver.forVisionTasks(
			'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
		);
		poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
			baseOptions: {
				modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
				delegate: 'GPU'
			},
			runningMode: runningMode,
			numPoses: 1
		});
	};

	const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

	async function startCamera() {
		if (!poseLandmarker) {
			console.log('Wait! poseLandmarker not loaded yet.');
			return;
		}

		if (webcamRunning) {
			console.log('Webcam already running.');
			return;
		}

		webcamRunning = true;

		const constraints = {
			video: {
				facingMode: 'user',
				aspectRatio: 0.5625, // 9:16 ratio
				width: { ideal: 375 },
				height: { ideal: 667 }
			}
		};

		try {
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			webcam.srcObject = stream;

			webcam.addEventListener('loadeddata', () => {
				updateCanvasDimensions();
				startProgressBars();
				predictWebcam();
			});
		} catch (err) {
			console.error('Error accessing camera:', err);
			webcamRunning = false;
		}
	}

	function stopCamera() {
		if (!webcamRunning) {
			console.log('Webcam not running.');
			return;
		}

		webcamRunning = false;
		if (webcam.srcObject) {
			webcam.srcObject.getTracks().forEach((track) => track.stop());
			webcam.srcObject = null;
		}
		if (canvasCtx) {
			canvasCtx.clearRect(0, 0, output_canvas.width, output_canvas.height);
		}
		resetProgressBars();
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
		}
	}

	function startProgressBars() {
		let startTime = Date.now();
		progressInterval = setInterval(() => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min((elapsed / PROGRESS_DURATION) * 100, 100);
			progressValueLeft = progress;
			progressValueRight = progress;
			if (progress >= 100) {
				clearInterval(progressInterval!);
			}
		}, 100);
	}

	function resetProgressBars() {
		if (progressInterval) {
			clearInterval(progressInterval);
			progressInterval = null;
		}
		progressValueLeft = 0;
		progressValueRight = 0;
	}

	async function predictWebcam() {
		if (!webcamRunning || !poseLandmarker || !canvasCtx) return;

		if (
			output_canvas.width !== containerElement.offsetWidth ||
			output_canvas.height !== containerElement.offsetWidth * (16 / 9)
		) {
			updateCanvasDimensions();
		}

		let startTimeMs = performance.now();
		if (lastVideoTime !== webcam.currentTime) {
			lastVideoTime = webcam.currentTime;
			const results = poseLandmarker.detectForVideo(webcam, startTimeMs);

			canvasCtx.clearRect(0, 0, output_canvas.width, output_canvas.height);

			if (results.landmarks && results.landmarks.length > 0) {
				const landmarks = results.landmarks[0];

				previousLandmarksBuffer.push([...landmarks]);
				if (previousLandmarksBuffer.length > BUFFER_SIZE) {
					previousLandmarksBuffer.shift();
				}

				const averagedLandmarks = landmarks.map((landmark, i) => {
					let avgX = 0,
						avgY = 0,
						avgZ = 0,
						avgVisibility = 0;
					let validFrames = 0;

					for (const frame of previousLandmarksBuffer) {
						if (i < frame.length && frame[i].visibility >= VISIBILITY_THRESHOLD) {
							avgX += frame[i].x;
							avgY += frame[i].y;
							avgZ += frame[i].z;
							avgVisibility += frame[i].visibility;
							validFrames++;
						}
					}

					if (validFrames === 0) {
						return { ...landmark };
					}

					const smoothed = {
						x: avgX / validFrames,
						y: avgY / validFrames,
						z: avgZ / validFrames,
						visibility: avgVisibility / validFrames
					};

					return {
						x: smoothed.x * SMOOTHING_FACTOR + landmark.x * (1 - SMOOTHING_FACTOR),
						y: smoothed.y * SMOOTHING_FACTOR + landmark.y * (1 - SMOOTHING_FACTOR),
						z: smoothed.z * SMOOTHING_FACTOR + landmark.z * (1 - SMOOTHING_FACTOR),
						visibility: landmark.visibility
					};
				});

				const scaledLandmarks = averagedLandmarks.map((landmark) => {
					const scaledX = landmark.x * output_canvas.width;
					const scaledY = landmark.y * output_canvas.height;
					return {
						x: scaledX / output_canvas.width,
						y: scaledY / output_canvas.height,
						z: landmark.z,
						visibility: landmark.visibility
					};
				});

				const drawingUtils = new DrawingUtils(canvasCtx);
				canvasCtx.lineWidth = 2;
				drawingUtils.drawConnectors(scaledLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
					color: '#00ff00'
				});
				drawingUtils.drawLandmarks(scaledLandmarks, { color: '#ff0364', radius: 3 });

				// Check full body visibility
				const landmarkMap = {
					left_knee: 27,
					right_knee: 28,
					left_elbow: 13,
					right_elbow: 14,
					left_wrist: 15,
					right_wrist: 16,
					left_ankle: 29,
					right_ankle: 30,
					left_shoulder: 11,
					right_shoulder: 12,
					left_hip: 23,
					right_hip: 24
				};

				let visibleEssentialParts = 0;
				ESSENTIAL_PARTS.forEach((part) => {
					const index = landmarkMap[part];
					if (landmarks[index] && landmarks[index].visibility > 0.8) {
						visibleEssentialParts++;
					}
				});

				isFullBodyVisible = visibleEssentialParts >= ESSENTIAL_PARTS.length * 0.8;
			} else {
				isFullBodyVisible = false;
			}
		}

		if (webcamRunning) {
			animationFrame = requestAnimationFrame(predictWebcam);
		}
	}

	function handleResize() {
		setTimeout(() => {
			updateCanvasDimensions();
		}, 200);
	}

	onMount(async () => {
		webcam = document.getElementById('webcam') as HTMLVideoElement;
		output_canvas = document.getElementById('output_canvas') as HTMLCanvasElement;
		canvasCtx = output_canvas.getContext('2d')!;
		containerElement = document.getElementById('webcam-container') as HTMLDivElement;

		await createPoseLandmarker();

		if (hasGetUserMedia()) {
			// Start camera automatically or wait for user action
		} else {
			console.warn('getUserMedia() is not supported by your browser');
		}

		window.addEventListener('resize', handleResize);
		window.addEventListener('orientationchange', handleResize);
	});

	onDestroy(() => {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    if (webcam?.srcObject) {
        webcam.srcObject.getTracks().forEach((track) => track.stop());
    }
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    if (browser) {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
    }
});

	const yogName = 'Yoga Name';


</script>

<div class="h-screen flex flex-col items-center justify-center">
	<div class="px-8 flex flex-row items-center justify-center mb-4">
		<div>
			<button class="absolute top-9 left-8 flex items-center space-x-2" on:click={handleBack}>
				<p class="pl-6 text-2xl font-bold text-center">{yogName}</p>
			</button>
		</div>
	</div>

	<div class="flex justify-between w-full gap-4 relative mb-8">
		<div class="relative w-4 h-[75vh] bg-gray-200 rounded">
			<div
				class="absolute bottom-0 w-full bg-green-500 rounded"
				style="height: {progressValueLeft}%"
			></div>
		</div>

		<div
			id="webcam-container"
			class="w-[80vw] h-[75vh] bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden"
		>
			<video
				id="webcam"
				autoplay
				playsinline
				class="w-1280px h-full object-cover rounded-lg transition-all duration-300"
				style="border: 4px solid {isFullBodyVisible
					? '#22c55e'
					: '#ef4444'}; transform: scaleX(-1);"
			></video>
			<canvas
				id="output_canvas"
				class="w-1280px h-full absolute top-0 left-0 pointer-events-none"
				style="transform: scaleX(-1);"
			></canvas>

			{#if !isFullBodyVisible}
				<div class="absolute top-4 left-0 right-0 flex justify-center">
					<div class="bg-red-500/90 text-white rounded-lg shadow-lg p-3 mx-4 md:mx-0 max-w-sm">
						<div class="flex items-center justify-center space-x-2">
							<svg
								class="w-5 h-5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							<span class="text-sm md:text-base text-center"
								>Please ensure your full body is visible in the frame</span
							>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<div class="relative w-4 h-[75vh] bg-gray-200 rounded">
			<div
				class="absolute bottom-0 w-full bg-green-500 rounded"
				style="height: {progressValueRight}%"
			></div>
		</div>
	</div>

	<div class="absolute bottom-10 flex w-full justify-between px-10">
		<button
			id="play-btn"
			class="bg-green-500 text-white hover:bg-green-700 px-6 py-3 rounded-full w-[100px] text-center"
			on:click={handlePlay}
		>
			Play
		</button>

		<button
			id="stop-btn"
			class="bg-red-500 text-white hover:bg-red-600 px-6 py-3 rounded-full w-[100px] text-center"
			on:click={handleStop}
		>
			Stop
		</button>
	</div>
</div>
