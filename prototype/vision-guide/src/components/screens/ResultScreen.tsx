import React from 'react';
import { useStore } from '../../store/useStore';
import { ExerciseSummary } from '../result/ExerciseSummary';
import { CoachInsight } from '../result/CoachInsight';
import { RPESelector } from '../result/RPESelector';
import exercisesData from '../../../configs/exercises.json';

export const ResultScreen: React.FC = () => {
  const { workoutResult, rpe, setRpe, setScreen } = useStore();

  if (!workoutResult) {
    return (
      <div className="screen result-screen">
        <div className="screen-content">
          <p>No workout data available.</p>
          <button className="btn-primary" onClick={() => setScreen('landing')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const exerciseNames: Record<string, string> = {};
  for (const ex of exercisesData.exercises) {
    exerciseNames[ex.exercise_id] = ex.display_name;
  }

  const durationMin = Math.floor(workoutResult.duration_seconds / 60);
  const durationSec = workoutResult.duration_seconds % 60;

  return (
    <div className="screen result-screen">
      <div className="result-content">
        {/* Achievement */}
        <div className="result-achievement">
          <div className="achievement-icon">&#127942;</div>
          <h2>Workout Complete</h2>
          <p className="achievement-detail">
            {workoutResult.rounds_completed} round{workoutResult.rounds_completed > 1 ? 's' : ''}
            {' · '}
            {durationMin}m {durationSec}s
          </p>
        </div>

        {/* Exercise Summary */}
        <ExerciseSummary
          results={workoutResult.exercise_results}
          exerciseNames={exerciseNames}
        />

        {/* Coach Insight */}
        <CoachInsight
          results={workoutResult.exercise_results}
          roundsCompleted={workoutResult.rounds_completed}
        />

        {/* One Improvement Focus */}
        <div className="improvement-focus">
          <div className="focus-label">Next Focus</div>
          <div className="focus-text">
            {getImprovementFocus(workoutResult.exercise_results, exerciseNames)}
          </div>
        </div>

        {/* RPE */}
        <RPESelector value={rpe} onChange={setRpe} />

        {/* Actions */}
        <div className="btn-group">
          <button className="btn-secondary" onClick={() => setScreen('landing')}>
            Done
          </button>
          <button className="btn-primary" onClick={() => setScreen('camera_setup')}>
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

function getImprovementFocus(
  results: { exercise_id: string; dominant_issue: string | null; issue_count: number }[],
  names: Record<string, string>
): string {
  const worst = results.reduce(
    (best, r) => (r.issue_count > (best?.issue_count ?? 0) ? r : best),
    null as typeof results[0] | null
  );

  if (!worst || !worst.dominant_issue) {
    return 'Keep up the great form. Focus on maintaining control throughout each rep.';
  }

  const exerciseName = names[worst.exercise_id] ?? worst.exercise_id;
  const issue = worst.dominant_issue.replace(/_/g, ' ');

  return `Keep your form steady during ${exerciseName}. Focus on controlling the ${issue} movement.`;
}
