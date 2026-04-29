import Link from "next/link";
import { championIcon, itemIcon, spellIcon } from "@/lib/ddragon";
import type { ParticipantViewModel } from "@/lib/analytics/types";

function PlayerRow({ p, platform }: { p: ParticipantViewModel; platform: string }) {
  const canLink = p.gameName && p.gameName !== "Unknown" && p.tagLine;

  const body = (
    <div className="grid grid-cols-[minmax(160px,1fr)_90px_70px_70px_80px_80px_92px] items-center gap-3 px-3 py-2 text-xs hover:bg-[#171a24]">
      <div className="flex min-w-0 items-center gap-2">
        <img src={championIcon(p.champion)} alt="" className="h-7 w-7 rounded-md" />
        <div className="min-w-0">
          <div className="truncate font-semibold text-slate-200">{p.gameName}{p.tagLine ? <span className="text-slate-500">#{p.tagLine}</span> : null}</div>
          <div className="text-[10px] text-slate-500">{p.champion}</div>
        </div>
      </div>
      <div className="font-mono">{p.kills}/{p.deaths}/{p.assists}</div>
      <div className="text-right">{p.cs}</div>
      <div className="text-right">{p.vision}</div>
      <div className="text-right">{p.damage.toLocaleString()}</div>
      <div className="text-right">{p.gold.toLocaleString()}</div>
      <div className="flex gap-1 justify-end">
        <img src={spellIcon(p.spells[0])} alt="" className="h-5 w-5 rounded" />
        <img src={spellIcon(p.spells[1])} alt="" className="h-5 w-5 rounded" />
      </div>
    </div>
  );

  if (!canLink) return body;

  return (
    <Link href={`/profile/${platform}/${encodeURIComponent(p.gameName)}/${encodeURIComponent(p.tagLine)}`}>
      {body}
    </Link>
  );
}

export function Scoreboard({
  blue,
  red,
  platform,
}: {
  blue: ParticipantViewModel[];
  red: ParticipantViewModel[];
  platform: string;
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-[#1f2335] bg-[#0d0f14]">
      <div className="grid min-w-[900px] grid-cols-[minmax(160px,1fr)_90px_70px_70px_80px_80px_92px] gap-3 border-b border-[#1f2335] px-3 py-2 text-[10px] uppercase tracking-wide text-slate-500">
        <div>Player</div>
        <div>KDA</div>
        <div className="text-right">CS</div>
        <div className="text-right">Vision</div>
        <div className="text-right">Damage</div>
        <div className="text-right">Gold</div>
        <div className="text-right">Spells</div>
      </div>
      <div className="min-w-[900px]">
        <div className="bg-sky-500/5 px-3 py-1 text-[11px] font-bold text-sky-300">Blue Team</div>
        {blue.map((p) => <PlayerRow key={p.puuid || `${p.gameName}-${p.champion}`} p={p} platform={platform} />)}
        <div className="bg-red-500/5 px-3 py-1 text-[11px] font-bold text-red-300">Red Team</div>
        {red.map((p) => <PlayerRow key={p.puuid || `${p.gameName}-${p.champion}`} p={p} platform={platform} />)}
      </div>
    </div>
  );
}
