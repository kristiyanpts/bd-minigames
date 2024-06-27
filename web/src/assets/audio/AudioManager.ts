import checkBeep from "./check-beep.mp3";
import timerBeep from "./timer-beep.mp3";
import success from "./success.mp3";
import failed from "./failed.mp3";

export class AudioPlayer {
  private audioElement: HTMLAudioElement | null = null;

  constructor(src: string) {
    if (typeof window !== "undefined") {
      this.audioElement = new Audio(src);
      this.audioElement.preload = "auto";
    }
  }

  play(): void {
    if (this.audioElement) {
      this.audioElement.currentTime = 0; // Reset to start
      this.audioElement.play().catch((error) => {
        console.error("Audio playback failed:", error);
      });
    }
  }
}

// Export a specific instance if needed
export const checkBeepPlayer = new AudioPlayer(checkBeep);
export const timerBeepPlayer = new AudioPlayer(timerBeep);
export const successPlayer = new AudioPlayer(success);
export const failedPlayer = new AudioPlayer(failed);
