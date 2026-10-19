import React from 'react';
import { useStore } from '../../store/useStore';

export const PrivacyScreen: React.FC = () => {
  const { setScreen } = useStore();

  return (
    <div className="screen privacy-screen">
      <div className="screen-content">
        <h2>Camera & Privacy</h2>

        <div className="privacy-items">
          <div className="privacy-item">
            <span className="privacy-icon">&#128247;</span>
            <div>
              <strong>Real-time pose detection only</strong>
              <p>Your camera feed is used to detect body position and movement. No video is recorded or uploaded.</p>
            </div>
          </div>
          <div className="privacy-item">
            <span className="privacy-icon">&#128274;</span>
            <div>
              <strong>All processing on your device</strong>
              <p>Pose detection runs locally in your browser. No frames leave your phone.</p>
            </div>
          </div>
          <div className="privacy-item">
            <span className="privacy-icon">&#128202;</span>
            <div>
              <strong>Only movement data is tracked</strong>
              <p>We record joint positions, rep counts, and form feedback. No images are saved.</p>
            </div>
          </div>
          <div className="privacy-item">
            <span className="privacy-icon">&#9940;</span>
            <div>
              <strong>You can stop anytime</strong>
              <p>Close the browser to stop. You can revoke camera access in your browser settings.</p>
            </div>
          </div>
        </div>

        <div className="btn-group">
          <button className="btn-secondary" onClick={() => setScreen('equipment')}>
            Back
          </button>
          <button className="btn-primary" onClick={() => setScreen('camera_setup')}>
            Allow Camera
          </button>
        </div>
      </div>
    </div>
  );
};
