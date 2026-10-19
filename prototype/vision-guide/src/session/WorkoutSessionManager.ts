import type { WorkoutTemplate, BlockItem, SessionState, ExerciseResult, WorkoutResult } from '../types/workout';
import type { ExerciseConfig } from '../types/exercise';
import type { PoseLandmarks, IssueEvent } from '../types/pose';
import type { FeedbackMessage } from '../types/feedback';
import { BaseExerciseDetector } from '../engine/exercises/BaseExerciseDetector';
import { SeatedCurlDetector } from '../engine/exercises/SeatedCurlDetector';
import { ShoulderPressDetector } from '../engine/exercises/ShoulderPressDetector';
import { LateralRaiseDetector } from '../engine/exercises/LateralRaiseDetector';
import { SupportedRowDetector } from '../engine/exercises/SupportedRowDetector';
import { WarmupDetector } from '../engine/exercises/WarmupDetector';
import { FeedbackScheduler } from '../engine/feedback/FeedbackScheduler';
import { TTSEngine } from '../engine/feedback/TTSEngine';
import { MetronomeEngine } from '../engine/feedback/MetronomeEngine';
import { EventLogger } from './EventLogger';

export interface SessionSnapshot {
  state: SessionState;
  currentExercise: BlockItem | null;
  currentExerciseConfig: ExerciseConfig | null;
  currentRound: number;
  totalRounds: number;
  repCount: number;
  targetReps: number;
  phase: string;
  activeSide: 'left' | 'right' | 'both';
  restSecondsRemaining: number;
  feedback: string | null;
  elapsedSeconds: number;
  exerciseResults: ExerciseResult[];
  countdownValue: number;
  blockType: string;
  warmupSecondsRemaining: number;
}

export class WorkoutSessionManager {
  private template: WorkoutTemplate | null = null;
  private exerciseConfigs: Map<string, ExerciseConfig> = new Map();
  private detectors: Map<string, BaseExerciseDetector> = new Map();
  private feedbackScheduler: FeedbackScheduler;
  private tts: TTSEngine;
  private metronome: MetronomeEngine;
  private logger: EventLogger;
  private prevPhaseMap: Map<string, string> = new Map();

  private state: SessionState = 'idle';
  private blockIndex: number = 0;
  private itemIndex: number = 0;
  private currentRound: number = 1;
  private activeSide: 'left' | 'right' | 'both' = 'both';
  private restTimer: ReturnType<typeof setInterval> | null = null;
  private restSecondsRemaining: number = 0;
  private countdownValue: number = 0;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private warmupTimer: ReturnType<typeof setInterval> | null = null;
  private warmupSecondsRemaining: number = 0;
  private workoutStartTime: number = 0;
  private exerciseResults: ExerciseResult[] = [];
  private subscribers: Array<(snapshot: SessionSnapshot) => void> = [];
  private milestoneTracker: Map<string, Set<number>> = new Map();

  constructor(messages: Record<string, FeedbackMessage>) {
    this.tts = new TTSEngine();
    this.tts.initialize();
    this.metronome = new MetronomeEngine();
    this.metronome.initialize();
    this.feedbackScheduler = new FeedbackScheduler(messages, this.tts);
    this.logger = new EventLogger();
  }

  configure(exerciseConfigs: ExerciseConfig[]): void {
    for (const config of exerciseConfigs) {
      this.exerciseConfigs.set(config.exercise_id, config);
    }
  }

  startWorkout(template: WorkoutTemplate): void {
    this.template = template;
    this.blockIndex = 0;
    this.itemIndex = 0;
    this.currentRound = 1;
    this.activeSide = 'both';
    this.exerciseResults = [];
    this.workoutStartTime = Date.now();
    this.milestoneTracker.clear();

    this.initDetectors(template);
    this.transitionTo('PREPARE');

    this.logger.log('ai_strength_workout_start', {
      workout_id: template.workout_id,
    });

    // Auto-advance to first exercise after brief prepare
    setTimeout(() => {
      this.startFirstBlock();
    }, 2000);

    this.notify();
  }

  private initDetectors(template: WorkoutTemplate): void {
    this.detectors.clear();
    const exerciseIds = new Set<string>();
    template.blocks.forEach(b => b.items.forEach(i => exerciseIds.add(i.exercise_id)));

    for (const id of exerciseIds) {
      const config = this.exerciseConfigs.get(id);
      const detector = this.createDetector(id);
      if (config) detector.configure(config);
      this.detectors.set(id, detector);
    }
  }

  private createDetector(exerciseId: string): BaseExerciseDetector {
    switch (exerciseId) {
      case 'seated_dumbbell_curl': return new SeatedCurlDetector();
      case 'seated_dumbbell_shoulder_press': return new ShoulderPressDetector();
      case 'seated_dumbbell_lateral_raise': return new LateralRaiseDetector();
      case 'supported_dumbbell_row': return new SupportedRowDetector();
      case 'seated_arm_circle':
      case 'seated_scapular_retraction':
        return new WarmupDetector();
      default: return new WarmupDetector();
    }
  }

  private startFirstBlock(): void {
    const block = this.template!.blocks[0];
    if (block.type === 'warmup') {
      this.startWarmupItem();
    } else {
      this.startCountdown();
    }
  }

  private startWarmupItem(): void {
    this.transitionTo('WARMUP');
    const item = this.getCurrentItem();
    this.logger.log('ai_strength_exercise_start', {
      exercise_id: item.exercise_id,
      block_type: 'warmup',
    });

    const config = this.exerciseConfigs.get(item.exercise_id);
    const detector = this.detectors.get(item.exercise_id);
    if (detector && config) {
      detector.configure(config);
      detector.reset();
    }

    this.feedbackScheduler.triggerMilestone(
      `Warm up: ${config?.display_name ?? item.exercise_id}`,
      true
    );

    if (item.duration_seconds) {
      this.warmupSecondsRemaining = item.duration_seconds;
      if (this.warmupTimer) clearInterval(this.warmupTimer);
      this.warmupTimer = setInterval(() => {
        this.warmupSecondsRemaining--;
        this.notify();
        if (this.warmupSecondsRemaining <= 0) {
          if (this.warmupTimer) clearInterval(this.warmupTimer);
          this.warmupTimer = null;
          this.advanceItem();
        }
      }, 1000);
    }
    this.notify();
  }

  private startCountdown(): void {
    this.transitionTo('COUNTDOWN');
    this.countdownValue = 3;
    this.feedbackScheduler.triggerMilestone('3', true);

    this.countdownTimer = setInterval(() => {
      this.countdownValue--;
      if (this.countdownValue > 0) {
        this.feedbackScheduler.triggerMilestone(`${this.countdownValue}`, true);
        this.notify();
      } else {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.startActiveSet();
      }
    }, 1000);
    this.notify();
  }

  private startActiveSet(): void {
    this.transitionTo('ACTIVE_SET');
    const item = this.getCurrentItem();
    const config = this.exerciseConfigs.get(item.exercise_id);

    const detector = this.detectors.get(item.exercise_id);
    if (detector) {
      if (config) detector.configure(config);
      detector.reset();
      if (detector instanceof SupportedRowDetector) {
        detector.setActiveSide(this.activeSide as 'left' | 'right');
      }
    }

    const rules = config?.form_rules ?? [];
    this.feedbackScheduler.setActiveRules(rules);

    this.milestoneTracker.set(item.exercise_id, new Set());
    this.prevPhaseMap.delete(item.exercise_id);

    this.logger.log('ai_strength_exercise_start', {
      exercise_id: item.exercise_id,
      round: this.currentRound,
      side: this.activeSide,
    });

    this.notify();
  }

  updatePose(landmarks: PoseLandmarks): void {
    if (this.state !== 'ACTIVE_SET') return;

    const item = this.getCurrentItem();
    const detector = this.detectors.get(item.exercise_id);
    if (!detector) return;

    detector.updatePose(landmarks);

    // Metronome: play tick on phase transitions
    const currentPhase = detector.getCurrentPhase();
    const prevPhase = this.prevPhaseMap.get(item.exercise_id) ?? '';
    if (currentPhase !== prevPhase) {
      this.prevPhaseMap.set(item.exercise_id, currentPhase);
      if (currentPhase === 'CONCENTRIC') {
        this.metronome.tickConcentric();
      } else if (currentPhase === 'ECCENTRIC') {
        this.metronome.tickEccentric();
      }
    }

    // Process issues through feedback scheduler
    const issues = detector.getIssues();
    for (const issue of issues) {
      this.feedbackScheduler.processIssue(issue);
    }

    // Check rep milestones for TTS
    const repCount = detector.getRepCount();
    this.checkRepMilestone(item.exercise_id, repCount, item.reps ?? 0);

    // Check set complete
    const targetReps = item.reps ?? 0;
    if (targetReps > 0 && repCount >= targetReps) {
      this.completeSet();
    }

    this.notify();
  }

  private checkRepMilestone(exerciseId: string, repCount: number, targetReps: number): void {
    const tracker = this.milestoneTracker.get(exerciseId);
    if (!tracker) return;

    // Announce at 50% and last 2 reps
    const halfway = Math.floor(targetReps / 2);
    if (repCount === halfway && !tracker.has(halfway)) {
      tracker.add(halfway);
      this.feedbackScheduler.triggerMilestone(`${halfway} reps.`, true);
    }
    if (repCount === targetReps - 2 && !tracker.has(targetReps - 2)) {
      tracker.add(targetReps - 2);
      this.feedbackScheduler.triggerMilestone('Two more.', true);
    }
  }

  private completeSet(): void {
    this.transitionTo('SET_COMPLETE');
    const item = this.getCurrentItem();
    const detector = this.detectors.get(item.exercise_id);

    this.feedbackScheduler.triggerMilestone('Set complete!', true);

    this.logger.log('ai_strength_set_complete', {
      exercise_id: item.exercise_id,
      rep_count: detector?.getRepCount() ?? 0,
    });

    this.recordExerciseResult(item, detector);

    setTimeout(() => this.advanceItem(), 2000);
    this.notify();
  }

  private recordExerciseResult(item: BlockItem, detector?: BaseExerciseDetector): void {
    const dominant = detector?.getDominantIssue();
    this.exerciseResults.push({
      exercise_id: item.exercise_id,
      target_reps: (item.reps ?? 0) * (item.per_side ? 2 : 1),
      counted_reps: detector?.getRepCount() ?? 0,
      dominant_issue: dominant?.code ?? null,
      issue_count: detector?.getTotalIssueCount() ?? 0,
      round_trend: 'stable',
    });
  }

  private advanceItem(): void {
    const block = this.template!.blocks[this.blockIndex];
    const item = block.items[this.itemIndex];

    // Handle per_side: switch sides
    if (item.per_side && this.activeSide === 'left') {
      this.activeSide = 'right';
      this.transitionTo('REST_OR_SIDE_SWITCH');
      this.feedbackScheduler.triggerMilestone('Switch sides.', true);
      this.startRest(10);
      this.notify();
      return;
    }

    // Reset side for next per_side exercise
    if (item.per_side) {
      this.activeSide = 'left';
    }

    // Move to next item in block
    if (this.itemIndex < block.items.length - 1) {
      this.itemIndex++;
      if (this.template!.blocks[this.blockIndex].type === 'warmup') {
        this.startWarmupItem();
      } else {
        this.transitionTo('NEXT_EXERCISE');
        const nextConfig = this.exerciseConfigs.get(this.getCurrentItem().exercise_id);
        this.feedbackScheduler.triggerMilestone(
          `Next: ${nextConfig?.display_name ?? ''}`,
          true
        );
        this.startRest(20);
      }
      this.notify();
      return;
    }

    // Block complete - check for more blocks or rounds
    this.advanceBlock();
  }

  private advanceBlock(): void {
    const block = this.template!.blocks[this.blockIndex];

    // Handle repeat for main blocks
    if (block.type === 'main' && block.repeat && this.currentRound < block.repeat) {
      this.currentRound++;
      this.itemIndex = 0;
      this.activeSide = block.items[0].per_side ? 'left' : 'both';

      // Reset detectors for new round
      for (const [, detector] of this.detectors) {
        detector.reset();
      }
      this.feedbackScheduler.resetForNewSet();

      this.transitionTo('REST_BETWEEN_ROUNDS');
      this.feedbackScheduler.triggerMilestone(
        `Round ${this.currentRound}. Nice work!`,
        true
      );
      this.startRest(45);
      this.notify();
      return;
    }

    // Move to next block
    if (this.blockIndex < this.template!.blocks.length - 1) {
      this.blockIndex++;
      this.itemIndex = 0;
      const nextBlock = this.template!.blocks[this.blockIndex];
      if (nextBlock.type === 'warmup') {
        this.startWarmupItem();
      } else {
        this.activeSide = nextBlock.items[0].per_side ? 'left' : 'both';
        this.startCountdown();
      }
      this.notify();
      return;
    }

    // Workout complete
    this.finishWorkout();
  }

  private startRest(seconds: number): void {
    this.restSecondsRemaining = seconds;
    if (this.restTimer) clearInterval(this.restTimer);
    this.restTimer = setInterval(() => {
      this.restSecondsRemaining--;
      this.notify();
      if (this.restSecondsRemaining <= 0) {
        if (this.restTimer) clearInterval(this.restTimer);
        this.restTimer = null;
        this.startCountdown();
      }
    }, 1000);
  }

  private finishWorkout(): void {
    this.transitionTo('WORKOUT_COMPLETE');
    this.tts.speak('Workout complete! Great job today.', 1);
    this.logger.log('ai_strength_workout_complete', {
      duration_seconds: this.getElapsedSeconds(),
      rounds_completed: this.currentRound,
    });
    this.notify();
  }

  private getCurrentItem(): BlockItem {
    return this.template!.blocks[this.blockIndex].items[this.itemIndex];
  }

  private getElapsedSeconds(): number {
    return Math.floor((Date.now() - this.workoutStartTime) / 1000);
  }

  private transitionTo(newState: SessionState): void {
    this.state = newState;
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    for (const sub of this.subscribers) {
      sub(snapshot);
    }
  }

  getSnapshot(): SessionSnapshot {
    const item = this.template ? this.getCurrentItem() : null;
    const config = item ? this.exerciseConfigs.get(item.exercise_id) ?? null : null;
    const detector = item ? this.detectors.get(item.exercise_id) : undefined;
    const feedback = this.feedbackScheduler.getCurrentFeedback();

    return {
      state: this.state,
      currentExercise: item,
      currentExerciseConfig: config,
      currentRound: this.currentRound,
      totalRounds: this.template?.rounds ?? 1,
      repCount: detector?.getRepCount() ?? 0,
      targetReps: item?.reps ?? 0,
      phase: detector?.getCurrentPhase() ?? 'IDLE',
      activeSide: this.activeSide,
      restSecondsRemaining: this.restSecondsRemaining,
      feedback: feedback?.message ?? null,
      elapsedSeconds: this.getElapsedSeconds(),
      exerciseResults: [...this.exerciseResults],
      countdownValue: this.countdownValue,
      blockType: this.template?.blocks[this.blockIndex]?.type ?? '',
      warmupSecondsRemaining: this.warmupSecondsRemaining,
    };
  }

  getResult(): WorkoutResult {
    return {
      session_id: this.logger.getSessionId(),
      workout_id: this.template?.workout_id ?? '',
      duration_seconds: this.getElapsedSeconds(),
      completed: this.state === 'WORKOUT_COMPLETE',
      rounds_completed: this.currentRound,
      exercise_results: this.exerciseResults,
      rpe: null,
    };
  }

  subscribe(callback: (snapshot: SessionSnapshot) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  pause(): void {
    if (this.state === 'ACTIVE_SET') {
      this.transitionTo('PAUSED');
      this.logger.log('ai_strength_workout_pause', {});
      this.notify();
    }
  }

  resume(): void {
    if (this.state === 'PAUSED') {
      this.transitionTo('ACTIVE_SET');
      this.notify();
    }
  }

  skipExercise(): void {
    if (this.state === 'ACTIVE_SET' || this.state === 'PAUSED') {
      const item = this.getCurrentItem();
      const detector = this.detectors.get(item.exercise_id);
      this.recordExerciseResult(item, detector);
      this.advanceItem();
    }
  }

  endWorkout(): WorkoutResult {
    if (this.restTimer) clearInterval(this.restTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.warmupTimer) clearInterval(this.warmupTimer);
    this.logger.log('ai_strength_workout_exit', {
      exit_stage: this.state,
    });
    this.tts.stop();
    return this.getResult();
  }

  getEventLogger(): EventLogger {
    return this.logger;
  }

  setTTSEnabled(enabled: boolean): void {
    this.feedbackScheduler.setTTSEnabled(enabled);
  }

  setMetronomeEnabled(enabled: boolean): void {
    this.metronome.setEnabled(enabled);
  }

  destroy(): void {
    if (this.restTimer) clearInterval(this.restTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.warmupTimer) clearInterval(this.warmupTimer);
    this.tts.dispose();
    this.metronome.dispose();
    this.subscribers = [];
  }
}
