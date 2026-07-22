import { describe, expect, it } from "vitest";
import { calculateMeasurements } from "./calculator";
import type { Landmark } from "./types";

function fullBodyLandmarks(): Landmark[] {
  const points = Array.from({ length: 33 }, (_, i) => ({
    x: 0.5,
    y: 0.1 + i * 0.015,
    z: 0,
    visibility: 0.95,
  }));

  Object.assign(points[0], { x: 0.5, y: 0.05 });
  Object.assign(points[11], { x: 0.4, y: 0.25 });
  Object.assign(points[12], { x: 0.6, y: 0.25 });
  Object.assign(points[13], { x: 0.35, y: 0.43 });
  Object.assign(points[14], { x: 0.65, y: 0.43 });
  Object.assign(points[15], { x: 0.32, y: 0.6 });
  Object.assign(points[16], { x: 0.68, y: 0.6 });
  Object.assign(points[23], { x: 0.43, y: 0.55 });
  Object.assign(points[24], { x: 0.57, y: 0.55 });
  Object.assign(points[25], { x: 0.44, y: 0.75 });
  Object.assign(points[26], { x: 0.56, y: 0.75 });
  Object.assign(points[27], { x: 0.45, y: 0.95 });
  Object.assign(points[28], { x: 0.55, y: 0.95 });
  return points;
}

describe("calculateMeasurements", () => {
  it("prefills all 17 tailor measurements from a valid full-body pose", () => {
    const result = calculateMeasurements(fullBodyLandmarks());
    const fields = [
      "chestInches", "bustInches", "underbustInches", "shoulderWidthInches",
      "neckInches", "sleeveLengthInches", "bicepInches", "wristInches",
      "backLengthInches", "waistInches", "hipsInches", "thighInches",
      "kneeInches", "calfInches", "inseamInches", "outseamInches",
      "heightInches",
    ] as const;

    for (const field of fields) {
      expect(result[field], field).toBeGreaterThan(0);
    }
    expect(result.shoulderWidthInches).not.toBe(result.sleeveLengthInches);
  });
});
