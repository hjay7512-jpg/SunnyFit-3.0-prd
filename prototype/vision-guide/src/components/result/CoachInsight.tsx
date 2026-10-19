import React from 'react';
import type { ExerciseResult } from '../../types/workout';

interface CoachInsightProps {
  results: ExerciseResult[];
  roundsCompleted: number;
}

export const CoachInsight: React.FC<CoachInsightProps> = ({ results, roundsCompleted }) => {
  const insight = generateInsight(results, roundsCompleted);

  return (
    <div className="coach-insight">
      <div className="insight-header">Coach Insight</div>
      <div className="insight-text">{insight}</div>
    </div>
  );
};

function generateInsight(results: ExerciseResult[], roundsCompleted: number): string {
  if (results.length === 0) return 'Great job completing your workout!';

  const totalReps = results.reduce((s, r) => s + r.counted_reps, 0);
  const totalIssues = results.reduce((s, r) => s + r.issue_count, 0);
  const dominantIssue = results.reduce(
    (best, r) => (r.issue_count > (best?.issue_count ?? 0) ? r : best),
    null as ExerciseResult | null
  );

  let insight = '';

  if (roundsCompleted >= 2) {
    insight += `You completed ${roundsCompleted} rounds with ${totalReps} total reps. `;
  } else {
    insight += `Good effort completing ${roundsCompleted} round${roundsCompleted > 1 ? 's' : ''}. `;
  }

  if (totalIssues === 0) {
    insight += 'Your form looked solid throughout. Keep up the great control!';
  } else if (dominantIssue) {
    const issueName = dominantIssue.dominant_issue?.replace(/_/g, ' ') ?? 'form';
    insight += `Focus area for next time: work on keeping steady control during ${issueName}. `;
    insight += 'Slow, controlled reps build more strength than fast ones.';
  } else {
    insight += 'Keep focusing on controlled movement and steady tempo.';
  }

  return insight;
}
