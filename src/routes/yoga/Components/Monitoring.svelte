<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { poseLandmarkerStore } from '$lib/store/poseLandmarkerStore';

	// UI variables
	let progressValue = 0;
	let isFullBodyVisible = false;

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

	// Smoothing variables
	let previousLandmarksBuffer: any[] = [];
	const SMOOTHING_FACTOR = 0.7;
	const BUFFER_SIZE = 3;
	const VISIBILITY_THRESHOLD = 0.5;

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

	const POSE_CONNECTIONS = PoseLandmarker.POSE_CONNECTIONS;

	/** Update video constraints based on current screen dimensions */
	function updateVideoConstraints() {
		return {
			video: { 
				facingMode: 'user', 
				aspectRatio: window.innerWidth / window.innerHeight,
				width: { ideal: window.innerWidth }, 
				height: { ideal: window.innerHeight } 
			}
		};
	}

	/** Navigate back based on history */
	function handleBack() {
		if (browser) {
			if (window.history.length > 2) {
				window.history.go(-1);
			} else {
				goto('/');
			}
		}
	}

	/** Start or resume the webcam and progress */
	function handlePlay() {
		if (status === 'stopped') {
			sessionStartTime = Date.now();
			totalPausedTime = 0;
			pauseStartTime = null;
			progressValue = 0;
			startCamera();
			status = 'playing';
			progressInterval = setInterval(() => {
				if (status === 'playing' && sessionStartTime !== null) {
					const elapsed = Date.now() - sessionStartTime - totalPausedTime;
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

	/** Pause the webcam and progress */
	function handlePause() {
		if (status === 'playing') {
			pauseStartTime = Date.now();
			webcam.pause();
			status = 'paused';
		}
	}

	/** Stop the session and navigate */
	function handleStop() {
		status = 'stopped';
		if (progressInterval) {
			clearInterval(progressInterval);
			progressInterval = null;
		}
		stopCamera();
		goto('/yoga/3');
	}

	/** Start the webcam feed */
	async function startCamera() {
		if (!poseLandmarker) {
			console.log('PoseLandmarker not loaded yet.');
			return;
		}
		
		// Get dynamic constraints based on current screen size
		const constraints = updateVideoConstraints();
		
		try {
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			webcam.srcObject = stream;
			webcam.addEventListener('loadeddata', () => {
				updateCanvasDimensions();
				predictWebcam();
			});
		} catch (error) {
			console.error('Error accessing webcam:', error);
			// Fallback to default constraints if dynamic fails
			const defaultConstraints = {
				video: { facingMode: 'user', aspectRatio: 0.5625, width: { ideal: 375 }, height: { ideal: 667 } }
			};
			try {
				const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
				webcam.srcObject = stream;
				webcam.addEventListener('loadeddata', () => {
					updateCanvasDimensions();
					predictWebcam();
				});
			} catch (fallbackError) {
				console.error('Fallback webcam access failed:', fallbackError);
			}
		}
	}

	/** Stop the webcam feed */
	function stopCamera() {
		if (webcam.srcObject) {
			webcam.srcObject.getTracks().forEach((track) => track.stop());
			webcam.srcObject = null;
		}
		if (canvasCtx) {
			canvasCtx.clearRect(0, 0, output_canvas.width, output_canvas.height);
		}
		progressValue = 0;
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
		}
	}

	/** Update canvas dimensions based on container */
	function updateCanvasDimensions() {
		if (!webcam || !output_canvas || !containerElement) return;
		const containerWidth = containerElement.offsetWidth;
		const containerHeight = containerWidth * (16 / 9);
		output_canvas.width = containerWidth;
		output_canvas.height = containerHeight;
	}

	/** Handle window resize */
	function handleResize() {
		setTimeout(async () => {
			// Update canvas dimensions
			updateCanvasDimensions();

			// If camera is currently active, restart with new constraints
			if (status === 'playing') {
				// Stop current camera stream
				stopCamera();

				// Restart camera with new constraints
				try {
					const constraints = updateVideoConstraints();
					const stream = await navigator.mediaDevices.getUserMedia(constraints);
					webcam.srcObject = stream;
					webcam.addEventListener('loadeddata', () => {
						updateCanvasDimensions();
						predictWebcam();
					});
				} catch (error) {
					console.error('Error restarting camera with new constraints:', error);
					// Fallback to default constraints if dynamic fails
					const defaultConstraints = {
						video: { facingMode: 'user', aspectRatio: 0.5625, width: { ideal: 375 }, height: { ideal: 667 } }
					};
					try {
						const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
						webcam.srcObject = stream;
						webcam.addEventListener('loadeddata', () => {
							updateCanvasDimensions();
							predictWebcam();
						});
					} catch (fallbackError) {
						console.error('Fallback camera restart failed:', fallbackError);
					}
				}
			}
		}, 200);
	}

	/** Predict and draw pose landmarks */
	async function predictWebcam() {
		if (status !== 'playing' || !poseLandmarker || !canvasCtx) return;
		updateCanvasDimensions();
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

					if (validFrames === 0) return { ...landmark };

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

				const drawingUtils = new DrawingUtils(canvasCtx);
				canvasCtx.lineWidth = 2;
				drawingUtils.drawConnectors(averagedLandmarks, POSE_CONNECTIONS, { color: 'white' });
				drawingUtils.drawLandmarks(averagedLandmarks, { color: '#ff0364', radius: 3 });

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
		if (status === 'playing') {
			animationFrame = requestAnimationFrame(predictWebcam);
		}
	}

	onMount(() => {
		webcam = document.getElementById('webcam') as HTMLVideoElement;
		output_canvas = document.getElementById('output_canvas') as HTMLCanvasElement;
		canvasCtx = output_canvas.getContext('2d')!;
		containerElement = document.getElementById('webcam-container') as HTMLDivElement;
		poseLandmarkerStore.subscribe((value) => (poseLandmarker = value));
		window.addEventListener('resize', handleResize);
		window.addEventListener('orientationchange', handleResize);
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

	const yogName = 'Yoga Name';
</script>

<div class="h-screen flex flex-col overflow-hidden">


	<!-- Feedback Area (from first component) -->
	<div class="w-full bg-white flex flex-col items-center py-4">
		<h2 class="text-black font-sans text-xl font-bold mb-4">Feedback Area</h2>
		<div class="flex justify-evenly w-full space-x-4 px-4">
			<div class="bg-gray-200 border border-gray-300 rounded p-4 w-full h-10 flex items-center justify-center">
				<span class="text-black font-sans text-lg">54</span>
			</div>
			<div class="bg-gray-200 border border-gray-300 rounded p-4 w-full h-10 flex items-center justify-center">
				<span class="text-black font-sans text-lg">54</span>
			</div>
			<div class="bg-gray-200 border border-gray-300 rounded p-4 w-full h-10 flex items-center justify-center">
				<span class="text-black font-sans text-lg">54</span>
			</div>
		</div>
	</div>

	<!-- Video and Progress Bars Container -->
	<div class="flex justify-between w-full gap-4 p-4 flex-grow-0 h-[calc(100vh-160px)]">
		<div class="relative w-4 bg-gray-200 rounded" style="height: 100%;">
			<div
				class="absolute bottom-0 w-full bg-orange-500 rounded"
				style="height: {progressValue}%"
			></div>
		</div>

		<div
			id="webcam-container"
			class="flex-grow bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden"
			style="height: 100%;"
		>
			<video
				id="webcam"
				autoplay
				playsinline
				class="w-full h-full object-cover rounded-lg transition-all duration-300"
				style="border: 4px solid {isFullBodyVisible ? '#22c55e' : '#ef4444'}; transform: scaleX(-1);"
			></video>
			<canvas
				id="output_canvas"
				class="w-full h-full absolute top-0 left-0 pointer-events-none"
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

		<div class="relative w-4 bg-gray-200 rounded" style="height: 100%;">
			<div
				class="absolute bottom-0 w-full bg-orange-500 rounded"
				style="height: {progressValue}%"
			></div>
		</div>
	</div>

	<!-- Footer with controls (from first component) -->
	<footer class="bg-white  flex justify-evenly space-x-12 h-12 border-black">
		<button on:click={handlePlay} class="p-1 rounded-full hover:bg-gray-200" aria-label="Play">
			<svg class="w-6 h-6 text-black" viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
				<path d="M10 8l6 4-6 4V8z" fill="currentColor" />
			</svg>
		</button>
		<button on:click={handlePause} class="p-1 rounded-full hover:bg-gray-200" aria-label="Pause">
			<svg class="w-6 h-6 text-black" viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
				<rect x="9" y="8" width="2" height="8" fill="currentColor" />
				<rect x="13" y="8" width="2" height="8" fill="currentColor" />
			</svg>
		</button>
		<button on:click={handleStop} class="p-1 rounded-full hover:bg-gray-200" aria-label="Stop">
			<svg class="w-6 h-6 text-black" viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
				<rect x="8" y="8" width="8" height="8" fill="currentColor" />
			</svg>
		</button>
	</footer>
</div>