"use client";

export type FocusSoundMode = "focus" | "deeper";

// Generated noise instead of audio files: nothing to download, license or cache.
function noiseBuffer(context: AudioContext, mode: FocusSoundMode) {
  const length = context.sampleRate * 4;
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let last = 0;
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (mode === "focus") {
        // Brown noise: integrated white noise, a low steady rumble.
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      } else {
        // Pink noise (Paul Kellet's economy filter): softer, rain-like.
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11;
      }
    }
  }
  return buffer;
}

export class FocusSound {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;

  get playing() {
    return this.source !== null;
  }

  start(mode: FocusSoundMode, volume: number) {
    this.stop();
    this.context ??= new AudioContext();
    void this.context.resume();
    this.gain = this.context.createGain();
    this.gain.gain.value = volume;
    this.gain.connect(this.context.destination);
    this.source = this.context.createBufferSource();
    this.source.buffer = noiseBuffer(this.context, mode);
    this.source.loop = true;
    this.source.connect(this.gain);
    this.source.start();
  }

  setVolume(volume: number) {
    if (this.gain && this.context) this.gain.gain.setTargetAtTime(volume, this.context.currentTime, 0.05);
  }

  stop() {
    this.source?.stop();
    this.source?.disconnect();
    this.gain?.disconnect();
    this.source = null;
    this.gain = null;
  }
}
