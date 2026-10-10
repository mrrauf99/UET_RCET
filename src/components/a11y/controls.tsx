"use client";

import { useId, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

export function Switch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const descriptionId = useId();
  return (
    <div className="flex flex-col gap-1">
      <label className="a11y-check-row">
        {label}
        <input
          type="checkbox"
          checked={checked}
          aria-describedby={description ? descriptionId : undefined}
          onChange={(event) => onChange(event.target.checked)}
          onKeyDown={(event) => {
            if (event.key === "Enter") { event.preventDefault(); onChange(!checked); }
          }}
        />
      </label>
      {description ? (
        <p id={descriptionId} className="text-sm text-(--tb-muted)">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Choice<T extends string | number>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: T | null;
  options: readonly { value: T; label: ReactNode; ariaLabel?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="a11y-radio-rows">
      <legend className="mb-2 font-bold">{legend}</legend>
      <div className="flex flex-col">
        {options.map((option) => (
          <label key={String(option.value)} className="a11y-radio-row">
            <input
              type="radio"
              name={name}
              value={String(option.value)}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              aria-label={option.ariaLabel}
              className="a11y-radio-input"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Stepper({
  legend,
  valueLabel,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
}: {
  legend: string;
  valueLabel: string;
  canDecrease: boolean;
  canIncrease: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  const button =
    "grid size-11 place-items-center rounded-full border-2 border-(--tb-border) hover:bg-(--tb-hover) aria-disabled:cursor-not-allowed aria-disabled:opacity-50";
  return (
    <fieldset className="a11y-stepper">
      <legend className="mb-2 font-bold">{legend}</legend>
      <div className="flex items-center justify-between gap-3">
        <button type="button" className={button} aria-disabled={!canDecrease} onClick={() => canDecrease && onDecrease()}>
          <Icon name="minus" />
          <span className="sr-only">{decreaseLabel}</span>
        </button>
        <span className="font-bold tabular-nums">{valueLabel}</span>
        <button type="button" className={button} aria-disabled={!canIncrease} onClick={() => canIncrease && onIncrease()}>
          <Icon name="plus" />
          <span className="sr-only">{increaseLabel}</span>
        </button>
      </div>
    </fieldset>
  );
}

export function ResetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="a11y-panel-reset"
    >
      Reset to default
    </button>
  );
}
