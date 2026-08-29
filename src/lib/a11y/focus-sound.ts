"use client";

export type FocusSoundMode = "focus" | "deeper";

// Recordings of the live Focus Audio output; provenance is in public/audio/README.md.
const TRACKS: Record<FocusSoundMode, string> = {
  focus: "/audio/focus.wav",
  deeper: "/audio/deeper.wav",
};

export class FocusSound {
  private audio: HTMLAudioElement | null = null;

  constructor(private onPlaybackChange: (playing: boolean, error: string) => void = () => {}) {}

  start(mode: FocusSoundMode, volume: number) {
    this.stop();
    const audio = new Audio(TRACKS[mode]);
    audio.loop = true;
    audio.volume = volume;
    this.audio = audio;
    const failed = () => {
      if (this.audio !== audio) return;
      audio.pause();
      this.onPlaybackChange(false, "Audio could not play. Check your browser's sound permissions and try again.");
    };
    audio.addEventListener("error", failed);
    audio.play().then(() => {
      if (this.audio === audio) this.onPlaybackChange(true, "");
    }).catch(failed);
  }

  setVolume(volume: number) {
    if (this.audio) this.audio.volume = volume;
  }

  stop() {
    this.audio?.pause();
    this.audio = null;
  }
}
