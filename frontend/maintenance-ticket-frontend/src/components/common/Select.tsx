import type { SelectHTMLAttributes, ReactNode } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

function Select({ label, id, children, ...props }: SelectProps) {
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

      <div className="relative flex-1">
        <select
          id={id}
          {...props}
          className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          {children}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default Select;
