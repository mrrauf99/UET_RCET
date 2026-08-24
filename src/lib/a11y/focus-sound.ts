"use client";

export type FocusSoundMode = "focus" | "deeper";

// CC0 loops from OpenGameArt: "Heavenly Loop" by isaiah658 and "Loopable Dungeon Ambience" by JaggedStone.
const TRACKS: Record<FocusSoundMode, string> = {
  focus: "/audio/focus.ogg",
  deeper: "/audio/deeper.ogg",
};

export class FocusSound {
  private audio: HTMLAudioElement | null = null;

  start(mode: FocusSoundMode, volume: number) {
    this.stop();
    const audio = new Audio(TRACKS[mode]);
    audio.loop = true;
    audio.volume = volume;
    this.audio = audio;
    // Rejects if playback is blocked or the format is unsupported; the toolbar stays usable either way.
    audio.play().catch(() => {});
  }

  setVolume(volume: number) {
    if (this.audio) this.audio.volume = volume;
  }

  stop() {
    this.audio?.pause();
    this.audio = null;
  }
}
