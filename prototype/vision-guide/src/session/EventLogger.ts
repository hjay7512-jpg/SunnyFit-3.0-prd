import type { AnalyticsEvent } from '../types/analytics';

export class EventLogger {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;

  constructor(sessionId?: string) {
    this.sessionId = sessionId ?? `session_${Date.now()}`;
  }

  log(event: string, properties: Record<string, unknown> = {}): void {
    const entry: AnalyticsEvent = {
      event,
      timestamp: Date.now(),
      properties: { session_id: this.sessionId, ...properties },
    };
    this.events.push(entry);

    if (typeof console !== 'undefined') {
      console.log(`[Analytics] ${event}`, properties);
    }
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getSessionId(): string {
    return this.sessionId;
  }

  exportJSON(): string {
    return JSON.stringify({ session_id: this.sessionId, events: this.events }, null, 2);
  }
}
