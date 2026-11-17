import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

function Card({ children, title, className = "" }: CardProps) {
  return (
    <section
      className={`w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ${className}`}
    >
      {title && (
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-800">
          {title}
        </h2>
      )}

      {children}
    </section>
  );
}

export default Card;
