const workerId = Math.random().toString(36).slice(2, 8);
console.log(`[Worker ${workerId}] booting up…`);

let exercises = [];           // full array from Svelte
let currentIdx = 0;           // which exercise we’re on
let controller = null;
let operationId = 0;
let currentTime = 0;

 
 class BasePhase {
  constructor(controller) {
      this.controller = controller;
      this.holdDuration = 2;
      this.normalizedKeypoints = null;
      this.hipPoint = 0;
  }

  process(currentTime) {
      throw new Error('Not implemented');
  }
}

class StartPhase extends BasePhase {
    constructor(controller, targetFacing) {
        super(controller);
        console.log(`StartPhase initialized with target facing: ${targetFacing}`);
        this.targetFacing = targetFacing;
        this.start_time = null;
    }
    

    process(currentTime) {
        console.log('Processing StartPhase');
        const detectedFacing = this.controller.landmarks ? detectFacing(this.controller.landmarks) : 'random';
        console.log(`StartPhase - Detected Facing: ${detectedFacing}, Target Facing: ${this.targetFacing}`);
        const phase = this.controller.segments[this.controller.currentSegmentIdx].phase;
        const expertKeypoints = this.controller.getIdealKeypoints(this.targetFacing);
        const idealStartingKeypoints = this.controller.getNextIdealKeypoints('starting', 0);
        this.thresholds = this.controller.segments[0].thresholds;
        console.log(`Thresholds of starting phase are ${this.thresholds}`);
        const [_, success] = checkBendback(
            null,
            idealStartingKeypoints,
            this.controller.normalizedKeypoints,
            currentTime,
            this.thresholds
        );
        console.log(`starting Frame Success: ${success}`);
        if ( success && (detectedFacing === this.targetFacing)) {
            if(this.start_time == null){
                this.start_time = currentTime;
            }
            else{
                if ( currentTime - this.start_time >= this.holdDuration) {
                    console.log('Start phase completed');
                    return [phase, true];
                }
            }
            
        }
        return [phase, false];
    }
}

class TransitionPhase extends BasePhase {
    constructor(controller , startFacing) {
        super(controller);
        this.transitionTimeout = 15; 
        this.startFacing = startFacing;
        this.thresholds = null;
        console.log(`Transition thresholds: ${this.thresholds}`);
    }

    process(currentTime) {
        const elapsedMs = currentTime - this.controller.startTime;
        const elapsedSec = elapsedMs / 1000;
        const timeLeft = this.transitionTimeout - elapsedMs;
        
        // Get NEXT phase's ideal keypoints (if valid index)
        const nextSegmentIdx = this.controller.currentSegmentIdx + 1;
        console.log(`next segment index is: ${nextSegmentIdx}`);
        const phase = this.controller.segments[nextSegmentIdx].phase; 
        this.thresholds = this.controller.segments[nextSegmentIdx].thresholds;
        console.log(`Transition thresholds: ${this.thresholds}`);
        console.log(`next phase is: ${nextSegmentIdx}`);
        const idealKeypoints = this.controller.getNextIdealKeypoints(phase, nextSegmentIdx);
        
        console.log(`Here are the Keypoints ${idealKeypoints}`);
        
        console.log(`Here are the Keypoints size ${idealKeypoints.length}`);
        console.log(`Normalised Keypoints Transition ${this.controller.normalizedKeypoints}`);
        const [_, success] = checkBendback(
            null,
            idealKeypoints,
            this.controller.normalizedKeypoints,
            this.controller.hipPoint,
            this.thresholds
        );
        const keypoints_to_print = denormalizeKeypoints(idealKeypoints, this.controller.hipPoint);
        if (keypoints_to_print) {
        self.postMessage({
            type: 'transition_keypoints',
            operation: this.controller.operationId,  // if you’re tracking ops
            value: keypoints_to_print
            });
        }

        console.log(`Success: ${success}`);
        if((elapsedMs >= this.transitionTimeout)){
            this.controller.currentSegmentIdx = 0;
        }
        return [
            this.controller.segments[this.controller.currentSegmentIdx].phase,
            success];
    }
}
class HoldingPhase extends BasePhase {
    constructor(controller, thresholds, startFacing) {
        super(controller);
        this._resetTimers();
        this.startFacing = startFacing;
        console.log('HoldingPhase initialized with thresholds:', thresholds);
        this.thresholds = thresholds;
        this.holdStartTime = null;
        this.successDuration = 0;
        this.minHoldDuration = 1;
        this.completedHold = false;
        this.exitThresholdMultiplier = 1;
        this.leavePoseTime = null;     
    }
    _resetTimers() {
        this.holdStartTime   = null;
        this.successDuration = 0;
        this.completedHold   = false;
        this.leavePoseTime   = null;
    }
    
    
    
    process(currentTime) {
        console.log("controller"+this.controller.normalizedKeypoints) ;
        console.log('Processing HoldingPhase');
        const phase = this.controller.segments[this.controller.currentSegmentIdx].phase;
        const idealKeypoints = this.controller.getIdealKeypoints(phase);
        console.log('Ideal keypoints for holding phase from phase handler:', idealKeypoints);
        console.log(`Normalised keypoints in Holding ${this.controller.normalizedKeypoints}`);


        if (this.controller.lastHoldingIdx !== -1 && 
            this.controller.currentSegmentIdx > this.controller.lastHoldingIdx && 
            this.controller.transitionKeypoints.length) {
            const idealTransKeypoints = this.controller.getTransitionKeypoints(this.controller.lastHoldingIdx, this.controller.currentSegmentIdx);
            if (idealTransKeypoints.length && this.controller.transitionKeypoints.length) {
                const minLen = Math.min(this.controller.transitionKeypoints.length, idealTransKeypoints.length);
                const userTrans = this.controller.transitionKeypoints.slice(0, minLen).flat();
                const idealTrans = idealTransKeypoints.slice(0, minLen).flat();
            }
        }

        if (this.controller.normalizedKeypoints) {
            const [_, success] = checkBendback(null, idealKeypoints, this.controller.normalizedKeypoints, this.controller.hipPoint, this.thresholds);
            console.log(`Success in holding frame ${success}`);
            console.log(`Hold duration is ${currentTime - this.holdStartTime}`);
            // this.controller.frame = ctx;
            const { dtwDistance: dtwLeftWrist } = calculateDtwScore(idealKeypoints[15], this.controller.normalizedKeypoints[15]);
            const { dtwDistance: dtwLeftShoulder } = calculateDtwScore(idealKeypoints[11], this.controller.normalizedKeypoints[11]);
            
            const exitThresholdWrist = this.thresholds[1];
            const exitThresholdShoulder = this.thresholds[2] * this.exitThresholdMultiplier;
            if (!success && !this.completedHold) {
            // user is out of pose before completing
            if (this.leavePoseTime === null) {
                this.leavePoseTime = currentTime;
            }
            const elapsedLeave = currentTime - this.leavePoseTime;
            if (elapsedLeave > this.controller.phaseTimeouts.holdingAbandonment) {
                // 10 s up → force relaxation
                this.controller.enterRelaxation();
                return [ 'holding', false ];
            }
            } else {
                // either success or already completedHold
                this.leavePoseTime = null;
            }

            if (success) {
                if (!this.holdStartTime) this.holdStartTime = currentTime;
                this.successDuration = currentTime - this.holdStartTime;
                // printTextOnFrame(this.controller.frame, `Holding ${phase} (${this.successDuration.toFixed(1)}s)`, { x: 10, y: 60 }, 'green');
                if (this.successDuration >= this.minHoldDuration && !this.completedHold) {
                    this.completedHold = true;
                    // printTextOnFrame(this.controller.frame, 'Hold completed, stay or adjust to exit', { x: 10, y: 90 }, 'green');
                }
                return [phase, true];
            } else {
                console.log(`the value of dtwLeftWrist is: ${dtwLeftWrist}`);
                console.log(`the value of exitthresholdwrist is: ${exitThresholdWrist}`);
                
                // if (this.completedHold && (dtwLeftWrist > exitThresholdWrist)) {
                if (this.completedHold && (dtwLeftWrist > 0)) { // this is just for testing in real life we have to incerease it to exitthresholdwrist
                    const phaseName = phase.split('_')[1] || phase;
                    // printTextOnFrame(this.controller.frame, `${phaseName} completed, exiting hold (DTW: ${dtwWhole.toFixed(2)})`, { x: 10, y: 60 }, 'green');
                    console.log('Holding phase completed');
                    
                    this._resetTimers();
                }
                if (!this.completedHold) {
                    this.holdStartTime = null;
                    this.successDuration = 0;
                    // printTextOnFrame(this.controller.frame, 'Adjust pose to hold', { x: 10, y: 60 }, 'red');
                } else {
                    // printTextOnFrame(this.controller.frame, `Hold completed, stay or adjust to exit (DTW: ${dtwWhole.toFixed(2)})`, { x: 10, y: 60 }, 'green');
                }
            }
        } else {
            // printTextOnFrame(this.controller.frame, 'Adjust pose', { x: 10, y: 60 }, 'red');
            this.holdStartTime = null;
            this.successDuration = 0;
            this.completedHold = false;
        }
        return[ this.controller.segments[this.controller.currentSegmentIdx].phase, false ];
    }
}

class EndingPhase extends BasePhase {
    constructor(controller, targetFacing) {
        super(controller);
        this.targetFacing = targetFacing;
        this.thresholds = null;
    }

    process(currentTime) {
        console.log('Processing EndingPhase');
        const detectedFacing = this.controller.landmarks ? detectFacing(this.controller.landmarks) : 'random';
        console.log(`EndingPhase - Detected Facing: ${detectedFacing}, Target Facing: ${this.targetFacing}`);
        const phase = this.controller.segments[this.controller.currentSegmentIdx].phase;
        const idealEndingKeypoints = this.controller.getNextIdealKeypoints('starting', 0);
        this.thresholds = this.controller.segments[0].thresholds;
        console.log(`Thresholds of ending phase are ${this.thresholds}`);
        const [_, success] = checkBendback(
            null,
            idealEndingKeypoints,
            this.controller.normalizedKeypoints,
            this.controller.hipPoint,
            this.thresholds
        );
        // this.controller.frame = ctx;
        console.log(`Ending Frame Success: ${success}`);
        if (success && (detectedFacing === this.targetFacing)) {
            if (currentTime - this.controller.startTime >= this.holdDuration) {
                console.log('Ending phase completed');
                return [phase, true];
            }
        } else {
        }
        return [phase, false];
    }
}
class RelaxationPhase extends BasePhase {
    constructor(controller) {
        super(controller);
        this.currentFeedback   = "Relax and breathe";
    }

    process(currentTime) {
        this.controller.transitionKeypoints = [];
        this.controller.lastHoldingIdx     = -1;
        return {
        phase:     'relaxation',
        completed: this.shouldExitRelaxation()
    };  
  }

shouldExitRelaxation() {
    const startSegment = this.controller.segments.find(s => s.type === 'starting');
    if (!startSegment) return false;

    const expertKeypoints = this.controller.getIdealKeypoints(startSegment.phase);
    const userKeypoints   = this.controller.normalizedKeypoints;
    const distance        = calculateEuclideanDistance(userKeypoints, expertKeypoints);

    const THRESHOLD       = 2;
    const userFacing      = this.controller.landmarks
                          ? detectFacing(this.controller.landmarks)
                          : null;

    return distance < THRESHOLD && userFacing === startSegment.facing;
  }
}

function calculateDtwScore(p1, p2){
    if (!Array.isArray(p1[0])) p1 = [p1];
    if (!Array.isArray(p2[0])) p2 = [p2];
    if (p1.length !== p2.length) {
        throw new Error("Point arrays must be the same length");
    }

    let sum = 0;                              
    const n = p1.length;                        

    for (let i = 0; i < n; i++) {                
        const dx = p2[i][0] - p1[i][0];
        const dy = p2[i][1] - p1[i][1];
        sum += Math.hypot(dx, dy);                 
    }

    return { dtwDistance: sum / n };  
}
function checkPoseSuccess(idealKeypoints, normalizedKeypoints, thresholds) {
    if (!normalizedKeypoints) return false;
    const { dtwDistance: dtwWhole } = calculateDtwScore(idealKeypoints, normalizedKeypoints);
    const { dtwDistance: dtwLeftWrist } = calculateDtwScore([idealKeypoints[15]], [normalizedKeypoints[15]]);
    const { dtwDistance: dtwLeftShoulder } = calculateDtwScore([idealKeypoints[11]], [normalizedKeypoints[11]]);
    const isCompleted =  dtwWhole < thresholds[0] && dtwLeftWrist < thresholds[1] && dtwLeftShoulder < thresholds[2];
    return isCompleted;
  }

function calculateEuclideanDistance(p1, p2) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return Math.hypot(dx, dy);
}

function checkBendback(ctx, idealKeypoints, normalizedKeypoints, hipPoint, thresholds) {
    if (!normalizedKeypoints) {
        return [ctx, false];
    }


    const handTh  = thresholds[1] * calculateEuclideanDistance(idealKeypoints[15], idealKeypoints[23]);
    const shoulTh = thresholds[2] * calculateEuclideanDistance(idealKeypoints[11], idealKeypoints[23]);


    const success = checkPoseSuccess(idealKeypoints, normalizedKeypoints, [thresholds[0], handTh, shoulTh]);
    return [ctx, success];
}








function normalizeKeypoints(landmarks) {
    if (!landmarks || !Array.isArray(landmarks) || landmarks.length < 33) {
        console.warn('Invalid landmarks data:', landmarks);
        return null;
    }

    const keypoints = landmarks.map(lm => {
        if (typeof lm === 'object' && lm.x !== undefined) {
            return [lm.x || 0, lm.y || 0, lm.z || 0];
        }
        return [lm[0] || 0, lm[1] || 0, lm[2] || 0];
    });

    const hip = keypoints[24];
    if (!hip || hip.some(coord => coord === undefined)) {
        console.warn('Hip keypoint is invalid:', hip);
        return null;
    }

    const normalized = keypoints.map(point => [
        point[0] - hip[0],
        point[1] - hip[1],
        point[2] - hip[2]
    ]);

    console.log('Normalized keypoints - Hip (should be [0, 0, 0]):', normalized[24]);
    console.log('Normalized keypoints sample:', normalized.slice(0, 5));
    return [normalized, hip];
}


function denormalizeKeypoints(normalized, hip) {
  if (!Array.isArray(normalized) || normalized.length < 33) {
    console.warn('Invalid normalized data:', normalized);
    return null;
  }
  if (!Array.isArray(hip) || hip.length < 3) {
    console.warn('Invalid hip data:', hip);
    return null;
  }

  return normalized.map(point => [
    (point[0] || 0) + hip[0],
    (point[1] || 0) + hip[1],
    (point[2] || 0) + hip[2]
  ]);
}
function calculateNormal(p1, p2, p3) {
    const v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
    const v2 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];

    const normal = [
        v1[1] * v2[2] - v1[2] * v2[1],
        v1[2] * v2[0] - v1[0] * v2[2],
        v1[0] * v2[1] - v1[1] * v2[0]
    ];

    const normMagnitude = Math.sqrt(normal.reduce((sum, val) => sum + val * val, 0));
    const result = normMagnitude !== 0 ? normal.map(val => val / normMagnitude) : [0, 0, 0];
    console.log('Calculated normal:', result);
    return result;
}




function detectFacing(landmarks, xThreshold = 0.5, yThreshold = 0.5, zThreshold = 0.5) {
    const normalized = normalizeKeypoints(landmarks);
    const keypoints = normalized[0];
    if (!keypoints) {
        console.warn('No keypoints available for facing detection');
        return 'random';
    }


    const leftShoulder = keypoints[11];
    const rightShoulder = keypoints[12];
    const rightHip = keypoints[24];

    console.log('DetectFacing - Input landmarks sample complete:', landmarks);
    console.log('DetectFacing - Normalized keypoints sample:', keypoints.slice(0, 5));
    console.log('DetectFacing - Left Shoulder:', leftShoulder);
    console.log('DetectFacing - Right Shoulder:', rightShoulder);
    console.log('DetectFacing - Right Hip:', rightHip);

    if (!leftShoulder || !rightShoulder || !rightHip) {
        console.warn('Missing critical keypoints for facing detection');
        return 'random';
    }

    const [nx, ny, nz] = calculateNormal(leftShoulder, rightShoulder, rightHip);
    const absNx = Math.abs(nx), absNy = Math.abs(ny), absNz = Math.abs(nz);
    console.log('Normal components - nx:', nx, 'ny:', ny, 'nz:', nz);
    console.log('Absolute values - absNx:', absNx, 'absNy:', absNy, 'absNz:', absNz);

    const directions = {
        'x': [nx > 0 ? 'left' : 'right', absNx, xThreshold],
        'y': [ny > 0 ? 'up' : 'down', absNy, yThreshold],
        'z': [nz > 0 ? 'back' : 'front', absNz, zThreshold]
    };

    const [direction, magnitude, threshold] = Object.values(directions)
        .reduce((max, curr) => curr[1] > max[1] ? curr : max, ['', -1, 0]);
    console.log("its working");
    console.log('Facing detection - Direction:', direction, 'Magnitude:', magnitude, 'Threshold:', threshold);

    
    return magnitude > threshold ? direction : 'random';
}

 function checkKeypointVisibility(landmarks) {
  if (!landmarks || landmarks.length < 33) {
      console.warn('Landmarks incomplete for visibility check:', landmarks);
      return [false, ['all']];
  }
  const missing = [];
  for (let i = 0; i < landmarks.length; i++) {
      if (!landmarks[i].visibility || landmarks[i].visibility < 0.0) {
          missing.push(i);
      }
  }
  console.log('Keypoint visibility - Missing:', missing);
  return [missing.length === 0, missing];
}

 class YogaDataExtractor {
  constructor(jsonData) {
      console.log('[YogaDataExtractor] Creating YogaDataExtractor with JSON data');
      this.data = jsonData;
      this.keypointsData = jsonData?.frames || [];
      this.segmentsData = jsonData?.segments || [];
      this.loadPromise = this.ensureLoaded();
      console.log('[YogaDataExtractor] Initialized with frames:', this.keypointsData.length, 'segments:', this.segmentsData.length);
  }

  async ensureLoaded() {
      console.log('[YogaDataExtractor] Ensuring JSON data is loaded');
      if (!this.data || !this.segmentsData || !this.keypointsData) {
          console.warn('[YogaDataExtractor] JSON data not properly provided');
          this.data = { frames: [], segments: [] };
          this.keypointsData = [];
          this.segmentsData = [];
      }
  }

  segments() {
      console.log('[YogaDataExtractor] Generating segments');
      if (!this.data || !this.segmentsData || !Array.isArray(this.segmentsData)) {
          console.warn('[YogaDataExtractor] Segments data not available:', this.segmentsData);
          return [];
      }

      const segments = this.segmentsData.map(s => {
          try {
              const idealKeypoints = this.getIdealKeypoints(s[0], s[1]);
              const middleIdx = Math.floor(idealKeypoints.length / 2);
              const keypointsFrame = idealKeypoints[middleIdx] || [];
              const segment = {
                  start: s[0],
                  end: s[1],
                  phase: s[2],
                  thresholds: s[3],
                  facing: detectFacing(keypointsFrame),
                  type: s[2].split('_')[0]
              };
              console.log(`[YogaDataExtractor] Created segment: ${segment.phase}`);
              return segment;
          } catch (e) {
              console.error(`[YogaDataExtractor] Invalid segment: ${s}`, e);
              return null;
          }
      }).filter(s => s !== null);
      console.log('[YogaDataExtractor] Segments generated:', segments);
      return segments;
  }

  getIdealKeypoints(startFrame, endFrame) {
      if (!this.keypointsData || !Array.isArray(this.keypointsData)) {
          console.warn('[YogaDataExtractor] No keypoints data available');
          return [];
      }
      const subData = this.keypointsData.slice(startFrame, endFrame);
      return subData.map(frame => 
          frame.map(kp => {
              const [x, y, z] = kp.split(',').slice(0, 3).map(parseFloat);
              return [x || 0, y || 0, z || 0];
          })
      );
  }
}


 class TransitionAnalyzer {
  constructor(jsonData, yogaName) {
      console.log(`[TransitionAnalyzer] Creating TransitionAnalyzer for ${yogaName} with JSON data`);
      this.yoga = new YogaDataExtractor(jsonData);
      this.yogaName = yogaName;
      this.segments = this.yoga.segments();
      this.transitionPaths = this._createTransitionPaths();
      console.log('[TransitionAnalyzer] Transition paths created:', this.transitionPaths);
  }

  _createTransitionPaths() {
      console.log('[TransitionAnalyzer] Creating transition paths');
      const transitionPaths = [];
      const holdingIndices = this.segments
          .map((seg, i) => seg.type === 'starting' || seg.type === 'holding' || seg.type === 'ending' ? i : -1)
          .filter(i => i !== -1);

      for (let i = 0; i < holdingIndices.length - 1; i++) {
          const startIdx = holdingIndices[i];
          const endIdx = holdingIndices[i + 1];
          const startFrame = this.segments[startIdx].end;
          const endFrame = this.segments[endIdx].start;
          if (startFrame >= endFrame) continue;

          const idealKeypoints = this.yoga.getIdealKeypoints(startFrame, endFrame);
          if (!idealKeypoints.length) continue;

          const leftWristKeypoints = idealKeypoints.map(frame => frame[15]);
          const threshold = this.segments[endIdx].thresholds ? this.segments[endIdx].thresholds[0] : 0.1;
          transitionPaths.push({
              startSegmentIdx: startIdx,
              endSegmentIdx: endIdx,
              startFrame,
              endFrame,
              leftWristPath: leftWristKeypoints,
              threshold
          });
      }
      console.log('[TransitionAnalyzer] Transition paths:', transitionPaths);
      return transitionPaths;
  }

  analyzeTransition( userKeypoints, currentSegmentIdx) {
        console.log('Analyzing transition for segment:', currentSegmentIdx);
        const userLeftWrist = userKeypoints[15];
        for (const path of this.transitionPaths) {
            if (currentSegmentIdx > path.startSegmentIdx && currentSegmentIdx < path.endSegmentIdx) {
                // drawTr/ansitionPath(ctx, path.leftWristPath, userKeypoints, path.threshold);
                const distances = path.leftWristPath.map(p => Math.hypot(userLeftWrist[0] - p[0], userLeftWrist[1] - p[1]));
                const minDistance = Math.min(...distances);
                const withinPath = minDistance <= path.threshold;
                const color = withinPath ? 'green' : 'red';
                // printTextOnFrame(ctx, `Transition: ${withinPath ? 'Within Path' : 'Off Path'} (Dist: ${minDistance.toFixed(2)})`, { x: 10, y: 90 }, color);
                return withinPath;
            }
        }
        return false;
    }

    // transition_analysis.js
    _toPixelCoords(point, width, height) {
        // Handle array or object format
        const x = point.x ?? point[0] ?? 0;
        const y = point.y ?? point[1] ?? 0;

        const safeWidth = width || 1280;
        const safeHeight = height || 720;

        return [
            (x + 1) * safeWidth / 2,
            (y + 1) * safeHeight / 2
        ];
    }
    getTransitionEndTarget(currentSegmentIdx) {
        for (const path of this.transitionPaths) {
            if (currentSegmentIdx > path.startSegmentIdx && currentSegmentIdx <= path.endSegmentIdx) {
                return path.leftWristPath[path.leftWristPath.length - 1];
            }
        }
        return [0, 0, 0];
    }
}

 function integrateWithController(controller, transitionAnalyzer) {
  console.log('Integrating TransitionAnalyzer with Controller');
    const originalProcessExercise = controller.processExercise;
    controller.processExercise = function(currentTime) {
        const [phase, exerciseName, count, targetReps] = originalProcessExercise.call(this, currentTime);
        const currentSegment = this.segments[this.currentSegmentIdx];

        if (this.normalizedKeypoints) {
            const userLeftWrist = this.normalizedKeypoints[15];
            console.info(`User wrist position is: ${userLeftWrist}`);
            // const userWristPixel = transitionAnalyzer._toPixelCoords(userLeftWrist, width, height);

            for (const path of transitionAnalyzer.transitionPaths) {
                if (this.currentSegmentIdx > path.startSegmentIdx && this.currentSegmentIdx <= path.endSegmentIdx) {
                    // drawTransitionPath(this.frame, path.leftWristPath, this.normalizedKeypoints, path.threshold);

                    if (currentSegment.type !== 'starting' && currentSegment.type !== 'holding' && currentSegment.type !== 'ending') {
                        // const withinPath = transitionAnalyzer.analyzeTransition(this.frame, this.normalizedKeypoints, this.currentSegmentIdx);
                    } else if (['starting', 'holding', 'ending'].includes(currentSegment.type) && path.endSegmentIdx === this.currentSegmentIdx) {
                        const handler = this.phaseHandlers[currentSegment.handlerKey];
                        const [, completed] = handler.process(currentTime);
                    }
                }
            }
        }
        return [phase, exerciseName, count, targetReps];
  };
}

class Controller {
    constructor(exercisePlan) {
        console.log('Constructing Controller with exercise plan:', exercisePlan);
        this.lastValidPoseTime = performance.now();  
        this.inRelaxation = false;
        this.relaxationEnteredTime = 0;
        this.relaxationThreshold = 5;
        this.relaxationSegmentIdx = 0;

        this.exercisePlan = exercisePlan;
        this.currentExerciseIdx = 0;
        this.exerciseNames = Object.keys(exercisePlan);
        this.currentExercise = this.exerciseNames[this.currentExerciseIdx];
        this.jsonData = exercisePlan[this.currentExercise].json_data;
        this.targetReps = exercisePlan[this.currentExercise].reps;
        
        // Yoga data components
        this.yoga = new YogaDataExtractor(this.jsonData);
        this.segments = this.yoga.segments();  
        this.currentSegmentIdx = 0;
        
        // Phase handling
        this.phaseHandlers = this._initializeHandlers(); 
        
        // Rep tracking
        this.count = 0;
        this.startTime = performance.now();  
        this.currentRepStartTime = null;
        
        this.landmarks = null;
        this.normalized = null;
        this.normalizedKeypoints = null;
        this.hipPoint = 0;
        this.transitionKeypoints = [];
        this.workoutCompleted = false;

        this.lastValidHoldTime = 0;
        this.phaseTimeouts = {
            transition: 10000, 
            holdingAbandonment: 5000, 
            holdingDuration: 5000  
        };
        this.lostPoseWarned = false;
        this.currentExpertKeypoints = null;
        // Analysis tools
        this.lastHoldingIdx = -1;
        // this.replogger = new RepLogger();
        // this.current_rep_start_time = null;
        this.transitionAnalyzer = new TransitionAnalyzer(this.jsonData, this.currentExercise);
    }

    async initialize() {
        console.log('Initializing YogaDataExtractor');
        await this.yoga.ensureLoaded();
        console.log("Data loaded and exercise initialized");
        this.segments = this.yoga.segments();
        console.log('Segments initialized:', this.segments);
        if (this.segments.length === 0) {
            console.error('No segments available, exercise cannot start');
            return;
        }
        this.phaseHandlers = this._initializeHandlers();
        console.log('Phase handlers initialized:', Object.keys(this.phaseHandlers));
        integrateWithController(this, this.transitionAnalyzer);
        console.log('Transition analyzer integrated');
    }

    _initializeHandlers() {
        const handlers = {};
        this.segments.forEach((segment, i) => {
            const phase = segment.phase;
            const phaseType = segment.type;
            const uniqueKey = `${phase}_${i}`;
            const startFacing = segment.facing;

            if (phaseType === 'starting') {
                handlers[uniqueKey] = new StartPhase(this, startFacing);
            } else if (phaseType === 'transition') {
                handlers[uniqueKey] = new TransitionPhase(this , startFacing); // Pass facing
            } else if (phaseType === 'holding') {
                handlers[uniqueKey] = new HoldingPhase(this, segment.thresholds, startFacing); // Add facing
            } else if (phaseType === 'ending') {
                handlers[uniqueKey] = new EndingPhase(this, startFacing);
            }else if (phaseType === 'relaxation') {
                handlers[uniqueKey] = new RelaxationPhase(this, startFacing);
            }
            segment.handlerKey = uniqueKey;
        });
        return handlers;
    }
    getExcerciseName(){
        return this.currentExercise;
    }

    startExerciseSequence() {
        console.log(`Starting exercise sequence for ${this.currentExercise}`);
    }
    update_phase_handlers_frame(){
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
            console.log('Pose landmarks regained');
            this.lostPoseWarned = false;
        }

        this.landmarks = results.poseLandmarks;
        const [allVisible, missing] = checkKeypointVisibility(this.landmarks);

        if (allVisible) {
            this.lastValidPoseTime = performance.now();

            [this.normalizedKeypoints, this.hipPoint] = normalizeKeypoints(this.landmarks);
            this.update_phase_handlers_frame();
        } else {
            this.normalizedKeypoints = null;
            console.log(`Missing keypoints: ${missing.join(', ')}`);
        }

        this.update_phase_handlers_frame();
    }



    handleRepCompletion(currentTime) {
        this.count++;
        
        if (this.count >= this.targetReps) {
            // Load next exercise
            if (this.currentExerciseIdx < this.exerciseNames.length - 1) {
                this.currentExerciseIdx++;
                currentIdx++;
                this.resetForNewExercise();
                console.log(`Starting next exercise: ${this.currentExercise}`);
            }
            else{
                this.workoutCompleted = true;
                console.log('Workout completed');
            }
        }
        
        this.currentSegmentIdx = 0;
        this.startTime = currentTime;
    }
    checkPhaseTimeouts(currentTime) {
        const currentSegment = this.segments[this.currentSegmentIdx];
        
        if (currentSegment.type === 'transition') {
            const elapsed = currentTime - this.startTime;
            if (elapsed > this.phaseTimeouts.transition) {
                console.log('Transition timeout triggered');
                this.currentSegmentIdx = 0; 
                this.transitionKeypoints = [];
            }
        }
        
        if (currentSegment.type === 'holding') {
            if (currentTime - this.lastValidHoldTime > this.phaseTimeouts.holdingAbandonment) {
                console.log('Holding abandonment detected');
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
        
        if (this.count >= this.targetReps) {
            if (this.currentExerciseIdx < this.exerciseNames.length - 1) {
                this.currentExerciseIdx++;
                currentIdx++;
                this.resetForNewExercise();
            } else {
            }
        }
        
        this.currentSegmentIdx = this.relaxationSegmentIdx;
        this.startTime = currentTime;
    }
    resetForNewExercise() {
        this.currentExercise = this.exerciseNames[this.currentExerciseIdx];
        this.jsonData = this.exercisePlan[this.currentExercise].jsonData;
        this.targetReps = this.exercisePlan[this.currentExercise].reps;
        this.yoga = new YogaDataExtractor(this.jsonData);
        this.segments = this.yoga.segments();
        this.phaseHandlers = this._initializeHandlers();
        console.log(`Phase handlers initialized: ${this.phaseHandlers}`);

        this.count = 0;
    }
    shouldEnterRelaxation(currentTime) {
        const current = this.segments[this.currentSegmentIdx];
        const elapsed = currentTime - this.lastValidPoseTime;

        if (!this.landmarks && elapsed > this.relaxationThreshold*1000) {
            return true;
        }

        if (['starting','ending'].includes(current?.type)) {
            if (this.landmarks) {
                const target = current.facing || 'front';
                console.log(`target facing declared here: ${target}`)
                console.log(`Normalized keypoints testing for facing=${this.normalizedKeypoints}`);
                const facing = detectFacing(this.landmarks);  // Raw landmarks, not normalized
                console.log('code works fine till here')
                if (facing != null && facing !== target) {
                console.log(`Detected facing=${facing}, expected=${target} → relaxing`);
                return true;
                }
            }
        }

        // Transition timeout
        if (current?.type === 'transition' &&
            currentTime - this.startTime > this.phaseTimeouts.transition) {
            return true;
        }

        return false;
    }

    handleRelaxationPhase(currentTime) {
        
        if (!this.inRelaxation) {
            this.inRelaxation = true;
            this.relaxationEnteredTime = currentTime;
            console.log("Entering relaxation phase");
        }

        const handler = new RelaxationPhase(this);
        const { phase, completed } = handler.process(currentTime);

        // Check exit conditions
        if (completed || (currentTime - this.relaxationEnteredTime) > 30000) {
            this.inRelaxation = false;
            this.lastValidPoseTime = currentTime;
            console.log("Exiting relaxation phase");
        }
    }

    getRelaxationReturnValues() {
        return [
            'relaxation',
            this.currentExercise,
            this.count,
            this.targetReps
        ];

    }
    processExercise(currentTime) {
        // Handle relaxation phase entry
        if (!this.segments || this.segments.length === 0) {
            console.error('No segments loaded!');
            return ['error', '', 0, 0];
        }
        
        if (this.currentSegmentIdx >= this.segments.length) {
            console.warn('Segment index overflow - resetting');
            this.currentSegmentIdx = 0;
        }

        if (this.shouldEnterRelaxation(currentTime)) {
            this.handleRelaxationPhase(currentTime);
            return this.getRelaxationReturnValues();
        }

        const currentSegment = this.segments[this.currentSegmentIdx];
        const handler = this.phaseHandlers[currentSegment.handlerKey];
        
        const [phase, completed] = handler.process(currentTime);

        if (currentSegment.type === 'transition' && this.normalizedKeypoints) {
            this.transitionKeypoints.push(this.normalizedKeypoints);
        }

        // Draw skeleton for non-transitions
        if (this.landmarks && currentSegment.type !== 'transition') {
            // drawPoseSkeleton(this.frame, this.landmarks);
        }

        // Holding phase visualization
        if (currentSegment.type === 'holding' && this.normalizedKeypoints) {
            const idealKeypoints = this.getIdealKeypoints(currentSegment.phase);
            if (idealKeypoints.length) {
                const dtwResult = calculateDtwScore(idealKeypoints, this.normalizedKeypoints);
                if (dtwResult?.dtwDistance !== undefined) {
                    
                    const hipNorm     = this.hipPoint;               // [x,y] in 0…1
                    const userRel     = this.normalizedKeypoints[15]; // [dx,dy] around hip
                    const idealRel    = idealKeypoints[15];               
                    const isSuccess   = (dtwResult.dtwDistance < currentSegment.thresholds[0]);


                }
            }
        }
        if (completed) {
            if (currentSegment.type === 'starting') {
                // Starting phase completed, move to transition
                this.currentSegmentIdx++;
                this.startTime = currentTime;
            } 
            else if (currentSegment.type === 'transition') {
                if (currentTime - this.startTime > 10000) { 
                    this.currentSegmentIdx = 0; 
                    console.log('Transition timeout - returning to relaxation');
                } else {
                    this.currentSegmentIdx++;
                    this.startTime = currentTime;
                }
            }
            else if (currentSegment.type === 'holding') {
                // Start monitoring for abandonment
                const newIdx = this.currentSegmentIdx + 1;
                this.currentSegmentIdx = newIdx;
                this.startTime = currentTime;

                const nextSeg = this.segments[newIdx];
                if (nextSeg.type === 'holding') {
                this.phaseHandlers[nextSeg.handlerKey]._resetTimers();
                }
            }
            else if (currentSegment.type === 'ending') {
                // Rep completion logic
                this.handleRepCompletion(currentTime);
                this.currentSegmentIdx = this.relaxationSegmentIdx;
            }
        }
        let feedback = '';
        // Check for holding phase abandonment
        if (currentSegment.type === 'holding' && 
            currentTime - this.lastValidHoldTime > 5000) {
            console.log('Holding phase abandoned - returning to relaxation');
            this.currentSegmentIdx = 0;
        }
        if (currentSegment.type === 'holding' && this.normalizedKeypoints) {
        const idealKeypoints = this.getIdealKeypoints(currentSegment.phase);
            if (idealKeypoints.length) {
                const dtwResult = calculateDtwScore(idealKeypoints, this.normalizedKeypoints);
                if (dtwResult && typeof dtwResult.dtwDistance === 'number') {
                feedback = dtwResult.dtwDistance < currentSegment.thresholds[0]
                    ? 'Good form! Keep it up!'
                    : 'Adjust your pose to match the ideal position.';
                }
            }
        }
        return [phase, this.currentExercise, this.count, this.targetReps, feedback];
    }

    getIdealKeypoints(phase) {
        const segment = this.segments[this.currentSegmentIdx];
        if (segment.phase === phase) {
            const middle = Math.floor((segment.start + segment.end) / 2);
            return this.yoga.getIdealKeypoints(middle, middle + 1)[0] || [];
        }
        return [];
    }
    getNextIdealKeypoints(phase, segmentidx){
        const segment = this.segments[segmentidx];
        const middle = Math.floor((segment.start + segment.end) / 2);
        return this.yoga.getIdealKeypoints(middle, middle + 1)[0] || [];
        
    }


    getTransitionKeypoints(startIdx, endIdx) {
        for (let i = startIdx; i < endIdx; i++) {
            if (this.segments[i].type === 'transition') {
                return this.yoga.getIdealKeypoints(this.segments[i].start, this.segments[i].end);
            }
        }
        return [];
    }
}

// worker.js


// helper to init one exercise
async function initCurrentExercise(sendTime) {
  const ex = exercises[currentIdx];
  const start = performance.now();
  operationId++;

  console.log(`[Worker ${workerId}] init exercise #${currentIdx}: ${ex.name}`);

  // build a one-exercise plan
  const plan = [{
    [ex.name]: {
      json_data: ex.altData,
      reps: ex.reps
    }
  }];
  console.log('Current exercise plan is:', plan[currentIdx]);
  controller = new Controller(plan[currentIdx]);
  await controller.initialize();
  controller.startExerciseSequence();
  currentTime = 0;           // reset the time counter for frames

  // tell Svelte we’re ready to start frames for this exercise
  self.postMessage({
    type: 'init_done',
    operation: operationId,
    value: {
      exercise: ex.name,
      reps: ex.reps,
      exerciseName: controller.getExcerciseName()
    },
    sendTime,
    processingTime: performance.now() - start
  });

  console.log(`[Worker ${workerId}] init_done sent for ${ex.name}`);
}

self.onmessage = async (e) => {
  const { type, op, data, sendTime } = e.data;
  const receiveTime = performance.now();

  operationId = (op != null) ? op : (operationId + 1);
  if (type === 'init') {
    exercises = data.exerciseData;   // save the full list
    currentIdx = 0;
    await initCurrentExercise(sendTime);
    return;
  }

  // ───────── PROCESS EACH FRAME ─────────
  if (type === 'process_frame') {
    const frameStart = performance.now();
    try {
      if (!controller) throw new Error('not initialized');

      const transformed = {
        poseLandmarks: data.results.landmarks?.[0] || []
      };
      controller.updateFrame(transformed);
      currentTime += 1 / 60;

      const [phase, exerciseName, repCount, totalReps, feedback] =
        controller.processExercise(currentTime);

      const score = totalReps
        ? Math.round((repCount / totalReps) * 100)
        : 0;

      // send the usual frame result
      self.postMessage({
        type: 'frame_result',
        operation: operationId,
        value: {
          exerciseName,
          repCount,
          totalReps,
          score,
          currentPhase: phase,
          feedback,
          currentExerciseName: controller.getExcerciseName()
        },
        sendTime,
        processingTime: performance.now() - frameStart
      });

      // …and *if* they’ve finished all reps, move to next exercise:
      if (repCount >= totalReps) {
        console.log(`[Worker ${workerId}] Completed "${exerciseName}". moving on`);
        currentIdx++;
        if (currentIdx < exercises.length) {
          // init the *next* exercise:
          await initCurrentExercise(sendTime);
        } else {
          // no more exercises! notify Svelte if you like:
          self.postMessage({
            type: 'all_done',
            operation: operationId,
            sendTime,
            processingTime: performance.now() - frameStart
          });
          console.log(`[Worker ${workerId}] All exercises complete`);
        }
      }
    } catch (err) {
      console.error(`[Worker ${workerId}] process_frame error:`, err);
      self.postMessage({
        type: 'error',
        operation: operationId,
        error: err.message,
        sendTime,
        processingTime: performance.now() - frameStart
      });
    }
    return;
  }

  // ───────── GET CURRENT EXERCISE NAME ─────────
  if (type === 'get_exercise_name') {
    const start = performance.now();
    try {
      if (!controller) throw new Error('not initialized');
      const name = controller.getExcerciseName();
      self.postMessage({
        type: 'exercise_name_result',
        operation: operationId,
        value: { exerciseName: name },
        sendTime,
        processingTime: performance.now() - start
      });
    } catch (err) {
      console.error(`[Worker ${workerId}] get_exercise_name error:`, err);
      self.postMessage({
        type: 'error',
        operation: operationId,
        error: err.message,
        sendTime,
        processingTime: performance.now() - start
      });
    }
    return;
  }

  console.warn(`[Worker ${workerId}] Unknown message type:`, type);
};

self.onerror = (err) => {
  console.error(`[Worker ${workerId}] Unhandled error:`, err);
};
