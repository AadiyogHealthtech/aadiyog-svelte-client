<script lang="ts">
  import { onMount } from 'svelte';
  import '@mediapipe/pose';
  import * as poseDetection from '@tensorflow-models/pose-detection';

  let videoElement: HTMLVideoElement;
  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let dimensions: string = "Waiting for camera...";
  let stream: MediaStream | null = null;
  let facingMode: string = "user";
  let canSwitch: boolean = false;
  let detector: poseDetection.PoseDetector | null = null;
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

  // Initialize the pose detector
  async function initPoseDetector() {
    try {
      const model = poseDetection.SupportedModels.BlazePose;
      const detectorConfig = {
        runtime: 'mediapipe',
        modelType: 'lite',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose'
      };
      detector = await poseDetection.createDetector(model, detectorConfig);
      console.log('Pose detector initialized');
    } catch (error) {
      console.error('Failed to initialize pose detector:', error);
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

      if (!detector) {
        await initPoseDetector();
      }

      if (!canvasElement) {
        console.error('Canvas element not available');
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
  async function detectPose() {
    if (!detector || !videoElement || videoElement.readyState !== 4 || !ctx) {
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
      // Detect poses using the constrained video
      const poses = await detector.estimatePoses(videoElement, {
        flipHorizontal: facingMode === "user"
      });

      // Draw each detected pose
      poses.forEach(pose => {
        drawPoseSkeleton(pose);
      });
    } catch (error) {
      console.error('Pose detection failed:', error);
    }

    // Continue detection loop
    animationFrameId = requestAnimationFrame(detectPose);
  }

  // Function to draw the pose skeleton
  function drawPoseSkeleton(pose: poseDetection.Pose) {
    if (!ctx) return;

    const keypoints = pose.keypoints;
    if (!keypoints || keypoints.length === 0) return;

    // Define connections for skeleton
    const connections = [
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
      ['left_hip', 'left_knee'],
      ['left_knee', 'left_ankle'],
      ['right_hip', 'right_knee'],
      ['right_knee', 'right_ankle'],
      ['nose', 'left_eye'],
      ['left_eye', 'left_ear'],
      ['nose', 'right_eye'],
      ['right_eye', 'right_ear']
    ];

    // Create a keypoint map for easy lookup
    const keypointMap: { [key: string]: poseDetection.Keypoint } = {};
    keypoints.forEach(keypoint => {
      keypointMap[keypoint.name!] = keypoint;
    });

    // Scale coordinates to canvas (matches video dimensions)
    const scaleX = canvasElement.width;
    const scaleY = canvasElement.height;

    // Draw connections
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 4;

    connections.forEach(([from, to]) => {
      const fromKeypoint = keypointMap[from];
      const toKeypoint = keypointMap[to];

      if (fromKeypoint && toKeypoint && fromKeypoint.score > 0.3 && toKeypoint.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(fromKeypoint.x * scaleX, fromKeypoint.y * scaleY);
        ctx.lineTo(toKeypoint.x * scaleX, toKeypoint.y * scaleY);
        ctx.stroke();
      }
    });

    // Draw keypoints
    keypoints.forEach(keypoint => {
      if (keypoint.score > 0.3) {
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(keypoint.x * scaleX, keypoint.y * scaleY, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
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
      if (detector) {
        detector.dispose();
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