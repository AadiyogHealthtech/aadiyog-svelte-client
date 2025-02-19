<script lang="ts">
	import { onMount } from 'svelte';
	import { Holistic } from '@mediapipe/holistic';
	import { Camera } from '@mediapipe/camera_utils';
	import { goto } from '$app/navigation';
  
	let videoElement: HTMLVideoElement | null = null;
	let canvasElement: HTMLCanvasElement | null = null;
	let canvasCtx: CanvasRenderingContext2D | null = null;
	let userScore = 0;
	let progressValue = 80;
  
	// Initialize MediaPipe Holistic
	function initializeMediaPipe() {
	  const holistic = new Holistic({
		locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
	  });
  
	  holistic.setOptions({
		modelComplexity: 1,
		smoothLandmarks: true,
		enableSegmentation: true,
		smoothSegmentation: true,
		minDetectionConfidence: 0.5,
		minTrackingConfidence: 0.5,
	  });
  
	  holistic.onResults((results) => {
		console.log('Keypoints:', results.poseLandmarks); // Log keypoints
		processResults(results);
		drawResults(results);
	  });
  
	  if (videoElement) {
		const camera = new Camera(videoElement, {
		  onFrame: async () => {
			await holistic.send({ image: videoElement });
		  },
		  width: window.innerWidth, // Take full width of the window
		  height: window.innerHeight, // Optional: adjust height dynamically
		});
		camera.start();
	  }
	}
  
	// Process detection results
	function processResults(results) {
	  if (results.poseLandmarks) {
		updateScore(true);
	  } else {
		updateScore(false);
	  }
	}
  
	// Update user score based on detection
	function updateScore(detected) {
	  if (detected) {
		userScore += 1;
	  } else {
		userScore -= 1;
	  }
	}
  
	// Draw results on the canvas
	function drawResults(results) {
	  if (!canvasElement || !canvasCtx) return;
  
	  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
	  if (results.poseLandmarks) {
		drawConnectors(canvasCtx, results.poseLandmarks, [
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
		  [28, 32],
		]);
  
		drawLandmarks(canvasCtx, results.poseLandmarks, {
		  color: '#FF0000',
		  radius: 5,
		});
	  }
	}
  
	// Utility function: Draw landmarks (dots)
	function drawLandmarks(ctx, landmarks, options) {
	  ctx.fillStyle = options.color;
	  landmarks.forEach((landmark) => {
		const { x, y } = landmark;
		const cx = x * canvasElement.width;
		const cy = y * canvasElement.height;
		ctx.beginPath();
		ctx.arc(cx, cy, options.radius, 0, 2 * Math.PI);
		ctx.fill();
	  });
	}
  
	// Utility function: Draw connections (lines)
	function drawConnectors(ctx, landmarks, connections, options = { color: '#00FF00', lineWidth: 2 }) {
	  ctx.strokeStyle = options.color;
	  ctx.lineWidth = options.lineWidth;
  
	  connections.forEach(([startIdx, endIdx]) => {
		const start = landmarks[startIdx];
		const end = landmarks[endIdx];
		if (!start || !end) return;
  
		const startX = start.x * canvasElement.width;
		const startY = start.y * canvasElement.height;
		const endX = end.x * canvasElement.width;
		const endY = end.y * canvasElement.height;
  
		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();
	  });
	}
  
	// Handle back button
	function handleBack() {
	  if (window.history.length > 2) {
		history.go(-1);
	  } else {
		goto('/');
	  }
	}
  
	// Start MediaPipe on component mount
	onMount(() => {
	  if (videoElement && canvasElement) {
		canvasElement.width = window.innerWidth; // Set canvas to full window width
		canvasElement.height = window.innerHeight; // Adjust height as needed
		canvasCtx = canvasElement.getContext('2d');
	  }
  
	  if (!canvasCtx) {
		console.error('Failed to initialize canvas context');
	  }
  
	  initializeMediaPipe();
	});
</script>

<div class="h-screen flex flex-col items-center justify-center">
	<div class="flex w-full justify-between px-10">
	  <button on:click={handleBack} class="bg-gray-500 text-white px-4 py-2 rounded">
		Back
	  </button>
	  <p class="text-lg">Score: {userScore}</p>
	</div>
  
	<div class="relative w-full h-[75vh] bg-gray-200 border rounded-lg">
	  <video bind:this={videoElement} autoplay playsinline class="absolute w-full h-full object-cover"></video>
	  <canvas bind:this={canvasElement} class="absolute w-full h-full"></canvas>
	</div>
</div>
