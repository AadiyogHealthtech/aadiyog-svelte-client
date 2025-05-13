// phase handlers 

class BasePhase {
  constructor(controller) {
      this.controller = controller;
      this.holdDuration = 3;
  }

  process(currentTime) {
      throw new Error('Not implemented');
  }
}

 class StartPhase extends BasePhase {
  constructor(controller, targetFacing) {
      super(controller);
      // console.log(`StartPhase initialized with target facing: ${targetFacing}`);
      this.targetFacing = targetFacing;
  }

  process(currentTime) {
      // console.log('Processing StartPhase');
      const detectedFacing = this.controller.landmarks ? detectFacing(this.controller.landmarks) : 'random';
      // console.log(`StartPhase - Detected Facing: ${detectedFacing}, Target Facing: ${this.targetFacing}`);
      const phase = this.controller.segments[this.controller.currentSegmentIdx].phase;
      if (detectedFacing === this.targetFacing) {
          // Canvas-related code commented out:
          // printTextOnFrame(this.controller.frame, `Starting pose (${this.targetFacing}) detected`, { x: 10, y: 60 }, 'green');
          
          if (currentTime - this.controller.startTime >= this.holdDuration) {
              // console.log('Start phase completed');
              return [phase, true];
          }
      } 
      return [phase, false];
  }
}

 class TransitionPhase extends BasePhase {
  process(currentTime) {
      // console.log('Processing TransitionPhase');
      const phase = this.controller.segments[this.controller.currentSegmentIdx].phase;
      
      // Canvas-related code commented out:
      // printTextOnFrame(this.controller.frame, 'Transitioning...', { x: 10, y: 60 }, 'yellow');
      
      if (currentTime - this.controller.startTime >= this.holdDuration) {
          // console.log('Transition phase completed');
          return [phase, true];
      }
      return [phase, false];
  }
}

 class HoldingPhase extends BasePhase {
  constructor(controller, thresholds) {
      super(controller);
      console.log('HoldingPhase initialized with thresholds:', thresholds);
      this.thresholds = thresholds;
      this.holdStartTime = null;
      this.successDuration = 0;
      this.minHoldDuration = 1;
      this.completedHold = false;
      this.exitThresholdMultiplier = 1.1;
  }
  
  process(currentTime) {
      // console.log("controller"+this.controller.normalizedKeypoints);
      // console.log('Processing HoldingPhase');
      const phase = this.controller.segments[this.controller.currentSegmentIdx].phase;
      const idealKeypoints = this.controller.getIdealKeypoints(phase);
      // console.log('Ideal keypoints for holding phase from phase handler:', idealKeypoints);

      if (this.controller.lastHoldingIdx !== -1 && 
          this.controller.currentSegmentIdx > this.controller.lastHoldingIdx && 
          this.controller.transitionKeypoints.length) {
          const idealTransKeypoints = this.controller.getTransitionKeypoints(this.controller.lastHoldingIdx, this.controller.currentSegmentIdx);
          if (idealTransKeypoints.length && this.controller.transitionKeypoints.length) {
              const minLen = Math.min(this.controller.transitionKeypoints.length, idealTransKeypoints.length);
              const userTrans = this.controller.transitionKeypoints.slice(0, minLen).flat();
              const idealTrans = idealTransKeypoints.slice(0, minLen).flat();
              const { dtwDistance } = calculateDtwScore(userTrans, idealTrans);
              
              // Canvas-related code commented out:
              // const color = dtwDistance < 50 ? 'green' : 'red';
              // printTextOnFrame(this.controller.frame, `Transition DTW: ${dtwDistance.toFixed(2)}`, { x: 10, y: 120 }, color);
          }
      }

      if (this.controller.normalizedKeypoints) {
          // Modified to ignore canvas context return value
          const [_, success] = checkBendback(null, idealKeypoints, this.controller.normalizedKeypoints, currentTime, this.thresholds);
          // this.controller.frame = ctx; // Canvas-related code commented out

          // console.log("success from phase handler holding"+ success);
          
          const { dtwDistance: dtwWhole } = calculateDtwScore(idealKeypoints, this.controller.normalizedKeypoints);
          const exitThreshold = this.thresholds[0] * this.exitThresholdMultiplier;

          // Canvas-related drawing code commented out:
          /*
          // Draw DTW scores
          const scores = {
              [phase]: { value: dtwWhole, threshold: this.thresholds[0] }
          };
          drawDtwScores(this.controller.frame, scores);

          // Draw arrow from user wrist to ideal wrist position
          const width = this.controller.frame.canvas.width;
          const height = this.controller.frame.canvas.height;
          const userWrist = this.controller.normalizedKeypoints[15]; // LEFT_WRIST
          const idealWrist = idealKeypoints[15];
          const userWristPixel = [(userWrist[0] + 1) * width / 2, (userWrist[1] + 1) * height / 2];
          const idealWristPixel = [(idealWrist[0] + 1) * width / 2, (idealWrist[1] + 1) * height / 2];
          this.controller.frame.beginPath();
          this.controller.frame.moveTo(userWristPixel[0], userWristPixel[1]);
          this.controller.frame.lineTo(idealWristPixel[0], idealWristPixel[1]);
          this.controller.frame.strokeStyle = success ? 'green' : 'red';
          this.controller.frame.lineWidth = 3;
          this.controller.frame.stroke();
          // Draw arrowhead
          const angle = Math.atan2(idealWristPixel[1] - userWristPixel[1], idealWristPixel[0] - userWristPixel[0]);
          const arrowSize = 10;
          this.controller.frame.beginPath();
          this.controller.frame.moveTo(idealWristPixel[0], idealWristPixel[1]);
          this.controller.frame.lineTo(
              idealWristPixel[0] - arrowSize * Math.cos(angle + Math.PI / 6),
              idealWristPixel[1] - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          this.controller.frame.moveTo(idealWristPixel[0], idealWristPixel[1]);
          this.controller.frame.lineTo(
              idealWristPixel[0] - arrowSize * Math.cos(angle - Math.PI / 6),
              idealWristPixel[1] - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          this.controller.frame.stroke();
          console.log(`Arrow drawn from (${userWristPixel[0]}, ${userWristPixel[1]}) to (${idealWristPixel[0]}, ${idealWristPixel[1]})`);
          */

          if (success) {
              if (!this.holdStartTime) this.holdStartTime = currentTime;
              this.successDuration = currentTime - this.holdStartTime;
              
              // Canvas-related code commented out:
              // printTextOnFrame(this.controller.frame, `Holding ${phase} (${this.successDuration.toFixed(1)}s)`, { x: 10, y: 60 }, 'green');
              
              if (this.successDuration >= this.minHoldDuration && !this.completedHold) {
                  this.completedHold = true;
                  
                  // Canvas-related code commented out:
                  // printTextOnFrame(this.controller.frame, 'Hold completed, stay or adjust to exit', { x: 10, y: 90 }, 'green');
              }
              return [phase, true];
          } else {
              if (this.completedHold && dtwWhole > exitThreshold) {
                  const phaseName = phase.split('_')[1] || phase;
                  
                  // Canvas-related code commented out:
                  // printTextOnFrame(this.controller.frame, `${phaseName} completed, exiting hold (DTW: ${dtwWhole.toFixed(2)})`, { x: 10, y: 60 }, 'green');
                  
                  // console.log('Holding phase completed');
                  return [phase, true];
              }
              if (!this.completedHold) {
                  this.holdStartTime = null;
                  this.successDuration = 0;
                  
                  // Canvas-related code commented out:
                  // printTextOnFrame(this.controller.frame, 'Adjust pose to hold', { x: 10, y: 60 }, 'red');
              } else {
                  // Canvas-related code commented out:
                  // printTextOnFrame(this.controller.frame, `Hold completed, stay or adjust to exit (DTW: ${dtwWhole.toFixed(2)})`, { x: 10, y: 60 }, 'green');
              }
          }
      } else {
          // Canvas-related code commented out:
          // printTextOnFrame(this.controller.frame, 'Adjust pose', { x: 10, y: 60 }, 'red');
          
          this.holdStartTime = null;
          this.successDuration = 0;
          this.completedHold = false;
      }
      return [phase, this.completedHold];
  }
}

 class EndingPhase extends BasePhase {
  constructor(controller, targetFacing) {
      super(controller);
      // console.log(`EndingPhase initialized with target facing: ${targetFacing}`);
      this.targetFacing = targetFacing;
  }

  process(currentTime) {
      // console.log('Processing EndingPhase');
      const detectedFacing = this.controller.landmarks ? detectFacing(this.controller.landmarks) : 'random';
      // console.log(`EndingPhase - Detected Facing: ${detectedFacing}, Target Facing: ${this.targetFacing}`);
      const phase = this.controller.segments[this.controller.currentSegmentIdx].phase;
      if (detectedFacing === this.targetFacing) {
          // Canvas-related code commented out:
          // printTextOnFrame(this.controller.frame, 'Repetition completed', { x: 10, y: 60 }, 'green');
          
          if (currentTime - this.controller.startTime >= this.holdDuration) {
              // console.log('Ending phase completed');
              return [phase, true];
          }
      } else {
          // Canvas-related code commented out:
          // printTextOnFrame(this.controller.frame, `Face ${this.targetFacing} to end`, { x: 10, y: 60 }, 'red');
      }
      return [phase, false];
  }
}

function checkPoseSuccess(idealKeypoints, normalizedKeypoints, thresholds) {
  if (!normalizedKeypoints) return false;
  const dtwStart = performance.now();
  const { dtwDistance: dtwWhole } = calculateDtwScore(idealKeypoints, normalizedKeypoints);
  const { dtwDistance: dtwHand } = calculateDtwScore(idealKeypoints.slice(13, 21), normalizedKeypoints.slice(15, 21));
  const { dtwDistance: dtwShoulder } = calculateDtwScore([idealKeypoints[11], idealKeypoints[12]], [normalizedKeypoints[11], normalizedKeypoints[12]]);
  // console.log(`[Debug] DTW calculation time: ${performance.now() - dtwStart}ms`);
  // console.log(`[Debug] DTW scores - Whole: ${dtwWhole.toFixed(2)} (Threshold: ${thresholds[0]}), Hand: ${dtwHand.toFixed(2)} (Threshold: ${thresholds[1]}), Shoulder: ${dtwShoulder.toFixed(2)} (Threshold: ${thresholds[2]})`);

  const isCompleted = dtwWhole < thresholds[0] && dtwHand < thresholds[1];
  console.log(`[Debug] Pose success: ${isCompleted}`);
  return isCompleted;
}

 function checkBendback(ctx, idealKeypoints, normalizedKeypoints, currentTime, thresholds) {

  if (!normalizedKeypoints) {
      // Canvas-related code commented out:
      // printTextOnFrame(ctx, 'Keypoints not detected', { x: 50, y: 50 }, 'red');
      return [ctx, false];
  }

  const { dtwDistance: dtwWhole } = calculateDtwScore(idealKeypoints, normalizedKeypoints);
  const { dtwDistance: dtwHand } = calculateDtwScore(idealKeypoints.slice(13, 21), normalizedKeypoints.slice(15, 21));
  const { dtwDistance: dtwShoulder } = calculateDtwScore([idealKeypoints[11], idealKeypoints[12]], [normalizedKeypoints[11], normalizedKeypoints[12]]);
  const { dtwDistance: dtwTorso } = calculateDtwScore([idealKeypoints[15]], [normalizedKeypoints[15]]);

  // Canvas-related code commented out:
  /*
  const scores = {
      'Whole Body': { value: dtwWhole, threshold: thresholds[0] },
      'Hand': { value: dtwHand, threshold: thresholds[1] },
      'Shoulder': { value: dtwShoulder, threshold: thresholds[2] }
  };
  drawDtwScores(ctx, scores);
T
  const idealWrist = idealKeypoints[15];
  const curWrist = normalizedKeypoints[15];
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const curPoint = [(curWrist[0] + 1) * width / 2, (curWrist[1] + 1) * height / 2];
  const idealPoint = [(idealWrist[0] + 1) * width / 2, (idealWrist[1] + 1) * height / 2];
  ctx.beginPath();
  ctx.moveTo(curPoint[0], curPoint[1]);
  ctx.lineTo(idealPoint[0], idealPoint[1]);
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = 3;
  ctx.stroke();
  */

  const success = checkPoseSuccess(idealKeypoints, normalizedKeypoints, thresholds);
  console.log("sucess from checkbecndback" + success)
  return [ctx, success]; // Still returning ctx for compatibility, but it's not modified
}



// utils


function difference(a, b) {
  return Math.abs(a - b);
}

function norm(p) {
  return function(a, b) {
      const diff = Array.isArray(a) ? 
          a.map((val, i) => val - b[i]) : 
          [a - b];
      return Math.pow(diff.reduce((sum, val) => sum + Math.pow(Math.abs(val), p), 0), 1/p);
  };
}

  function fastdtw(x, y, radius = 1, dist = null) {
  const [preparedX, preparedY, preparedDist] = prepInputs(x, y, dist);
  return fastdtwCore(preparedX, preparedY, radius, preparedDist);
}

function prepInputs(x, y, dist) {
  const xArr = Array.isArray(x) ? x : [x];
  const yArr = Array.isArray(y) ? y : [y];

  if (xArr.length > 1 && yArr.length > 1 && Array.isArray(xArr[0]) && Array.isArray(yArr[0]) && xArr[0].length !== yArr[0].length) {
      throw new Error('Second dimension of x and y must be the same');
  }
  
  if (typeof dist === 'number' && dist <= 0) {
      throw new Error('Distance metric must be positive');
  }

  let finalDist = dist;
  if (dist === null) {
      finalDist = (xArr.length === 1 || !Array.isArray(xArr[0])) ? difference : norm(2); // Use Euclidean for keypoints
  } else if (typeof dist === 'number') {
      finalDist = norm(dist);
  }

  return [xArr, yArr, finalDist];
}

function fastdtwCore(x, y, radius, dist) {
  const minTimeSize = radius + 2;

  if (x.length < minTimeSize || y.length < minTimeSize) {
      return dtw(x, y, dist);
  }

  const xShrinked = reduceByHalf(x);
  const yShrinked = reduceByHalf(y);
  
  const [distance, path] = fastdtwCore(xShrinked, yShrinked, radius, dist);
  const window = expandWindow(path, x.length, y.length, radius);
  
  return dtwCore(x, y, window, dist);
}

function dtw(x, y, dist = null) {
  const [preparedX, preparedY, preparedDist] = prepInputs(x, y, dist);
  return dtwCore(preparedX, preparedY, null, preparedDist);
}

function dtwCore(x, y, window, dist) {
  const lenX = x.length;
  const lenY = y.length;
  
  let fullWindow = window || [];
  if (!window) {
      for (let i = 0; i < lenX; i++) {
          for (let j = 0; j < lenY; j++) {
              fullWindow.push([i, j]);
          }
      }
  }

  const D = new Map();
  D.set('0,0', [0, 0, 0]);

  for (const [i, j] of fullWindow.map(([i, j]) => [i + 1, j + 1])) {
      const dt = dist(x[i-1], y[j-1]);
      if (isNaN(dt) || dt < 0) throw new Error(`Invalid distance at (i=${i-1}, j=${j-1}): ${dt}`);

      const options = [];
      
      // Check all three possible previous cells
      const prevCell1 = D.get(`${i-1},${j}`);
      const prevCell2 = D.get(`${i},${j-1}`);
      const prevCell3 = D.get(`${i-1},${j-1}`);
      
      if (prevCell1) options.push([prevCell1[0] + dt, i-1, j]);
      if (prevCell2) options.push([prevCell2[0] + dt, i, j-1]);
      if (prevCell3) options.push([prevCell3[0] + dt, i-1, j-1]);
      
      // If no valid previous cells, use infinity with default path
      if (options.length === 0) {
          if (i > 1 || j > 1) {
              console.warn(`No valid previous cells for (${i},${j}), using default path`);
          }
          options.push([i === 1 && j === 1 ? dt : Infinity, Math.max(0, i-1), Math.max(0, j-1)]);
      }
      
      D.set(`${i},${j}`, options.reduce((min, curr) => (curr[0] < min[0] ? curr : min)));
  }

  const path = [];
  let i = lenX;
  let j = lenY;
  
  // Reconstruct path
  const finalCell = D.get(`${i},${j}`);
  if (!finalCell) {
      console.error(`No final cell in D for (${i},${j})`);
      return [Infinity, []]; // Return empty path with Infinity distance
  }
  
  while (i > 0 || j > 0) {
      const current = D.get(`${i},${j}`);
      if (!current) {
          console.error(`No entry in D for (${i},${j})`);
          break; // Prevent infinite loop
      }
      path.push([i-1, j-1]);
      const [, nextI, nextJ] = current;
      i = nextI;
      j = nextJ;
  }
  
  path.reverse();
  const finalDistance = D.get(`${lenX},${lenY}`)?.[0] || Infinity;
  return [finalDistance, path];
}

function reduceByHalf(x) {
  const result = [];
  for (let i = 0; i < x.length - 1; i += 2) {
      if (Array.isArray(x[i])) {
          // Handle multi-dimensional data
          const nextIdx = Math.min(i+1, x.length-1);
          const avgPoint = x[i].map((val, idx) => {
              return Array.isArray(x[nextIdx]) ? (val + x[nextIdx][idx]) / 2 : val;
          });
          result.push(avgPoint);
      } else {
          // Handle scalar data
          const nextVal = (i+1 < x.length) ? x[i+1] : x[i];
          result.push((x[i] + nextVal) / 2);
      }
  }
  // If odd length, add the last element
  if (x.length % 2 !== 0) {
      result.push(x[x.length - 1]);
  }
  return result;
}

function expandWindow(path, lenX, lenY, radius) {
  const pathSet = new Set();
  
  // Add scaled coordinates to the set
  for (const [i, j] of path) {
      // Calculate scaling factors to map from reduced series to original series
      const scaleX = lenX / Math.max(1, path[path.length-1][0] + 1);
      const scaleY = lenY / Math.max(1, path[path.length-1][1] + 1);
      
      // Compute scaled coordinates in original space
      const scaledI = Math.min(Math.floor(i * scaleX), lenX - 1);
      const scaledJ = Math.min(Math.floor(j * scaleY), lenY - 1);
      
      // Add the point and its neighborhood to the window
      for (let a = -radius; a <= radius; a++) {
          for (let b = -radius; b <= radius; b++) {
              const newI = scaledI + a;
              const newJ = scaledJ + b;
              if (newI >= 0 && newJ >= 0 && newI < lenX && newJ < lenY) {
                  pathSet.add(`${newI},${newJ}`);
              }
          }
      }
  }

  // Convert set back to array of coordinate pairs
  const window = [];
  for (const coord of pathSet) {
      const [i, j] = coord.split(',').map(Number);
      window.push([i, j]);
  }
  
  // If window is empty, include some default points
  if (window.length === 0) {
      console.warn("Empty window after expansion, using default window");
      for (let i = 0; i < Math.min(radius * 2, lenX); i++) {
          for (let j = 0; j < Math.min(radius * 2, lenY); j++) {
              window.push([i, j]);
          }
      }
  }
  
  return window;
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
  return normalized;
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

 function calculateDtwScore(series1, series2) {
  try {
      const custom3dDistance = (a, b) => {
          const aArr = Array.isArray(a) ? a : [a];
          const bArr = Array.isArray(b) ? b : [b];
          return Math.sqrt(
              aArr.reduce((sum, val, i) => {
                  const diff = val - (bArr[i] || 0);
                  return sum + diff * diff;
              }, 0)
          );
      };

      console.log(`Series1 length: ${series1.length}, Series2 length: ${series2.length}`);
      const [dtwDistance, path] = fastdtw(series1, series2, 2, custom3dDistance);
      console.log('DTW Distance:', dtwDistance);
      return { dtwDistance, path };
  } catch (error) {
      console.error("Error calculating DTW score:", error);
      return null;
  }
}

 function detectFacing(landmarks, xThreshold = 0.5, yThreshold = 0.5, zThreshold = 0.5) {
  const keypoints = normalizeKeypoints(landmarks);
  if (!keypoints) {
      console.warn('No keypoints available for facing detection');
      return 'random';
  }

  const leftShoulder = keypoints[11];
  const rightShoulder = keypoints[12];
  const rightHip = keypoints[24];

  console.log('DetectFacing - Input landmarks sample:', landmarks.slice(0, 5));
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

//  yoga.js

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

  analyzeTransition(userKeypoints, currentSegmentIdx) {
      console.log('[TransitionAnalyzer] Analyzing transition for segment:', currentSegmentIdx);
      const userLeftWrist = userKeypoints[15];
      for (const path of this.transitionPaths) {
          if (currentSegmentIdx > path.startSegmentIdx && currentSegmentIdx < path.endSegmentIdx) {
              const distances = path.leftWristPath.map(p => Math.hypot(userLeftWrist[0] - p[0], userLeftWrist[1] - p[1]));
              const minDistance = Math.min(...distances);
              const withinPath = minDistance <= path.threshold;
              return withinPath;
          }
      }
      return false;
  }

  _toPixelCoords(point, width, height) {
      return [(point[0] + 1) * width / 2, (point[1] + 1) * height / 2];
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
  console.log('[TransitionAnalyzer] Integrating TransitionAnalyzer with Controller');
  const originalProcessExercise = controller.processExercise;
  controller.processExercise = function(currentTime) {
      const [phase, exerciseName, count, targetReps] = originalProcessExercise.call(this, currentTime);
      const currentSegment = this.segments[this.currentSegmentIdx];

      if (this.normalizedKeypoints) {
          const userLeftWrist = this.normalizedKeypoints[15];

          for (const path of transitionAnalyzer.transitionPaths) {
              if (this.currentSegmentIdx > path.startSegmentIdx && this.currentSegmentIdx <= path.endSegmentIdx) {
                  if (currentSegment.type !== 'starting' && currentSegment.type !== 'holding' && currentSegment.type !== 'ending') {
                      const withinPath = transitionAnalyzer.analyzeTransition(this.normalizedKeypoints, this.currentSegmentIdx);
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

// Controller code

 class Controller {
  constructor(exercisePlan) {
    console.log('[Controller] Constructing Controller with exercise plan:', exercisePlan);
    this.results = null;
    this.exercisePlan = exercisePlan;
    this.currentExerciseIdx = 0;
    this.exerciseNames = Object.keys(exercisePlan);
    this.currentExercise = this.exerciseNames[this.currentExerciseIdx];
    this.jsonData = exercisePlan[this.currentExercise].json_data; // Use json_data instead of json_path
    this.targetReps = exercisePlan[this.currentExercise].reps;
    this.yoga = new YogaDataExtractor(this.jsonData);
    this.segments = [];
    this.currentSegmentIdx = 0;
    this.phaseHandlers = {};
    this.count = 0;
    this.startTime = performance.now() / 1000;
    this.landmarks = null;
    this.normalizedKeypoints = null;
    this.transitionKeypoints = [];
    this.lastHoldingIdx = -1;
    this.transitionAnalyzer = new TransitionAnalyzer(this.jsonData, this.currentExercise);
    console.log('[Controller] Constructor completed');
  }
  getExcerciseName(){
    return this.currentExercise;
  }

  async initialize() {
    console.log('[Controller] Initializing YogaDataExtractor with JSON data');
    try {
      await this.yoga.ensureLoaded();
      console.log('[Controller] YogaDataExtractor JSON loaded successfully');
    } catch (error) {
      console.error('[Controller] Failed to load JSON:', error);
      throw error;
    }
    this.segments = this.yoga.segments();
    console.log('[Controller] Segments initialized:', this.segments.length);
    if (this.segments.length === 0) {
      console.error('[Controller] No segments available, exercise cannot start');
    }
    this.phaseHandlers = this._initializeHandlers();
    console.log('[Controller] Phase handlers initialized:', Object.keys(this.phaseHandlers));
    integrateWithController(this, this.transitionAnalyzer);
    console.log('[Controller] Transition analyzer integrated');
  }

  _initializeHandlers() {
    console.log('[Controller] Initializing phase handlers');
    const handlers = {};
    this.segments.forEach((segment, i) => {
      const phase = segment.phase;
      const phaseType = segment.type;
      const uniqueKey = `${phase}_${i}`;
      let startFacing = segment.facing;

      if (phaseType === 'starting' || phaseType === 'ending') {
        const idealKeypoints = this.yoga.getIdealKeypoints(segment.start, segment.end);
        const middleIdx = Math.floor(idealKeypoints.length / 2);
        const keypointsFrame = idealKeypoints[middleIdx] || [];
        console.log(`[Controller] Segment ${uniqueKey} - Raw ideal keypoints sample:`, keypointsFrame.slice(0, 5));
        if (keypointsFrame.length >= 33) {
          const normalizedIdealKeypoints = normalizeKeypoints(keypointsFrame);
          console.log(`[Controller] Segment ${uniqueKey} - Normalized ideal keypoints sample:`, normalizedIdealKeypoints?.slice(0, 5));
          if (normalizedIdealKeypoints) {
            const calculatedFacing = detectFacing(normalizedIdealKeypoints);
            console.log(`[Controller] Segment ${uniqueKey} - Calculated facing: ${calculatedFacing}, Precomputed facing: ${segment.facing}`);
            startFacing = calculatedFacing !== 'random' ? calculatedFacing : segment.facing;
          }
        } else {
          console.warn(`[Controller] Segment ${uniqueKey} - Insufficient keypoints for facing detection, using precomputed: ${startFacing}`);
        }
      }
      console.log(`[Controller] Handler for ${uniqueKey} - Start Facing: ${startFacing}`);

      if (phaseType === 'starting') handlers[uniqueKey] = new StartPhase(this, startFacing);
      else if (phaseType === 'transition') handlers[uniqueKey] = new TransitionPhase(this);
      else if (phaseType === 'holding') handlers[uniqueKey] = new HoldingPhase(this, segment.thresholds);
      else if (phaseType === 'ending') handlers[uniqueKey] = new EndingPhase(this, startFacing);
      segment.handlerKey = uniqueKey;
    });
    console.log('[Controller] Phase handlers created:', Object.keys(handlers));
    return handlers;
  }

  startExerciseSequence() {
    console.log(`[Controller] Starting exercise sequence for ${this.currentExercise}`);
  }

  updateFrame(results) {
    console.log('[Controller] Updating frame with results:', !!results.poseLandmarks);
    this.results = results;
    if (!results || !results.poseLandmarks) {
      console.warn('[Controller] No pose landmarks detected');
      this.landmarks = null;
      this.normalizedKeypoints = null;
      return;
    }
    this.landmarks = results.poseLandmarks;
    const [allVisible, missing] = checkKeypointVisibility(this.landmarks);
    if (allVisible) {
      this.normalizedKeypoints = normalizeKeypoints(this.landmarks);
      console.log('[Controller] Normalized keypoints:', this.normalizedKeypoints.slice(0, 5));
    } else {
      this.normalizedKeypoints = null;
      console.log(`[Controller] Missing keypoints: ${missing.join(', ')}`);
    }
  }

  processExercise(currentTime) {
    if (!this.results) {
      console.warn('[Controller] No pose results available');
      return ['waiting', this.currentExercise, this.count, this.targetReps];
    }
    if (!this.segments || this.segments.length === 0) {
      console.warn('[Controller] Segments are not initialized');
      return ['waiting', this.currentExercise, this.count, this.targetReps];
    }

    const currentSegment = this.segments[this.currentSegmentIdx];
    const handler = this.phaseHandlers[currentSegment.handlerKey];
    const [nextPhase, completed] = handler.process(currentTime);
    console.log(`[Controller] Processing segment: ${currentSegment.phase}, Completed: ${completed}`);

    if (currentSegment.type === 'transition' && this.normalizedKeypoints) {
      this.transitionKeypoints.push(this.normalizedKeypoints);
      console.log('[Controller] Added transition keypoints:', this.transitionKeypoints.length);
    }

    if (currentSegment.type === 'holding' && this.normalizedKeypoints) {
      const idealKeypoints = this.getIdealKeypoints(currentSegment.phase);
      if (idealKeypoints.length) {
        const dtwResult = calculateDtwScore(idealKeypoints, this.normalizedKeypoints);
        console.log('[Controller] DTW result for holding phase:', dtwResult);
      } else {
        console.warn('[Controller] No ideal keypoints available for holding phase');
      }
    }

    if (completed) {
      if (currentSegment.type === 'holding') {
        this.lastHoldingIdx = this.currentSegmentIdx;
        console.log('[Controller] Holding phase completed, reset transition keypoints');
      }
      if (currentSegment.type === 'ending') {
        this.count++;
        console.log(`[Controller] Repetition ${this.count} completed for ${this.currentExercise}`);
        if (this.count >= this.targetReps && this.currentExerciseIdx < this.exerciseNames.length - 1) {
          this.currentExerciseIdx++;
          this.currentExercise = this.exerciseNames[this.currentExerciseIdx];
          this.jsonData = this.exercisePlan[this.currentExercise].json_data;
          this.targetReps = this.exercisePlan[this.currentExercise].reps;
          this.yoga = new YogaDataExtractor(this.jsonData);
          this.segments = this.yoga.segments();
          this.phaseHandlers = this._initializeHandlers();
          this.transitionAnalyzer = new TransitionAnalyzer(this.jsonData, this.currentExercise);
          integrateWithController(this, this.transitionAnalyzer);
          this.count = 0;
          console.log(`[Controller] Switched to next exercise: ${this.currentExercise}`);
        }
        this.currentSegmentIdx = 0;
        this.lastHoldingIdx = -1;
        this.startTime = currentTime;
      } else if (this.currentSegmentIdx < this.segments.length - 1) {
        this.currentSegmentIdx++;
        this.startTime = currentTime;
        console.log(`[Controller] Moved to next segment: ${this.currentSegmentIdx}`);
      }
    }

    let feedback = '';
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

    return [currentSegment.phase, this.currentExercise, this.count, this.targetReps, feedback];
  }

  getIdealKeypoints(phase) {
    const segment = this.segments[this.currentSegmentIdx];
    if (segment.phase === phase) {
      const middle = Math.floor((segment.start + segment.end) / 2);
      return this.yoga.getIdealKeypoints(middle, middle + 1)[0] || [];
    }
    return [];
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


// Worker Code ->

const workerId = Math.random().toString(36).slice(2, 8);
console.log(`[Worker ${workerId}] Initializing`);

// Worker state
let controller = null;
let operationId = 0;
let currentTime = 0;

self.onmessage = async function (e) {
  const receiveTime = performance.now();
  console.log(`[Worker ${workerId}] Received message:`, e.data);
  console.log(`[Debug] Message receive latency: ${receiveTime - e.data.sendTime}ms`);
  const { type, op, data, sendTime } = e.data;

  if (type === 'init') {
    operationId = op || operationId + 1;
    const initStart = performance.now();
    console.log(`[Worker ${workerId}] Processing init, operation: ${operationId}`);
    try {
      const exercisePlan = {
        "Anuvittasana": {
          "json_data": data.jsonData,
          "reps": 3
        }
      };
      console.log(`[Worker ${workerId}] Exercise plan created:`, exercisePlan);
      controller = new Controller(exercisePlan);
      console.log(`[Worker ${workerId}] Controller instantiated:`, controller.currentExercise);
      await controller.initialize();
      console.log(`[Worker ${workerId}] Controller initialized successfully`);
      controller.startExerciseSequence();
      console.log(`[Worker ${workerId}] Exercise sequence started`);
      const exerciseName = controller.getExcerciseName();
      self.postMessage({
        type: 'init_done',
        value: { exercise: controller.currentExercise, reps: controller.targetReps, exerciseName },
        operation: operationId,
        sendTime,
        processingTime: performance.now() - initStart
      });
      console.log(`[Worker ${workerId}] Sent init_done message with exerciseName: ${exerciseName}`);
    } catch (error) {
      console.error(`[Worker ${workerId}] Init failed:`, error);
      self.postMessage({ type: 'error', error: error.message, operation: operationId, sendTime, processingTime: performance.now() - initStart });
    }
  } else if (type === 'process_frame') {
    operationId = op || operationId + 1;
    const frameStart = performance.now();
    console.log(`[Worker ${workerId}] Processing frame, operation: ${operationId}`);
    try {
      if (!controller) throw new Error('Controller not initialized');
      const transformedResults = {
        poseLandmarks: data.results.landmarks?.[0] || []
      };
      console.log(`[Worker ${workerId}] Transformed pose results:`, {
        landmarkCount: transformedResults.poseLandmarks.length
      });
      controller.updateFrame(transformedResults);
      currentTime += 1 / 60;
      const processStart = performance.now();
      const [currentPhase, exerciseName, repCount, totalReps, feedback] = controller.processExercise(currentTime);
      console.log(`[Debug] Controller.processExercise time: ${performance.now() - processStart}ms`);
      const score = Math.round(repCount / totalReps * 100);
      const currentExerciseName = controller.getExcerciseName();
      console.log(`[Debug] Exercise state: reps=${repCount}, score=${score}, phase=${currentPhase}`);
      self.postMessage({
        type: 'frame_result',
        value: {
          exerciseName,
          repCount,
          totalReps,
          score,
          currentPhase,
          feedback,
          currentExerciseName
        },
        operation: operationId,
        sendTime,
        processingTime: performance.now() - frameStart
      });
      console.log(`[Worker ${workerId}] Sent frame_result message`);
    } catch (error) {
      console.error(`[Worker ${workerId}] Frame processing failed:`, error);
      self.postMessage({ type: 'error', error: error.message, operation: operationId, sendTime, processingTime: performance.now() - frameStart });
    }
  } else if (type === 'get_exercise_name') {
    operationId = op || operationId + 1;
    const nameStart = performance.now();
    console.log(`[Worker ${workerId}] Processing get_exercise_name, operation: ${operationId}`);
    try {
      if (!controller) throw new Error('Controller not initialized');
      const exerciseName = controller.getExcerciseName();
      self.postMessage({
        type: 'exercise_name_result',
        value: { exerciseName },
        operation: operationId,
        sendTime,
        processingTime: performance.now() - nameStart
      });
      console.log(`[Worker ${workerId}] Sent exercise_name_result: ${exerciseName}`);
    } catch (error) {
      console.error(`[Worker ${workerId}] Get exercise name failed:`, error);
      self.postMessage({ type: 'error', error: error.message, operation: operationId, sendTime, processingTime: performance.now() - nameStart });
    }
  } else if (type == 'transitioning_excercise') {
    const nextAssan = "Hallassan";
    self.postMessage({
      type: 'next_excercise_name',
      value: { nextAssan },
      operationId: operationId,
      sendTime,
      processingTime: performance.now() - receiveTime
    });
  } else {
    console.warn(`[Worker ${workerId}] Unknown message type:`, type);
  }
};

self.onerror = function (error) {
  console.error(`[Worker ${workerId}] Unhandled error:`, error);
};