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

	// Asanas data
	const asanas = [
		{ 
			name: 'Wheel Pose', 
			duration: '20 min', 
			image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
			reps: 3,
			score: 98
		},
		{ 
			name: 'Warrior II', 
			duration: '40 min', 
			image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
			reps: 0,
			score: 0
		},
		{ 
			name: 'Tree Pose', 
			duration: '15 min', 
			image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
			reps: 0,
			score: 0
		},
		{ 
			name: 'Cobra Pose', 
			duration: '25 min', 
			image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
			reps: 0,
			score: 0
		}
	];

	// Drawer control
	function handleDrawerToggle() {
		switch(drawerState) {
			case 'closed':
				drawerState = 'partial';
				break;
			case 'partial':
				drawerState = 'full';
				break;
			case 'full':
				drawerState = 'closed';
				break;
		}
	}

	$: drawerTranslation = {
		'closed': '90%',
		'partial': '62%',
		'full': '0%'
	}[drawerState];

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

	function handleBack() {
		if (browser) {
			if (window.history.length > 2) {
				window.history.go(-1);
			} else {
				goto('/');
			}
		}
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
		if (progressInterval) {
			clearInterval(progressInterval);
			progressInterval = null;
		}
		stopCamera();
		goto('/yoga/3');
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
			webcam.addEventListener('loadeddata', () => {
				updateCanvasDimensions();
				predictWebcam();
			});
		} catch (error) {
			console.error('Error accessing webcam:', error);
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

	function updateCanvasDimensions() {
		if (!webcam || !output_canvas || !containerElement) return;
		const containerWidth = containerElement.offsetWidth;
		const containerHeight = containerWidth * (16 / 9);
		output_canvas.width = containerWidth;
		output_canvas.height = containerHeight;
	}

	function handleResize() {
		setTimeout(async () => {
			updateCanvasDimensions();
			if (status === 'playing') {
				stopCamera();
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

	// Helper function to format time
	function formatTime(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
</script>

<div class="h-screen flex flex-col overflow-hidden relative w-full">
	<!-- Video Container -->
	<div id="webcam-container" class="flex-grow relative rounded-t-3xl">
		<video
			id="webcam"
			autoplay
			playsinline
			class="w-full h-full object-cover transition-all duration-300"
			style="transform: scaleX(-1); outline: none; border: none;"
		></video>
		<canvas
			id="output_canvas"
			class="absolute top-0 left-0 w-full h-full pointer-events-none"
			style="transform: scaleX(-1);"
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
			<div class="flex items-center  justify-around mt-4">
				<div class="flex w-full justify-between">
					<div class="flex items-center px-4 py-3 rounded-lg border-2 border-orange-500">
						<div class="flex flex-col mr-8">
							<div class="text-3xl"><img src={target} alt="Target"></div>
							<div class="text-xl text-gray-800">Reps</div>
						</div>
						<div class="text-5xl ml-4 text-gray-800">3</div>
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