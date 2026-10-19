import React from 'react';

interface RepCounterProps {
  current: number;
  target: number;
  phase: string;
}

export const RepCounter: React.FC<RepCounterProps> = ({ current, target, phase }) => {
  return (
    <div className="rep-counter">
      <div className="rep-count">
        <span className="rep-current">{current}</span>
        {target > 0 && <span className="rep-target"> / {target}</span>}
      </div>
      <div className="rep-phase">{phase}</div>
    </div>
  );
};
