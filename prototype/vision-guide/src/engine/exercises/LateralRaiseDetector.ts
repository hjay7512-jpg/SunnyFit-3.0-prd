import { BaseExerciseDetector, POSE_LANDMARKS } from './BaseExerciseDetector';
import type { PoseLandmarks } from '../../types/pose';

export class LateralRaiseDetector extends BaseExerciseDetector {
  exerciseId = 'seated_dumbbell_lateral_raise';

  protected analyzePose(landmarks: PoseLandmarks): void {
    // Lateral raise: measure the angle of arm abduction
    // Use shoulder-elbow angle relative to vertical (y-axis)
    const leftShoulder = this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_SHOULDER);
    const leftElbow = this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_ELBOW);
    const rightShoulder = this.getLandmark(landmarks, POSE_LANDMARKS.RIGHT_SHOULDER);
    const rightElbow = this.getLandmark(landmarks, POSE_LANDMARKS.RIGHT_ELBOW);

    if (!leftShoulder || !leftElbow || !rightShoulder || !rightElbow) return;

    // Calculate abduction angle: angle of upper arm from vertical
    const leftAbduction = this.getAbductionAngle(leftShoulder, leftElbow);
    const rightAbduction = this.getAbductionAngle(rightShoulder, rightElbow);
    const abductionAngle = (leftAbduction + rightAbduction) / 2;

    const startAngle = this.getThreshold('start_angle', 15);
    const peakAngle = this.getThreshold('peak_angle', 80);
    const hysteresis = this.getThreshold('hysteresis', 8);
    const concentricTrigger = this.getThreshold('concentric_trigger', 35);
    const eccentricTrigger = this.getThreshold('eccentric_trigger', 60);

    switch (this.currentPhase) {
      case 'IDLE':
        if (abductionAngle < startAngle + hysteresis) {
          this.transitionTo('START');
        }
        break;

      case 'START':
        if (abductionAngle > concentricTrigger) {
          this.transitionTo('CONCENTRIC');
        }
        break;

      case 'CONCENTRIC':
        if (abductionAngle > peakAngle - hysteresis) {
          this.transitionTo('PEAK');
        }
        break;

      case 'PEAK':
        if (abductionAngle < eccentricTrigger) {
          this.transitionTo('ECCENTRIC');
        }
        break;

      case 'ECCENTRIC':
        if (abductionAngle < startAngle + hysteresis) {
          this.completeRep();
          this.transitionTo('START');
        }
        break;
    }

    this.checkFormRules(landmarks, abductionAngle, leftElbow, rightElbow, leftShoulder, rightShoulder);
  }

  private getAbductionAngle(shoulder: { x: number; y: number }, elbow: { x: number; y: number }): number {
    // Angle from vertical (downward y-axis) to the shoulder-elbow vector
    const dx = elbow.x - shoulder.x;
    const dy = elbow.y - shoulder.y;
    // atan2 gives angle from positive x-axis; we want angle from downward vertical
    const angleRad = Math.atan2(Math.abs(dx), dy > 0 ? dy : -dy);
    return (angleRad * 180) / Math.PI;
  }

  private checkFormRules(
    landmarks: PoseLandmarks,
    abductionAngle: number,
    leftElbow: { x: number; y: number },
    rightElbow: { x: number; y: number },
    leftShoulder: { x: number; y: number },
    rightShoulder: { x: number; y: number }
  ): void {
    // Rule: Raise too high
    if (this.currentPhase === 'PEAK' || this.currentPhase === 'CONCENTRIC') {
      const maxAbove = this.getThreshold('elbow_above_shoulder_max', 0.08);
      const leftAbove = leftElbow.y < leftShoulder.y - maxAbove;
      const rightAbove = rightElbow.y < rightShoulder.y - maxAbove;
      if (leftAbove || rightAbove) {
        this.recordIssue('raise_too_high', 0.7);
      }
    }

    // Rule: Torso swing
    const leftHip = this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_HIP);
    const rightHip = this.getLandmark(landmarks, POSE_LANDMARKS.RIGHT_HIP);
    if (leftHip && rightHip) {
      const hipMidY = (leftHip.y + rightHip.y) / 2;
      const hipDisplacement = Math.abs(hipMidY - 0.65);
      const maxDisplacement = this.getThreshold('hip_displacement_max', 0.04);
      if (hipDisplacement > maxDisplacement && this.currentPhase !== 'IDLE') {
        this.recordIssue('torso_swing', 0.6);
      }
    }

    // Rule: Movement too fast
    if (this.currentPhase === 'START' && this.repCount > 0) {
      const repDuration = performance.now() - this.lastRepTime;
      const minDuration = this.getThreshold('rep_duration_min_ms', 1200);
      if (repDuration < minDuration) {
        this.recordIssue('movement_too_fast', 0.6);
      }
    }
  }
}
