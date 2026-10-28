"use client";

import { useState } from "react";
import { ToolbarIcon } from "../ToolbarIcon";
import type { FocusSoundMode } from "@/lib/a11y/focus-sound";
import type { SpeechOptions } from "@/lib/a11y/speech";
import { VOICE_COMMANDS } from "@/lib/a11y/voice-control";
import { Choice, ResetButton, Stepper, Switch } from "../controls";

export function SpeechPanel({ enabled, options, movable, error, onToggle, onOptions, onMovable, onReset }: {
  enabled: boolean; options: SpeechOptions; movable: boolean; error: string;
  onToggle: () => void; onOptions: (options: SpeechOptions) => void; onMovable: (on: boolean) => void; onReset: () => void;
}) {
  return <div className="a11y-speech-controls">
    <Switch label="Text To Speech (On/Off)" checked={enabled} onChange={onToggle} />
    {enabled ? <>
      <Switch label="Play Automatically" checked={options.autoPlay} onChange={(autoPlay) => onOptions({ ...options, autoPlay })} />
      <Switch label="Read whole page of content" checked={options.wholePage} onChange={(wholePage) => onOptions({ ...options, wholePage })} />
      <Switch label="Movable Player Controls" checked={movable} onChange={onMovable} />
      <hr className="a11y-divider" />
      <Choice legend="Voice" name="tts-voice" value={options.voice} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} onChange={(voice) => onOptions({ ...options, voice })} />
      <hr className="a11y-divider" />
      <Stepper legend="Reading Speed:" valueLabel={String(options.rate)} canDecrease={options.rate > 0.5} canIncrease={options.rate < 2} decreaseLabel="Decrease playback speed" increaseLabel="Increase playback speed" onDecrease={() => onOptions({ ...options, rate: Math.max(0.5, Math.round((options.rate - 0.1) * 10) / 10) })} onIncrease={() => onOptions({ ...options, rate: Math.min(2, Math.round((options.rate + 0.1) * 10) / 10) })} />
      <hr className="a11y-divider" />
      <details className="a11y-speech-keyboard"><summary>Keyboard Controls</summary><p>Ctrl + Alt + Z: toggle Text to Speech.<br />Ctrl + Alt + P: play.<br />Ctrl + Alt + S: stop.<br />Ctrl + Right / Left: next / previous.<br />Ctrl + Shift + arrows: move floating controls.</p></details>
      {error ? <p role="alert" className="text-[14px]">{error}</p> : null}
    </> : null}
    <hr className="a11y-divider" />
    <ResetButton label="Reset Text to Speech Options to default" onClick={onReset} />
  </div>;
}

export function FocusAudioPanel({
  playing,
  mode,
  volume,
  error,
  onToggle,
  onPlay,
  onVolume,
}: {
  playing: boolean;
  mode: FocusSoundMode;
  volume: number;
  error: string;
  onToggle: (on: boolean) => void;
  onPlay: (mode: FocusSoundMode) => void;
  onVolume: (volume: number) => void;
}) {
  return (
    <div className="a11y-panel-controls">
      <div className="a11y-audio-volume">
        <button type="button" className="a11y-audio-toggle" aria-label={playing ? "Pause focus audio" : "Resume focus audio"} aria-pressed={playing} onClick={() => onToggle(!playing)}>
          <ToolbarIcon name={playing ? "speak" : "pause"} className="size-5" />
        </button>
        <label htmlFor="focus-audio-volume">Volume</label>
        <input
          id="focus-audio-volume"
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(volume * 100)}
          onChange={(event) => onVolume(Number(event.target.value) / 100)}
          className="min-w-0 flex-1 accent-(--tb-fg)"
        />
      </div>
      {([{ value: "focus", label: "Focus" }, { value: "deeper", label: "Deeper Reading" }] as const).map((track) => (
        <button key={track.value} type="button" className="a11y-audio-track" aria-pressed={playing && mode === track.value} onClick={() => playing && mode === track.value ? onToggle(false) : onPlay(track.value)}>
          {track.label}<ToolbarIcon name={playing && mode === track.value ? "pause" : "play"} className="size-5" />
        </button>
      ))}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
export function VoiceControlPanel({
  supported,
  listening,
  status,
  onToggle,
}: {
  supported: boolean;
  listening: boolean;
  status: string;
  onToggle: (on: boolean) => void;
}) {
  const [showCommands, setShowCommands] = useState(false);
  if (!supported) {
    return (
      <p>
        Voice control is not available in this browser. It works in recent versions of Chrome, Edge and Safari.
      </p>
    );
  }
  return (
    <div className="a11y-panel-controls">
      <Switch
        label="Voice Control (On/Off)"
        description="Uses your microphone. Speech is processed by your browser’s speech service."
        checked={listening}
        onChange={onToggle}
      />
      {status ? <p className="rounded-md border-2 border-(--tb-border) p-3 text-[14px]">{status}</p> : null}
      <Switch label="View all Commands" checked={showCommands} onChange={setShowCommands} />
      {showCommands ? <div>
        <h3 className="font-bold">Commands</h3>
        <dl className="mt-2 divide-y divide-(--tb-border) text-[14px]">
          {VOICE_COMMANDS.map((command) => (
            <div key={command.say} className="py-2">
              <dt className="font-bold">“{command.say}”</dt>
              <dd className="text-(--tb-muted)">{command.does}</dd>
            </div>
          ))}
        </dl>
      </div> : null}
    </div>
  );
}
