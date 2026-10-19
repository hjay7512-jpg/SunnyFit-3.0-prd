export interface BlockItem {
  exercise_id: string;
  reps?: number;
  duration_seconds?: number;
  per_side?: boolean;
}

export interface WorkoutBlock {
  type: 'warmup' | 'main' | 'cooldown';
  repeat?: number;
  items: BlockItem[];
}

export interface WorkoutTemplate {
  workout_id: string;
  display_name: string;
  goal: string;
  level: string;
  duration_minutes: number;
  camera_profile_id: string;
  equipment: string[];
  rounds: number;
  blocks: WorkoutBlock[];
}

export type SessionState =
  | 'idle'
  | 'PREPARE'
  | 'POSITION_CHECK'
  | 'COUNTDOWN'
  | 'ACTIVE_SET'
  | 'SET_COMPLETE'
  | 'REST_OR_SIDE_SWITCH'
  | 'NEXT_EXERCISE'
  | 'REST_BETWEEN_ROUNDS'
  | 'WARMUP'
  | 'COOLDOWN'
  | 'WORKOUT_COMPLETE'
  | 'PAUSED';

export interface ExerciseResult {
  exercise_id: string;
  target_reps: number;
  counted_reps: number;
  dominant_issue: string | null;
  issue_count: number;
  round_trend: 'improved' | 'declined' | 'stable';
}

export interface WorkoutResult {
  session_id: string;
  workout_id: string;
  duration_seconds: number;
  completed: boolean;
  rounds_completed: number;
  exercise_results: ExerciseResult[];
  rpe: number | null;
}
