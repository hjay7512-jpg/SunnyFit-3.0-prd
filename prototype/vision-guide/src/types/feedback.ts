export interface FeedbackMessage {
  key: string;
  text: string;
  priority: number;
  tts_enabled: boolean;
}

export interface FeedbackItem {
  issue_code: string;
  message: string;
  priority: number;
  timestamp: number;
  tts_enabled: boolean;
}
