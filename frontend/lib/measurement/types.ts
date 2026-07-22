export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface MeasurementResult {
  chestInches: number;
  bustInches: number;
  underbustInches: number;
  shoulderWidthInches: number;
  neckInches: number;
  waistInches: number;
  hipsInches: number;
  thighInches: number;
  kneeInches: number;
  calfInches: number;
  inseamInches: number;
  outseamInches: number;
  sleeveLengthInches: number;
  bicepInches: number;
  wristInches: number;
  backLengthInches: number;
  heightInches: number;
  recommendedSize: string;
  fitNote: string;
  confidencePercent: number;
  accuracyNote: string;
  timestamp: string;
  rawLandmarksCount: number;
}

export interface MeasurementData {
  measurements: MeasurementResult;
  rawLandmarks: Landmark[];
}

export type FacingMode = 'user' | 'environment';

export interface CameraConfig {
  width: number;
  height: number;
  facingMode: FacingMode;
}
