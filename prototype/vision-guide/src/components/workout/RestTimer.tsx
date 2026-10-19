import React from 'react';

interface RestTimerProps {
  secondsRemaining: number;
  label?: string;
}

export const RestTimer: React.FC<RestTimerProps> = ({ secondsRemaining, label }) => {
  return (
    <div className="rest-timer">
      <div className="rest-label">{label ?? 'Rest'}</div>
      <div className="rest-time">{secondsRemaining}s</div>
      <div className="rest-bar">
        <div
          className="rest-bar-fill"
          style={{ width: `${(secondsRemaining / 60) * 100}%` }}
        />
      </div>
    </div>
  );
};
