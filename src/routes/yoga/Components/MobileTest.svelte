<script lang="ts">
  import { onMount } from 'svelte';

  let videoElement: HTMLVideoElement;
  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let dimensionsInfo: string = "Waiting for camera...";
  let stream: MediaStream | null = null;
  let facingMode: string = "user"; // Front camera
  let canSwitch: boolean = false;
  let animationFrameId: number;

  // Unconstrained constraints (for debugging original resolution)
  function getUnconstrainedConstraints(): MediaStreamConstraints {
    return {
      video: {
        facingMode
      },
      audio: false
    };
  }

  // Constrained constraints (target 1080x1920 for front camera)
  function getConstrainedConstraints(): MediaStreamConstraints {
    return {
      video: {
        facingMode: "user",
        width: { exact: 1080 },
        height: { exact: 1920 }
      },
      audio: false
    };
  }

  // Set canvas to match screen size
  function setCanvasDimensions() {
    if (canvasElement) {
      canvasElement.width = window.innerWidth;
      canvasElement.height = window.innerHeight;
    }
  }

  // Start camera with fallback
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
            console.log('Original video dimensions (unconstrained):', originalWidth, 'x', originalHeight);
          }
          resolve();
        };
      });
      stream.getTracks().forEach(track => track.stop());

      // Step 2: Set canvas and request constrained stream
      setCanvasDimensions();
      let constraints = getConstrainedConstraints();
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        console.warn('Exact 1080x1920 failed:', error);
        // Fallback to ideal 1080x1920, then 720x1280
        constraints = {
          video: {
            facingMode: "user",
            width: { ideal: 1080 },
            height: { ideal: 1920 }
          },
          audio: false
        };
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (fallbackError) {
          console.warn('Ideal 1080x1920 failed:', fallbackError);
          constraints = {
            video: {
              facingMode: "user",
              width: { ideal: 720 },
              height: { ideal: 1280 }
            },
            audio: false
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
      }
      videoElement.srcObject = stream;

      // Log actual dimensions and update UI
      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          const videoTrack = stream?.getVideoTracks()[0];
          if (videoTrack) {
            const settings = videoTrack.getSettings();
            const actualWidth = settings.width;
            const actualHeight = settings.height;
            const canvasAspectRatio = (canvasElement.width / canvasElement.height).toFixed(2);
            const inputAspectRatio = ((constraints.video.width.exact || constraints.video.width.ideal) / (constraints.video.height.exact || constraints.video.height.ideal)).toFixed(2);
            const outputAspectRatio = (actualWidth! / actualHeight!).toFixed(2);

            console.log('Actual webcam dimensions (constrained):', actualWidth, 'x', actualHeight);

            dimensionsInfo = `
              Canvas: ${canvasElement.width}x${canvasElement.height} (Aspect: ${canvasAspectRatio}),
              Original Video: ${originalWidth}x${originalHeight} (Aspect: ${originalAspectRatio}),
              Video Input (Requested): ${constraints.video.width.exact || constraints.video.width.ideal}x${constraints.video.height.exact || constraints.video.height.ideal} (Aspect: ${inputAspectRatio}),
              Video Output (Actual): ${actualWidth}x${actualHeight} (Aspect: ${outputAspectRatio})
            `;
            console.log('Constrained video metadata loaded:', videoElement.videoWidth, 'x', videoElement.videoHeight);
          }
          resolve();
        };
      });

      await videoElement.play();
      console.log('Video playing, starting render');
      renderVideo();

      canSwitch = true;
    } catch (error) {
      console.error('Error accessing the camera:', error);
      dimensionsInfo = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  // Switch camera (optional, limited to front for now)
  function switchCamera(): void {
    facingMode = facingMode === "user" ? "environment" : "user";
    startCamera();
  }

  // Render video, scaled to fit canvas without cropping
  function renderVideo() {
    if (!videoElement || videoElement.readyState !== 4 || !ctx) {
      animationFrameId = requestAnimationFrame(renderVideo);
      return;
    }

    // Clear canvas with black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Get actual video dimensions
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    const videoAspect = videoWidth / videoHeight;
    const canvasAspect = canvasElement.width / canvasElement.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasAspect > videoAspect) {
      // Canvas is wider: fit to height, add pillarboxes
      drawHeight = canvasElement.height;
      drawWidth = drawHeight * videoAspect;
      offsetX = (canvasElement.width - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Canvas is taller: fit to width, add letterboxes
      drawWidth = canvasElement.width;
      drawHeight = drawWidth / videoAspect;
      offsetX = 0;
      offsetY = (canvasElement.height - drawHeight) / 2;
    }

    // Draw video (mirrored for front camera)
    ctx.save();
    if (facingMode === "user") {
      ctx.scale(-1, 1);
      ctx.drawImage(videoElement, -drawWidth - offsetX, offsetY, drawWidth, drawHeight);
    } else {
      ctx.drawImage(videoElement, offsetX, offsetY, drawWidth, drawHeight);
    }
    ctx.restore();

    animationFrameId = requestAnimationFrame(renderVideo);
  }

  // Handle resize
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
    startCamera(); // Auto-start camera on mount

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