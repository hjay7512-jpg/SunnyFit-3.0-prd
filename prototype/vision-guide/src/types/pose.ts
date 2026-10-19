export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseLandmarks {
  landmarks: Landmark[];
  timestamp: number;
  confidence: number;
}

export interface IssueEvent {
  issue_code: string;
  confidence: number;
  timestamp: number;
  consecutive_count: number;
}

export interface ExercisePhase {
  phase: string;
  confidence: number;
}
