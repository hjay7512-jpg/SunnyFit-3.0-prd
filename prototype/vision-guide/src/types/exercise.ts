export interface FormRule {
  issue_code: string;
  severity: 'coaching' | 'warning';
  min_consecutive_occurrences: number;
  cooldown_seconds: number;
  message_key: string;
  thresholds: Record<string, number>;
}

export interface ExerciseConfig {
  exercise_id: string;
  display_name: string;
  camera_profile_id: string;
  equipment: string[];
  body_position: string;
  training_role: string[];
  sides: 'bilateral' | 'unilateral';
  rep_target: number;
  state_machine: {
    states: string[];
  };
  form_rules: FormRule[];
  phase_thresholds: Record<string, number>;
  tempo_bpm?: number;
}
