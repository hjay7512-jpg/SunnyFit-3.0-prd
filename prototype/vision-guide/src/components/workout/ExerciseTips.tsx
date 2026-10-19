import React from 'react';
import coachData from '../../../configs/coach_messages.json';

interface ExerciseTipsProps {
  exerciseId: string;
}

const tips = (coachData as any).exercise_tips as Record<string, { intro: string; key_points: string[] }>;

export const ExerciseTips: React.FC<ExerciseTipsProps> = ({ exerciseId }) => {
  const tip = tips?.[exerciseId];
  if (!tip) return null;

  return (
    <div className="exercise-tips">
      {tip.key_points.length > 0 && (
        <ul className="tips-list">
          {tip.key_points.map((point, i) => (
            <li key={i} className="tip-item">{point}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
