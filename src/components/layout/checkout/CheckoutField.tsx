import type { ChangeEvent, InputHTMLAttributes } from 'react';

interface CheckoutFieldProps {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  inputRef?: (element: HTMLInputElement | null) => void;
}

function CheckoutField({
  label,
  name,
  value,
  placeholder,
  onChange,
  onBlur,
  error,
  type = 'text',
  autoComplete,
  inputMode,
  maxLength,
  inputRef,
}: CheckoutFieldProps) {
  const descriptionId = error ? `${name}-error` : undefined;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      <input
        ref={inputRef}
        name={name}
        value={value}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        className={`focus-ring w-full rounded-[1.15rem] border px-4 py-3 text-sm text-white placeholder:text-slate-500 ${
          error
            ? 'border-rose-400/40 bg-rose-400/8'
            : 'border-white/10 bg-white/[0.04]'
        }`}
      />
      <span id={descriptionId} className={`mt-2 block text-sm ${error ? 'text-rose-200' : 'sr-only'}`}>
        {error ?? `${label} looks good.`}
      </span>
    </label>
  );
}

export default CheckoutField;
