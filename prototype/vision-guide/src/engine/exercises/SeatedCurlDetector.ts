import { BaseExerciseDetector, POSE_LANDMARKS } from './BaseExerciseDetector';
import type { PoseLandmarks } from '../../types/pose';

export class SeatedCurlDetector extends BaseExerciseDetector {
  exerciseId = 'seated_dumbbell_curl';

  protected analyzePose(landmarks: PoseLandmarks): void {
    const leftElbow = this.calcAngle(
      landmarks, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST
    );
    const rightElbow = this.calcAngle(
      landmarks, POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST
    );

    if (leftElbow === null && rightElbow === null) return;

    const elbowAngle = leftElbow !== null && rightElbow !== null
      ? (leftElbow + rightElbow) / 2
      : (leftElbow ?? rightElbow!);

    const startAngle = this.getThreshold('start_angle', 150);
    const peakAngle = this.getThreshold('peak_angle', 45);
    const hysteresis = this.getThreshold('hysteresis', 10);
    const concentricTrigger = this.getThreshold('concentric_trigger', 130);
    const eccentricTrigger = this.getThreshold('eccentric_trigger', 70);

    switch (this.currentPhase) {
      case 'IDLE':
        if (elbowAngle > startAngle - hysteresis) {
          this.transitionTo('START');
        }
        break;

      case 'START':
        if (elbowAngle < concentricTrigger) {
          this.transitionTo('CONCENTRIC');
        }
        break;

      case 'CONCENTRIC':
        if (elbowAngle < peakAngle + hysteresis) {
          this.transitionTo('PEAK');
        }
        break;

      case 'PEAK':
        if (elbowAngle > eccentricTrigger) {
          this.transitionTo('ECCENTRIC');
        }
        break;

      case 'ECCENTRIC':
        if (elbowAngle > startAngle - hysteresis) {
          this.completeRep();
          this.transitionTo('START');
        }
        break;
    }

    this.checkFormRules(landmarks, elbowAngle);
  }

  private checkFormRules(landmarks: PoseLandmarks, _elbowAngle: number): void {
    // Rule: Elbow drift forward
    const shoulder = this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_SHOULDER);
    const elbow = this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_ELBOW);
    const hip = this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_HIP);
    if (shoulder && elbow && hip) {
      const elbowForwardOffset = Math.abs(elbow.x - shoulder.x);
      const maxOffset = this.getThreshold('elbow_forward_offset_max', 0.08);
      if (elbowForwardOffset > maxOffset && this.currentPhase === 'CONCENTRIC') {
        this.recordIssue('elbow_drift_forward', 0.7);
      }
    }

    // Rule: Torso swing (hip displacement)
    const leftHip = this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_HIP);
    const rightHip = this.getLandmark(landmarks, POSE_LANDMARKS.RIGHT_HIP);
    if (leftHip && rightHip) {
      const hipMidY = (leftHip.y + rightHip.y) / 2;
      const hipDisplacement = Math.abs(hipMidY - 0.65); // Expected seated hip Y
      const maxDisplacement = this.getThreshold('hip_displacement_max', 0.04);
      if (hipDisplacement > maxDisplacement && this.currentPhase !== 'IDLE') {
        this.recordIssue('torso_swing', 0.6);
      }
    }

    // Rule: Fast eccentric
    if (this.currentPhase === 'ECCENTRIC') {
      const duration = this.getPhaseDuration();
      const minDuration = this.getThreshold('eccentric_duration_min_ms', 800);
      if (duration > 0 && duration < minDuration) {
        this.recordIssue('fast_eccentric', 0.8);
      }
    }
  }
}
