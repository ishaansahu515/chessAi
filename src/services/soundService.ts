class SoundService {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private enabled = true;

  constructor() {
    this.loadSounds();
  }

  private loadSounds() {
    const soundFiles = {
      move: '/sounds/move.mp3',
      capture: '/sounds/capture.mp3',
      check: '/sounds/check.mp3',
    };

    Object.entries(soundFiles).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = 0.5;
      
      // Handle loading errors gracefully
      audio.addEventListener('error', () => {
        console.warn(`Could not load sound: ${name}`);
      });
      
      this.sounds[name] = audio;
    });
  }

  playMove() {
    this.playSound('move');
  }

  playCapture() {
    this.playSound('capture');
  }

  playCheck() {
    this.playSound('check');
  }

  private playSound(soundName: string) {
    if (!this.enabled) return;

    const sound = this.sounds[soundName];
    if (sound) {
      // Reset the sound to beginning and play
      sound.currentTime = 0;
      sound.play().catch(error => {
        console.warn(`Could not play sound ${soundName}:`, error);
      });
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    Object.values(this.sounds).forEach(sound => {
      sound.volume = Math.max(0, Math.min(1, volume));
    });
  }
}

export const soundService = new SoundService();