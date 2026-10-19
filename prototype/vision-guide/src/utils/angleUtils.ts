import type { Landmark } from '../types/pose';

export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const cb = { x: b.x - c.x, y: b.y - c.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
  const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);
  if (magAB === 0 || magCB === 0) return 0;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

export function distance2D(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function averageLandmarks(frames: Landmark[][]): Landmark[] {
  if (frames.length === 0) return [];
  const count = frames[0].length;
  return Array.from({ length: count }, (_, i) => {
    let x = 0, y = 0, z = 0, v = 0;
    for (const frame of frames) {
      x += frame[i].x;
      y += frame[i].y;
      z += frame[i].z;
      v += frame[i].visibility;
    }
    const n = frames.length;
    return { x: x / n, y: y / n, z: z / n, visibility: v / n };
  });
}

// MediaPipe Pose landmark indices
export const POSE_LANDMARKS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;
