import { BaseExerciseDetector, POSE_LANDMARKS } from './BaseExerciseDetector';
import type { PoseLandmarks } from '../../types/pose';

export class WarmupDetector extends BaseExerciseDetector {
  exerciseId = 'warmup_generic';

  private prevWristY: number | null = null;
  private motionAccum: number = 0;
  private motionThreshold = 0.06;
  private repThreshold = 0.15;

  protected analyzePose(landmarks: PoseLandmarks): void {
    const leftWrist = this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_WRIST);
    const rightWrist = this.getLandmark(landmarks, POSE_LANDMARKS.RIGHT_WRIST);
    const leftShoulder = this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_SHOULDER);
    const rightShoulder = this.getLandmark(landmarks, POSE_LANDMARKS.RIGHT_SHOULDER);

    if (!leftWrist || !rightWrist) return;

    const avgWristY = (leftWrist.y + rightWrist.y) / 2;

    if (this.prevWristY !== null) {
      const delta = Math.abs(avgWristY - this.prevWristY);
      this.motionAccum += delta;

      if (this.motionAccum > this.repThreshold) {
        this.completeRep();
        this.motionAccum = 0;
      }
    }

    this.prevWristY = avgWristY;

    if (leftShoulder && rightShoulder) {
      const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
      if (shoulderWidth < 0.05) {
        this.motionThreshold = 0.03;
        this.repThreshold = 0.08;
      }
    }
  }

  reset(): void {
    super.reset();
    this.prevWristY = null;
    this.motionAccum = 0;
  }
}
