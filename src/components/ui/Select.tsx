import { Icon } from "@/components/ui/Icon";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  value: string;
  options: readonly SelectOption[];
  onValueChange: (value: string) => void;
}

/**
 * Native <select>: no scroll locking, native keyboard and screen reader behaviour, and the OS picker on touch.
 * Browsers with customizable select (`appearance: base-select`) also get the styled list from globals.css.
 */
export function Select({ id, value, options, onValueChange }: SelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="rcet-select min-h-11 w-full cursor-pointer appearance-none rounded-md border-2 border-border-strong bg-surface ps-3 pe-10 text-base text-fg transition-colors duration-(--dur-fast) hover:border-fg"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* Fades a long selected label out under the chevron; a customizable select's label can't take an ellipsis. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0.5 end-0.5 w-14 rounded-e-md bg-linear-to-r from-transparent via-surface via-40% to-surface" />
      <Icon
        name="chevron-down"
        className="rcet-select-icon pointer-events-none absolute end-3 top-1/2 size-5 -translate-y-1/2 text-fg-muted"
      />
    </div>
  );
}
