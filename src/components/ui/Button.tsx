import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";
import { buttonClasses, type ButtonVariant } from "./button-styles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: IconName;
}

export function Button({ variant = "primary", icon, className, children, type = "button", ...props }: ButtonProps) {
  return (
    <button {...props} type={type} className={buttonClasses(variant, "md", className)}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}
