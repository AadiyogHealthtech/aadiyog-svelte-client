<script lang="ts">
  import { onMount } from 'svelte';
  import { PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
  import { poseLandmarkerStore } from '$lib/store/poseLandmarkerStore';
  
  let videoElement: HTMLVideoElement;
  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let stream: MediaStream | null = null;
  let animationFrameId: number;
  let dimensions: string = "Waiting for camera...";
  let containerElement: HTMLDivElement;
  let isMobile: boolean = false;
  let poseLandmarker: PoseLandmarker | null = null;
  let drawingUtils: DrawingUtils | null = null;
  
  // Detect if we're on a mobile device
  function detectMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  function getConstraints(): MediaStreamConstraints {
    isMobile = detectMobileDevice();
    
    if (isMobile) {
      return {
        video: {
          width: { min: 720, ideal: 1080 },
          height: { min: 1280, ideal: 1920 },
          facingMode: "user"
        },
        audio: false
      };
    } else {
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
    
    console.log(`Container: ${containerWidth}x${containerHeight}`);
    
    canvasElement.width = containerWidth;
    canvasElement.height = containerHeight;
    
    const scaleX = containerWidth / videoWidth;
    const scaleY = containerHeight / videoHeight;
    
    canvasElement.dataset.scaleX = scaleX.toString();
    canvasElement.dataset.scaleY = scaleY.toString();
    
    if (isMobile) {
      canvasElement.style.width = `${containerWidth}px`;
      canvasElement.style.height = `${containerHeight}px`;
      canvasElement.style.position = 'absolute';
      canvasElement.style.left = '0px';
      canvasElement.style.top = '0px';
      canvasElement.style.transform = '';
    } else {
      canvasElement.style.width = `${containerWidth}px`;
      canvasElement.style.height = `${containerHeight}px`;
      canvasElement.style.position = 'absolute';
      canvasElement.style.left = '0px';
      canvasElement.style.top = '0px';
      canvasElement.style.transform = '';
    }
    
    console.log(`Canvas: ${canvasElement.width}x${canvasElement.height}, isMobile: ${isMobile}`);
  }
  
  // Initialize the pose landmarker
  async function initPoseLandmarker() {
    const storedLandmarker = $poseLandmarkerStore;
    if (storedLandmarker) {
      poseLandmarker = storedLandmarker;
      console.log("Using pose landmarker from store:", poseLandmarker);
    } else {
      try {
        console.log("Creating new pose landmarker");
        const vision = await import('@mediapipe/tasks-vision');
        
        poseLandmarker = await vision.PoseLandmarker.createFromOptions({
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1
        });
        
        poseLandmarkerStore.set(poseLandmarker);
        console.log("Pose landmarker created:", poseLandmarker);
      } catch (error) {
        console.error("Error initializing pose landmarker:", error);
      }
    }
    
    if (ctx) {
      drawingUtils = new DrawingUtils(ctx);
      console.log("DrawingUtils initialized:", drawingUtils);
    } else {
      console.error("Canvas context not available for DrawingUtils");
    }
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
  
      isMobile = detectMobileDevice();
      console.log("Device detected as", isMobile ? "mobile" : "desktop");
  
      const constraints = getConstraints();
      console.log('Trying camera with constraints:', constraints);
      
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn('Failed with initial constraints, falling back to basic config:', err);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }
  
      videoElement.srcObject = stream;
  
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      console.log('Webcam capabilities:', capabilities);
  
      if (isMobile) {
        try {
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
  
      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          const settings = videoTrack.getSettings();
          const actualWidth = settings.width || videoElement.videoWidth;
          const actualHeight = settings.height || videoElement.videoHeight;
          
          console.log('Actual camera dimensions:', actualWidth, 'x', actualHeight);
          dimensions = `${actualWidth} x ${actualHeight}`;
          
          updateCanvasSize(actualWidth, actualHeight);
          
          resolve();
        };
      });
  
      await initPoseLandmarker();
      await videoElement.play();
      console.log("Video playing, starting render loop");
      renderVideo();
    } catch (error) {
      console.error('Error accessing the camera:', error);
      dimensions = "Camera error: " + (error as Error).message;
    }
  }
  
  // Process video frame for pose detection
  function detectPose(timestamp: number) {
    if (!poseLandmarker || !videoElement || videoElement.readyState !== 4) {
      console.log("Pose detection skipped: ", { poseLandmarker: !!poseLandmarker, videoReady: videoElement?.readyState });
      return null;
    }
  
    try {
      const results = poseLandmarker.detectForVideo(videoElement, timestamp);
      console.log("Pose detection results:", results);
      return results;
    } catch (error) {
      console.error('Error detecting pose:', error);
      return null;
    }
  }
  
  // Render video to canvas with horizontal flip and skeleton
  function renderVideo() {
    if (!videoElement || videoElement.readyState !== 4 || !ctx) {
      console.log("Render skipped: ", { videoReady: videoElement?.readyState, ctx: !!ctx });
      animationFrameId = requestAnimationFrame(renderVideo);
      return;
    }
  
    const timestamp = performance.now();
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    const containerWidth = canvasElement.width;
    const containerHeight = canvasElement.height;
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    
    const videoRatio = videoWidth / videoHeight;
    const containerRatio = containerWidth / containerHeight;
    
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
    
    if (videoRatio > containerRatio) {
      drawWidth = containerWidth;
      drawHeight = containerWidth / videoRatio;
      offsetY = (containerHeight - drawHeight) / 2;
    } else {
      drawHeight = containerHeight;
      drawWidth = containerHeight * videoRatio;
      offsetX = (containerWidth - drawWidth) / 2;
    }
    
    // Draw the video with mirroring
    ctx.save();
    ctx.scale(-1, 1); // Flip horizontally
    ctx.translate(-containerWidth, 0);
    ctx.drawImage(videoElement, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
    
    // Draw pose landmarks and connections
    if (poseLandmarker && drawingUtils) {
      const results = detectPose(timestamp);
      
      if (results && results.landmarks && results.landmarks.length > 0) {
        console.log("Drawing skeleton with landmarks:", results.landmarks);
        
        // Save context for drawing landmarks
        ctx.save();
        ctx.scale(-1, 1); // Mirror landmarks to match video
        ctx.translate(-containerWidth, 0);
        
        const landmarkScaleX = drawWidth / videoWidth;
        const landmarkScaleY = drawHeight / videoHeight;
        
        for (const landmarks of results.landmarks) {
          const scaledLandmarks = landmarks.map(landmark => {
            const scaledX = offsetX + landmark.x * drawWidth;
            const scaledY = offsetY + landmark.y * drawHeight;
            console.log(`Landmark: x=${scaledX}, y=${scaledY}, visibility=${landmark.visibility}`);
            return {
              x: scaledX,
              y: scaledY,
              z: landmark.z,
              visibility: landmark.visibility
            };
          });
          
          // Use DrawingUtils to draw landmarks and connectors
          drawingUtils.drawLandmarks(scaledLandmarks, {
            radius: 5,
            color: '#FF0000',
            lineWidth: 2
          });
          
          drawingUtils.drawConnectors(scaledLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 3
          });
  
          // Fallback: Manually draw points to ensure visibility
          ctx.fillStyle = '#FF0000';
          scaledLandmarks.forEach(landmark => {
            if (landmark.visibility && landmark.visibility > 0.5) {
              ctx.beginPath();
              ctx.arc(landmark.x, landmark.y, 5, 0, 2 * Math.PI);
              ctx.fill();
            }
          });
        }
        
        ctx.restore();
      } else {
        console.log("No landmarks detected:", results);
      }
    } else {
      console.log("PoseLandmarker or DrawingUtils not available:", { poseLandmarker: !!poseLandmarker, drawingUtils: !!drawingUtils });
    }
  
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
    
    setTimeout(() => {
      startCamera();
    }, 100);
  
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
      width: 100vw;
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
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  </style>