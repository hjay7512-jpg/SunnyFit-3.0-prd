import React from 'react';
import { useStore } from '../../store/useStore';

export const EquipmentScreen: React.FC = () => {
  const { setScreen } = useStore();

  return (
    <div className="screen equipment-screen">
      <div className="screen-content">
        <h2>Confirm Your Equipment</h2>
        <p className="screen-desc">Make sure you have these ready:</p>

        <div className="equipment-list">
          <div className="equipment-item">
            <span className="eq-icon">&#127994;</span>
            <div>
              <div className="eq-name">Dumbbells</div>
              <div className="eq-desc">A pair of moderate weight dumbbells</div>
            </div>
          </div>
          <div className="equipment-item">
            <span className="eq-icon">&#129681;</span>
            <div>
              <div className="eq-name">Flat Bench</div>
              <div className="eq-desc">Flat bench or adjustable bench in flat position</div>
            </div>
          </div>
          <div className="equipment-item">
            <span className="eq-icon">&#128241;</span>
            <div>
              <div className="eq-name">Phone with Camera</div>
              <div className="eq-desc">You'll prop it up in portrait mode, 2-3m away</div>
            </div>
          </div>
        </div>

        <div className="btn-group">
          <button className="btn-secondary" onClick={() => useStore.getState().setScreen('landing')}>
            Back
          </button>
          <button className="btn-primary" onClick={() => setScreen('privacy')}>
            I Have Everything
          </button>
        </div>
      </div>
    </div>
  );
};
