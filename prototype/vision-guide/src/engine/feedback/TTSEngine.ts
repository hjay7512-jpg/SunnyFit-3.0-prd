export class TTSEngine {
  private synth: SpeechSynthesis | null = null;
  private enabled: boolean = true;
  private queue: string[] = [];
  private speaking: boolean = false;
  private voice: SpeechSynthesisVoice | null = null;
  private rate: number = 1.0;
  private volume: number = 1.0;

  initialize(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      this.enabled = false;
      return;
    }
    this.synth = window.speechSynthesis;
    this.loadVoice();
  }

  private loadVoice(): void {
    if (!this.synth) return;
    const loadVoices = () => {
      const voices = this.synth!.getVoices();
      // Prefer English voices, then any available
      this.voice = voices.find(v => v.lang.startsWith('en') && v.localService) ||
                   voices.find(v => v.lang.startsWith('en')) ||
                   voices[0] || null;
    };
    loadVoices();
    // Voices may load asynchronously
    this.synth.onvoiceschanged = loadVoices;
  }

  speak(text: string, priority: number = 3): void {
    if (!this.enabled || !this.synth) return;

    if (priority <= 1) {
      // High priority: interrupt current speech
      this.synth.cancel();
      this.speaking = false;
      this.queue = [];
      this.doSpeak(text);
    } else if (this.speaking) {
      // Queue if already speaking (max 3 items)
      if (this.queue.length < 3) {
        this.queue.push(text);
      }
    } else {
      this.doSpeak(text);
    }
  }

  private doSpeak(text: string): void {
    if (!this.synth || !this.enabled) return;

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = this.rate;
    utterance.volume = this.volume;
    utterance.pitch = 1.0;

    utterance.onstart = () => { this.speaking = true; };
    utterance.onend = () => {
      this.speaking = false;
      const next = this.queue.shift();
      if (next) {
        setTimeout(() => this.doSpeak(next), 300);
      }
    };
    utterance.onerror = () => {
      this.speaking = false;
    };

    this.synth.speak(utterance);
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.queue = [];
      this.speaking = false;
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  setRate(rate: number): void {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  dispose(): void {
    this.stop();
    this.synth = null;
  }
}
