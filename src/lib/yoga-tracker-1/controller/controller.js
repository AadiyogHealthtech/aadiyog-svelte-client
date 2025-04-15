// src/lib/yoga-tracker/controller/controller.js
console.log('Loading controller.js');

import { normalizeKeypoints, detectFacing, checkKeypointVisibility, calculateDtwScore } from '../utils/utils.js';
import { YogaDataExtractor } from './yoga.js';
import { StartPhase, TransitionPhase, HoldingPhase, EndingPhase } from './phase_handlers.js';
import { TransitionAnalyzer, integrateWithController } from './transition_analysis.js';

console.log('All controller dependencies imported');

export class Controller {
    constructor(exercisePlan) {
        console.log('Constructing Controller with exercise plan:', exercisePlan);
        this.frame = null; // Kept for compatibility, but unused
        this.results = null;
        this.exercisePlan = exercisePlan;
        this.currentExerciseIdx = 0;
        this.exerciseNames = Object.keys(exercisePlan);
        this.currentExercise = this.exerciseNames[this.currentExerciseIdx];
        this.jsonPath = exercisePlan[this.currentExercise].json_path;
        this.targetReps = exercisePlan[this.currentExercise].reps;
        this.yoga = new YogaDataExtractor(this.jsonPath);
        this.segments = [];
        this.currentSegmentIdx = 0;
        this.phaseHandlers = {};
        this.count = 0;
        this.startTime = performance.now() / 1000;
        this.landmarks = null;
        this.normalizedKeypoints = null;
        this.transitionKeypoints = [];
        this.lastHoldingIdx = -1;
        this.transitionAnalyzer = new TransitionAnalyzer(this.jsonPath, this.currentExercise);
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
        console.log('Initializing phase handlers');
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
                console.log(`Segment ${uniqueKey} - Raw ideal keypoints sample:`, keypointsFrame.slice(0, 5));
                if (keypointsFrame.length >= 33) {
                    const normalizedIdealKeypoints = normalizeKeypoints(keypointsFrame);
                    console.log(`Segment ${uniqueKey} - Normalized ideal keypoints sample:`, normalizedIdealKeypoints?.slice(0, 5));
                    if (normalizedIdealKeypoints) {
                        const calculatedFacing = detectFacing(normalizedIdealKeypoints);
                        console.log(`Segment ${uniqueKey} - Calculated facing: ${calculatedFacing}, Precomputed facing: ${segment.facing}`);
                        startFacing = calculatedFacing !== 'random' ? calculatedFacing : segment.facing;
                    }
                } else {
                    console.warn(`Segment ${uniqueKey} - Insufficient keypoints for facing detection, using precomputed: ${startFacing}`);
                }
            }
            console.log(`Handler for ${uniqueKey} - Start Facing: ${startFacing}`);

            if (phaseType === 'starting') handlers[uniqueKey] = new StartPhase(this, startFacing);
            else if (phaseType === 'transition') handlers[uniqueKey] = new TransitionPhase(this);
            else if (phaseType === 'holding') handlers[uniqueKey] = new HoldingPhase(this, segment.thresholds);
            else if (phaseType === 'ending') handlers[uniqueKey] = new EndingPhase(this, startFacing);
            segment.handlerKey = uniqueKey;
        });
        return handlers;
    }

    startExerciseSequence() {
        console.log(`Starting exercise sequence for ${this.currentExercise}`);
    }

    updateFrame(results) {
        console.log('Updating frame with results:', results);
        this.results = results;
        if (!results || !results.poseLandmarks) {
            console.warn('No pose landmarks detected');
            this.landmarks = null;
            this.normalizedKeypoints = null;
            return;
        }
        this.landmarks = results.poseLandmarks;
        const [allVisible, missing] = checkKeypointVisibility(this.landmarks);
        if (allVisible) {
            this.normalizedKeypoints = normalizeKeypoints(this.landmarks);
            console.log('Normalized keypoints:', this.normalizedKeypoints);
        } else {
            this.normalizedKeypoints = null;
            console.warn(`Missing keypoints: ${missing.join(', ')}`);
        }
    }

    processExercise(currentTime) {
        console.log('Processing exercise:', {
            exercise: this.currentExercise,
            segmentIdx: this.currentSegmentIdx,
            hasLandmarks: !!this.landmarks,
            hasNormalizedKeypoints: !!this.normalizedKeypoints
        });

        if (!this.results || !this.normalizedKeypoints) {
            console.warn('No valid pose data available');
            return ['waiting', this.currentExercise, this.count, this.targetReps, { message: 'No pose detected', color: 'red' }];
        }
        if (!this.segments || this.segments.length === 0) {
            console.warn('Segments are not initialized');
            return ['waiting', this.currentExercise, this.count, this.targetReps, { message: 'Exercise not initialized', color: 'red' }];
        }

        const currentSegment = this.segments[this.currentSegmentIdx];
        const handler = this.phaseHandlers[currentSegment.handlerKey];
        console.log(`Processing segment: ${currentSegment.phase}, Type: ${currentSegment.type}`);

        const [nextPhase, completed, feedback] = handler.process(currentTime);
        console.log(`Handler result: Phase: ${nextPhase}, Completed: ${completed}, Feedback:`, feedback);

        // Collect transition keypoints
        if (currentSegment.type === 'transition' && this.normalizedKeypoints) {
            this.transitionKeypoints.push(this.normalizedKeypoints);
            console.log('Added transition keypoints:', this.transitionKeypoints.length);
        }

        // Log holding phase DTW
        if (currentSegment.type === 'holding' && this.normalizedKeypoints) {
            const idealKeypoints = this.getIdealKeypoints(currentSegment.phase);
            if (idealKeypoints.length) {
                const dtwResult = calculateDtwScore(idealKeypoints, this.normalizedKeypoints);
                console.log('Holding DTW result:', dtwResult);
            } else {
                console.warn('No ideal keypoints for holding phase');
            }
        }

        if (completed) {
            console.log(`Segment ${currentSegment.phase} completed`);
            if (currentSegment.type === 'holding') {
                this.lastHoldingIdx = this.currentSegmentIdx;
                this.transitionKeypoints = [];
                console.log('Holding phase completed, reset transition keypoints');
            }
            if (currentSegment.type === 'ending') {
                this.count++;
                console.log(`Repetition ${this.count} completed for ${this.currentExercise}`);
                if (this.count >= this.targetReps && this.currentExerciseIdx < this.exerciseNames.length - 1) {
                    this.currentExerciseIdx++;
                    this.currentExercise = this.exerciseNames[this.currentExerciseIdx];
                    this.jsonPath = this.exercisePlan[this.currentExercise].json_path;
                    this.targetReps = this.exercisePlan[this.currentExercise].reps;
                    this.yoga = new YogaDataExtractor(this.jsonPath);
                    this.segments = [];
                    this.currentSegmentIdx = 0;
                    this.phaseHandlers = {};
                    this.count = 0;
                    this.lastHoldingIdx = -1;
                    this.transitionKeypoints = [];
                    this.startTime = currentTime;
                    console.log(`Switching to exercise: ${this.currentExercise}`);
                    this.initialize();
                } else {
                    this.currentSegmentIdx = 0;
                    this.lastHoldingIdx = -1;
                    this.transitionKeypoints = [];
                    this.startTime = currentTime;
                    console.log('Reset to first segment');
                }
            } else if (this.currentSegmentIdx < this.segments.length - 1) {
                this.currentSegmentIdx++;
                this.startTime = currentTime;
                console.log(`Moved to next segment: ${this.currentSegmentIdx}`);
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