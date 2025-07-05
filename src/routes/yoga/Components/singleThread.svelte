<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { FilesetResolver, PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { poseLandmarkerStore } from '$lib/store/poseLandmarkerStore';
  import target from '$lib/Images/target.svg';
  import award from '$lib/Images/award.svg';
  import pause from '$lib/Images/pause-circle.svg';
  import stop from '$lib/Images/stop-circle.svg';
  import nexticon from "$lib/Images/nexticon.svg";
  import { workoutStore } from '$lib/store/workoutStore';
  import { allWorkouts } from '$lib/store/allWorkouts';
  import { fetchAltExercises } from '$lib/utils/api/fetchAllExercises';
  import { workoutDetails } from '$lib/store/workoutDetailsStore';
  import { getToken } from '$lib/store/authStore';

  // Type Definitions
  type ExerciseStats = {
    [key: string]: {
      rep_done: number;
      score: number;
      timestamp: string;
    };
    total_time?: number;
    holding_time?: number;
    relaxation_time?: number;
    transition_time?: number;
  };

  type WorkoutSummary = {
    yoga_name: string;
    reps: number;
    score: number;
    time: number;
    exercises: ExerciseStats;
    summaryJson: string;
  };

  type Segment = {
    start: number;
    end: number;
    phase: string;
    thresholds: number[];
    facing: string;
    type: string;
    handlerKey?: string;
  };

  type ExercisePlan = {
    [key: string]: {
      json_data: any;
      reps: number;
    };
  };

  // Variables
  let count = 0;
  let jsonDump: string = '';
  let showTransitionLoading = false;
  let nextExerciseTitle = '';
  let transitionProgress = 0;
  const TRANSITION_DURATION = 5000;
  let transitionTimeout: NodeJS.Timeout | null = null;
  let analysisPaused = false;
  let loadingProgress = 0;
  let loadingTotal = 1;
  let showProgressBar = false;
  let progressValue = 0;
  let drawerState: 'partial' | 'full' = 'partial';
  let elapsedMs: number = 0;
  let dimensions: string = 'Waiting for camera...';
  let poseLandmarker: PoseLandmarker | undefined;
  let runningMode: 'VIDEO' = 'VIDEO';
  let webcam: HTMLVideoElement;
  let output_canvas: HTMLCanvasElement;
  let canvasCtx: CanvasRenderingContext2D;
  let animationFrame: number;
  let containerElement: HTMLDivElement;
  let stream: MediaStream | null = null;
  let isMobile: boolean = false;
  let drawingUtils: DrawingUtils | null = null;
  let status: 'stopped' | 'playing' | 'paused' = 'stopped';
  let sessionStartTime: number | null = null;
  let totalPausedTime = 0;
  let pauseStartTime: number | null = null;
  let userInPosition = false;
  let targetBox = { x: 0, y: 0, width: 0, height: 0 };
  let currentReps: number = 0;
  let currentScore: number = 0;
  let detectPoseActive = true;
  let lastPhase: string | null = null;
  let currentPhase: string | null = null;
  let showPhase: boolean = false;
  let phaseTimeout: NodeJS.Timeout | null = null;
  let showModal = false;
  let isInitialized = false;
  let workoutJson = null;
  let yogName: string = "YogaName";
  let showInstructionalModal = false;
  let exerciseData: Array<{ name: string; reps: number; altData: any }> = [];
  let filteredExercises: Array<{ name: string; reps: number; altData: any }> = [];
  let exerciseStats: ExerciseStats = {};
  let currentExerciseName: string = '';
  let transitionKeypoints: any = null;
  let canvasContext: CanvasRenderingContext2D | null = null;
  let safeWidth = window.innerWidth;
  let safeHeight = window.innerHeight;

  // Controller Instance
  let controller: Controller | null = null;
  let operationId = 0;
  let currentTime = 0;
  let controllerInitialized = false;
  let progressInterval: NodeJS.Timeout | null = null;

// Helper Functions

/**
 * Draws selected keypoints and connecting lines on a canvas context
 * @param {CanvasRenderingContext2D} ctx - The canvas context to draw on
 * @param {Array} keypoints - Array of normalized keypoints [x, y] coordinates (0-1 range)
 * @param {Array} indices - Array of indices specifying which keypoints to draw
 * @param {Object} opts - Drawing options (color, lineType, pointRadius)
 */
 function drawSelectedKeypointsAndLines(ctx, keypoints, indices, opts = {}) {
    const { color = 'red', lineType = 'solid', pointRadius = 5 } = opts;

    // Validate inputs
    if (!keypoints || !Array.isArray(keypoints) || !indices || !Array.isArray(indices) || indices.length < 1) {
        return;
    }

    const canvas = ctx.canvas;
    const W = canvas.width;
    const H = canvas.height;

    // Draw keypoints as circles
    ctx.fillStyle = color;
    for (const idx of indices) {
        const pt = keypoints[idx];
        if (!pt) continue;
        const [nx, ny] = pt;
        const cx = nx * W;  // Convert normalized to canvas coordinates
        const cy = ny * H;
        ctx.beginPath();
        ctx.arc(cx, cy, pointRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw connecting lines if there are multiple points
    if (indices.length > 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        // Set line style (solid or dotted)
        if (lineType === 'dotted') {
            ctx.setLineDash([5, 5]);
        } else {
            ctx.setLineDash([]);
        }

        // Draw the connecting path
        ctx.beginPath();
        let first = true;
        for (const idx of indices) {
            const pt = keypoints[idx];
            if (!pt) continue;
            const [nx, ny] = pt;
            const cx = nx * W;
            const cy = ny * H;
            if (first) {
                ctx.moveTo(cx, cy);
                first = false;
            } else {
                ctx.lineTo(cx, cy);
            }
        }
        ctx.stroke();
        ctx.setLineDash([]);  // Reset line dash
    }
}

/**
 * Detects if the current device is mobile
 * @returns {boolean} True if mobile device, false otherwise
 */
function detectMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Gets media constraints based on device type
 * @returns {MediaStreamConstraints} Media constraints for getUserMedia
 */
function getConstraints(): MediaStreamConstraints {
    isMobile = detectMobileDevice();
    return {
        video: { facingMode: 'user' },  // Front camera
        audio: false
    };
}

/**
 * Formats milliseconds into MM:SS format
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

/**
 * Calculates Dynamic Time Warping (DTW) score between two point sets
 * @param {Array} p1 - First set of points
 * @param {Array} p2 - Second set of points
 * @returns {Object} Contains dtwDistance (average distance between points)
 */
function calculateDtwScore(p1, p2) {
    // Ensure inputs are 2D arrays
    if (!Array.isArray(p1[0])) p1 = [p1];
    if (!Array.isArray(p2[0])) p2 = [p2];
    if (p1.length !== p2.length) {
        throw new Error('Point arrays must be the same length');
    }

    // Calculate average Euclidean distance
    let sum = 0;
    const n = p1.length;
    for (let i = 0; i < n; i++) {
        const dx = p2[i][0] - p1[i][0];
        const dy = p2[i][1] - p1[i][1];
        sum += Math.hypot(dx, dy);
    }

    return { dtwDistance: sum / n };
}

/**
 * Checks if a pose matches the ideal pose within thresholds
 * @param {Array} idealKeypoints - Ideal pose keypoints
 * @param {Array} normalizedKeypoints - User's normalized keypoints
 * @param {Array} thresholds - Array of threshold values
 * @returns {boolean} True if pose matches within thresholds
 */
function checkPoseSuccess(idealKeypoints, normalizedKeypoints, thresholds) {
    if (!normalizedKeypoints) return false;
    
    // Calculate DTW scores for different body parts
    const { dtwDistance: dtwWhole } = calculateDtwScore(idealKeypoints, normalizedKeypoints);
    const { dtwDistance: dtwLeftWrist } = calculateDtwScore([idealKeypoints[15]], [normalizedKeypoints[15]]);
    const { dtwDistance: dtwLeftShoulder } = calculateDtwScore([idealKeypoints[11]], [normalizedKeypoints[11]]);
    
    // Check against thresholds
    const isCompleted =
        dtwWhole < thresholds[0] && 
        dtwLeftWrist < thresholds[1] && 
        dtwLeftShoulder < thresholds[2];
    return isCompleted;
}

/**
 * Calculates Euclidean distance between two points
 * @param {Array} p1 - First point [x,y]
 * @param {Array} p2 - Second point [x,y]
 * @returns {number} Distance between points
 */
function calculateEuclideanDistance(p1, p2) {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return Math.hypot(dx, dy);
}

/**
 * Checks bendback pose with visual feedback
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} idealKeypoints - Ideal pose keypoints
 * @param {Array} normalizedKeypoints - User's normalized keypoints
 * @param {Array} hipPoint - Hip reference point
 * @param {Array} thresholds - Threshold values
 * @returns {Array} [ctx, success] - Updated context and success flag
 */
function checkBendback(ctx, idealKeypoints, normalizedKeypoints, hipPoint, thresholds) {
    if (!normalizedKeypoints) {
        return [ctx, false];
    }
    
    // Prepare canvas for drawing
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.translate(ctx.canvas.width, 0);
    ctx.scale(-1, 1);
    
    // Calculate DTW scores for different body parts
    const { dtwDistance: dtwWhole } = calculateDtwScore(idealKeypoints, normalizedKeypoints);
    const { dtwDistance: dtwLeftWrist } = calculateDtwScore([idealKeypoints[15]], [normalizedKeypoints[15]]);
    const { dtwDistance: dtwLeftShoulder } = calculateDtwScore([idealKeypoints[11]], [normalizedKeypoints[11]]);
    const { dtwDistance: dtwTorso } = calculateDtwScore([idealKeypoints[15]], [normalizedKeypoints[15]]);

    // Calculate adaptive thresholds based on body proportions
    const handTh = thresholds[1] * calculateEuclideanDistance(idealKeypoints[15], idealKeypoints[23]);
    const shoulTh = thresholds[2] * calculateEuclideanDistance(idealKeypoints[11], idealKeypoints[23]);

    // Store scores for display
    const scores = {
        'Whole Body': { value: dtwWhole, threshold: thresholds[0] },
        'Hand': { value: dtwLeftWrist, threshold: handTh },
        'Shoulder': { value: dtwLeftShoulder, threshold: shoulTh }
    };

    // Calculate positions in different coordinate systems
    const userRel = normalizedKeypoints[15];  // Relative to hip
    const idealRel = idealKeypoints[15];
    const hipNorm = hipPoint;

    // Convert to absolute normalized coordinates
    const userNorm = [userRel[0] + hipNorm[0], userRel[1] + hipNorm[1]];
    const idealNorm = [idealRel[0] + hipNorm[0], idealRel[1] + hipNorm[1]];

    // Convert to pixel coordinates
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const userPix = [userNorm[0] * width, userNorm[1] * height];
    const idealPix = [idealNorm[0] * width, idealNorm[1] * height];
    const hipPix = [hipNorm[0] * width, hipNorm[1] * height];

    // Calculate distance for debugging
    const Dist = calculateEuclideanDistance(hipPix, idealNorm);
    const DistPix = calculateEuclideanDistance(hipPix, idealPix);
    console.log("Distance between hip and wrist is : ", Dist);

    // Draw target position (red circle)
    const radius = 10;
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(idealPix[0], idealPix[1], radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw guidance arrow (yellow)
    ctx.beginPath();
    ctx.moveTo(userPix[0], userPix[1]);
    ctx.lineTo(idealPix[0], idealPix[1]);
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(idealPix[1] - userPix[1], idealPix[0] - userPix[0]);
    const arrowSize = 10;
    ctx.beginPath();
    ctx.moveTo(idealPix[0], idealPix[1]);
    ctx.lineTo(
        idealPix[0] - arrowSize * Math.cos(angle + Math.PI/6),
        idealPix[1] - arrowSize * Math.sin(angle + Math.PI/6)
    );
    ctx.moveTo(idealPix[0], idealPix[1]);
    ctx.lineTo(
        idealPix[0] - arrowSize * Math.cos(angle - Math.PI/6),
        idealPix[1] - arrowSize * Math.sin(angle - Math.PI/6)
    );
    ctx.stroke();

    // Check if pose is successful
    const success = checkPoseSuccess(
        idealKeypoints,
        normalizedKeypoints,
        [thresholds[0], handTh, shoulTh]
    );
    ctx.restore();
    return [ctx, success];
}

/**
 * Normalizes keypoints relative to hip position
 * @param {Array} landmarks - Input keypoints
 * @returns {Array|null} [normalizedKeypoints, hipPoint] or null if invalid
 */
function normalizeKeypoints(landmarks) {
    // Validate input
    if (!landmarks || !Array.isArray(landmarks) || landmarks.length < 33) {
        console.warn('Invalid landmarks data:', landmarks);
        return null;
    }

    // Convert landmarks to consistent format
    const keypoints = landmarks.map((lm) => {
        if (typeof lm === 'object' && lm.x !== undefined) {
            return [lm.x || 0, lm.y || 0, lm.z || 0];
        }
        return [lm[0] || 0, lm[1] || 0, lm[2] || 0];
    });

    // Use hip as reference point
    const hip = keypoints[24];
    if (!hip || hip.some((coord) => coord === undefined)) {
        console.warn('Hip keypoint is invalid:', hip);
        return null;
    }

    // Normalize all points relative to hip
    const normalized = keypoints.map((point) => [
        point[0] - hip[0],
        point[1] - hip[1],
        point[2] - hip[2]
    ]);

    return [normalized, hip];
}

/**
 * Denormalizes keypoints by adding back hip position
 * @param {Array} normalized - Normalized keypoints
 * @param {Array} hip - Hip reference point
 * @returns {Array|null} Denormalized keypoints or null if invalid
 */
function denormalizeKeypoints(normalized, hip) {
    // Validate inputs
    if (!Array.isArray(normalized) || normalized.length < 33) {
        console.warn('Invalid normalized data:', normalized);
        return null;
    }
    if (!Array.isArray(hip) || hip.length < 3) {
        console.warn('Invalid hip data:', hip);
        return null;
    }

    // Add hip position back to each point
    return normalized.map((point) => [
        (point[0] || 0) + hip[0],
        (point[1] || 0) + hip[1],
        (point[2] || 0) + hip[2]
    ]);
}

/**
 * Calculates normal vector from three points
 * @param {Array} p1 - First point
 * @param {Array} p2 - Second point
 * @param {Array} p3 - Third point
 * @returns {Array} Normalized normal vector
 */
function calculateNormal(p1, p2, p3) {
    // Calculate two vectors from the points
    const v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
    const v2 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];

    // Calculate cross product
    const normal = [
        v1[1] * v2[2] - v1[2] * v2[1],
        v1[2] * v2[0] - v1[0] * v2[2],
        v1[0] * v2[1] - v1[1] * v2[0]
    ];

    // Normalize the vector
    const normMagnitude = Math.sqrt(normal.reduce((sum, val) => sum + val * val, 0));
    const result = normMagnitude !== 0 ? normal.map((val) => val / normMagnitude) : [0, 0, 0];
    return result;
}

/**
 * Detects which direction the user is facing
 * @param {Array} landmarks - Pose landmarks
 * @param {number} xThreshold - X-axis threshold
 * @param {number} yThreshold - Y-axis threshold
 * @param {number} zThreshold - Z-axis threshold
 * @returns {string} Facing direction ('left', 'right', 'up', 'down', 'front', 'back', 'random')
 */
function detectFacing(landmarks, xThreshold = 0.5, yThreshold = 0.5, zThreshold = 0.5) {
    const normalized = normalizeKeypoints(landmarks);
    const keypoints = normalized?.[0];
    if (!keypoints) {
        console.warn('No keypoints available for facing detection');
        return 'random';
    }

    // Use shoulders and hip to determine orientation
    const leftShoulder = keypoints[11];
    const rightShoulder = keypoints[12];
    const rightHip = keypoints[24];

    if (!leftShoulder || !rightShoulder || !rightHip) {
        console.warn('Missing critical keypoints for facing detection');
        return 'random';
    }

    // Calculate normal vector
    const [nx, ny, nz] = calculateNormal(leftShoulder, rightShoulder, rightHip);
    const absNx = Math.abs(nx), absNy = Math.abs(ny), absNz = Math.abs(nz);

    // Determine primary direction
    const directions = {
        x: [nx > 0 ? 'left' : 'right', absNx, xThreshold],
        y: [ny > 0 ? 'up' : 'down', absNy, yThreshold],
        z: [nz > 0 ? 'back' : 'front', absNz, zThreshold]
    };

    // Find direction with strongest component
    const [direction, magnitude, threshold] = Object.values(directions).reduce(
        (max, curr) => (curr[1] > max[1] ? curr : max),
        ['', -1, 0]
    );

    return magnitude > threshold ? direction : 'random';
}

/**
 * Checks visibility of keypoints
 * @param {Array} landmarks - Pose landmarks
 * @returns {Array} [allVisible, missingIndices] - Visibility status and missing indices
 */
function checkKeypointVisibility(landmarks) {
    if (!landmarks || landmarks.length < 33) {
        console.warn('Landmarks incomplete for visibility check:', landmarks);
        return [false, ['all']];
    }
    
    // Check visibility of each landmark
    const missing = [];
    for (let i = 0; i < landmarks.length; i++) {
        if (!landmarks[i].visibility || landmarks[i].visibility < 0.0) {
            missing.push(i);
        }
    }
    return [missing.length === 0, missing];
}

// Controller Classes

/**
 * Base class for all pose phases
 */
class BasePhase {
    constructor(controller) {
        this.controller = controller;
        this.holdDuration = 0;
        this.normalizedKeypoints = null;
        this.hipPoint = 0;
    }

    process(currentTime) {
        throw new Error('Not implemented');
    }
}

/**
 * Phase for starting pose detection
 */
class StartPhase extends BasePhase {
    constructor(controller, targetFacing) {
        super(controller);
        this.targetFacing = targetFacing;
        this.start_time = null;
    }

    process(currentTime) {
        // Detect current facing direction
        const detectedFacing = this.controller.landmarks
            ? detectFacing(this.controller.landmarks)
            : 'random';
            
        const phase = this.controller.segments[this.controller.currentSegmentIdx].phase;
        const expertKeypoints = this.controller.getIdealKeypoints(this.targetFacing);
        const idealStartingKeypoints = this.controller.getNextIdealKeypoints('starting', 0);
        this.thresholds = this.controller.segments[0].thresholds;
        
        // Check if starting pose is correct
        const [_, success] = checkBendback(
            canvasContext,
            idealStartingKeypoints,
            this.controller.normalizedKeypoints,
            this.controller.hipPoint,
            this.thresholds
        );
        
        // Start timer when pose is correct
        if (success && detectedFacing === this.targetFacing) {
            if (this.start_time == null) {
                this.start_time = currentTime;
            } else {
                if (currentTime - this.start_time >= this.holdDuration) {
                    return [phase, true];
                }
            }
        }
        return [phase, false];
    }
}

/**
 * Phase for transition between poses
 */
class TransitionPhase extends BasePhase {
    constructor(controller, startFacing) {
        super(controller);
        this.transitionTimeout = 15;
        this.startFacing = startFacing;
        this.thresholds = null;
        this.phaseStartTime = null;
    }

    process(currentTime) {
        this.phaseStartTime = currentTime;
        const elapsedMs = currentTime - this.controller.startTime;
        const elapsedSec = elapsedMs / 1000;
        const timeLeft = this.transitionTimeout - elapsedMs;

        // Get next segment info
        const nextSegmentIdx = this.controller.currentSegmentIdx + 1;
        const phase = this.controller.segments[nextSegmentIdx].phase;
        this.thresholds = this.controller.segments[nextSegmentIdx].thresholds;
        const idealKeypoints = this.controller.getNextIdealKeypoints(phase, nextSegmentIdx);

        // Check transition progress
        const [_, success] = checkBendback(
            canvasContext,
            idealKeypoints,
            this.controller.normalizedKeypoints,
            this.controller.hipPoint,
            this.thresholds
        );

        // Store transition keypoints for visualization
        const keypoints_to_print = denormalizeKeypoints(idealKeypoints, this.controller.hipPoint);
        if (keypoints_to_print && phase != 'ending') {
            transitionKeypoints = keypoints_to_print;
        }

        // Handle timeout
        if (elapsedMs >= this.transitionTimeout) {
            this.controller.currentSegmentIdx = 0;
        }
        
        // Update timing stats
        const timeInPhaseMs = currentTime - this.phaseStartTime;
        const timeInPhaseSec = timeInPhaseMs / 1000;
        this.controller.total_time = this.controller.total_time + timeInPhaseSec;
        this.controller.transition_time = this.controller.transition_time + timeInPhaseSec;
        
        return [this.controller.segments[this.controller.currentSegmentIdx].phase, success];
    }
}

/**
 * Phase for holding a pose
 */
class HoldingPhase extends BasePhase {
    constructor(controller, thresholds, startFacing) {
        super(controller);
        this._resetTimers();
        this.startFacing = startFacing;
        this.thresholds = thresholds;
        this.holdStartTime = null;
        this.successDuration = 0;
        this.minHoldDuration = 1;
        this.completedHold = false;
        this.exitThresholdMultiplier = 1;
        this.leavePoseTime = null;
        this.phaseEntryTime = null;
    }

    _resetTimers() {
        this.holdStartTime = null;
        this.successDuration = 0;
        this.completedHold = false;
        this.leavePoseTime = null;
        this.phaseEntryTime = null;
    }

    process(currentTime) {
        if (this.phaseEntryTime === null) {
            this.phaseEntryTime = currentTime;
        }

        const phase = this.controller.segments[this.controller.currentSegmentIdx].phase;
        const idealKeypoints = this.controller.getIdealKeypoints(phase);
        
        // Store keypoints for visualization
        const keypoints_to_print = denormalizeKeypoints(idealKeypoints, this.controller.hipPoint);
        if (keypoints_to_print) {
            transitionKeypoints = keypoints_to_print;
        }

        if (this.controller.normalizedKeypoints) {
            // Check pose accuracy
            const [_, success] = checkBendback(
                canvasContext,
                idealKeypoints,
                this.controller.normalizedKeypoints,
                this.controller.hipPoint,
                this.thresholds
            );

            // Calculate distance metrics
            const dx = idealKeypoints[15][0] - this.controller.normalizedKeypoints[15][0];
            const dy = idealKeypoints[15][1] - this.controller.normalizedKeypoints[15][1];
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Update score based on distance
            const raw = Math.min(this.controller.score, (dist / this.thresholds[0] - 1) * -100);
            this.controller.score = Math.trunc(raw);

            // Calculate DTW distances for specific body parts
            const { dtwDistance: dtwLeftWrist } = calculateDtwScore(
                idealKeypoints[15],
                this.controller.normalizedKeypoints[15]
            );
            const { dtwDistance: dtwLeftShoulder } = calculateDtwScore(
                idealKeypoints[11],
                this.controller.normalizedKeypoints[11]
            );

            // Set exit thresholds
            const exitThresholdWrist = this.thresholds[1];
            const exitThresholdShoulder = this.thresholds[2] * this.exitThresholdMultiplier;
            
            // Handle pose abandonment
            if (!success && !this.completedHold) {
                if (this.leavePoseTime === null) {
                    this.leavePoseTime = currentTime;
                }
                const elapsedLeave = currentTime - this.leavePoseTime;
                if (elapsedLeave > this.controller.phaseTimeouts.holdingAbandonment) {
                    const duration = currentTime - this.phaseEntryTime;
                    this.controller.total_time += duration;
                    this.controller.holding_time += duration;
                    this.controller.enterRelaxation();
                    return ['holding', false];
                }
            } else {
                this.leavePoseTime = null;
            }

            // Handle successful hold
            if (success) {
                const duration = currentTime - this.phaseEntryTime;
                this.controller.total_time += duration;
                this.controller.holding_time += duration;
                if (!this.holdStartTime) this.holdStartTime = currentTime;
                this.successDuration = currentTime - this.holdStartTime;
                if (this.successDuration >= this.minHoldDuration && !this.completedHold) {
                    this.completedHold = true;
                }
                return [phase, true];
            } else {
                if (this.completedHold && dtwLeftWrist > 0) {
                    const phaseName = phase.split('_')[1] || phase;
                    this._resetTimers();
                }
            }
        } else {
            this.holdStartTime = null;
            this.successDuration = 0;
            this.completedHold = false;
        }
        return [this.controller.segments[this.controller.currentSegmentIdx].phase, false];
    }
}

/**
 * Phase for ending a pose
 */
class EndingPhase extends BasePhase {
    constructor(controller, targetFacing) {
        super(controller);
        this.targetFacing = targetFacing;
        this.thresholds = null;
    }

    process(currentTime) {
        // Detect current facing direction
        const detectedFacing = this.controller.landmarks
            ? detectFacing(this.controller.landmarks)
            : 'random';
            
        const phase = this.controller.segments[this.controller.currentSegmentIdx].phase;
        const idealEndingKeypoints = this.controller.getNextIdealKeypoints('starting', 0);
        this.thresholds = this.controller.segments[0].thresholds;
        
        // Check if ending pose is correct
        const [_, success] = checkBendback(
            canvasContext,
            idealEndingKeypoints,
            this.controller.normalizedKeypoints,
            this.controller.hipPoint,
            this.thresholds
        );
        
        if (success && detectedFacing === this.targetFacing) {
            return [phase, true];
        }
        return [phase, false];
    }
}

/**
 * Phase for relaxation between poses
 */
class RelaxationPhase extends BasePhase {
    constructor(controller) {
        super(controller);
        this.currentFeedback = 'Relax and breathe';
        this.phaseEntryTime = null;
    }

    process(currentTime) {
        if (this.phaseEntryTime === null) {
            this.phaseEntryTime = currentTime;
        }
        
        // Reset transition data
        this.controller.transitionKeypoints = [];
        this.controller.lastHoldingIdx = -1;
        
        // Calculate duration
        const durationMs = currentTime - this.phaseEntryTime;
        const durationSec = (durationMs / 1000).toFixed(2);

        // Update timing stats
        this.controller.total_time += durationMs;
        this.controller.relaxation_time += durationMs;

        return {
            phase: 'relaxation',
            completed: this.shouldExitRelaxation()
        };
    }

    shouldExitRelaxation() {
        // Check if user is ready to exit relaxation
        const startSegment = this.controller.segments.find((s) => s.type === 'starting');
        if (!startSegment) return false;

        const expertKeypoints = this.controller.getIdealKeypoints(startSegment.phase);
        const userKeypoints = this.controller.normalizedKeypoints;
        const distance = calculateEuclideanDistance(userKeypoints, expertKeypoints);

        const THRESHOLD = 2;
        const userFacing = this.controller.landmarks ? detectFacing(this.controller.landmarks) : null;

        return distance < THRESHOLD && userFacing === startSegment.facing;
    }
}

/**
 * Class for extracting and processing yoga pose data from JSON
 */
class YogaDataExtractor {
    constructor(jsonData) {
        this.data = jsonData;
        this.keypointsData = jsonData?.frames || [];
        this.segmentsData = jsonData?.segments || [];
        this.loadPromise = this.ensureLoaded();
    }

    async ensureLoaded() {
        if (!this.data || !this.segmentsData || !this.keypointsData) {
            console.warn('JSON data not properly provided');
            this.data = { frames: [], segments: [] };
            this.keypointsData = [];
            this.segmentsData = [];
        }
    }

    segments() {
        if (!this.data || !this.segmentsData || !Array.isArray(this.segmentsData)) {
            console.warn('Segments data not available:', this.segmentsData);
            return [];
        }

        // Process each segment from the JSON data
        const segments = this.segmentsData
            .map((s) => {
                try {
                    const idealKeypoints = this.getIdealKeypoints(s[0], s[1]);
                    const middleIdx = Math.floor(idealKeypoints.length / 2);
                    const keypointsFrame = idealKeypoints[middleIdx] || [];
                    
                    // Create segment object
                    const segment = {
                        start: s[0],
                        end: s[1],
                        phase: s[2],
                        thresholds: s[3],
                        facing: detectFacing(keypointsFrame),
                        type: s[2].split('_')[0]
                    };
                    return segment;
                } catch (e) {
                    console.error(`Invalid segment: ${s}`, e);
                    return null;
                }
            })
            .filter((s) => s !== null);
        return segments;
    }

    getIdealKeypoints(startFrame, endFrame) {
        if (!this.keypointsData || !Array.isArray(this.keypointsData)) {
            console.warn('No keypoints data available');
            return [];
        }
        
        // Extract keypoints for specified frame range
        const subData = this.keypointsData.slice(startFrame, endFrame);
        return subData.map((frame) =>
            frame.map((kp) => {
                const [x, y, z] = kp.split(',').slice(0, 3).map(parseFloat);
                return [x || 0, y || 0, z || 0];
            })
        );
    }
}

/**
 * Analyzes transitions between poses
 */
class TransitionAnalyzer {
    constructor(jsonData, yogaName) {
        this.yoga = new YogaDataExtractor(jsonData);
        this.yogaName = yogaName;
        this.segments = this.yoga.segments();
        this.transitionPaths = this._createTransitionPaths();
    }

    _createTransitionPaths() {
        const transitionPaths = [];
        
        // Find all holding segments
        const holdingIndices = this.segments
            .map((seg, i) =>
                seg.type === 'starting' || seg.type === 'holding' || seg.type === 'ending' ? i : -1
            )
            .filter((i) => i !== -1);

        // Create paths between consecutive holding segments
        for (let i = 0; i < holdingIndices.length - 1; i++) {
            const startIdx = holdingIndices[i];
            const endIdx = holdingIndices[i + 1];
            const startFrame = this.segments[startIdx].end;
            const endFrame = this.segments[endIdx].start;
            if (startFrame >= endFrame) continue;

            // Get keypoints for transition
            const idealKeypoints = this.yoga.getIdealKeypoints(startFrame, endFrame);
            if (!idealKeypoints.length) continue;

            // Extract left wrist path
            const leftWristKeypoints = idealKeypoints.map((frame) => frame[15]);
            const threshold = this.segments[endIdx].thresholds
                ? this.segments[endIdx].thresholds[0]
                : 0.1;
                
            // Store transition path
            transitionPaths.push({
                startSegmentIdx: startIdx,
                endSegmentIdx: endIdx,
                startFrame,
                endFrame,
                leftWristPath: leftWristKeypoints,
                threshold
            });
        }
        return transitionPaths;
    }

    analyzeTransition(userKeypoints, currentSegmentIdx) {
        const userLeftWrist = userKeypoints[15];
        
        // Check if user is following the transition path
        for (const path of this.transitionPaths) {
            if (currentSegmentIdx > path.startSegmentIdx && currentSegmentIdx < path.endSegmentIdx) {
                const distances = path.leftWristPath.map((p) =>
                    Math.hypot(userLeftWrist[0] - p[0], userLeftWrist[1] - p[1])
                );
                const minDistance = Math.min(...distances);
                const withinPath = minDistance <= path.threshold;
                return withinPath;
            }
        }
        return false;
    }

    getTransitionEndTarget(currentSegmentIdx) {
        // Get target position for current transition
        for (const path of this.transitionPaths) {
            if (currentSegmentIdx > path.startSegmentIdx && currentSegmentIdx <= path.endSegmentIdx) {
                return path.leftWristPath[path.leftWristPath.length - 1];
            }
        }
        return [0, 0, 0];
    }
}

/**
 * Main controller class for managing yoga pose detection and exercise flow
 */
class Controller {
    constructor(exercisePlan) {
        // Initialize timing and state variables
        this.lastValidPoseTime = performance.now();
        this.inRelaxation = false;
        this.relaxationEnteredTime = 0;
        this.relaxationThreshold = 5;
        this.relaxationSegmentIdx = 0;

        // Setup exercise plan
        this.exercisePlan = exercisePlan;
        this.currentExerciseIdx = 0;
        this.exerciseNames = Object.keys(exercisePlan);
        this.currentExercise = this.exerciseNames[this.currentExerciseIdx];
        this.jsonData = exercisePlan[this.currentExercise].json_data;
        this.targetReps = exercisePlan[this.currentExercise].reps;

        // Initialize data extractor and analyzer
        this.yoga = new YogaDataExtractor(this.jsonData);
        this.segments = this.yoga.segments();
        this.currentSegmentIdx = 0;

        this.phaseHandlers = this._initializeHandlers();

        // Initialize counters and timers
        this.count = 0;
        this.startTime = performance.now();
        this.currentRepStartTime = null;

        // Pose tracking variables
        this.landmarks = null;
        this.normalized = null;
        this.normalizedKeypoints = null;
        this.hipPoint = 0;
        this.transitionKeypoints = [];
        this.workoutCompleted = false;
        this.exerciseChanged = false;
        this.lastValidHoldTime = 0;
        
        // Timeout configurations
        this.phaseTimeouts = {
            transition: 10000,
            holdingAbandonment: 5000,
            holdingDuration: 5000
        };
        
        this.lostPoseWarned = false;
        this.currentExpertKeypoints = null;
        this.lastHoldingIdx = -1;
        this.transitionAnalyzer = new TransitionAnalyzer(this.jsonData, this.currentExercise);
        
        // Performance metrics
        this.score = 100;
        this.total_time = 0;
        this.holding_time = 0;
        this.relaxation_time = 0;
        this.transition_time = 0;
    }

    async initialize() {
        await this.yoga.ensureLoaded();
        this.segments = this.yoga.segments();
        if (this.segments.length === 0) {
            console.error('No segments available, exercise cannot start');
            return;
        }
        this.phaseHandlers = this._initializeHandlers();
        integrateWithController(this, this.transitionAnalyzer);
    }

    _initializeHandlers() {
        const handlers = {};
        
        // Create phase handlers for each segment
        this.segments.forEach((segment, i) => {
            const phase = segment.phase;
            const phaseType = segment.type;
            const uniqueKey = `${phase}_${i}`;
            const startFacing = segment.facing;

            // Create appropriate handler based on segment type
            if (phaseType === 'starting') {
                handlers[uniqueKey] = new StartPhase(this, startFacing);
            } else if (phaseType === 'transition') {
                handlers[uniqueKey] = new TransitionPhase(this, startFacing);
            } else if (phaseType === 'holding') {
                handlers[uniqueKey] = new HoldingPhase(this, segment.thresholds, startFacing);
            } else if (phaseType === 'ending') {
                handlers[uniqueKey] = new EndingPhase(this, startFacing);
            } else if (phaseType === 'relaxation') {
                handlers[uniqueKey] = new RelaxationPhase(this, startFacing);
            }
            segment.handlerKey = uniqueKey;
        });
        return handlers;
    }

    getExcerciseName() {
        return this.currentExercise;
    }

    startExerciseSequence() {
        console.log(`Starting exercise sequence for ${this.currentExercise}`);
    }

    update_phase_handlers_frame() {
        // Update all phase handlers with current keypoints
        for (const handlerKey of Object.keys(this.phaseHandlers)) {
            this.phaseHandlers[handlerKey].normalizedKeypoints = this.normalizedKeypoints;
            this.phaseHandlers[handlerKey].hipPoint = this.hipPoint;
        }
    }

    updateFrame(results) {
        this.results = results;

        if (!results) {
            return;
        }

        // Handle case when no landmarks detected
        if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
            if (!this.lostPoseWarned) {
                console.warn('No pose landmarks detected (first warning)');
                this.lostPoseWarned = true;
            }
            this.landmarks = null;
            this.normalizedKeypoints = null;
            this.update_phase_handlers_frame();
            return;
        }

        if (this.lostPoseWarned) {
            this.lostPoseWarned = false;
        }

        // Process new landmarks
        this.landmarks = results.poseLandmarks;
        const [allVisible, missing] = checkKeypointVisibility(this.landmarks);

        if (allVisible) {
            this.lastValidPoseTime = performance.now();
            [this.normalizedKeypoints, this.hipPoint] = normalizeKeypoints(this.landmarks);
            this.update_phase_handlers_frame();
        } else {
            this.normalizedKeypoints = null;
        }

        this.update_phase_handlers_frame();
    }

    checkPhaseTimeouts(currentTime) {
        const currentSegment = this.segments[this.currentSegmentIdx];

        // Handle transition timeout
        if (currentSegment.type === 'transition') {
            const elapsed = currentTime - this.startTime;
            if (elapsed > this.phaseTimeouts.transition) {
                this.currentSegmentIdx = 0;
                this.transitionKeypoints = [];
            }
        }

        // Handle holding abandonment
        if (currentSegment.type === 'holding') {
            if (currentTime - this.lastValidHoldTime > this.phaseTimeouts.holdingAbandonment) {
                this.currentSegmentIdx = 0;
            }
        }
    }

    enterRelaxation() {
        this.inRelaxation = true;
        this.currentSegmentIdx = this.relaxationSegmentIdx;
        this.startTime = performance.now();
    }

    handleRepCompletion(currentTime) {
        this.count++;
        
        // Check if target reps completed
        if (this.count >= this.targetReps) {
            // Move to next exercise if available
            if (this.currentExerciseIdx < this.exerciseNames.length - 1) {
                this.currentExerciseIdx++;
                this.resetForNewExercise();
                this.exerciseChanged = true;
                nextExerciseTitle = this.currentExercise;
                showTransitionLoading = true;
                analysisPaused = true;
                
                if (transitionTimeout) clearTimeout(transitionTimeout);
                transitionTimeout = setTimeout(() => {
                    showTransitionLoading = false;
                    analysisPaused = false;
                }, TRANSITION_DURATION);
                
                this.exerciseChanged = false;
            } else {
                // Workout completed
                this.workoutCompleted = true;
                const workoutSummary = {
                    total_time: this.total_time,
                    relaxation_time: this.relaxation_time,
                    transition_time: this.transition_time,
                    holding_time: this.holding_time
                };
                exerciseStats = { ...exerciseStats, ...workoutSummary };
                jsonDump = JSON.stringify(exerciseStats, null, 2);
            }
        }

        // Reset for next rep
        this.currentSegmentIdx = 0;
        this.startTime = currentTime;
    }

    resetForNewExercise() {
        // Setup for new exercise
        this.currentExercise = this.exerciseNames[this.currentExerciseIdx];
        this.jsonData = this.exercisePlan[this.currentExercise].json_data;
        this.targetReps = this.exercisePlan[this.currentExercise].reps;
        this.yoga = new YogaDataExtractor(this.jsonData);
        this.segments = this.yoga.segments();
        this.phaseHandlers = this._initializeHandlers();
        this.count = 0;
    }

    shouldEnterRelaxation(currentTime) {
        const current = this.segments[this.currentSegmentIdx];
        const elapsed = currentTime - this.lastValidPoseTime;

        // Enter relaxation if no landmarks detected for threshold time
        if (!this.landmarks && elapsed > this.relaxationThreshold * 1000) {
            return true;
        }

        // Check facing direction for starting/ending segments
        if (['starting', 'ending'].includes(current?.type)) {
            if (this.landmarks) {
                const target = current.facing || 'front';
                const facing = detectFacing(this.landmarks);
                if (facing != null && facing !== target) {
                    return true;
                }
            }
        }

        // Check transition timeout
        if (
            current?.type === 'transition' &&
            currentTime - this.startTime > this.phaseTimeouts.transition
        ) {
            return true;
        }

        return false;
    }

    handleRelaxationPhase(currentTime) {
        if (!this.inRelaxation) {
            this.inRelaxation = true;
            this.relaxationEnteredTime = currentTime;
        }

        // Process relaxation phase
        const handler = new RelaxationPhase(this);
        const { phase, completed } = handler.process(currentTime);

        // Exit relaxation when completed or timeout
        if (completed || currentTime - this.relaxationEnteredTime > 30000) {
            this.inRelaxation = false;
            this.lastValidPoseTime = currentTime;
        }
    }

    getRelaxationReturnValues() {
        return ['relaxation', this.currentExercise, this.count, this.targetReps];
    }

    processExercise(currentTime) {
        if (!this.segments || this.segments.length === 0) {
            console.error('No segments loaded!');
            return ['error', '', 0, 0];
        }

        if (this.currentSegmentIdx >= this.segments.length) {
            this.currentSegmentIdx = 0;
        }

        // Handle relaxation if needed
        if (this.shouldEnterRelaxation(currentTime)) {
            this.handleRelaxationPhase(currentTime);
            return this.getRelaxationReturnValues();
        }

        // Process current segment
        const currentSegment = this.segments[this.currentSegmentIdx];
        const handler = this.phaseHandlers[currentSegment.handlerKey];

        const [phase, completed] = handler.process(currentTime);

        // Store transition keypoints for visualization
        if (currentSegment.type === 'transition' && this.normalizedKeypoints) {
            this.transitionKeypoints.push(this.normalizedKeypoints);
        }

        // Handle segment completion
        if (completed) {
            if (currentSegment.type === 'starting') {
                this.currentSegmentIdx++;
                this.startTime = currentTime;
            } else if (currentSegment.type === 'transition') {
                if (currentTime - this.startTime > 10000) {
                    this.currentSegmentIdx = 0;
                } else {
                    this.currentSegmentIdx++;
                    this.startTime = currentTime;
                }
            } else if (currentSegment.type === 'holding') {
                const newIdx = this.currentSegmentIdx + 1;
                this.currentSegmentIdx = newIdx;
                this.startTime = currentTime;

                const nextSeg = this.segments[newIdx];
                if (nextSeg.type === 'holding') {
                    this.phaseHandlers[nextSeg.handlerKey]._resetTimers();
                }
            } else if (currentSegment.type === 'ending') {
                this.handleRepCompletion(currentTime);
            }
        }

        // Handle holding abandonment
        if (currentSegment.type === 'holding' && currentTime - this.lastValidHoldTime > 5000) {
            this.currentSegmentIdx = 0;
        }

        return [phase, this.currentExercise, this.count, this.targetReps];
    }

    getIdealKeypoints(phase) {
        // Get ideal keypoints for current phase
        const segment = this.segments[this.currentSegmentIdx];
        if (segment.phase === phase) {
            const middle = Math.floor((segment.start + segment.end) / 2);
            return this.yoga.getIdealKeypoints(middle, middle + 1)[0] || [];
        }
        return [];
    }

    getNextIdealKeypoints(phase, segmentidx) {
        // Get ideal keypoints for specified segment
        const segment = this.segments[segmentidx];
        const middle = Math.floor((segment.start + segment.end) / 2);
        return this.yoga.getIdealKeypoints(middle, middle + 1)[0] || [];
    }

    getTransitionKeypoints(startIdx, endIdx) {
        // Get keypoints for transition between segments
        for (let i = startIdx; i < endIdx; i++) {
            if (this.segments[i].type === 'transition') {
                return this.yoga.getIdealKeypoints(this.segments[i].start, this.segments[i].end);
            }
        }
        return [];
    }
}

/**
 * Integrates transition analyzer with controller
 */
function integrateWithController(controller, transitionAnalyzer) {
    // Wrap the original processExercise method
    const originalProcessExercise = controller.processExercise;
    controller.processExercise = function (currentTime) {
        const [phase, exerciseName, count, targetReps] = originalProcessExercise.call(
            this,
            currentTime
        );
        const currentSegment = this.segments[this.currentSegmentIdx];

        // Analyze transition if keypoints available
        if (this.normalizedKeypoints) {
            const userLeftWrist = this.normalizedKeypoints[15];
            for (const path of transitionAnalyzer.transitionPaths) {
                if (
                    this.currentSegmentIdx > path.startSegmentIdx &&
                    this.currentSegmentIdx <= path.endSegmentIdx
                ) {
                    if (
                        currentSegment.type !== 'starting' &&
                        currentSegment.type !== 'holding' &&
                        currentSegment.type !== 'ending'
                    ) {
                        // Handle transition segments
                    } else if (
                        ['starting', 'holding', 'ending'].includes(currentSegment.type) &&
                        path.endSegmentIdx === this.currentSegmentIdx
                    ) {
                        // Check if reached target position
                        const handler = this.phaseHandlers[currentSegment.handlerKey];
                        const [, completed] = handler.process(currentTime);
                    }
                }
            }
        }
        return [phase, exerciseName, count, targetReps];
    };
}

// UI Functions

/**
 * Toggles drawer state between partial and full
 */
function handleDrawerToggle() {
    drawerState = drawerState === 'partial' ? 'full' : 'partial';
}

/**
 * Initializes the pose landmarker model
 */
async function initPoseLandmarker() {
    // Load WASM files for MediaPipe
    const wasmFileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
    );
    
    // Check for cached landmarker
    const storedLandmarker = $poseLandmarkerStore;
    if (storedLandmarker) {
        poseLandmarker = storedLandmarker;
    } else {
        try {
            // Initialize new landmarker
            const vision = await import('@mediapipe/tasks-vision');
            poseLandmarker = await vision.PoseLandmarker.createFromOptions(
                wasmFileset,  
                {
                    baseOptions: {
                        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
                        delegate: 'GPU'
                    },
                    runningMode: 'VIDEO',
                    numPoses: 1
                });
            poseLandmarkerStore.set(poseLandmarker);
        } catch (error) {
            console.error('Error initializing pose landmarker:', error);
            dimensions = 'Pose landmarker error: ' + (error as Error).message;
        }
    }

    // Initialize drawing utilities if needed
    if (canvasCtx && !drawingUtils) {
        drawingUtils = new DrawingUtils(canvasCtx);
    }
}

/**
 * Starts camera and sets up video stream
 */
async function startCamera(): Promise<void> {
    try {
        // Clean up existing stream if any
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        if (!output_canvas || !canvasCtx || !webcam) {
            console.error('Canvas, context, or webcam not available');
            return;
        }

        // Get media constraints based on device
        isMobile = detectMobileDevice();
        const constraints = getConstraints();

        // Try with preferred constraints, fallback to basic if needed
        stream = await navigator.mediaDevices.getUserMedia(constraints).catch(err => {
            console.warn('Failed with initial constraints, falling back to basic config:', err);
            return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        });

        // Start video stream
        webcam.srcObject = stream;
        await webcam.play();
        dimensions = 'Camera active';
        setupTargetBox();
        detectPoseActive = true;
        renderFrame();
    } catch (error) {
        console.error('Error accessing the camera:', error);
        dimensions = 'Camera error: ' + (error as Error).message;
    }
}

/**
 * Sets up the target box for user positioning
 */
function setupTargetBox() {
    if (!output_canvas) return;

    const canvasWidth = output_canvas.width;
    const canvasHeight = output_canvas.height;

    // Define target box dimensions (96% of canvas with 2% margin)
    targetBox = {
        x: canvasWidth * 0.02,
        y: canvasHeight * 0.08,
        width: canvasWidth * 0.96,
        height: canvasHeight * 0.90
    };
}

/**
 * Draws transition keypoints on canvas
 * @param {Array} denormKeypoints - Denormalized keypoints to draw
 */
function drawTransitionKeypoints(denormKeypoints) {
    if (!denormKeypoints || !canvasContext) return;

    // Clear canvas and prepare for drawing
    canvasContext.clearRect(0, 0, safeWidth, safeHeight);
    canvasContext.translate(safeWidth, 0);
    canvasContext.scale(-1, 1);
    
    // Define connections between keypoints to draw
    const connections = [
        [11, 12], [11, 23], [12, 24], [23, 24],
        [24, 26], [26, 28], [23, 25], [25, 27],
        [12, 14], [14, 16], [11, 13], [13, 15]
    ];

    // Style configuration for transition visualization
    const transitionStyle = {
        lineColor: '#FFA500',       // orange
        lineWidth: 3,
        lineDash: [5, 3],
        pointColor: '#FFA500',      // orange
        pointRadius: 5,
        pointOutline: '#FFFFFF',
        pointOutlineWidth: 1
    };

    // Draw connections between keypoints
    canvasContext.strokeStyle = transitionStyle.lineColor;
    canvasContext.lineWidth = transitionStyle.lineWidth;
    canvasContext.setLineDash(transitionStyle.lineDash);

    canvasContext.beginPath();
    connections.forEach(([i, j]) => {
        const start = denormKeypoints[i];
        const end   = denormKeypoints[j];
        if (start && end) {
            const startX = start[0] * safeWidth;
            const startY = start[1] * safeHeight;
            const endX   = end[0]   * safeWidth;
            const endY   = end[1]   * safeHeight;

            canvasContext.moveTo(startX, startY);
            canvasContext.lineTo(endX,   endY);
        }
    });
    canvasContext.stroke();

    // Draw keypoints
    const pointsToDraw = new Set();
    connections.forEach(([i, j]) => {
        pointsToDraw.add(i);
        pointsToDraw.add(j);
    });

    pointsToDraw.forEach(i => {
        const point = denormKeypoints[i];
        if (!point) return;

        const [nx, ny] = point;
        const x = nx * safeWidth;
        const y = ny * safeHeight;

        // Draw filled point with outline
        canvasContext.fillStyle   = transitionStyle.pointColor;
        canvasContext.strokeStyle = transitionStyle.pointOutline;
        canvasContext.lineWidth   = transitionStyle.pointOutlineWidth;

        canvasContext.beginPath();
        canvasContext.arc(x, y, transitionStyle.pointRadius, 0, 2 * Math.PI);
        canvasContext.fill();
        canvasContext.stroke();
    });

    // Reset line dash
    canvasContext.setLineDash([]);
    canvasContext.restore();
}

/**
 * Renders each video frame with pose detection and visualization
 */
function renderFrame() {
    // Skip if not ready
    if (!webcam || !canvasCtx || webcam.readyState !== 4 || !isInitialized) {
        if (canvasCtx) canvasCtx.clearRect(0, 0, output_canvas.width, output_canvas.height);
        if (canvasContext) canvasContext.clearRect(0, 0, safeWidth, safeHeight);
        animationFrame = requestAnimationFrame(renderFrame);
        return;
    }

    // Calculate video dimensions and positioning
    const containerWidth = output_canvas.width;
    const containerHeight = output_canvas.height;
    const videoWidth = webcam.videoWidth;
    const videoHeight = webcam.videoHeight;

    const videoRatio = videoWidth / videoHeight;
    const containerRatio = containerWidth / containerHeight;

    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

    // Adjust dimensions to maintain aspect ratio
    if (containerRatio < 1) {
        drawHeight = containerHeight;
        drawWidth = containerHeight * videoRatio;
        offsetX = (containerWidth - drawWidth) / 2;
        offsetY = 0;
    } else {
        drawWidth = containerWidth;
        drawHeight = containerWidth / videoRatio;
        offsetY = (containerHeight - drawHeight) / 2;
    }

    // Clear and draw video frame
    canvasCtx.clearRect(0, 0, containerWidth, containerHeight);

    canvasCtx.save();
    canvasCtx.scale(-1, 1);  // Mirror the video
    canvasCtx.translate(-containerWidth, 0);
    canvasCtx.drawImage(webcam, offsetX, offsetY, drawWidth, drawHeight);
    canvasCtx.restore();

    // Draw target box if user not in position
    if (!userInPosition) {
        drawTargetBox();
    }

    // Perform pose detection if active
    if (!analysisPaused && detectPoseActive && poseLandmarker && drawingUtils) {
        const timestamp = performance.now();
        try {
            const results = poseLandmarker.detectForVideo(webcam, timestamp);

            if (results?.landmarks?.length > 0) {
                for (const landmarks of results.landmarks) {
                    // Scale landmarks to canvas coordinates
                    const scaledLandmarks = landmarks.map(landmark => ({
                        x: offsetX + landmark.x * drawWidth,
                        y: offsetY + landmark.y * drawHeight,
                        z: landmark.z,
                        visibility: landmark.visibility
                    }));

                    // Check if user is in target position
                    checkUserPosition(scaledLandmarks);

                    // Draw pose connections and landmarks
                    canvasCtx.save();
                    canvasCtx.scale(-1, 1);
                    canvasCtx.translate(-containerWidth, 0);

                    // Draw connections (green if in position, red otherwise)
                    drawingUtils.drawConnectors(scaledLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
                        color: userInPosition ? '#00FF00' : '#FF0000',
                        lineWidth: 4
                    });

                    // Draw landmarks (yellow)
                    drawingUtils.drawLandmarks(scaledLandmarks, {
                        color: '#FFFF00',
                        lineWidth: 8,
                        radius: 6
                    });

                    // Highlight specific keypoints (white)
                    const keyIndices = [11, 12, 23, 24, 25, 26, 27, 28, 15, 16, 13, 14];
                    const keyLandmarks = keyIndices.map(i => scaledLandmarks[i]);
                    
                    canvasCtx.fillStyle = 'white';
                    keyLandmarks.forEach(({x, y}) => {
                        canvasCtx.beginPath();
                        canvasCtx.arc(x, y, 6, 0, 2 * Math.PI);
                        canvasCtx.fill();
                    });

                    // Draw bone connections with dashed lines
                    const boneConnections = [
                        [11, 12], [11, 23], [12, 24], [23, 24],
                        [24, 26], [26, 28], [23, 25], [25, 27],
                        [12, 14], [14, 16], [11, 13], [13, 15]
                    ];

                    canvasCtx.strokeStyle = 'white';
                    canvasCtx.lineWidth = 2;
                    canvasCtx.setLineDash([8, 4]);
                    canvasCtx.beginPath();
                    
                    boneConnections.forEach(([i, j]) => {
                        const a = scaledLandmarks[i];
                        const b = scaledLandmarks[j];
                        canvasCtx.moveTo(a.x, a.y);
                        canvasCtx.lineTo(b.x, b.y);
                    });
                    
                    canvasCtx.stroke();
                    canvasCtx.setLineDash([]);
                    canvasCtx.restore();

                    // Process pose with controller if user is in position
                    if (userInPosition && controller && controllerInitialized) {
                        operationId++;
                        const transformedResults = {
                            poseLandmarks: landmarks
                        };
                        
                        // Update controller with new pose data
                        controller.updateFrame(transformedResults);
                        currentTime += 1 / 60;
                        
                        // Process current exercise phase
                        const [currentPhase, exerciseName, repCount, targetReps] = controller.processExercise(currentTime);
                        
                        // Update UI state
                        currentReps = repCount;
                        currentScore = controller.score;
                        yogName = exerciseName;
                        currentExerciseName = exerciseName;
                        
                        // Update exercise stats
                        if (!exerciseStats[currentExerciseName]) {
                            exerciseStats[currentExerciseName] = {
                                rep_done: 0,
                                score: 0,
                                timestamp: new Date().toISOString()
                            };
                        }

                        exerciseStats[currentExerciseName].rep_done = currentReps;
                        exerciseStats[currentExerciseName].score = currentScore;

                        // Show phase change notification
                        if (currentPhase && currentPhase !== lastPhase) {
                            lastPhase = currentPhase;
                            showPhase = true;
                            if (phaseTimeout) clearTimeout(phaseTimeout);
                            phaseTimeout = setTimeout(() => {
                                showPhase = false;
                            }, 3000);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error detecting pose:', error);
        }
    }
    
    // Draw rep count if available
    if (currentReps !== undefined) {
        const cw = canvasCtx.canvas.width;
        const ch = canvasCtx.canvas.height;
        canvasCtx.save();
        canvasCtx.fillStyle = 'yellow';
        canvasCtx.font = '30px Arial';
        canvasCtx.textAlign = 'center';
        canvasCtx.textBaseline = 'middle';
        // canvasCtx.fillText(`Reps: ${currentReps}`, cw/2, ch/2 - 20);
        canvasCtx.restore();
    }
    animationFrame = requestAnimationFrame(renderFrame);
}

/**
 * Draws the target box on canvas
 */
function drawTargetBox() {
    if (!canvasCtx) return;

    // Draw semi-transparent target box
    canvasCtx.save();
    canvasCtx.fillStyle = 'rgba(255, 0, 0, 0)';
    canvasCtx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    canvasCtx.lineWidth = 2;
    canvasCtx.fillRect(targetBox.x, targetBox.y, targetBox.width, targetBox.height);
    canvasCtx.strokeRect(targetBox.x, targetBox.y, targetBox.width, targetBox.height);

    canvasCtx.fillStyle = 'white';
    canvasCtx.font = '20px Arial';
    canvasCtx.textAlign = 'center';
    canvasCtx.restore();
}

/**
 * Checks if user is within target box based on keypoints
 * @param {Array} landmarks - Pose landmarks
 */
function checkUserPosition(landmarks) {
    if (!isInitialized) return;
    if (!landmarks || landmarks.length === 0) return;

    // Key landmarks to check
    const keyLandmarks = [
        landmarks[0], // nose
        landmarks[11], // left shoulder
        landmarks[12], // right shoulder
        landmarks[23], // left hip
        landmarks[24], // right hip
        landmarks[27], // left ankle
        landmarks[28], // right ankle
        landmarks[15], // left wrist
        landmarks[16] // right wrist
    ];

    // Count how many keypoints are within target box
    let pointsInBox = 0;
    const totalPoints = keyLandmarks.length;

    keyLandmarks.forEach(point => {
        if (
            point &&
            point.x >= targetBox.x &&
            point.x <= targetBox.x + targetBox.width &&
            point.y >= targetBox.y &&
            point.y <= targetBox.y + targetBox.height
        ) {
            pointsInBox++;
        }
    });

    // Update userInPosition state
    if (pointsInBox === totalPoints && !userInPosition) {
        userInPosition = true;
        if (status === 'stopped') {
            handlePlay();
        }
    } else if (pointsInBox < totalPoints && userInPosition) {
        userInPosition = false;
    }
}

/**
 * Handles window resize events
 */
function handleResize() {
    if (webcam && webcam.videoWidth && containerElement && output_canvas) {
        // Adjust canvas dimensions
        output_canvas.width = containerElement.clientWidth;
        output_canvas.height = containerElement.clientHeight;
        output_canvas.style.width = `${containerElement.clientWidth}px`;
        output_canvas.style.height = `${containerElement.clientHeight}px`;
        
        // Reinitialize drawing utils if needed
        if (canvasCtx) {
            drawingUtils = new DrawingUtils(canvasCtx);
        }
        setupTargetBox();
    }

    // Update safe dimensions for overlay canvas
    safeWidth = window.innerWidth;
    safeHeight = window.innerHeight;
    const overlayCanvas = document.getElementById('overlayCanvas') as HTMLCanvasElement | null;
    if (overlayCanvas) {
        overlayCanvas.width = safeWidth;
        overlayCanvas.height = safeHeight;
    }
}

/**
 * Starts the workout session
 */
function handlePlay() {
    status = 'playing';
    sessionStartTime = Date.now();
    progressInterval = setInterval(updateProgress, 100);
    detectPoseActive = true;

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    renderFrame();
}

/**
 * Toggles pause state
 */
function handlePause() {
    if (status === 'playing') {
        status = 'paused';
        pauseStartTime = Date.now();
        if (progressInterval) clearInterval(progressInterval);
    } else if (status === 'paused') {
        status = 'playing';
        if (pauseStartTime) {
            totalPausedTime += Date.now() - pauseStartTime;
            pauseStartTime = null;
        }
        progressInterval = setInterval(updateProgress, 100);
    }
}

/**
 * Initiates stop sequence (shows confirmation modal)
 */
function handleStop() {
    showModal = true;
}

/**
 * Confirms workout stop and saves results
 */
async function confirmStop() {
    status = 'stopped';
    if (progressInterval) clearInterval(progressInterval);
    
    // Prepare workout summary
    const workoutSummary = {
        yoga_name: yogName,
        reps: currentReps,
        score: currentScore,
        time: elapsedMs,
        exercises: exerciseStats,
        summaryJson: jsonDump
    };

    try {
        // Get authentication token
        const token = getToken();
        const userId = localStorage.getItem("userId");
        
        if (!token || !userId) {
            throw new Error('User not authenticated');
        }

        // Save workout to server
        const response = await fetch('https://v2.app.aadiyog.in/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                data: {
                    title: `${yogName} Workout Summary`,
                    description: `Completed ${currentReps} reps with score ${currentScore}`,
                    yoga_name: yogName,
                    reps: currentReps,
                    score: currentScore,
                    time: elapsedMs,
                    summaryJson: workoutSummary,
                    user: userId
                }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save workout');
        }

        // Navigate to workout details page
        const data = await response.json();
        goto(`/yoga/${data.data.id}`);
        
    } catch (error) {
        console.error('Error saving workout:', error);
        goto('/community');
    }
    
    showModal = false;
}

/**
 * Cancels the stop operation
 */
function cancelStop() {
    showModal = false;
}

/**
 * Updates progress bar
 */
function updateProgress() {
    if (status !== 'playing' || !sessionStartTime) return;
    const now = Date.now();
    elapsedMs = now - sessionStartTime - totalPausedTime;
    progressValue = Math.min((elapsedMs / 300000) * 100, 100);
    if (progressValue >= 100) handleStop();
}

/**
 * Navigates back to home
 */
function handleBack() {
    goto('/home');
}

/**
 * Shows instructional video modal
 */
function handleVideoButtonClick() {
    showInstructionalModal = true;
}

/**
 * Closes instructional video modal
 */
function closeInstructionalModal() {
    showInstructionalModal = false;
}

// Component Logic

// Reactive declarations for drawer state and visibility
$: currentWorkout = $allWorkouts.find(workout => workout.title === yogName) || $allWorkouts[0] || null;
$: drawerTranslation = drawerState === 'partial' ? '94%' : '0%';
$: p = parseFloat(drawerTranslation.replace('%', ''));
$: visibleHeightPercentage = 90 * (1 - p / 100);

// Subscribe to workout store updates
workoutStore.subscribe((workouts) => {
    workoutJson = workouts?.data[0].attributes.excercise?.data.attributes?.json;
});

// Component lifecycle - Mount
onMount(() => {
    if (!browser) return;
    
    // Initialize overlay canvas
    const canvas = document.getElementById('overlayCanvas') as HTMLCanvasElement | null;
    if (canvas) {
        canvasContext = canvas.getContext('2d');
        handleResize();
    }
    
    let unsubscribe: () => void;

    // Async initialization
    (async () => {
        let titlesToFetch:string[] = [];
        // Subscribe to workout details
        unsubscribe = workoutDetails.subscribe((data) => {
            if (data?.exercises) {
                titlesToFetch = data.exercises.data.map((ex) => ex.attributes.title.trim());
            }
        });

        // Fetch exercise data with progress callback
        let fetchedCount = 0;
        let totalCount = 0;
        exerciseData = await fetchAltExercises(titlesToFetch, (count, total) => {
            loadingProgress = count;
            loadingTotal = total;
            showProgressBar = true
            fetchedCount = count;
            totalCount = total;
            if (count === total) {
                setTimeout(() => showProgressBar = false, 500);
            }
        });
        
        filteredExercises = exerciseData;
        
        // Get DOM elements
        webcam = document.getElementById('webcam') as HTMLVideoElement;
        output_canvas = document.getElementById('output_canvas') as HTMLCanvasElement;
        canvasCtx = output_canvas.getContext('2d')!;
        containerElement = document.getElementById('webcam-container') as HTMLDivElement;

        // Set canvas dimensions
        output_canvas.width = containerElement.clientWidth;
        output_canvas.height = containerElement.clientHeight;
        output_canvas.style.width = `${containerElement.clientWidth}px`;
        output_canvas.style.height = `${containerElement.clientHeight}px`;

        try {
            // Create exercise plan from fetched data
            const exercisePlan = filteredExercises.reduce((plan, { name, reps, altData }) => {
                plan[name] = {
                    json_data: altData,
                    reps
                };
                return plan;
            }, {});

            // Initialize controller
            controller = new Controller(exercisePlan);
            await controller.initialize();
            controller.startExerciseSequence();
            controllerInitialized = true;
            yogName = controller.getExcerciseName();
            dimensions = `Camera active, Controller: ${controller.currentExercise}`;
        } catch (error) {
            console.error('Controller initialization failed:', error);
            dimensions = `Controller error: ${error.message}`;
        }

        // Initialize pose detection
        await initPoseLandmarker();
        await startCamera();
        isInitialized = true;

        // Set up event listeners
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 500);
        });
    })();

    // Cleanup function
    return () => {
        if (unsubscribe) unsubscribe();
    };
});

// Prepare JSON dump of exercise stats
jsonDump = JSON.stringify(exerciseStats, null, 2);

// Component lifecycle - Destroy
onDestroy(() => {
    if (!browser) return;
    
    // Clean up timers and event listeners
    if (transitionTimeout) clearTimeout(transitionTimeout);
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (stream) stream.getTracks().forEach(track => track.stop());
    if (progressInterval) clearInterval(progressInterval);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    if (phaseTimeout) clearTimeout(phaseTimeout);
});
</script>

<div class="h-surface flex flex-col overflow-hidden relative w-full">
  {#if showTransitionLoading}
  <div class="fixed inset-0 flex items-center justify-center z-[9998] bg-black bg-opacity-70">
    <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center animate-fade-in">
      <div class="animate-pulse mb-6">
        <svg class="w-16 h-16 mx-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </div>
      <h3 class="text-xl font-medium mb-2">Preparing Next Exercise</h3>
      <h2 class="text-3xl font-bold text-primary mb-6">{nextExerciseTitle}</h2>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div class="bg-primary h-2 rounded-full transition-all duration-300" 
             style={`width: ${(elapsedMs % TRANSITION_DURATION) / TRANSITION_DURATION * 100}%`}>
        </div>
      </div>
    </div>
  </div>
  {/if}

  {#if showProgressBar}
  <div class="fixed top-0 inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-80 shadow-xl">
      <div class="flex items-center justify-center mb-4">
        <svg class="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <div class="text-center mb-2 font-medium text-gray-700">
        Loading Exercises...
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          class="bg-primary h-2.5 rounded-full transition-all duration-300" 
          style={`width: ${(loadingProgress / loadingTotal) * 100}%`}
        ></div>
      </div>
      <div class="flex justify-between mt-2 text-sm text-gray-600">
        <span>{loadingProgress}/{loadingTotal} loaded</span>
        <span>{Math.round((loadingProgress / loadingTotal) * 100)}%</span>
      </div>
    </div>
  </div>
  {/if}

  <div id="webcam-container" style="background: black;" class="relative bg-black overflow-hidden" bind:this={containerElement}>
    <video id="webcam" autoplay playsinline muted style="display: none;"></video>
    <canvas id="output_canvas" class="pointer-events-none absolute top-0 left-0 z-0 w-full h-full"></canvas>
    <canvas id="overlayCanvas" class="pointer-events-none absolute top-0 left-0 z-10 w-full h-full"></canvas>
    
    {#if dimensions === 'Waiting for camera...' }
      <div class="loading-container">
        <div class="loading-text">Get ready...</div>
        <div class="loading-bar">
          <div class="loading-bar-fill"></div>
        </div>
      </div>
    {/if}

    {#if !userInPosition && !dimensions.startsWith('Camera error') && !dimensions.startsWith('Pose landmarker error')}
    <div
      class="absolute left-1/2 transform -translate-x-1/2 z-20 flex justify-between items-center w-full px-4"
      style="bottom: 5%; 
           max-width: {isInitialized ? targetBox.width : '90%'};"
    >
      <button on:click={handleVideoButtonClick} class="h-16 w-16 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary">
        <img
          src={currentWorkout?.src || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b'}
          alt="Media button"
          class="h-full w-full object-cover"
        />
      </button>

      <button on:click={handlePlay} class="bg-white p-4 rounded-full relative shadow-lg focus:outline-none hover:bg-gray-100">
        <svg class="w-10 h-10 text-black" viewBox="0 0 24 24">
          <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
        </svg>
      </button>
      <button on:click={handleStop} class="bg-white p-4 rounded-full shadow-lg focus:outline-none hover:bg-gray-100">
        <img src={stop} alt="stop" class="w-6 h-6 z-10">
      </button>
    </div>
    {/if}

    {#if userInPosition}
      <div class="user-in-position-container">
        <div class="score-reps-container">
          <div class="flex items-center px-4 py-3 rounded-lg border-2 border-orange-500 bg-white bg-opacity-80">
            <div class="flex flex-col mr-8">
              <div class="text-3xl"><img src={target} alt="Target" /></div>
              <div class="text-xl text-gray-800">Reps</div>
            </div>
            <div class="text-5xl ml-4 text-gray-800">{currentReps}</div>
          </div>
          <div class="flex items-center border-2 border-orange-400 px-2 py-1 rounded-lg bg-white bg-opacity-80">
            <div class="flex flex-col mr-8">
              <div class="text-3xl"><img src={award} alt="Award" /></div>
              <div class="text-xl text-gray-800">Score</div>
            </div>
            <div class="text-5xl ml-2 text-gray-800">{currentScore}</div>
          </div>
        </div>

        <div class="progress-container bg-gray-100">
          <div class="yoga-name">{yogName}</div>
          <div class="custom-progress-bar">
            <div class="progress-bg">
              <div class="progress-fill" style="width: {progressValue}%" />
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if showPhase && currentPhase}
      <div class="phase-display">
        {currentPhase}
      </div>
    {/if}
  </div>
  
  <div style="height: {visibleHeightPercentage}%; transition: height 300ms;"></div>

  <div
    class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 w-full border-t-1 border-b flex flex-col z-30"
    style="transform: translateY({drawerTranslation}); height: 90%;"
  >
    <div class="w-full h-8 flex justify-center items-center cursor-pointer" on:click={handleDrawerToggle}>
      <div class="w-32 h-1 bg-gray-700 rounded-full"></div>
    </div>

    {#if drawerState === 'full'}
      <div class="flex flex-col flex-grow overflow-hidden items-center z-60">
        <h2 class="text-xl  mb-4 mt-2 font-sans border-b-2  w-[90vw] border-gray-200 py-2">
          {$allWorkouts.length} Asanas Remaining
        </h2>
        <div class=" flex-grow overflow-y-auto">
          {#each $allWorkouts as workout}
            <div class="flex  space-x-4 p-2 px-4 rounded-lg items-center min-w-[100vw]" >
              <img src={workout.src} alt={workout.title} class="w-28 h-28 object-cover rounded-md" />
              <div class="flex-grow">
                <h3 class="text-md font-medium">{workout.description}</h3>
                <div class="flex flex-col text-gray-600">
                  <span class="text-md mt-1 mb-3">{workout.extraData?.reps || 3} reps</span>
                  <span class="text-md">{workout.extraData?.duration || '20 min'}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  {#if showModal}
    <div class="fixed inset-0 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h2 class="text-xl font-bold mb-4">Confirm Stop</h2>
        <p class="mb-4">Do you want to finish the exercise?</p>
        <div class="flex justify-end space-x-4">
          <button on:click={cancelStop} class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
          <button on:click={confirmStop} class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Yes</button>
        </div>
      </div>
    </div>
  {/if}

  {#if showInstructionalModal}
    <div class="fixed inset-0 flex items-center justify-center z-50 p-2 mb-8">
      <div class="bg-white p-6 shadow-lg w-[96vw] h-[92vh] overflow-hidden instructional-modal flex flex-col">
        <div class="flex-grow overflow-y-auto hide-scrollbar">
          <video
            src={currentWorkout?.videoUrl || 'https://example.com/anuvittasana-instructional-video.mp4'}
            controls
            autoplay
            class="w-full h-48 rounded-lg mb-8 border-2 border-orange-500"
          ></video>
          <div class="w-full flex flex-row justify-between mb-6 items-center">
            <h2 class="text-2xl mb-4">{currentWorkout?.title || yogName}</h2>
            <div>
              <div class="text-gray-600">{currentWorkout?.extraData?.reps || 3} reps</div>
              <div class="text-gray-600">{currentWorkout?.extraData?.duration || '20 min'}</div>
            </div>
          </div>

          <div class="w-full pb-20 font-sans">
            <div class="text-gray-800">
              {#if currentWorkout?.extraData}
                {#each currentWorkout.extraData.sections as section}
                  <h3 class="text-2xl mb-2">{section.section_title}:</h3>
                  <ol class="list-decimal pl-5 mb-6 text-2xl ">
                    {#each section.items as item}
                      <li >{item}</li>
                    {/each}
                  </ol>
                {/each}
              {:else}
                <h3 class="text-lg font-semibold mb-2">Instructions:</h3>
                <p>No detailed instructions available for {currentWorkout?.title || yogName}.</p>
              {/if}
            </div>
          </div>
        </div>

        <div class="fixed bottom-4 left-0 right-0 flex justify-between items-center px-4 py-2 bg-gray-500">
          <button on:click={handleVideoButtonClick} class="h-16 w-16 overflow-hidden focus:outline-none bg-white shadow-xl hover:bg-gray-100 rounded-full">
            <img
              src={nexticon}
              alt="Next button"
              class="h-full w-full object-cover rounded-full"
            />
          </button>

          <button on:click={closeInstructionalModal} class="bg-white p-4 rounded-full shadow-xl focus:outline-none hover:bg-gray-100">
            <svg class="w-10 h-10 text-black" viewBox="0 0 24 24">
              <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
            </svg>
          </button>
          <button on:click={handleStop} class="bg-white p-4 rounded-full shadow-xl focus:outline-none hover:bg-gray-100">
            <img src={stop} alt="" class="w-6 h-6">
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  :global(body) {
    overflow: hidden;
    background-color: #000;
    height: 100vh;
    width: 100vw;
    margin: 0;
  }

  canvas {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
 
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  .animate-pulse {
    animation: pulse 1.5s infinite;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .h-surface {
    height: 100vh;
    width: 100vw;
  }

  #webcam-container {
    width: 100vw;
    height: 100vh;
    position: relative;
    overflow: hidden;
    background-color: #000;
  }

  #output_canvas {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }

  .user-in-position-container {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    pointer-events: none;
  }

  .user-in-position-container > * {
    pointer-events: auto;
  }

  .score-reps-container {
    width: 100%;
    padding: 16px;
    display: flex;
    justify-content: space-between;
  }

  .anuvittasana-text {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: 20px;
    text-align: center;
    background-color: rgba(77, 74, 74, 0.5);
    padding: 4px 2px;
    border-radius: 8px;
    width: 100vw;
  }

  .suggestion-text {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 15px;
    text-align: center;
    background-color: rgba(233, 229, 229, 0.8);
    padding: 4px 2px;
    border-radius: 4px;
    width: 95vw;
    font-family: sans-serif;
    color: rgb(69, 69, 69);
  }

  .progress-container {
    width: 100%;
    padding: 16px;
    background-color: rgba(40, 39, 39, 0.5);
  }

  .yoga-name {
    font-size: 20px;
    font-weight: bold;
    color: #f3ecec;
    text-align: center;
    margin-bottom: 8px;
  }

  .custom-progress-bar {
    width: 100%;
    background-color: #fff;
    border-radius: 16px;
    overflow: hidden;
    height: 20px;
    position: relative;
    border: 1px solid #ccc;
  }

  .progress-bg {
    width: 100%;
    height: 100%;
    background-color: #fff;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: #32cd32;
    transition: width 0.3s ease-in-out;
  }

  .loading-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 20;
  }

  .loading-text {
    color: white;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 16px;
    text-align: center;
  }

  .loading-bar {
    width: 200px;
    height: 20px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    overflow: hidden;
  }

  .loading-bar-fill {
    width: 0;
    height: 100%;
    background-color: #32cd32;
    animation: loading 2s infinite ease-in-out;
  }

  @keyframes loading {
    0% {
      width: 0;
    }
    50% {
      width: 100%;
    }
    100% {
      width: 0;
    }
  }

  .fixed {
    position: fixed;
  }

  .inset-0 {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  .z-50 {
    z-index: 50;
  }

  .flex {
    display: flex;
  }

  .items-center {
    align-items: center;
  }

  .justify-center {
    justify-content: center;
  }

  .bg-black {
    background-color: #000;
  }

  .bg-opacity-50 {
    opacity: 0.5;
  }

  .bg-white {
    background-color: #fff;
  }

  .p-6 {
    padding: 1.5rem;
  }

  .rounded-lg {
    border-radius: 0.5rem;
  }

  .shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .text-xl {
    font-size: 1.25rem;
  }

  .font-bold {
    font-weight: 700;
  }

  .mb-4 {
    margin-bottom: 1rem;
  }

  .justify-end {
    justify-content: flex-end;
  }

  .space-x-4 > :not([hidden]) ~ :not([hidden]) {
    margin-left: 1rem;
  }

  .px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .py-2 {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .bg-gray-300 {
    background-color: #d1d5db;
  }

  .hover\:bg-gray-400:hover {
    background-color: #9ca3af;
  }

  .bg-red-500 {
    background-color: #ef4444;
  }

  .text-white {
    color: #fff;
  }

  .hover\:bg-red-600:hover {
    background-color: #dc2626;
  }

  .rounded {
    border-radius: 0.25rem;
  }

  .phase-display {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 16px 32px;
    border-radius: 8px;
    font-size: 24px;
    font-weight: bold;
    text-transform: capitalize;
    z-index: 20;
    pointer-events: none;
  }

  .instructional-modal {
    position: relative;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: white;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    padding: 16px;
    max-width: 100%;
    max-height: 100vh;
    overflow-y: auto;
    z-index: 60;
    box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(100%);
    animation: slideUp 0.3s ease-out forwards;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .instructional-modal video {
    width: 100%;
    max-height: 200px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .instructional-modal h2 {
    font-size: 20px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 16px;
  }

  .instructional-modal h3 {
    font-size: 16px;
    font-weight: 500;
    margin-top: 12px;
    margin-bottom: 8px;
  }

  .instructional-modal p,
  .instructional-modal li {
    font-size: 16px;
    font-weight: 400;
    color: #333;
    line-height: 1.5;
  }
</style>