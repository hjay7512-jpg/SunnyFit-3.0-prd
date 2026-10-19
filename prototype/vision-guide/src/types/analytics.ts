export interface AnalyticsEvent {
  event: string;
  timestamp: number;
  properties: Record<string, unknown>;
}

export interface SessionAnalytics {
  session_id: string;
  device_model: string;
  os: string;
  browser: string;
  camera_profile_id: string;
  pose_engine: string;
  events: AnalyticsEvent[];
}
