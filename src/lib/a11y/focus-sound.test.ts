import { afterEach, describe, expect, it, vi } from "vitest";
import { FocusSound } from "./focus-sound";

class AudioMock extends EventTarget {
  static instances: AudioMock[] = [];
  loop = false;
  volume = 0;
  pause = vi.fn();
  resolve!: () => void;
  reject!: (error: Error) => void;
  play = vi.fn(() => new Promise<void>((resolve, reject) => { this.resolve = resolve; this.reject = reject; }));
  constructor(public src: string) { super(); AudioMock.instances.push(this); }
}

afterEach(() => { vi.unstubAllGlobals(); AudioMock.instances = []; });

describe("Focus audio playback", () => {
  it("reports Deep Reading as playing only after playback succeeds", async () => {
    vi.stubGlobal("Audio", AudioMock);
    const changed = vi.fn();
    const sound = new FocusSound(changed);
    sound.start("deeper", 1);
    const audio = AudioMock.instances[0];
    expect(audio.src).toBe("/audio/deeper.wav");
    expect(audio.loop).toBe(true);
    expect(audio.volume).toBe(1);
    expect(changed).not.toHaveBeenCalled();
    audio.resolve(); await Promise.resolve();
    expect(changed).toHaveBeenCalledWith(true, "");
    sound.setVolume(0.5); expect(audio.volume).toBe(0.5);
    sound.stop(); expect(audio.pause).toHaveBeenCalled();
  });

  it("reports rejected or failed playback instead of silently showing Pause", async () => {
    vi.stubGlobal("Audio", AudioMock);
    const changed = vi.fn();
    const sound = new FocusSound(changed);
    sound.start("deeper", 1);
    AudioMock.instances[0].reject(new Error("blocked"));
    await Promise.resolve(); await Promise.resolve();
    expect(changed).toHaveBeenCalledWith(false, expect.stringContaining("Audio could not play"));
    sound.start("focus", 1);
    AudioMock.instances[1].dispatchEvent(new Event("error"));
    expect(changed).toHaveBeenLastCalledWith(false, expect.stringContaining("Audio could not play"));
  });

  it("ignores a previous track's late playback result after switching tracks", async () => {
    vi.stubGlobal("Audio", AudioMock);
    const changed = vi.fn();
    const sound = new FocusSound(changed);
    sound.start("focus", 1); sound.start("deeper", 1);
    AudioMock.instances[0].reject(new Error("interrupted"));
    AudioMock.instances[1].resolve();
    await Promise.resolve(); await Promise.resolve();
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledWith(true, "");
  });
});
