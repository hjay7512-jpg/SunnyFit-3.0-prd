import type { IssueEvent } from '../../types/pose';
import type { FeedbackMessage, FeedbackItem } from '../../types/feedback';
import type { FormRule } from '../../types/exercise';
import { TTSEngine } from './TTSEngine';

interface CooldownEntry {
  issueCode: string;
  expiresAt: number;
  triggerCount: number;
}

export class FeedbackScheduler {
  private cooldowns: Map<string, CooldownEntry> = new Map();
  private issueHistory: Map<string, { timestamp: number; confidence: number }[]> = new Map();
  private currentFeedback: FeedbackItem | null = null;
  private feedbackExpiry: number = 0;
  private messages: Record<string, FeedbackMessage>;
  private tts: TTSEngine;
  private activeRules: FormRule[] = [];
  private maxFeedbacksPerSet: number = 2;
  private feedbacksThisSet: number = 0;

  constructor(messages: Record<string, FeedbackMessage>, tts: TTSEngine) {
    this.messages = messages;
    this.tts = tts;
  }

  setActiveRules(rules: FormRule[]): void {
    this.activeRules = rules;
  }

  processIssue(issue: IssueEvent): void {
    const now = Date.now();
    const rule = this.activeRules.find(r => r.issue_code === issue.issue_code);
    if (!rule) return;

    // Check per-set limit
    if (this.feedbacksThisSet >= this.maxFeedbacksPerSet) return;

    // Check cooldown
    const cooldown = this.cooldowns.get(issue.issue_code);
    if (cooldown && now < cooldown.expiresAt) return;

    // Track history in sliding window
    if (!this.issueHistory.has(issue.issue_code)) {
      this.issueHistory.set(issue.issue_code, []);
    }
    const history = this.issueHistory.get(issue.issue_code)!;
    history.push({ timestamp: now, confidence: issue.confidence });
    // Keep only last 5 seconds
    const cutoff = now - 5000;
    const filtered = history.filter(h => h.timestamp > cutoff);
    this.issueHistory.set(issue.issue_code, filtered);

    // Check if threshold met
    if (filtered.length >= rule.min_consecutive_occurrences) {
      this.triggerFeedback(issue.issue_code, rule);
    }
  }

  private triggerFeedback(issueCode: string, rule: FormRule): void {
    const message = this.messages[rule.message_key];
    if (!message) return;

    // Don't show if another feedback is still displaying
    if (this.currentFeedback && Date.now() < this.feedbackExpiry) return;

    const item: FeedbackItem = {
      issue_code: issueCode,
      message: message.text,
      priority: message.priority,
      timestamp: Date.now(),
      tts_enabled: message.tts_enabled,
    };

    this.currentFeedback = item;
    this.feedbackExpiry = Date.now() + 4000;

    // Set cooldown
    const existingCooldown = this.cooldowns.get(issueCode);
    this.cooldowns.set(issueCode, {
      issueCode,
      expiresAt: Date.now() + rule.cooldown_seconds * 1000,
      triggerCount: (existingCooldown?.triggerCount ?? 0) + 1,
    });

    this.feedbacksThisSet++;

    // TTS
    if (message.tts_enabled) {
      this.tts.speak(message.text, message.priority);
    }

    // Auto-clear
    setTimeout(() => {
      if (this.currentFeedback?.timestamp === item.timestamp) {
        this.currentFeedback = null;
      }
    }, 4000);
  }

  triggerMilestone(text: string, ttsEnabled: boolean = true): void {
    if (this.currentFeedback && Date.now() < this.feedbackExpiry) return;

    const item: FeedbackItem = {
      issue_code: 'milestone',
      message: text,
      priority: 3,
      timestamp: Date.now(),
      tts_enabled: ttsEnabled,
    };

    this.currentFeedback = item;
    this.feedbackExpiry = Date.now() + 3000;

    if (ttsEnabled) {
      this.tts.speak(text, 3);
    }

    setTimeout(() => {
      if (this.currentFeedback?.timestamp === item.timestamp) {
        this.currentFeedback = null;
      }
    }, 3000);
  }

  getCurrentFeedback(): FeedbackItem | null {
    if (this.currentFeedback && Date.now() >= this.feedbackExpiry) {
      return null;
    }
    return this.currentFeedback;
  }

  resetForNewSet(): void {
    this.feedbacksThisSet = 0;
    this.cooldowns.clear();
    this.issueHistory.clear();
    this.currentFeedback = null;
  }

  resetAll(): void {
    this.resetForNewSet();
    this.tts.stop();
  }

  setTTSEnabled(enabled: boolean): void {
    this.tts.setEnabled(enabled);
  }
}
