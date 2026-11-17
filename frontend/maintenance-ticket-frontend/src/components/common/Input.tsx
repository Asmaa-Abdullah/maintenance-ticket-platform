import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

function Input({ label, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex items-center gap-4">
      {label && (
        <label
          htmlFor={id}
          className="w-24 shrink-0 text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        {...props}
        className={`flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:border-blue-200 disabled:bg-blue-50 disabled:text-blue-700 disabled:opacity-100 ${className}`}
      />
    </div>
  );
}

export default Input;
