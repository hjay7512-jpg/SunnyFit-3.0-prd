import { BaseExerciseDetector, POSE_LANDMARKS } from './BaseExerciseDetector';
import type { PoseLandmarks } from '../../types/pose';

export class ShoulderPressDetector extends BaseExerciseDetector {
  exerciseId = 'seated_dumbbell_shoulder_press';

  protected analyzePose(landmarks: PoseLandmarks): void {
    const leftElbow = this.calcAngle(
      landmarks, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW
    );
    const rightElbow = this.calcAngle(
      landmarks, POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW
    );

    if (leftElbow === null && rightElbow === null) return;

    // Use the arm-extension angle: shoulder-elbow-wrist
    const leftArmAngle = this.calcAngle(
      landmarks, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST
    );
    const rightArmAngle = this.calcAngle(
      landmarks, POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST
    );

    const armAngle = leftArmAngle !== null && rightArmAngle !== null
      ? (leftArmAngle + rightArmAngle) / 2
      : (leftArmAngle ?? rightArmAngle!);

    const startAngle = this.getThreshold('start_angle', 80);
    const peakAngle = this.getThreshold('peak_angle', 165);
    const hysteresis = this.getThreshold('hysteresis', 10);
    const concentricTrigger = this.getThreshold('concentric_trigger', 110);
    const eccentricTrigger = this.getThreshold('eccentric_trigger', 140);

    switch (this.currentPhase) {
      case 'IDLE':
        if (armAngle < startAngle + hysteresis) {
          this.transitionTo('START');
        }
        break;

      case 'START':
        if (armAngle > concentricTrigger) {
          this.transitionTo('CONCENTRIC');
        }
        break;

      case 'CONCENTRIC':
        if (armAngle > peakAngle - hysteresis) {
          this.transitionTo('PEAK');
        }
        break;

      case 'PEAK':
        if (armAngle < eccentricTrigger) {
          this.transitionTo('ECCENTRIC');
        }
        break;

      case 'ECCENTRIC':
        if (armAngle < startAngle + hysteresis) {
          this.completeRep();
          this.transitionTo('START');
        }
        break;
    }

    this.checkFormRules(landmarks, leftElbow, rightElbow);
  }

  private checkFormRules(
    landmarks: PoseLandmarks,
    _leftElbow: number | null,
    _rightElbow: number | null
  ): void {
    // Rule: Torso lean back
    const shoulder = this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_SHOULDER);
    const hip = this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_HIP);
    if (shoulder && hip) {
      // In seated position, shoulder should be roughly above hip
      const leanOffset = Math.abs(shoulder.x - hip.x);
      const maxLean = this.getThreshold('torso_lean_angle_max', 15) / 100; // Convert to normalized
      if (leanOffset > maxLean && this.currentPhase === 'CONCENTRIC') {
        this.recordIssue('torso_lean_back', 0.7);
      }
    }

    // Rule: Asymmetric press
    const leftWrist = this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_WRIST);
    const rightWrist = this.getLandmark(landmarks, POSE_LANDMARKS.RIGHT_WRIST);
    if (leftWrist && rightWrist) {
      const heightDiff = Math.abs(leftWrist.y - rightWrist.y);
      const maxDiff = this.getThreshold('wrist_height_diff_max', 0.1);
      if (heightDiff > maxDiff && this.currentPhase === 'CONCENTRIC') {
        this.recordIssue('asymmetric_press', 0.7);
      }
    }

    // Rule: Limited range
    if (this.currentPhase === 'START' || this.currentPhase === 'ECCENTRIC') {
      const armAngle = this.calcAngle(
        landmarks, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST
      );
      if (armAngle !== null) {
        const minBend = this.getThreshold('min_elbow_bend_angle', 80);
        // If the elbow angle is not bending enough (too straight at bottom)
        if (armAngle > 160 && this.currentPhase === 'START' && this.repCount > 0) {
          // This is actually full extension, which is correct for the start position
          // Limited range means not bending enough, i.e. angle stays too high
        }
      }
    }
  }
}
