import { BaseExerciseDetector, POSE_LANDMARKS } from './BaseExerciseDetector';
import type { PoseLandmarks } from '../../types/pose';

export class SupportedRowDetector extends BaseExerciseDetector {
  exerciseId = 'supported_dumbbell_row';

  private activeSide: 'left' | 'right' = 'right';

  setActiveSide(side: 'left' | 'right'): void {
    this.activeSide = side;
  }

  protected analyzePose(landmarks: PoseLandmarks): void {
    // Row: measure elbow flexion angle on the active side
    const shoulderIdx = this.activeSide === 'left'
      ? POSE_LANDMARKS.LEFT_SHOULDER : POSE_LANDMARKS.RIGHT_SHOULDER;
    const elbowIdx = this.activeSide === 'left'
      ? POSE_LANDMARKS.LEFT_ELBOW : POSE_LANDMARKS.RIGHT_ELBOW;
    const wristIdx = this.activeSide === 'left'
      ? POSE_LANDMARKS.LEFT_WRIST : POSE_LANDMARKS.RIGHT_WRIST;

    const elbowAngle = this.calcAngle(landmarks, shoulderIdx, elbowIdx, wristIdx);
    if (elbowAngle === null) return;

    const startAngle = this.getThreshold('start_angle', 150);
    const peakAngle = this.getThreshold('peak_angle', 50);
    const hysteresis = this.getThreshold('hysteresis', 10);
    const concentricTrigger = this.getThreshold('concentric_trigger', 120);
    const eccentricTrigger = this.getThreshold('eccentric_trigger', 80);

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
    // Rule: Torso rotation
    const leftShoulder = this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_SHOULDER);
    const rightShoulder = this.getLandmark(landmarks, POSE_LANDMARKS.RIGHT_SHOULDER);
    if (leftShoulder && rightShoulder) {
      // Measure shoulder alignment: in neutral, shoulders should be roughly horizontal
      const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
      const maxTilt = this.getThreshold('shoulder_rotation_angle_max', 15) / 100;
      if (shoulderTilt > maxTilt && this.currentPhase === 'CONCENTRIC') {
        this.recordIssue('torso_rotation', 0.7);
      }
    }

    // Rule: Elbow path out
    const activeShoulder = this.activeSide === 'left'
      ? this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_SHOULDER)
      : this.getLandmark(landmarks, POSE_LANDMARKS.RIGHT_SHOULDER);
    const activeElbow = this.activeSide === 'left'
      ? this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_ELBOW)
      : this.getLandmark(landmarks, POSE_LANDMARKS.RIGHT_ELBOW);
    const activeHip = this.activeSide === 'left'
      ? this.getLandmark(landmarks, POSE_LANDMARKS.LEFT_HIP)
      : this.getLandmark(landmarks, POSE_LANDMARKS.RIGHT_HIP);

    if (activeShoulder && activeElbow && activeHip) {
      // Elbow should track toward hip, not flare out laterally
      const elbowLateralOffset = Math.abs(activeElbow.x - activeShoulder.x);
      const maxOffset = this.getThreshold('elbow_lateral_offset_max', 0.12);
      if (elbowLateralOffset > maxOffset && this.currentPhase === 'CONCENTRIC') {
        this.recordIssue('elbow_path_out', 0.7);
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

  reset(): void {
    super.reset();
    this.activeSide = 'right';
  }
}
