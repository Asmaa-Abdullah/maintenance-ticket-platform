import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

function Textarea({ label, id, ...props }: TextareaProps) {
  return (
    <div className="flex items-start gap-4">
      {label && (
        <label
          htmlFor={id}
          className="w-24 shrink-0 pt-2.5 text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}

      <textarea
        id={id}
        {...props}
        className="min-h-32 flex-1 resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
    </div>
  );
}

export default Textarea;
