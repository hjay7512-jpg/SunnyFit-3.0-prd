import type { Landmark } from '../../types/pose';

export class SmoothingFilter {
  private buffer: Landmark[][] = [];
  private readonly windowSize: number;

  constructor(windowSize: number = 5) {
    this.windowSize = windowSize;
  }

  push(landmarks: Landmark[]): Landmark[] {
    this.buffer.push(landmarks);
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }
    return this.smooth();
  }

  private smooth(): Landmark[] {
    if (this.buffer.length === 0) return [];
    const count = this.buffer[0].length;
    return Array.from({ length: count }, (_, i) => {
      let x = 0, y = 0, z = 0, v = 0, w = 0;
      for (let f = 0; f < this.buffer.length; f++) {
        const weight = f + 1; // Linear weighting: recent frames get more weight
        const lm = this.buffer[f][i];
        x += lm.x * weight;
        y += lm.y * weight;
        z += lm.z * weight;
        v += lm.visibility * weight;
        w += weight;
      }
      return { x: x / w, y: y / w, z: z / w, visibility: v / w };
    });
  }

  reset(): void {
    this.buffer = [];
  }
}
