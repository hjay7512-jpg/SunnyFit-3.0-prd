import React from 'react';

interface RoundIndicatorProps {
  current: number;
  total: number;
}

export const RoundIndicator: React.FC<RoundIndicatorProps> = ({ current, total }) => {
  return (
    <div className="round-indicator">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`round-dot ${i < current ? 'completed' : ''} ${i === current - 1 ? 'active' : ''}`}
        />
      ))}
      <span className="round-text">Round {current} / {total}</span>
    </div>
  );
};
