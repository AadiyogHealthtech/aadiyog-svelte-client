<script lang="ts">
  import { onMount } from 'svelte';

  let videoElement: HTMLVideoElement;
  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let dimensionsInfo: string = "Waiting for camera...";
  let stream: MediaStream | null = null;
  let facingMode: string = "user";
  let canSwitch: boolean = false;
  let animationFrameId: number;

  // Function to get unconstrained camera constraints (for original dimensions)
  function getUnconstrainedConstraints(): MediaStreamConstraints {
    return {
      video: {
        facingMode
      },
      audio: false
    };
  }

  // Function to get camera constraints based on canvas size
  function getConstrainedConstraints(): MediaStreamConstraints {
    return {
      video: {
        facingMode,
        width: { ideal: canvasElement?.width || window.innerWidth },
        height: { ideal: canvasElement?.height || window.innerHeight }
      },
      audio: false
    };
  }

  // Set canvas dimensions to match device screen size
  function setCanvasDimensions() {
    if (canvasElement) {
      canvasElement.width = window.innerWidth;
      canvasElement.height = window.innerHeight;
    }
  }

  // Function to start the camera and display video
  async function startCamera(): Promise<void> {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (!canvasElement || !ctx) {
        console.error('Canvas or context not available');
        return;
      }

      // Step 1: Get original video dimensions (unconstrained)
      let originalWidth: number | undefined;
      let originalHeight: number | undefined;
      let originalAspectRatio: string;

      stream = await navigator.mediaDevices.getUserMedia(getUnconstrainedConstraints());
      videoElement.srcObject = stream;
      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          const videoTrack = stream?.getVideoTracks()[0];
          if (videoTrack) {
            const settings = videoTrack.getSettings();
            originalWidth = settings.width;
            originalHeight = settings.height;
            originalAspectRatio = (originalWidth! / originalHeight!).toFixed(2);
            console.log('Original video dimensions:', originalWidth, 'x', originalHeight);
          }
          resolve();
        };
      });
      stream.getTracks().forEach(track => track.stop());

      // Step 2: Set canvas dimensions and request constrained stream
      setCanvasDimensions();
      const constraints = getConstrainedConstraints();
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = stream;

      // Wait for the constrained video to be fully loaded
      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.width = canvasElement.width;
          videoElement.height = canvasElement.height;

          const videoTrack = stream?.getVideoTracks()[0];
          if (videoTrack) {
            const settings = videoTrack.getSettings();
            const canvasAspectRatio = (canvasElement.width / canvasElement.height).toFixed(2);
            const inputAspectRatio = (constraints.video.width.ideal / constraints.video.height.ideal).toFixed(2);
            const outputAspectRatio = (settings.width! / settings.height!).toFixed(2);

            dimensionsInfo = `
              Canvas: ${canvasElement.width}x${canvasElement.height} (Aspect: ${canvasAspectRatio}),
              Original Video: ${originalWidth}x${originalHeight} (Aspect: ${originalAspectRatio}),
              Video Input (Requested): ${constraints.video.width.ideal}x${constraints.video.height.ideal} (Aspect: ${inputAspectRatio}),
              Video Output (Actual): ${settings.width}x${settings.height} (Aspect: ${outputAspectRatio})
            `;
            console.log('Constrained video metadata loaded:', videoElement.videoWidth, 'x', videoElement.videoHeight);
          }
          resolve();
        };
      });

      // Start playback and rendering loop
      await videoElement.play();
      console.log('Video playing, starting render');
      renderVideo();

      canSwitch = true;
    } catch (error) {
      console.error('Error accessing the camera:', error);
      dimensionsInfo = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  // Function to switch cameras
  function switchCamera(): void {
    facingMode = facingMode === "user" ? "environment" : "user";
    startCamera();
  }

  // Function to render video on canvas
  function renderVideo() {
    if (!videoElement || videoElement.readyState !== 4 || !ctx) {
      animationFrameId = requestAnimationFrame(renderVideo);
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

    // Continue rendering loop
    animationFrameId = requestAnimationFrame(renderVideo);
  }

  // Handle window resize
  function handleResize() {
    setCanvasDimensions();
    if (stream) {
      startCamera();
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
    };
  });
</script>

<div class="app-container">
  <div class="info-panel">Dimensions: <span>{dimensionsInfo}</span></div>
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
    object-fit: contain;
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
    white-space: pre-wrap;
  }
</style>