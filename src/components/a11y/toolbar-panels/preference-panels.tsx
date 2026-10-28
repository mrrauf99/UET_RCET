"use client";

import { PRESET_LABELS } from "@/lib/a11y/color-presets";
import { COLOR_PRESETS, DEFAULT_PREFS, LETTER_SPACINGS, LINE_HEIGHTS, RULER_COLORS, RULER_SWATCHES, type A11yPrefs } from "@/lib/a11y/prefs";
import { resolvedAttribute } from "@/lib/a11y/store";
import { Choice, ResetButton, Stepper, Switch } from "../controls";
import { onOff, updatePreference, type PrefsPanelProps } from "./shared";

const FONT_OPTIONS = [
  { value: "default", label: "Default Font", style: undefined },
  { value: "lexend", label: "Lexend", style: "var(--font-lexend), Verdana, Arial, sans-serif" },
  { value: "arial", label: "Arial", style: "Arial, sans-serif" },
  { value: "verdana", label: "Verdana", style: "Verdana, sans-serif" },
  { value: "comic-sans", label: "Comic Sans MS", style: '"Comic Sans MS", cursive' },
  { value: "georgia", label: "Georgia", style: "Georgia, serif" },
  { value: "tahoma", label: "Tahoma", style: "Tahoma, Verdana, sans-serif" },
  { value: "lato", label: "Lato", style: "var(--font-lato), Arial, sans-serif" },
  { value: "trebuchet", label: "Trebuchet", style: '"Trebuchet MS", sans-serif' },
  { value: "open-dyslexic", label: "Open Dyslexic", style: '"Open Dyslexic", Verdana, sans-serif' },
] as const;

export function FontPanel({ prefs, announce }: PrefsPanelProps) {
  const lineIndex = LINE_HEIGHTS.indexOf(prefs.lineHeight);
  const spacingIndex = LETTER_SPACINGS.indexOf(prefs.letterSpacing);
  return (
    <>
      <Stepper
        legend="Line Height"
        valueLabel={prefs.lineHeight ? `${prefs.lineHeight}×` : "Default"}
        canDecrease={lineIndex > 0}
        canIncrease={lineIndex < LINE_HEIGHTS.length - 1}
        decreaseLabel="Reduce line spacing"
        increaseLabel="Increase line spacing"
        onDecrease={() => updatePreference({ lineHeight: LINE_HEIGHTS[lineIndex - 1] }, announce, "Line spacing reduced")}
        onIncrease={() => updatePreference({ lineHeight: LINE_HEIGHTS[lineIndex + 1] }, announce, "Line spacing increased")}
      />
      <Stepper
        legend="Character Spacing"
        valueLabel={prefs.letterSpacing ? `+${prefs.letterSpacing}em` : "Default"}
        canDecrease={spacingIndex > 0}
        canIncrease={spacingIndex < LETTER_SPACINGS.length - 1}
        decreaseLabel="Reduce character spacing"
        increaseLabel="Increase character spacing"
        onDecrease={() => updatePreference({ letterSpacing: LETTER_SPACINGS[spacingIndex - 1] }, announce, "Character spacing reduced")}
        onIncrease={() =>
          updatePreference({ letterSpacing: LETTER_SPACINGS[spacingIndex + 1] }, announce, "Character spacing increased")
        }
      />
      <hr className="a11y-divider" />
      <fieldset className="a11y-font-list">
        <legend className="mb-2 font-bold">Select Font</legend>
        <div className="flex flex-col gap-2">
          {FONT_OPTIONS.map((font) => (
            <label
              key={font.value}
              style={{ fontFamily: font.style }}
              className="a11y-font-option flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-(--tb-border) has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--tb-focus)"
            >
              <input
                type="radio"
                name="toolbar-font"
                value={font.value}
                checked={prefs.font === font.value}
                onChange={() => updatePreference({ font: font.value }, announce, `Font ${font.label}`)}
                className="sr-only"
              />
              {font.label}
            </label>
          ))}
        </div>
      </fieldset>
      <ResetButton
        label="Reset font options"
        onClick={() =>
          updatePreference(
            { font: DEFAULT_PREFS.font, lineHeight: DEFAULT_PREFS.lineHeight, letterSpacing: DEFAULT_PREFS.letterSpacing },
            announce,
            "Font options reset",
          )
        }
      />
    </>
  );
}

export function ColourPanel({ prefs, announce }: PrefsPanelProps) {
  const selected = prefs.colorPreset === "none" ? (prefs.grayscale ? "Monochrome" : "Default theme") : PRESET_LABELS[prefs.colorPreset].name;
  return (
    <div className="a11y-colour-controls">
      <label className="a11y-ruler-check">
        Monochrome
        <input type="checkbox" checked={prefs.grayscale} onChange={(event) => updatePreference({ grayscale: event.target.checked, colorPreset: "none" }, announce, `Monochrome ${onOff(event.target.checked)}. Page colours reset.`)} />
      </label>
      <div className="a11y-colour-background">
        <h3>Page Background</h3>
        {(["Dark", "Light"] as const).map((group) => (
          <fieldset key={group}>
            <legend>{group}</legend>
            <div className="a11y-colour-swatches">
              {COLOR_PRESETS.filter((preset): preset is Exclude<A11yPrefs["colorPreset"], "none"> => preset !== "none" && PRESET_LABELS[preset].group === group).map((preset) => {
                const swatch = PRESET_LABELS[preset];
                return (
                  <label key={preset} title={swatch.name} data-tone={group.toLowerCase()} style={{ backgroundColor: swatch.bg, color: swatch.fg }}>
                    <input type="radio" name="toolbar-preset" value={preset} checked={prefs.colorPreset === preset} onChange={() => updatePreference({ colorPreset: preset }, announce, swatch.name)} aria-label={swatch.name} className="sr-only" />
                    <span aria-hidden="true">A</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <p className="a11y-colour-selection">Selected: {selected}</p>
      <button type="button" className="a11y-panel-reset" aria-label="Reset colour themes to default" onClick={() => updatePreference({ theme: DEFAULT_PREFS.theme, contrast: DEFAULT_PREFS.contrast, grayscale: false, colorPreset: "none" }, announce, "Colours reset")}>Reset to default</button>
    </div>
  );
}

export function RulerPanel({ prefs, announce }: PrefsPanelProps) {
  return (
    <div className="a11y-ruler-controls">
      <label className="a11y-ruler-check">
        Ruler
        <input type="checkbox" checked={prefs.readingGuide} onChange={(event) => updatePreference({ readingGuide: event.target.checked }, announce, `Reading ruler ${onOff(event.target.checked)}`)} />
      </label>
      {prefs.readingGuide ? (
        <>
          <label className="a11y-ruler-check">
            Markings
            <input type="checkbox" checked={prefs.rulerMarkings} onChange={(event) => updatePreference({ rulerMarkings: event.target.checked }, announce, `Ruler markings ${onOff(event.target.checked)}`)} />
          </label>
          <fieldset className="a11y-ruler-colours">
            <legend>Select Colour</legend>
            <div className="a11y-ruler-swatches">
              {RULER_COLORS.map((color) => (
                <label key={color} title={color} style={{ backgroundColor: RULER_SWATCHES[color] }}>
                  <input type="radio" name="ruler-colour" aria-label={color} value={color} checked={prefs.rulerColor === color} onChange={() => updatePreference({ rulerColor: color }, announce, `Ruler colour ${color}`)} className="sr-only" />
                </label>
              ))}
            </div>
          </fieldset>
          <div className="a11y-ruler-adjustments">
            <Stepper
              legend="Size"
              valueLabel={String(prefs.rulerSize)}
              canDecrease={prefs.rulerSize > 1}
              canIncrease={prefs.rulerSize < 5}
              decreaseLabel="Reduce ruler size"
              increaseLabel="Increase ruler size"
              onDecrease={() => updatePreference({ rulerSize: (prefs.rulerSize - 1) as A11yPrefs["rulerSize"] }, announce, "Ruler smaller")}
              onIncrease={() => updatePreference({ rulerSize: (prefs.rulerSize + 1) as A11yPrefs["rulerSize"] }, announce, "Ruler larger")}
            />
            <Stepper
              legend="Opacity Level"
              valueLabel={`${prefs.rulerOpacity}%`}
              canDecrease={prefs.rulerOpacity > 25}
              canIncrease={prefs.rulerOpacity < 100}
              decreaseLabel="Reduce ruler opacity"
              increaseLabel="Increase ruler opacity"
              onDecrease={() => updatePreference({ rulerOpacity: (prefs.rulerOpacity - 25) as A11yPrefs["rulerOpacity"] }, announce, "Ruler opacity reduced")}
              onIncrease={() => updatePreference({ rulerOpacity: (prefs.rulerOpacity + 25) as A11yPrefs["rulerOpacity"] }, announce, "Ruler opacity increased")}
            />
          </div>
          <hr className="a11y-divider" />
          <div className="a11y-reading-controls">
            <h3>Controls</h3>
            <p>Move mouse or use your keyboard keys</p>
            <p>Shift + Arrow keys (up &amp; down)</p>
          </div>
        </>
      ) : null}
      <button type="button" className="a11y-ruler-reset" onClick={() => updatePreference({ readingGuide: false, rulerMarkings: DEFAULT_PREFS.rulerMarkings, rulerColor: DEFAULT_PREFS.rulerColor, rulerSize: DEFAULT_PREFS.rulerSize, rulerOpacity: DEFAULT_PREFS.rulerOpacity }, announce, "Ruler reset to default")}>
        Reset to default
      </button>
    </div>
  );
}

export function CursorPanel({ prefs, announce }: PrefsPanelProps) {
  return (
    <>
      <Choice
        legend="Cursor Size"
        name="cursor-size"
        value={prefs.cursor}
        options={[
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
          { value: "x-large", label: "X-Large" },
        ]}
        onChange={(cursor) => updatePreference({ cursor }, announce, `Cursor ${cursor === "x-large" ? "extra large" : cursor}`)}
      />
      <hr className="a11y-divider" />
      <Choice<"white" | "black">
        legend="Cursor Colour"
        name="cursor-colour"
        value={prefs.cursor === "default" ? null : prefs.cursorColor}
        options={[
          { value: "white", label: "White" },
          { value: "black", label: "Black" },
        ]}
        onChange={(cursorColor) => updatePreference({ cursor: prefs.cursor === "default" ? "small" : prefs.cursor, cursorColor }, announce, `Cursor colour ${cursorColor}`)}
      />
      <ResetButton label="Reset cursor to system default" onClick={() => updatePreference({ cursor: DEFAULT_PREFS.cursor, cursorColor: DEFAULT_PREFS.cursorColor }, announce, "Cursor reset to system default")} />
    </>
  );
}

export function MaskPanel({ prefs, announce }: PrefsPanelProps) {
  const enabled = prefs.readingMask || prefs.maskVertical;
  return (
    <div className="a11y-mask-controls">
      <Switch label="Horizontal" checked={prefs.readingMask} onChange={(on) => updatePreference({ readingMask: on }, announce, `Horizontal mask ${onOff(on)}`)} />
      <Switch label="Vertical" checked={prefs.maskVertical} onChange={(on) => updatePreference({ maskVertical: on }, announce, `Vertical mask ${onOff(on)}`)} />
      {enabled ? <>
        <Switch label="Edge Colour" checked={prefs.maskEdge} onChange={(on) => updatePreference({ maskEdge: on }, announce, `Mask edge ${onOff(on)}`)} />
        <fieldset className="a11y-ruler-colours">
          <legend>Select Colour</legend>
          <div className="a11y-ruler-swatches">
            {RULER_COLORS.map((color) => <label key={color} title={color} style={{ backgroundColor: RULER_SWATCHES[color] }}>
              <input type="radio" name="mask-colour" aria-label={color} checked={prefs.maskColor === color} onChange={() => updatePreference({ maskColor: color }, announce, `Mask colour ${color}`)} className="sr-only" />
            </label>)}
          </div>
        </fieldset>
        <hr className="a11y-divider" />
        <Stepper legend="Size" valueLabel={String(prefs.maskSize)} canDecrease={prefs.maskSize > 1} canIncrease={prefs.maskSize < 5} decreaseLabel="Reduce screen mask window size" increaseLabel="Increase screen mask window size" onDecrease={() => updatePreference({ maskSize: (prefs.maskSize - 1) as A11yPrefs["maskSize"] }, announce, "Mask window smaller")} onIncrease={() => updatePreference({ maskSize: (prefs.maskSize + 1) as A11yPrefs["maskSize"] }, announce, "Mask window larger")} />
        <Stepper legend="Opacity Level" valueLabel={`${prefs.maskOpacity}%`} canDecrease={prefs.maskOpacity > 25} canIncrease={prefs.maskOpacity < 100} decreaseLabel="Reduce mask opacity" increaseLabel="Increase mask opacity" onDecrease={() => updatePreference({ maskOpacity: (prefs.maskOpacity - 25) as A11yPrefs["maskOpacity"] }, announce, "Mask opacity reduced")} onIncrease={() => updatePreference({ maskOpacity: (prefs.maskOpacity + 25) as A11yPrefs["maskOpacity"] }, announce, "Mask opacity increased")} />
        <hr className="a11y-divider" />
        <div className="a11y-reading-controls">
          <h3>Controls</h3>
          <p>Move mouse or use your keyboard keys</p>
          <p>Shift + Arrow keys ({prefs.readingMask && prefs.maskVertical ? "up, down, left & right" : prefs.maskVertical ? "left & right" : "up & down"})</p>
        </div>
      </> : null}
      <ResetButton label="Reset screen mask to default" onClick={() => updatePreference({ readingMask: false, maskVertical: false, maskEdge: false, maskColor: DEFAULT_PREFS.maskColor, maskOpacity: DEFAULT_PREFS.maskOpacity, maskSize: DEFAULT_PREFS.maskSize }, announce, "Screen mask reset")} />
    </div>
  );
}

export function PageOptionsPanel({ prefs, announce }: PrefsPanelProps) {
  const motionReduced = resolvedAttribute("data-motion") === "reduce";
  return (
    <div className="a11y-page-controls">
      {!prefs.plainText ? <div className="a11y-page-image-options">
        <Switch label="Pause Animations and Video" checked={motionReduced} onChange={(on) => updatePreference({ motion: on ? "reduce" : "no-preference" }, announce, `Animations and video ${on ? "paused" : "on"}`)} />
        <Switch label="Hide Images" checked={prefs.hideImages} onChange={(on) => updatePreference({ hideImages: on }, announce, on ? "Images hidden on page. Images which are links have not been hidden." : "Images shown")} />
        <Switch label="View Image Description" checked={prefs.imageDescriptions} onChange={(on) => updatePreference({ imageDescriptions: on }, announce, `Image descriptions ${onOff(on)}`)} />
      </div> : null}
      {!prefs.plainText ? <hr className="a11y-divider" /> : null}
      <Switch label="Plain Text Mode" checked={prefs.plainText} onChange={(on) => updatePreference({ plainText: on, textArea: DEFAULT_PREFS.textArea }, announce, `Plain text mode ${onOff(on)}`)} />
      <hr className="a11y-divider" />
      {prefs.plainText ? <>
        <Choice
          legend="Text Area"
          name="page-text-area"
          value={prefs.textArea}
          options={[
            { value: "small", label: "Small", ariaLabel: "Small Text Area" },
            { value: "medium", label: "Medium", ariaLabel: "Medium Text Area" },
            { value: "large", label: "Large", ariaLabel: "Large Text Area" },
            { value: "full", label: "Full Page", ariaLabel: "Full Page Text Area" },
          ]}
          onChange={(textArea) => updatePreference({ textArea }, announce, `Text area ${textArea === "full" ? "full page" : textArea}`)}
        />
        <hr className="a11y-divider" />
      </> : null}
      <ResetButton label="Reset page options to default" onClick={() => updatePreference({ motion: DEFAULT_PREFS.motion, hideImages: false, imageDescriptions: false, plainText: false, textArea: DEFAULT_PREFS.textArea }, announce, "Page options reset")} />
    </div>
  );
}
