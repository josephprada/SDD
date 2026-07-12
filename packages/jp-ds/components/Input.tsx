import type { InputHTMLAttributes } from "react";
import "./components.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

function isTemporalInputType(type?: string): boolean {
  return type === "date" || type === "datetime-local" || type === "time";
}

function isTemporalInputEmpty(
  value: InputHTMLAttributes<HTMLInputElement>["value"],
  defaultValue: InputHTMLAttributes<HTMLInputElement>["defaultValue"],
): boolean {
  if (value === "") return true;
  if (value !== undefined) return false;
  return defaultValue === undefined || defaultValue === "";
}

export function Input({
  label,
  id,
  className = "",
  type,
  value,
  defaultValue,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const showPlaceholder =
    isTemporalInputType(type) && isTemporalInputEmpty(value, defaultValue);
  const inputClassName = `jp-input${showPlaceholder ? " jp-input--placeholder" : ""}`;

  return (
    <div className={`jp-input-wrap ${className}`.trim()}>
      {label ? (
        <label className="jp-input-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={inputClassName}
        type={type}
        value={value}
        defaultValue={defaultValue}
        {...props}
      />
    </div>
  );
}
