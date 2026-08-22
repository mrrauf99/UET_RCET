import Link from "next/link";
import type { ComponentProps } from "react";
import { Icon, type IconName } from "./Icon";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-styles";

type LinkButtonProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  external?: boolean;
};

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  icon,
  external = false,
  className,
  children,
  ...props
}: LinkButtonProps) {
  const classes = buttonClasses(variant, size, className);

  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
        <Icon
          name="external"
          className="size-4 transition-transform duration-(--dur-fast) ease-(--ease-out) group-hover/button:translate-x-0.5 group-hover/button:-translate-y-0.5"
        />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...props}>
      {children}
      {icon ? (
        <Icon name={icon} className="size-5 transition-transform duration-(--dur-fast) ease-(--ease-out) group-hover/button:translate-x-0.5" />
      ) : null}
    </Link>
  );
}
