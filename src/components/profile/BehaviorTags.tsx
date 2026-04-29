import type { PlayerTag } from "@/lib/analytics/types";
import { TagBadge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";

export function BehaviorTags({ tags }: { tags: PlayerTag[] }) {
  return (
    <StatCard title="Player Identity">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => <TagBadge key={tag.id} tag={tag} />)}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Derived from loaded ranked games. Timeline-based tags can be added later.
      </p>
    </StatCard>
  );
}
