import type { ReactNode } from "react";

export function StatCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-[#1f2335] bg-[#11131a] p-4 shadow-sm ${className}`}>
      {title ? (
        <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          {title}
        </div>
      ) : null}
      {children}
    </section>
  );
}
