import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./components.css";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  "aria-label": string;
}

export function IconButton({ children, className = "", ...props }: IconButtonProps) {
  return (
    <button type="button" className={`jp-icon-btn ${className}`} {...props}>
      {children}
    </button>
  );
}
