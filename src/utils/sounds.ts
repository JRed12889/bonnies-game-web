class SoundPlayer {
  private audioContext: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine'
  ): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = frequency;
      osc.type = type;

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (error) {
      console.log('Audio playback not available');
    }
  }

  playFlip(): void {
    this.playTone(400, 0.1);
  }

  playMatch(): void {
    this.playTone(800, 0.15, 'sine');
    setTimeout(() => this.playTone(1000, 0.15, 'sine'), 80);
  }

  playShuffle(): void {
    this.playTone(300, 0.2, 'square');
  }
}

export const soundPlayer = new SoundPlayer();
