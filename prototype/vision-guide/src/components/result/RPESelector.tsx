import React from 'react';

interface RPESelectorProps {
  value: number | null;
  onChange: (value: number) => void;
}

export const RPESelector: React.FC<RPESelectorProps> = ({ value, onChange }) => {
  return (
    <div className="rpe-selector">
      <div className="rpe-label">How did that feel?</div>
      <div className="rpe-scale">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            className={`rpe-btn ${value === n ? 'selected' : ''}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="rpe-desc">
        {value === null ? 'Tap a number' :
         value <= 3 ? 'Very easy' :
         value <= 5 ? 'Moderate' :
         value <= 7 ? 'Challenging' :
         value <= 9 ? 'Hard' : 'Maximum effort'}
      </div>
    </div>
  );
};
