<script lang="ts">
  import { onMount } from 'svelte';

  let videoElement: HTMLVideoElement;
  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let stream: MediaStream | null = null;
  let animationFrameId: number;
  let dimensions: string = "Waiting for camera...";

  // Constraints requesting 1280x720
  function getConstraints(): MediaStreamConstraints {
    return {
      video: {
        width: { exact: 1280 },  // Request 1280x720 explicitly
        height: { exact: 720 }
      },
      audio: false
    };
  }

  // Set canvas to screen size
  function setCanvasDimensions() {
    if (canvasElement) {
      canvasElement.width = window.innerWidth;
      canvasElement.height = window.innerHeight;
    }
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

      // Log actual dimensions
      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          const settings = videoTrack.getSettings();
          console.log('Actual webcam dimensions:', settings.width, 'x', settings.height);
          dimensions = `${settings.width} x ${settings.height}`;
          resolve();
        };
      });

      await videoElement.play();
      renderVideo();
    } catch (error) {
      console.error('Error accessing the camera:', error);
    }
  }

  // Render video to fit canvas
  function renderVideo() {
    if (!videoElement || videoElement.readyState !== 4 || !ctx) {
      animationFrameId = requestAnimationFrame(renderVideo);
      return;
    }

    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    animationFrameId = requestAnimationFrame(renderVideo);
  }

  onMount(() => {
    setCanvasDimensions();
    ctx = canvasElement.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context from canvas');
      return;
    }

    startCamera();

    return () => {
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
  <div class="dimensions">Dimensions: {dimensions}</div>
  <canvas bind:this={canvasElement}></canvas>
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
  }

  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>