// Audio manager for mystery card unboxing experience
// Uses Web Audio API - only unseal sound

class AudioManager {
  private context: AudioContext | null = null;
  private masterVolume = 0.5;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
      
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // Generate a satisfying foil tear sound
  playUnsealSound(): void {
    if (!this.context) return;
    
    const duration = 0.5;
    const sampleRate = this.context.sampleRate;
    const buffer = this.context.createBuffer(2, sampleRate * duration, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        // Create satisfying tear/open sound
        const envelope = Math.exp(-t * 6) * (1 - Math.exp(-t * 40));
        const noise = (Math.random() * 2 - 1) * 0.25;
        const crinkle = Math.sin(t * 1500 + Math.random() * 50) * 0.1;
        const bass = Math.sin(t * 80) * Math.exp(-t * 10) * 0.2;
        data[i] = (noise + crinkle + bass) * envelope;
      }
    }
    
    this.playBuffer(buffer, 0.5);
  }

  private playBuffer(buffer: AudioBuffer, volume: number): void {
    if (!this.context) return;
    
    const source = this.context.createBufferSource();
    const gainNode = this.context.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    gainNode.gain.value = volume * this.masterVolume;
    
    source.start(0);
  }

  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
}

export const audioManager = new AudioManager();
