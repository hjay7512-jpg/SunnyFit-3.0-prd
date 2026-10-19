export interface CameraProfile {
  camera_profile_id: string;
  orientation: 'portrait' | 'landscape';
  view_angle: { min_degree: number; max_degree: number };
  body_visibility: string;
  required_landmarks: string[];
  equipment_context: string[];
  phone_reposition_required: boolean;
  validation_rules: {
    min_visibility_threshold: number;
    min_frame_stability_seconds: number;
    max_people_count: number;
  };
}

export type CameraValidationStatus =
  | 'checking'
  | 'body_detected'
  | 'joints_visible'
  | 'good_distance'
  | 'camera_stable'
  | 'ready'
  | 'too_close'
  | 'too_far'
  | 'joints_missing'
  | 'low_light'
  | 'multiple_people'
  | 'camera_unstable';
