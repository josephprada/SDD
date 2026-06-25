import type { InputHTMLAttributes } from "react";
import "./components.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, id, className = "", ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`jp-input-wrap ${className}`}>
      {label ? (
        <label className="jp-input-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input id={inputId} className="jp-input" {...props} />
    </div>
  );
}
