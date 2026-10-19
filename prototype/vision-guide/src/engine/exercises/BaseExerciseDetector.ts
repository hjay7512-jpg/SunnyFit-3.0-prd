import type { PoseLandmarks, IssueEvent } from '../../types/pose';
import type { ExerciseConfig, FormRule } from '../../types/exercise';
import { calculateAngle, POSE_LANDMARKS } from '../../utils/angleUtils';
import type { Landmark } from '../../types/pose';

export abstract class BaseExerciseDetector {
  abstract exerciseId: string;

  protected currentPhase: string = 'IDLE';
  protected repCount: number = 0;
  protected issues: IssueEvent[] = [];
  protected config: ExerciseConfig | null = null;

  protected phaseStartTime: number = 0;
  protected lastRepTime: number = 0;
  protected consecutivePhaseFrames: number = 0;
  protected readonly MIN_PHASE_FRAMES = 3;

  configure(config: ExerciseConfig): void {
    this.config = config;
  }

  updatePose(landmarks: PoseLandmarks): void {
    if (landmarks.confidence < 0.3) return;
    this.analyzePose(landmarks);
  }

  protected abstract analyzePose(landmarks: PoseLandmarks): void;

  protected transitionTo(newPhase: string): void {
    if (this.currentPhase === newPhase) {
      this.consecutivePhaseFrames++;
      return;
    }
    this.consecutivePhaseFrames = 1;
    this.currentPhase = newPhase;
    this.phaseStartTime = performance.now();
  }

  protected confirmTransition(targetPhase: string): boolean {
    return this.consecutivePhaseFrames >= this.MIN_PHASE_FRAMES ||
           this.currentPhase === targetPhase;
  }

  protected completeRep(): void {
    this.repCount++;
    this.lastRepTime = performance.now();
  }

  protected getPhaseDuration(): number {
    return performance.now() - this.phaseStartTime;
  }

  protected recordIssue(code: string, confidence: number): void {
    const existing = this.issues.find(
      (i) => i.issue_code === code && performance.now() - i.timestamp < 5000
    );
    if (existing) {
      existing.consecutive_count++;
      existing.confidence = Math.max(existing.confidence, confidence);
      existing.timestamp = performance.now();
    } else {
      this.issues.push({
        issue_code: code,
        confidence,
        timestamp: performance.now(),
        consecutive_count: 1,
      });
    }
  }

  protected getFormRule(issueCode: string): FormRule | undefined {
    return this.config?.form_rules.find((r) => r.issue_code === issueCode);
  }

  protected getThreshold(key: string, defaultValue: number): number {
    // Search across all form rules for the threshold
    if (!this.config) return defaultValue;
    for (const rule of this.config.form_rules) {
      if (key in rule.thresholds) return rule.thresholds[key];
    }
    if (key in this.config.phase_thresholds) return this.config.phase_thresholds[key];
    return defaultValue;
  }

  protected getLandmark(landmarks: PoseLandmarks, index: number): Landmark | null {
    const lm = landmarks.landmarks[index];
    if (!lm || lm.visibility < 0.4) return null;
    return lm;
  }

  protected calcAngle(
    landmarks: PoseLandmarks,
    aIdx: number,
    bIdx: number,
    cIdx: number
  ): number | null {
    const a = this.getLandmark(landmarks, aIdx);
    const b = this.getLandmark(landmarks, bIdx);
    const c = this.getLandmark(landmarks, cIdx);
    if (!a || !b || !c) return null;
    return calculateAngle(a, b, c);
  }

  getCurrentPhase(): string { return this.currentPhase; }
  getRepCount(): number { return this.repCount; }
  getIssues(): IssueEvent[] { return this.issues; }

  getDominantIssue(): { code: string; count: number } | null {
    const recent = this.issues.filter(
      (i) => performance.now() - i.timestamp < 60000
    );
    if (recent.length === 0) return null;
    const grouped = new Map<string, number>();
    for (const issue of recent) {
      grouped.set(issue.issue_code, (grouped.get(issue.issue_code) ?? 0) + issue.consecutive_count);
    }
    let maxCode = '';
    let maxCount = 0;
    for (const [code, count] of grouped) {
      if (count > maxCount) { maxCode = code; maxCount = count; }
    }
    return maxCode ? { code: maxCode, count: maxCount } : null;
  }

  getTotalIssueCount(): number {
    return this.issues.reduce((sum, i) => sum + i.consecutive_count, 0);
  }

  reset(): void {
    this.currentPhase = 'IDLE';
    this.repCount = 0;
    this.issues = [];
    this.phaseStartTime = 0;
    this.lastRepTime = 0;
    this.consecutivePhaseFrames = 0;
  }
}

export { POSE_LANDMARKS };
