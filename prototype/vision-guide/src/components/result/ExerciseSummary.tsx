import React from 'react';
import type { ExerciseResult } from '../../types/workout';

interface ExerciseSummaryProps {
  results: ExerciseResult[];
  exerciseNames: Record<string, string>;
}

export const ExerciseSummary: React.FC<ExerciseSummaryProps> = ({ results, exerciseNames }) => {
  return (
    <div className="exercise-summary">
      <h3>Exercise Summary</h3>
      {results.map((r, i) => (
        <div key={i} className="summary-row">
          <div className="summary-name">{exerciseNames[r.exercise_id] ?? r.exercise_id}</div>
          <div className="summary-reps">
            <span className="reps-done">{r.counted_reps}</span>
            <span className="reps-target"> / {r.target_reps} reps</span>
          </div>
          {r.dominant_issue && (
            <div className="summary-issue">{formatIssueCode(r.dominant_issue)}</div>
          )}
        </div>
      ))}
    </div>
  );
};

function formatIssueCode(code: string): string {
  return code.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
