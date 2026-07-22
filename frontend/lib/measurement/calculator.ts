import type { Landmark, MeasurementResult } from './types';

/**
 * Calculate Euclidean distance between two landmarks
 */
function calculateDistance(point1: Landmark, point2: Landmark): number {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  const dz = point1.z - point2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate body measurements from MediaPipe pose landmarks
 * @param landmarks Array of 33 pose landmarks from MediaPipe
 * @returns Measurement results in inches
 */
export function calculateMeasurements(landmarks: Landmark[]): MeasurementResult {
  // MediaPipe Pose landmark indices
  const NOSE = 0;
  const LEFT_SHOULDER = 11;
  const RIGHT_SHOULDER = 12;
  const LEFT_HIP = 23;
  const RIGHT_HIP = 24;
  const LEFT_KNEE = 25;
  const RIGHT_KNEE = 26;
  const LEFT_ANKLE = 27;
  const RIGHT_ANKLE = 28;
  const LEFT_ELBOW = 13;
  const RIGHT_ELBOW = 14;
  const LEFT_WRIST = 15;
  const RIGHT_WRIST = 16;

  // Calculate pixel distances
  const shoulderWidth = calculateDistance(landmarks[LEFT_SHOULDER], landmarks[RIGHT_SHOULDER]);
  const hipWidth = calculateDistance(landmarks[LEFT_HIP], landmarks[RIGHT_HIP]);
  
  // Height estimation (nose to average of ankles)
  const leftAnkleToNose = calculateDistance(landmarks[NOSE], landmarks[LEFT_ANKLE]);
  const rightAnkleToNose = calculateDistance(landmarks[NOSE], landmarks[RIGHT_ANKLE]);
  const heightPixels = (leftAnkleToNose + rightAnkleToNose) / 2;
  
  // Assume average height of 170cm (5'7") for calibration
  const assumedHeightCm = 170;
  const pixelsPerCm = heightPixels / assumedHeightCm;
  
  // Convert pixel measurements to centimeters
  const shoulderWidthCm = shoulderWidth / pixelsPerCm;
  const hipWidthCm = hipWidth / pixelsPerCm;
  
  // Calculate body measurements with empirical multipliers
  const chestCm = shoulderWidthCm * 2.2; // Chest circumference
  const waistCm = hipWidthCm * 1.8; // Waist circumference
  const hipsCm = hipWidthCm * 2.4; // Hip circumference
  
  // Inseam (hip to ankle)
  const leftInseam = calculateDistance(landmarks[LEFT_HIP], landmarks[LEFT_ANKLE]);
  const rightInseam = calculateDistance(landmarks[RIGHT_HIP], landmarks[RIGHT_ANKLE]);
  const inseamPixels = (leftInseam + rightInseam) / 2;
  const inseamCm = inseamPixels / pixelsPerCm;
  
  // Sleeve length (shoulder to wrist)
  const leftSleeve = 
    calculateDistance(landmarks[LEFT_SHOULDER], landmarks[LEFT_ELBOW]) +
    calculateDistance(landmarks[LEFT_ELBOW], landmarks[LEFT_WRIST]);
  const rightSleeve = 
    calculateDistance(landmarks[RIGHT_SHOULDER], landmarks[RIGHT_ELBOW]) +
    calculateDistance(landmarks[RIGHT_ELBOW], landmarks[RIGHT_WRIST]);
  const sleevePixels = (leftSleeve + rightSleeve) / 2;
  const sleeveCm = sleevePixels / pixelsPerCm;
  
  // Convert to inches (1 inch = 2.54 cm)
  const chestInches = chestCm / 2.54;
  const waistInches = waistCm / 2.54;
  const hipsInches = hipsCm / 2.54;
  const inseamInches = inseamCm / 2.54;
  const sleeveLengthInches = sleeveCm / 2.54;
  const heightInches = assumedHeightCm / 2.54;
  
  // Calculate confidence based on landmark visibility
  const avgVisibility = landmarks.reduce((sum, lm) => sum + lm.visibility, 0) / landmarks.length;
  const confidencePercent = Math.round(avgVisibility * 100);
  
  // Determine size recommendation based on chest measurement
  let recommendedSize: string;
  let fitNote: string;
  
  if (chestInches < 34) {
    recommendedSize = 'XS';
    fitNote = 'Extra Small - Slim fit';
  } else if (chestInches < 37) {
    recommendedSize = 'S';
    fitNote = 'Small - Slim fit';
  } else if (chestInches < 40) {
    recommendedSize = 'M';
    fitNote = 'Medium - Standard fit';
  } else if (chestInches < 43) {
    recommendedSize = 'L';
    fitNote = 'Large - Standard fit';
  } else if (chestInches < 46) {
    recommendedSize = 'XL';
    fitNote = 'Extra Large - Relaxed fit';
  } else {
    recommendedSize = 'XXL';
    fitNote = 'Double Extra Large - Relaxed fit';
  }
  
  // Accuracy assessment
  let accuracyNote: string;
  if (confidencePercent >= 85) {
    accuracyNote = 'Excellent accuracy';
  } else if (confidencePercent >= 70) {
    accuracyNote = 'Good accuracy';
  } else if (confidencePercent >= 50) {
    accuracyNote = 'Fair accuracy - consider retaking';
  } else {
    accuracyNote = 'Low accuracy - please retake measurement';
  }
  
  return {
    chestInches: Math.round(chestInches * 10) / 10,
    waistInches: Math.round(waistInches * 10) / 10,
    hipsInches: Math.round(hipsInches * 10) / 10,
    inseamInches: Math.round(inseamInches * 10) / 10,
    sleeveLengthInches: Math.round(sleeveLengthInches * 10) / 10,
    heightInches: Math.round(heightInches * 10) / 10,
    recommendedSize,
    fitNote,
    confidencePercent,
    accuracyNote,
    timestamp: new Date().toISOString(),
    rawLandmarksCount: landmarks.length,
  };
}
