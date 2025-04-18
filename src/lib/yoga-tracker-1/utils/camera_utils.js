// utils/camera_utils.js
console.log('Loading camera_utils.js');

/**
 * Prints text on the canvas at a specified position.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {string} text - The text to display.
 * @param {Object} position - The {x, y} coordinates.
 * @param {string} color - The color in CSS format (e.g., 'green').
 */
// export function printTextOnFrame(ctx, text, position = { x: 10, y: 50 }, color = 'red') {
//     ctx.font = '20px Helvetica';
//     ctx.fillStyle = color;
//     ctx.fillText(text, position.x, position.y);
//     console.log(`Text drawn: "${text}" at (${position.x}, ${position.y}) in ${color}`);
// }

/**
 * Draws the pose skeleton on the canvas using MediaPipe landmarks.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {Array} landmarks - Array of MediaPipe Pose landmarks.
 */
// export function drawPoseSkeleton(ctx, landmarks) {
//     const width = ctx.canvas.width;
//     const height = ctx.canvas.height;

//     const POSE_CONNECTIONS = [
//         [11, 12], [11, 23], [12, 24], [23, 24], [11, 13], [12, 14], [13, 15], 
//         [14, 16], [23, 25], [24, 26], [25, 27], [26, 28]
//     ];

//     ctx.strokeStyle = 'green';
//     ctx.lineWidth = 2;

//     for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
//         const start = landmarks[startIdx];
//         const end = landmarks[endIdx];
//         if (start.visibility > 0.5 && end.visibility > 0.5) {
//             ctx.beginPath();
//             ctx.moveTo(start.x * width, start.y * height);
//             ctx.lineTo(end.x * width, end.y * height);
//             ctx.stroke();
//         }
//     }

//     ctx.fillStyle = 'blue';
//     landmarks.forEach((landmark) => {
//         if (landmark.visibility > 0.5) {
//             ctx.beginPath();
//             ctx.arc(landmark.x * width, landmark.y * height, 5, 0, 2 * Math.PI);
//             ctx.fill();
//         }
//     });

//     console.log('Pose skeleton drawn with', landmarks.length, 'landmarks');
// }

/**
 * Draws DTW scores on the canvas in a boxed area.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {Object} scores - Object with phase names as keys and {value, threshold} as values.
 */
// export function drawDtwScores(ctx, scores) {
//     const height = ctx.canvas.height;
//     const yPosStart = height - 150;

//     ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
//     ctx.fillRect(10, yPosStart - 30, 400, 120);

//     ctx.font = '18px Helvetica';
//     ctx.fillStyle = 'white';
//     ctx.fillText('DTW Scores:', 20, yPosStart);

//     let yPos = yPosStart + 30;
//     for (const [phase, data] of Object.entries(scores)) {
//         const score = data.value;
//         const threshold = data.threshold;
//         const color = score < threshold ? 'green' : 'red';
//         ctx.fillStyle = color;
//         ctx.fillText(`${phase}: ${score.toFixed(2)} (th: ${threshold})`, 20, yPos);
//         yPos += 30;
//     }

//     console.log('DTW scores drawn:', scores);
// }

/**
 * Draws the ideal transition path and a target circle for the user's wrist.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {Array} idealWristPath - Array of [x, y, z] coordinates or a single [x, y, z] point for the ideal wrist path.
 * @param {Array} userKeypoints - Array of normalized keypoints for the user.
 * @param {number} threshold - Threshold distance for the target circle.
 */
// export function drawTransitionPath(ctx, idealWristPath, userKeypoints, threshold) {
//     const width = ctx.canvas.width;
//     const height = ctx.canvas.height;

//     if (!userKeypoints || userKeypoints.length < 16) {
//         console.warn('User keypoints not available or insufficient');
//         return;
//     }

//     const userWrist = userKeypoints[15]; // LEFT_WRIST
//     const userWristPixel = [(userWrist[0] + 1) * width / 2, (userWrist[1] + 1) * height / 2];

//     if (!idealWristPath) {
//         console.warn('Ideal wrist path is empty or undefined');
//         return;
//     }

//     const targetPoint = Array.isArray(idealWristPath[0]) ? idealWristPath[idealWristPath.length - 1] : idealWristPath;
//     const targetPixel = [(targetPoint[0] + 1) * width / 2, (targetPoint[1] + 1) * height / 2];

//     let radius = threshold * width / 120;
//     if (radius < 5) radius = 5;

//     const distance = Math.hypot(userWristPixel[0] - targetPixel[0], userWristPixel[1] - targetPixel[1]);
//     const circleColor = distance <= radius ? 'green' : 'red';

//     ctx.beginPath();
//     ctx.arc(targetPixel[0], targetPixel[1], radius, 0, 2 * Math.PI);
//     ctx.strokeStyle = circleColor;
//     ctx.lineWidth = 2;
//     ctx.stroke();

//     ctx.beginPath();
//     ctx.arc(userWristPixel[0], userWristPixel[1], 5, 0, 2 * Math.PI);
//     ctx.fillStyle = 'red';
//     ctx.fill();

//     console.log('Transition path drawn - Target:', targetPixel, 'User wrist:', userWristPixel);
// }

/**
 * Draws a guidance arrow from the user's wrist to the ideal wrist position.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {Array} userWrist - Normalized [x, y, z] coordinates of the user's wrist.
 * @param {Array} idealWrist - Normalized [x, y, z] coordinates of the ideal wrist.
 * @param {number} width - Canvas width.
 * @param {number} height - Canvas height.
 * @param {boolean} isSuccess - Whether the pose is correct (determines arrow color).
 */
// export function drawGuidanceArrow(ctx, userWrist, idealWrist, width, height, isSuccess) {
//     if (!userWrist || !idealWrist || userWrist.length < 2 || idealWrist.length < 2) {
//         console.warn('Invalid wrist coordinates for arrow:', { userWrist, idealWrist });
//         return;
//     }

//     const userWristPixel = [(userWrist[0] + 1) * width / 2, (userWrist[1] + 1) * height / 2];
//     const idealWristPixel = [(idealWrist[0] + 1) * width / 2, (idealWrist[1] + 1) * height / 2];

//     // Validate coordinates are within canvas bounds
//     if (userWristPixel[0] < 0 || userWristPixel[0] > width || userWristPixel[1] < 0 || userWristPixel[1] > height ||
//         idealWristPixel[0] < 0 || idealWristPixel[0] > width || idealWristPixel[1] < 0 || idealWristPixel[1] > height) {
//         console.warn('Arrow coordinates out of bounds:', { userWristPixel, idealWristPixel, width, height });
//         return;
//     }

//     ctx.beginPath();
//     ctx.moveTo(userWristPixel[0], userWristPixel[1]);
//     ctx.lineTo(idealWristPixel[0], idealWristPixel[1]);
//     ctx.strokeStyle = isSuccess ? 'green' : 'red';
//     ctx.lineWidth = 3;
//     ctx.stroke();

//     const angle = Math.atan2(idealWristPixel[1] - userWristPixel[1], idealWristPixel[0] - userWristPixel[0]);
//     const arrowSize = 10;
//     ctx.beginPath();
//     ctx.moveTo(idealWristPixel[0], idealWristPixel[1]);
//     ctx.lineTo(
//         idealWristPixel[0] - arrowSize * Math.cos(angle + Math.PI / 6),
//         idealWristPixel[1] - arrowSize * Math.sin(angle + Math.PI / 6)
//     );
//     ctx.moveTo(idealWristPixel[0], idealWristPixel[1]);
//     ctx.lineTo(
//         idealWristPixel[0] - arrowSize * Math.cos(angle - Math.PI / 6),
//         idealWristPixel[1] - arrowSize * Math.sin(angle - Math.PI / 6)
//     );
//     ctx.stroke();

//     console.log(`Arrow drawn from (${userWristPixel[0]}, ${userWristPixel[1]}) to (${idealWristPixel[0]}, ${idealWristPixel[1]})`);
// }