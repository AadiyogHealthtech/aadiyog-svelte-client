<script lang="ts">
  import { onMount } from 'svelte';

  let videoElement: HTMLVideoElement;
  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let stream: MediaStream | null = null;
  let animationFrameId: number;
  let dimensions: string = "Waiting for camera...";
  let containerElement: HTMLDivElement;
  
  // Request portrait orientation video
  function getConstraints(): MediaStreamConstraints {
    return {
      video: {
        width: { ideal: 1080 },
        height: { ideal: 1920 },
        aspectRatio: { ideal: 9/16 }, // Portrait aspect ratio
        facingMode: { exact: "user" },
      },
      audio: false
    };
  }

  // Calculate container and canvas size to fit video dimensions
  function updateCanvasSize(videoWidth: number, videoHeight: number) {
    if (!canvasElement || !containerElement) return;
    
    const containerWidth = containerElement.clientWidth;
    const containerHeight = containerElement.clientHeight;
    
    // Set the canvas size to match the video's actual dimensions
    canvasElement.width = videoWidth;
    canvasElement.height = videoHeight;
    
    // Calculate scaling to fit the container while maintaining aspect ratio
    const containerRatio = containerWidth / containerHeight;
    const videoRatio = videoWidth / videoHeight;
    
    let scale;
    if (videoRatio < containerRatio) {
      // Video is taller than container (relative to width) - constrain by height
      scale = containerHeight / videoHeight;
    } else {
      // Video is wider than container (relative to height) - constrain by width
      scale = containerWidth / videoWidth;
    }
    
    // Apply CSS transform to scale the canvas properly
    canvasElement.style.transform = `scale(${scale})`;
    
    // Log the dimensions and scale
    console.log(`Canvas: ${canvasElement.width}x${canvasElement.height}, Scale: ${scale}`);
  }

  // Start camera, log capabilities and actual dimensions
  async function startCamera(): Promise<void> {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (!canvasElement || !ctx) {
        console.error('Canvas or context not available');
        return;
      }

      stream = await navigator.mediaDevices.getUserMedia(getConstraints());
      videoElement.srcObject = stream;

      // Log webcam capabilities
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      console.log('Webcam capabilities:', capabilities);

      // Wait for video metadata and update dimensions
      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          const settings = videoTrack.getSettings();
          const actualWidth = settings.width || videoElement.videoWidth;
          const actualHeight = settings.height || videoElement.videoHeight;
          
          console.log('Actual webcam dimensions:', actualWidth, 'x', actualHeight);
          dimensions = `${actualWidth} x ${actualHeight}`;
          
          // Update canvas to match video dimensions
          updateCanvasSize(actualWidth, actualHeight);
          resolve();
        };
      });

      await videoElement.play();
      renderVideo();
    } catch (error) {
      console.error('Error accessing the camera:', error);
    }
  }

  // Render video to canvas (1:1 mapping now that canvas matches video dimensions)
  function renderVideo() {
    if (!videoElement || videoElement.readyState !== 4 || !ctx) {
      animationFrameId = requestAnimationFrame(renderVideo);
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw the video at actual size (no scaling needed in drawImage)
    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    animationFrameId = requestAnimationFrame(renderVideo);
  }

  // Handle window resize
  function handleResize() {
    if (videoElement && videoElement.videoWidth) {
      updateCanvasSize(videoElement.videoWidth, videoElement.videoHeight);
    }
  }

  onMount(() => {
    ctx = canvasElement.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context from canvas');
      return;
    }

    window.addEventListener('resize', handleResize);
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', handleResize);
    };
  });
</script>

<div class="app-container" bind:this={containerElement}>
  <div class="dimensions">Dimensions: {dimensions}</div>
  <canvas bind:this={canvasElement} class="video-canvas"></canvas>
  <video bind:this={videoElement} playsinline autoplay muted style="display: none;"></video>
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .dimensions {
    position: fixed;
    top: 10px;
    left: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    font-size: 14px;
    z-index: 10;
  }

  :global(body) {
    overflow: hidden;
    background-color: #000;
    height: 100vh;
  }

  .app-container {
    height: 100vh;
    width: 100vw;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  .video-canvas {
    transform-origin: center;
    /* Remove width/height CSS - we'll set actual pixel dimensions programmatically */
  }
</style>