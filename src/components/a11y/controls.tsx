"use client";

import { useId, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

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
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descriptionId : undefined}
        onClick={() => onChange(!checked)}
        className="flex min-h-11 w-full items-center justify-between gap-4 rounded-sm text-start font-bold"
      >
        {label}
        <span
          aria-hidden="true"
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full border-2 transition-colors duration-(--dur-fast)",
            checked ? "border-(--tb-accent) bg-(--tb-accent)" : "border-(--tb-border) bg-(--tb-bg)",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 grid size-5 place-items-center rounded-full transition-transform duration-(--dur-fast)",
              checked ? "translate-x-5 bg-(--tb-bg) text-(--tb-accent)" : "bg-(--tb-border)",
            )}
          >
            {checked ? <Icon name="check" className="size-3.5" /> : null}
          </span>
        </span>
      </button>
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
  columns = 3,
  swatches = false,
}: {
  legend: string;
  name: string;
  value: T;
  options: readonly { value: T; label: ReactNode; ariaLabel?: string }[];
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4 | 5;
  /** Colour swatches show selection as a ring so the swatch colour stays visible. */
  swatches?: boolean;
}) {
  const grid = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5" }[columns];
  return (
    <fieldset>
      <legend className="mb-2 font-bold">{legend}</legend>
      <div className={cn("grid gap-2", grid)}>
        {options.map((option) => (
          <label
            key={String(option.value)}
            className={cn(
              "flex min-h-11 cursor-pointer items-center justify-center rounded-full border-2 border-(--tb-border) px-2 text-center text-sm has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--tb-focus)",
              swatches
                ? "has-checked:border-(--tb-fg) has-checked:ring-2 has-checked:ring-(--tb-fg) has-checked:ring-offset-2"
                : "has-checked:border-(--tb-accent) has-checked:bg-(--tb-accent) has-checked:text-(--tb-on-accent)",
            )}
          >
            <input
              type="radio"
              name={name}
              value={String(option.value)}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              aria-label={option.ariaLabel}
              className="sr-only"
            />
            {option.label}
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
    <fieldset>
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
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-(--tb-fg) font-bold hover:bg-(--tb-hover)"
    >
      <Icon name="reset" />
      {label}
    </button>
  );
}
