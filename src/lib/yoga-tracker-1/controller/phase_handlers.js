// src/lib/yoga-tracker/controller/phase_handlers.js
console.log('Loading phase_handlers.js');

import { detectFacing, calculateDtwScore } from '../utils/utils.js';
import { checkBendback } from './holding.js';

export class BasePhase {
    constructor(controller) {
        this.controller = controller;
        this.holdDuration = 3;
    }

    process(currentTime) {
        throw new Error('Not implemented');
    }
}

export class StartPhase extends BasePhase {
    constructor(controller, targetFacing) {
        super(controller);
        console.log(`StartPhase initialized with target facing: ${targetFacing}`);
        this.targetFacing = targetFacing;
    }

    process(currentTime) {
        console.log('Processing StartPhase');
        const phase = this.controller.segments[this.controller.currentSegmentIdx].phase;

        if (!this.controller.landmarks || !this.controller.normalizedKeypoints) {
            console.log('StartPhase: No landmarks or keypoints');
            return [phase, false, { message: 'No pose detected', color: 'red' }];
        }

        const detectedFacing = detectFacing(this.controller.normalizedKeypoints);
        console.log(`StartPhase - Detected Facing: ${detectedFacing}, Target Facing: ${this.targetFacing}`);

        if (detectedFacing === this.targetFacing) {
            console.log('StartPhase: Starting pose detected');
            if (currentTime - this.controller.startTime >= this.holdDuration) {
                console.log('Start phase completed');
                return [phase, true, { message: `Starting pose (${this.targetFacing}) detected`, color: 'green' }];
            }
            return [phase, false, { message: `Hold starting pose (${this.targetFacing})`, color: 'green' }];
        }

        console.log('StartPhase: Facing mismatch');
        return [phase, false, { message: `Face ${this.targetFacing} to start`, color: 'red' }];
    }
}

export class TransitionPhase extends BasePhase {
    process(currentTime) {
        console.log('Processing TransitionPhase');
        const phase = this.controller.segments[this.controller.currentSegmentIdx].phase;

        if (!this.controller.normalizedKeypoints) {
            console.log('TransitionPhase: No keypoints');
            return [phase, false, { message: 'No pose detected', color: 'red' }];
        }

        console.log('TransitionPhase: Transitioning');
        if (currentTime - this.controller.startTime >= this.holdDuration) {
            console.log('Transition phase completed');
            return [phase, true, { message: 'Transition completed', color: 'green' }];
        }

        return [phase, false, { message: 'Transitioning...', color: 'yellow' }];
    }
}

export class HoldingPhase extends BasePhase {
    constructor(controller, thresholds) {
        super(controller);
        console.log('HoldingPhase initialized with thresholds:', thresholds);
        this.thresholds = thresholds || [0.5];
        this.holdStartTime = null;
        this.successDuration = 0;
        this.minHoldDuration = 2;
        this.completedHold = false;
        this.exitThresholdMultiplier = 1.1;
    }

    process(currentTime) {
        console.log('Processing HoldingPhase');
        const phase = this.controller.segments[this.controller.currentSegmentIdx].phase;
        const idealKeypoints = this.controller.getIdealKeypoints(phase);

        if (!this.controller.normalizedKeypoints) {
            console.log('HoldingPhase: No keypoints');
            return [phase, false, { message: 'Adjust pose', color: 'red' }];
        }

        // Evaluate transition keypoints
        let transitionFeedback = '';
        if (
            this.controller.lastHoldingIdx !== -1 &&
            this.controller.currentSegmentIdx > this.controller.lastHoldingIdx &&
            this.controller.transitionKeypoints.length
        ) {
            const idealTransKeypoints = this.controller.getTransitionKeypoints(
                this.controller.lastHoldingIdx,
                this.controller.currentSegmentIdx
            );
            if (idealTransKeypoints.length && this.controller.transitionKeypoints.length) {
                const minLen = Math.min(this.controller.transitionKeypoints.length, idealTransKeypoints.length);
                const userTrans = this.controller.transitionKeypoints.slice(0, minLen).flat();
                const idealTrans = idealTransKeypoints.slice(0, minLen).flat();
                const { dtwDistance } = calculateDtwScore(userTrans, idealTrans);
                transitionFeedback = `Transition DTW: ${dtwDistance.toFixed(2)}`;
                console.log(`HoldingPhase: ${transitionFeedback}, Score: ${dtwDistance < 50 ? 'Good' : 'Needs adjustment'}`);
            }
        }

        // Evaluate holding pose
        const dtwResult = calculateDtwScore(idealKeypoints, this.controller.normalizedKeypoints);
        console.log('HoldingPhase: DTW result:', dtwResult + 'threshold' + this.thresholds);

        const [, success] = checkBendback(null, idealKeypoints, this.controller.normalizedKeypoints, currentTime, this.thresholds);
        const dtwWhole = dtwResult?.dtwDistance ?? Infinity;
        const exitThreshold = this.thresholds[0] * this.exitThresholdMultiplier;
        console.log('dtwWhole : '+ dtwWhole+ 'threshold : '+ this.thresholds[0])

        
        if (success && dtwWhole < this.thresholds[0]) {
            if (!this.holdStartTime) this.holdStartTime = currentTime;
            this.successDuration = currentTime - this.holdStartTime;
            console.log(`HoldingPhase: Holding for ${this.successDuration.toFixed(1)}s`);

            if (this.successDuration >= this.minHoldDuration && !this.completedHold) {
                this.completedHold = true;
                console.log('HoldingPhase: Hold completed');
                return [
                    phase,
                    false,
                    { message: `Hold completed, stay or adjust to exit (DTW: ${dtwWhole.toFixed(2)})`, color: 'green' }
                ];
            }
            return [
                phase,
                false,
                { message: `Holding ${phase} (${this.successDuration.toFixed(1)}s)`, color: 'green' }
            ];
        } else {
            if (this.completedHold && dtwWhole > exitThreshold) {
                console.log('HoldingPhase: Exiting hold');
                return [
                    phase,
                    true,
                    { message: `${phase} completed, exiting hold (DTW: ${dtwWhole.toFixed(2)})`, color: 'green' }
                ];
            }
            if (!this.completedHold) {
                this.holdStartTime = null;
                this.successDuration = 0;
                console.log('HoldingPhase: Pose needs adjustment');
                return [phase, false, { message: 'Adjust pose to hold', color: 'red' }];
            }
            return [
                phase,
                false,
                { message: `Hold completed, stay or adjust to exit (DTW: ${dtwWhole.toFixed(2)})`, color: 'green' }
            ];
        }
    }
}

export class EndingPhase extends BasePhase {
    constructor(controller, targetFacing) {
        super(controller);
        console.log(`EndingPhase initialized with target facing: ${targetFacing}`);
        this.targetFacing = targetFacing;
    }

    process(currentTime) {
        console.log('Processing EndingPhase');
        const phase = this.controller.segments[this.controller.currentSegmentIdx].phase;

        if (!this.controller.normalizedKeypoints) {
            console.log('EndingPhase: No keypoints');
            return [phase, false, { message: 'No pose detected', color: 'red' }];
        }

        const detectedFacing = detectFacing(this.controller.normalizedKeypoints);
        console.log(`EndingPhase - Detected Facing: ${detectedFacing}, Target Facing: ${this.targetFacing}`);

        if (detectedFacing === this.targetFacing) {
            console.log('EndingPhase: Ending pose detected');
            if (currentTime - this.controller.startTime >= this.holdDuration) {
                console.log('Ending phase completed');
                return [phase, true, { message: 'Repetition completed', color: 'green' }];
            }
            return [phase, false, { message: 'Hold ending pose', color: 'green' }];
        }

        console.log('EndingPhase: Facing mismatch');
        return [phase, false, { message: `Face ${this.targetFacing} to end`, color: 'red' }];
    }
}