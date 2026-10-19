import React from 'react';
import { useStore } from '../../store/useStore';

export const LandingScreen: React.FC = () => {
  const { setScreen } = useStore();

  return (
    <div className="screen landing-screen">
      <div className="landing-content">
        <div className="landing-icon">&#127947;</div>
        <h1 className="landing-title">AI Strength Coach</h1>
        <p className="landing-subtitle">
          Bench Dumbbell Upper Body
        </p>

        <div className="landing-info">
          <div className="info-item">
            <span className="info-icon">&#9201;</span>
            <span>~15 min</span>
          </div>
          <div className="info-item">
            <span className="info-icon">&#11088;</span>
            <span>Beginner</span>
          </div>
          <div className="info-item">
            <span className="info-icon">&#127994;</span>
            <span>Dumbbells + Bench</span>
          </div>
          <div className="info-item">
            <span className="info-icon">&#128247;</span>
            <span>Portrait Camera</span>
          </div>
        </div>

        <p className="landing-description">
          I'll count your reps, guide your form, and give you a workout summary.
          Set up your phone once and complete the full training.
        </p>

        <button className="btn-primary" onClick={() => setScreen('equipment')}>
          Set Up Camera
        </button>
      </div>
    </div>
  );
};
