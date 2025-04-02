<script lang="ts">
    import { onMount } from 'svelte';
    import { PoseLandmarker, DrawingUtils, FilesetResolver } from '@mediapipe/tasks-vision';

    let videoElement: HTMLVideoElement;
    let canvasElement: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null = null;
    let dimensions: string = "Waiting for camera...";
    let stream: MediaStream | null = null;
    let facingMode: string = "user";
    let canSwitch: boolean = false;
    let poseLandmarker: PoseLandmarker | null = null;
    let drawingUtils: DrawingUtils | null = null;
    let animationFrameId: number;

    // Function to get camera constraints based on canvas size
    function getConstraints(): MediaStreamConstraints {
      return {
        video: {
          facingMode,
          width: { ideal: canvasElement?.width || window.innerWidth },
          height: { ideal: canvasElement?.height || window.innerHeight }
        },
        audio: false
      };
    }

    // Initialize the pose landmarker
    async function initPoseLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
            delegate: 'GPU' // Use GPU for better performance if available
          },
          runningMode: 'VIDEO', // Use 'VIDEO' mode for continuous detection
          numPoses: 1 // Detect one pose at a time
        });
        drawingUtils = new DrawingUtils(ctx!);
        console.log('PoseLandmarker initialized');
      } catch (error) {
        console.error('Failed to initialize PoseLandmarker:', error);
      }
    }

    // Set canvas dimensions to match viewport
    function setCanvasDimensions() {
      if (canvasElement) {
        canvasElement.width = window.innerWidth;
        canvasElement.height = window.innerHeight;
      }
    }

    // Function to start the camera
    async function startCamera(): Promise<void> {
      try {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        if (!poseLandmarker) {
          await initPoseLandmarker();
        }

        if (!canvasElement || !ctx) {
          console.error('Canvas or context not available');
          return;
        }

        // Set canvas dimensions before requesting the stream
        setCanvasDimensions();
        stream = await navigator.mediaDevices.getUserMedia(getConstraints());
        videoElement.srcObject = stream;

        // Wait for the video to be fully loaded
        await new Promise<void>((resolve) => {
          videoElement.onloadedmetadata = () => {
            videoElement.width = canvasElement.width;
            videoElement.height = canvasElement.height;
            const videoTrack = stream?.getVideoTracks()[0];
            if (videoTrack) {
              const settings = videoTrack.getSettings();
              dimensions = `${settings.width}x${settings.height}, aspectRatio: ${(settings.width! / settings.height!).toFixed(2)}`;
            }
            console.log('Video metadata loaded:', videoElement.videoWidth, 'x', videoElement.videoHeight);
            resolve();
          };
        });

        // Start playback and detection loop
        await videoElement.play();
        console.log('Video playing, starting detection');
        detectPose();

        canSwitch = true;
      } catch (error) {
        console.error('Error accessing the camera:', error);
        dimensions = `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    // Function to switch cameras
    function switchCamera(): void {
      facingMode = facingMode === "user" ? "environment" : "user";
      startCamera();
    }

    // Function to detect pose and draw skeleton
    async function detectPose(timestamp: number = performance.now()) {
      if (!poseLandmarker || !videoElement || videoElement.readyState !== 4 || !ctx || !drawingUtils) {
        animationFrameId = requestAnimationFrame(detectPose);
        return;
      }

      // Clear the canvas
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // Draw video frame (scaled to canvas)
      ctx.save();
      if (facingMode === "user") {
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, -canvasElement.width, 0, canvasElement.width, canvasElement.height);
      } else {
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      }
      ctx.restore();

      try {
        // Detect poses
        const results = await poseLandmarker.detectForVideo(videoElement, timestamp);

        // Draw landmarks and connections
        if (results.landmarks && results.landmarks.length > 0) {
          results.landmarks.forEach((landmarks) => {
            drawingUtils.drawLandmarks(landmarks, { color: '#FF0000', radius: 5 });
            drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
          });
        }
      } catch (error) {
        console.error('Pose detection failed:', error);
      }

      // Continue detection loop
      animationFrameId = requestAnimationFrame(detectPose);
    }

    // Handle window resize
    function handleResize() {
      setCanvasDimensions();
      if (stream) {
        startCamera(); // Restart with new dimensions
      }
    }

    onMount(() => {
      setCanvasDimensions();
      ctx = canvasElement.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2D context from canvas');
        return;
      }

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        if (poseLandmarker) {
          poseLandmarker.close();
        }
      };
    });
</script>

<div class="app-container">
  <div class="info-panel">Camera dimensions: <span>{dimensions}</span></div>
  <canvas bind:this={canvasElement}></canvas>
  <video bind:this={videoElement} playsinline autoplay muted style="display: none;"></video>
  <div class="controls">
    <button on:click={startCamera}>
      {stream ? 'Restart Camera' : 'Start Camera'}
    </button>
    <button on:click={switchCamera} disabled={!canSwitch}>
      Switch Camera
    </button>
  </div>
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: Arial, sans-serif;
    overflow: hidden;
    background-color: #000;
    height: 100vh;
  }

  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    position: relative;
  }

  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain; /* Ensure canvas content scales properly */
  }

  .controls {
    position: fixed;
    bottom: 20px;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 20px;
    z-index: 100;
  }

  button {
    padding: 10px 20px;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 16px;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .info-panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 10px;
    font-size: 14px;
    z-index: 100;
  }
</style>