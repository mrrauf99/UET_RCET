import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-styles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: "start" | "end";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "start",
  loading = false,
  className,
  children,
  type = "button",
  onClick,
  ...props
}: ButtonProps) {
  const disabled = props["aria-disabled"] === true || props["aria-disabled"] === "true" || loading;
  const iconNode = icon ? <Icon name={icon} /> : null;

  return (
    <button
      {...props}
      type={type}
      className={buttonClasses(variant, size, className)}
      aria-busy={loading || undefined}
      // aria-disabled instead of disabled keeps the button focusable so its state stays discoverable.
      onClick={disabled ? (event) => event.preventDefault() : onClick}
    >
      {iconPosition === "start" ? iconNode : null}
      {children}
      {iconPosition === "end" ? iconNode : null}
    </button>
  );
}
