"use client";

import { useFormStatus } from "react-dom";
import type { AdminState } from "@/lib/admin";
import { Icon } from "@/components/ui/Icon";

export function FormFeedback({ state }: { state: AdminState }) {
  if (!state) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`flex items-start gap-2 border px-3 py-2 text-[0.78rem] ${
        state.ok
          ? "border-success/30 bg-success/10 text-success"
          : "border-error/30 bg-error-container text-error"
      }`}
    >
      <Icon
        name={state.ok ? "check" : "alert"}
        size={14}
        className="mt-0.5 shrink-0"
      />
      {state.message}
    </p>
  );
}

export function SubmitButton({
  label,
  pendingLabel = "Enregistrement…",
  className = "btn-primary",
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function ConfirmButton({
  label,
  message,
  className = "text-[0.7rem] text-error underline underline-offset-2 hover:no-underline",
}: {
  label: string;
  message: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {label}
    </button>
  );
}

export function AdminField({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
  hint,
  error,
  step,
  min,
  max,
  inputMode,
  autoComplete,
  disabled,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string;
  step?: string;
  min?: string | number;
  max?: string | number;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  autoComplete?: string;
  disabled?: boolean;
  className?: string;
}) {
  const id = `admin-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="ml-1 text-error">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        inputMode={inputMode}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`admin-input ${error ? "border-error" : ""}`}
      />
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error-text">{error}</p>}
    </div>
  );
}

export function AdminTextArea({
  label,
  name,
  defaultValue,
  rows = 5,
  required,
  placeholder,
  hint,
  error,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string;
  className?: string;
}) {
  const id = `admin-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="ml-1 text-error">*</span>}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={`admin-input resize-y ${error ? "border-error" : ""}`}
      />
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error-text">{error}</p>}
    </div>
  );
}

export function AdminSelect({
  label,
  name,
  defaultValue,
  options,
  required,
  hint,
  error,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
}) {
  const id = `admin-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="ml-1 text-error">*</span>}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className={`admin-input ${error ? "border-error" : ""}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error-text">{error}</p>}
    </div>
  );
}

export function AdminCheckbox({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-2 text-[0.8rem] text-on-surface-variant">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
      />
      <span>
        <span className="text-primary">{label}</span>
        {hint && <span className="mt-0.5 block text-[0.72rem]">{hint}</span>}
      </span>
    </label>
  );
}
