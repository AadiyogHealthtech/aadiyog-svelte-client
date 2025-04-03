<script lang="ts">
  import { onMount } from 'svelte';
  
    let videoElement: HTMLVideoElement;
    let canvasElement: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null = null;
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let dimensions: string = "Waiting for camera...";
    let containerElement: HTMLDivElement;
    let isMobile: boolean = false;
    
    // Detect if we're on a mobile device
    function detectMobileDevice(): boolean {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    function getConstraints(): MediaStreamConstraints {
      isMobile = detectMobileDevice();
      
      if (isMobile) {
        // For mobile devices, try to get portrait mode
        return {
          video: {
            width: { min: 720, ideal: 1080 },
            height: { min: 1280, ideal: 1920 },
            facingMode: "user"
          },
          audio: false
        };
      } else {
        // For laptops, don't force portrait constraints
        return {
          video: {
            width: { min: 640, ideal: 1080 },
            height: { min: 480, ideal: 720 },
            facingMode: "user"
          },
          audio: false
        };
      }
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
      if (isMobile && videoWidth < videoHeight) {
        // On mobile with portrait video, fit to height
        scale = containerHeight / videoHeight;
      } else if (videoRatio < containerRatio) {
        // Video is taller than container (relative to width) - constrain by height
        scale = containerHeight / videoHeight;
      } else {
        // Video is wider than container (relative to height) - constrain by width
        scale = containerWidth / videoWidth;
      }
      
      // Apply CSS transform to scale the canvas properly
      canvasElement.style.transform = `scale(${scale})`;
      
      // Center the canvas (important for no zoom cropping effect)
      canvasElement.style.transformOrigin = 'center center';
      
      // Log the dimensions and scale
      console.log(`Canvas: ${canvasElement.width}x${canvasElement.height}, Scale: ${scale}`);
    }
  
    async function startCamera(): Promise<void> {
      try {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
  
        if (!canvasElement || !ctx) {
          console.error('Canvas or context not available');
          return;
        }
  
        // Get appropriate constraints based on device
        const constraints = getConstraints();
        console.log('Trying camera with constraints:', constraints);
        
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
          console.warn('Failed with initial constraints, falling back to basic config:', err);
          
          // Fallback to very basic constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
  
        videoElement.srcObject = stream;
  
        // Log webcam capabilities
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();
        console.log('Webcam capabilities:', capabilities);
  
        // For mobile devices, try to apply better constraints if available
        if (isMobile) {
          try {
            // Try to get the best resolution the device supports
            const idealConstraints = {
              width: { ideal: capabilities.width?.max || 1080 },
              height: { ideal: capabilities.height?.max || 1920 }
            };
            
            await videoTrack.applyConstraints(idealConstraints);
            console.log('Applied additional constraints to mobile track:', idealConstraints);
          } catch (err) {
            console.warn('Could not apply additional mobile constraints:', err);
          }
        }
  
        // Wait for video metadata and update dimensions
        await new Promise<void>((resolve) => {
          videoElement.onloadedmetadata = () => {
            const settings = videoTrack.getSettings();
            const actualWidth = settings.width || videoElement.videoWidth;
            const actualHeight = settings.height || videoElement.videoHeight;
            
            console.log('Actual camera dimensions:', actualWidth, 'x', actualHeight);
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
        dimensions = "Camera error: " + (error as Error).message;
      }
    }
  
    // Render video to canvas
    function renderVideo() {
      if (!videoElement || videoElement.readyState !== 4 || !ctx) {
        animationFrameId = requestAnimationFrame(renderVideo);
        return;
      }
  
      // Clear canvas
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      
      // Draw video frame to canvas (no rotation needed)
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
      transform-origin: center center;
      /* The actual width/height will be set programmatically */
    }
  </style>