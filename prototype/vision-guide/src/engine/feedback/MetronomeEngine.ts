export class MetronomeEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  initialize(): void {
    try {
      this.ctx = new AudioContext();
    } catch {
      // Web Audio not supported
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  tickConcentric(): void {
    this.playTone(880, 0.06, 0.2);
  }

  tickEccentric(): void {
    this.playTone(440, 0.06, 0.12);
  }

  tickWarmup(): void {
    this.playTone(660, 0.05, 0.1);
  }

  private playTone(frequency: number, duration: number, volume: number): void {
    if (!this.enabled || !this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.frequency.value = frequency;
      osc.type = 'sine';

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore audio errors
    }
  }

  dispose(): void {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
