import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./components.css";

export type ButtonVariant = "primary" | "secondary" | "danger" | "google";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = [
    "jp-btn",
    `jp-btn--${variant}`,
    fullWidth ? "jp-btn--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
