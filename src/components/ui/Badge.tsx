import type { PlayerTag } from "@/lib/analytics/types";

const styles = {
  positive: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  warning: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  negative: "border-red-400/25 bg-red-400/10 text-red-300",
  neutral: "border-sky-400/25 bg-sky-400/10 text-sky-300",
};

export function TagBadge({ tag }: { tag: PlayerTag }) {
  return (
    <span
      title={tag.reason}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles[tag.type]}`}
    >
      {tag.label}
    </span>
  );
}

export function SmallBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof styles;
}) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles[tone]}`}>
      {children}
    </span>
  );
}
