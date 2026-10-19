import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { useCamera } from '../../hooks/useCamera';
import { usePoseDetection } from '../../hooks/usePoseDetection';
import { WorkoutSessionManager } from '../../session/WorkoutSessionManager';
import type { SessionSnapshot } from '../../session/WorkoutSessionManager';
import { PoseOverlay } from '../camera/PoseOverlay';
import { FeedbackBubble } from '../workout/FeedbackBubble';
import { RepCounter } from '../workout/RepCounter';
import { RestTimer } from '../workout/RestTimer';
import { RoundIndicator } from '../workout/RoundIndicator';
import { ExerciseIllustration } from '../workout/ExerciseIllustration';
import { ExerciseTips } from '../workout/ExerciseTips';
import type { PoseLandmarks } from '../../types/pose';
import workoutsData from '../../../configs/workouts.json';
import exercisesData from '../../../configs/exercises.json';
import coachData from '../../../configs/coach_messages.json';

export const WorkoutScreen: React.FC = () => {
  const {
    setScreen, setWorkoutResult, devMode, fps, poseConfidence,
    toggleDevMode, ttsEnabled, setTtsEnabled,
  } = useStore();

  const { videoRef, startCamera, stopCamera } = useCamera();
  const { initialize, startDetection, stopDetection } = usePoseDetection(videoRef);
  const [poseData, setPoseData] = useState<PoseLandmarks | null>(null);
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [warmupPreview, setWarmupPreview] = useState(true);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const sessionRef = useRef<WorkoutSessionManager | null>(null);
  const warmupExerciseRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await startCamera('user');
      if (ok && mounted) {
        try {
          await initialize();
          setEngineReady(true);
        } catch (e) {
          console.error('Pose engine init failed:', e);
        }
      }
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
      stopDetection();
      stopCamera();
      sessionRef.current?.destroy();
    };
  }, [startCamera, stopCamera, initialize, stopDetection]);

  // Initialize session manager
  useEffect(() => {
    if (!engineReady) return;

    const messages = coachData.messages as Record<string, any>;
    const manager = new WorkoutSessionManager(messages);
    manager.configure(exercisesData.exercises as any[]);
    manager.setTTSEnabled(ttsEnabled);

    manager.subscribe((snap) => {
      setSnapshot(snap);
      if (snap.state === 'WORKOUT_COMPLETE') {
        const result = manager.getResult();
        setWorkoutResult(result);
        setTimeout(() => {
          stopDetection();
          stopCamera();
          setScreen('result');
        }, 3000);
      }
    });

    sessionRef.current = manager;

    const template = workoutsData.workouts[0] as any;
    manager.startWorkout(template);

    return () => {
      manager.destroy();
    };
  }, [engineReady, setWorkoutResult, stopDetection, stopCamera, setScreen, ttsEnabled]);

  // Start pose detection and feed to session
  const handlePose = useCallback((pose: PoseLandmarks) => {
    setPoseData(pose);
    sessionRef.current?.updatePose(pose);
  }, []);

  useEffect(() => {
    if (engineReady) {
      startDetection(handlePose);
    }
    return () => stopDetection();
  }, [engineReady, startDetection, stopDetection, handlePose]);

  // Auto-hide warmup preview after 4s, reset on exercise change
  useEffect(() => {
    const exerciseId = snapshot?.currentExercise?.exercise_id;
    if (snapshot?.state === 'WARMUP' && exerciseId !== warmupExerciseRef.current) {
      warmupExerciseRef.current = exerciseId ?? null;
      setWarmupPreview(true);
    }
    if (snapshot?.state === 'WARMUP' && warmupPreview) {
      const timer = setTimeout(() => setWarmupPreview(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [snapshot?.state, snapshot?.currentExercise?.exercise_id, warmupPreview]);

  // Sync metronome enabled state
  useEffect(() => {
    sessionRef.current?.setMetronomeEnabled(metronomeEnabled);
  }, [metronomeEnabled]);

  const handleExit = () => {
    const result = sessionRef.current?.endWorkout();
    if (result) setWorkoutResult(result);
    stopDetection();
    stopCamera();
    setScreen('result');
  };

  if (loading) {
    return (
      <div className="screen workout-screen">
        <div className="camera-container">
          <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <p>Starting workout...</p>
          </div>
        </div>
      </div>
    );
  }

  const isResting = snapshot?.state === 'REST_OR_SIDE_SWITCH' ||
                    snapshot?.state === 'REST_BETWEEN_ROUNDS';
  const isCountdown = snapshot?.state === 'COUNTDOWN';
  const isActive = snapshot?.state === 'ACTIVE_SET';
  const isWarmup = snapshot?.state === 'WARMUP';
  const isComplete = snapshot?.state === 'WORKOUT_COMPLETE';

  return (
    <div className="screen workout-screen">
      <div className="camera-container">
        <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
        <PoseOverlay landmarks={poseData} showSkeleton={devMode} />
      </div>

      {/* Top bar */}
      <div className="workout-top">
        <div className="workout-top-left">
          {snapshot && (
            <RoundIndicator current={snapshot.currentRound} total={snapshot.totalRounds} />
          )}
        </div>
        <div className="workout-top-right">
          <span className="elapsed-time">
            {snapshot ? formatTime(snapshot.elapsedSeconds) : '0:00'}
          </span>
          <button className="btn-icon" onClick={() => sessionRef.current?.pause()}>
            &#9209;
          </button>
          <button className="btn-icon" onClick={() => setShowExitConfirm(true)}>
            &#10005;
          </button>
        </div>
      </div>

      {/* Dev info */}
      {devMode && (
        <div className="dev-info-top">
          FPS: {fps} | Pose: {(poseConfidence * 100).toFixed(0)}% | State: {snapshot?.state}
        </div>
      )}

      {/* Center content */}
      <div className="workout-center">
        {isWarmup && snapshot?.currentExercise && warmupPreview && (
          <div className="warmup-display">
            <div className="warmup-badge">Warm-up</div>
            <div className="exercise-preview">
              <ExerciseIllustration exerciseId={snapshot.currentExercise.exercise_id} />
              <div className="exercise-preview-name">
                {snapshot.currentExerciseConfig?.display_name}
              </div>
            </div>
            <ExerciseTips exerciseId={snapshot.currentExercise.exercise_id} />
          </div>
        )}

        {isWarmup && snapshot?.currentExercise && !warmupPreview && (
          <div className="warmup-compact">
            <span className="warmup-badge">Warm-up</span>
            {snapshot.warmupSecondsRemaining > 0 && (
              <span className="warmup-compact-timer">{snapshot.warmupSecondsRemaining}s</span>
            )}
          </div>
        )}

        {isCountdown && snapshot?.currentExercise && (
          <div className="countdown-display">
            <div className="exercise-preview">
              <ExerciseIllustration exerciseId={snapshot.currentExercise.exercise_id} />
              <div className="exercise-preview-name">
                {snapshot.currentExerciseConfig?.display_name}
              </div>
            </div>
            <div className="countdown-number">{snapshot.countdownValue}</div>
            <div className="countdown-label">Get ready</div>
          </div>
        )}

        {isResting && snapshot && (
          <div className="rest-display">
            {snapshot.currentExercise && (
              <div className="exercise-preview">
                <ExerciseIllustration exerciseId={snapshot.currentExercise.exercise_id} />
                <div className="exercise-preview-name">
                  Next: {snapshot.currentExerciseConfig?.display_name}
                </div>
              </div>
            )}
            <RestTimer
              secondsRemaining={snapshot.restSecondsRemaining}
              label={snapshot.state === 'REST_BETWEEN_ROUNDS' ? 'Between Rounds' : 'Rest'}
            />
          </div>
        )}

        {snapshot?.state === 'NEXT_EXERCISE' && snapshot.currentExercise && (
          <div className="next-exercise-display">
            <div className="exercise-preview large">
              <ExerciseIllustration exerciseId={snapshot.currentExercise.exercise_id} />
              <div className="exercise-preview-name">
                {snapshot.currentExerciseConfig?.display_name}
              </div>
            </div>
            <ExerciseTips exerciseId={snapshot.currentExercise.exercise_id} />
          </div>
        )}

        {isComplete && (
          <div className="workout-complete-msg">
            <div className="complete-icon">&#127881;</div>
            <div className="complete-text">Workout Complete!</div>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="workout-bottom">
        {/* Exercise info */}
        {snapshot?.currentExerciseConfig && (isActive || isWarmup) && (
          <div className="exercise-info">
            <div className="exercise-name">
              {snapshot.currentExerciseConfig.display_name}
              {snapshot.activeSide !== 'both' && (
                <span className="side-badge">{snapshot.activeSide === 'left' ? 'Left' : 'Right'}</span>
              )}
            </div>
            {isActive && (
              <RepCounter
                current={snapshot.repCount}
                target={snapshot.targetReps}
                phase={snapshot.phase}
              />
            )}
          </div>
        )}

        {/* Feedback bubble */}
        <FeedbackBubble message={snapshot?.feedback ?? null} />

        {/* Controls */}
        <div className="workout-controls">
          <button className="btn-ghost" onClick={toggleDevMode}>
            {devMode ? 'Hide Dev' : 'Dev'}
          </button>
          <button
            className={`btn-ghost ${ttsEnabled ? 'active' : ''}`}
            onClick={() => {
              setTtsEnabled(!ttsEnabled);
              sessionRef.current?.setTTSEnabled(!ttsEnabled);
            }}
          >
            {ttsEnabled ? 'Voice On' : 'Voice Off'}
          </button>
          <button
            className={`btn-ghost ${metronomeEnabled ? 'active' : ''}`}
            onClick={() => setMetronomeEnabled(!metronomeEnabled)}
          >
            {metronomeEnabled ? 'Beat On' : 'Beat Off'}
          </button>
          {isActive && (
            <button className="btn-ghost" onClick={() => sessionRef.current?.skipExercise()}>
              Skip
            </button>
          )}
        </div>
      </div>

      {/* Exit confirmation */}
      {showExitConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>End this workout?</h3>
            <p>Your completed reps will be saved for this session.</p>
            <div className="btn-group">
              <button className="btn-secondary" onClick={() => setShowExitConfirm(false)}>
                Continue
              </button>
              <button className="btn-danger" onClick={handleExit}>
                End Workout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
