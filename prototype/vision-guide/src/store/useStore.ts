import { create } from 'zustand';
import type { SessionSnapshot } from '../session/WorkoutSessionManager';
import type { WorkoutTemplate } from '../types/workout';
import type { ExerciseConfig } from '../types/exercise';
import type { FeedbackMessage } from '../types/feedback';
import type { CameraValidationStatus } from '../types/camera';
import type { WorkoutResult } from '../types/workout';

export type AppScreen = 'landing' | 'equipment' | 'privacy' | 'camera_setup' | 'workout' | 'result';

interface AppState {
  screen: AppScreen;
  setScreen: (screen: AppScreen) => void;

  cameraPermission: 'pending' | 'granted' | 'denied';
  setCameraPermission: (status: 'pending' | 'granted' | 'denied') => void;

  cameraValidation: CameraValidationStatus;
  setCameraValidation: (status: CameraValidationStatus) => void;

  workoutTemplate: WorkoutTemplate | null;
  setWorkoutTemplate: (template: WorkoutTemplate) => void;

  exerciseConfigs: ExerciseConfig[];
  setExerciseConfigs: (configs: ExerciseConfig[]) => void;

  coachMessages: Record<string, FeedbackMessage>;
  setCoachMessages: (messages: Record<string, FeedbackMessage>) => void;

  exerciseTips: Record<string, { intro: string; key_points: string[] }>;
  setExerciseTips: (tips: Record<string, { intro: string; key_points: string[] }>) => void;

  sessionSnapshot: SessionSnapshot | null;
  setSessionSnapshot: (snapshot: SessionSnapshot) => void;

  workoutResult: WorkoutResult | null;
  setWorkoutResult: (result: WorkoutResult) => void;

  rpe: number | null;
  setRpe: (rpe: number) => void;

  devMode: boolean;
  toggleDevMode: () => void;

  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;

  fps: number;
  setFps: (fps: number) => void;

  poseConfidence: number;
  setPoseConfidence: (confidence: number) => void;
}

export const useStore = create<AppState>((set) => ({
  screen: 'landing',
  setScreen: (screen) => set({ screen }),

  cameraPermission: 'pending',
  setCameraPermission: (cameraPermission) => set({ cameraPermission }),

  cameraValidation: 'checking',
  setCameraValidation: (cameraValidation) => set({ cameraValidation }),

  workoutTemplate: null,
  setWorkoutTemplate: (workoutTemplate) => set({ workoutTemplate }),

  exerciseConfigs: [],
  setExerciseConfigs: (exerciseConfigs) => set({ exerciseConfigs }),

  coachMessages: {},
  setCoachMessages: (coachMessages) => set({ coachMessages }),

  exerciseTips: {},
  setExerciseTips: (exerciseTips) => set({ exerciseTips }),

  sessionSnapshot: null,
  setSessionSnapshot: (sessionSnapshot) => set({ sessionSnapshot }),

  workoutResult: null,
  setWorkoutResult: (workoutResult) => set({ workoutResult }),

  rpe: null,
  setRpe: (rpe) => set({ rpe }),

  devMode: false,
  toggleDevMode: () => set((state) => ({ devMode: !state.devMode })),

  ttsEnabled: true,
  setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),

  fps: 0,
  setFps: (fps) => set({ fps }),

  poseConfidence: 0,
  setPoseConfidence: (poseConfidence) => set({ poseConfidence }),
}));
