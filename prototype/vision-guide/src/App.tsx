import React from 'react';
import { useStore } from './store/useStore';
import { LandingScreen } from './components/screens/LandingScreen';
import { EquipmentScreen } from './components/screens/EquipmentScreen';
import { PrivacyScreen } from './components/screens/PrivacyScreen';
import { CameraSetupScreen } from './components/screens/CameraSetupScreen';
import { WorkoutScreen } from './components/screens/WorkoutScreen';
import { ResultScreen } from './components/screens/ResultScreen';

export default function App() {
  const { screen } = useStore();

  return (
    <div className="app">
      {screen === 'landing' && <LandingScreen />}
      {screen === 'equipment' && <EquipmentScreen />}
      {screen === 'privacy' && <PrivacyScreen />}
      {screen === 'camera_setup' && <CameraSetupScreen />}
      {screen === 'workout' && <WorkoutScreen />}
      {screen === 'result' && <ResultScreen />}
    </div>
  );
}
