"use client";

import { useState } from "react";
import { championIcon, itemIcon, spellIcon } from "@/lib/ddragon";
import type { MatchCardViewModel } from "@/lib/analytics/types";
import { SmallBadge } from "@/components/ui/Badge";
import { Scoreboard } from "@/components/profile/Scoreboard";

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function MatchCard({ match, platform }: { match: MatchCardViewModel; platform: string }) {
  const [open, setOpen] = useState(false);
  const tone = match.win ? "border-l-emerald-400 bg-emerald-400/[0.04]" : "border-l-red-400 bg-red-400/[0.04]";
  const kdaTone = match.kda.ratio >= 4 ? "text-emerald-300" : match.kda.ratio >= 2.5 ? "text-amber-300" : "text-slate-300";

  return (
    <article className={`rounded-2xl border border-[#1f2335] border-l-4 ${tone}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid w-full grid-cols-[72px_54px_minmax(120px,1fr)_130px_110px_minmax(120px,1fr)_80px] items-center gap-3 p-4 text-left max-lg:grid-cols-[60px_48px_1fr] max-lg:gap-2"
      >
        <div>
          <div className={`text-sm font-black ${match.win ? "text-emerald-300" : "text-red-300"}`}>
            {match.win ? "WIN" : "LOSS"}
          </div>
          <div className="text-xs text-slate-500">{match.queueName}</div>
          <div className="text-xs text-slate-500">{fmtDuration(match.gameDuration)}</div>
        </div>

        <img src={championIcon(match.champion.name)} alt="" className="h-12 w-12 rounded-xl" />

        <div className="min-w-0">
          <div className="truncate font-bold">{match.champion.name}</div>
          <div className="text-xs text-slate-500">Level {match.champion.level} · {match.position}</div>
          <div className="mt-1 flex gap-1">
            <img src={spellIcon(match.spells[0])} alt="" className="h-5 w-5 rounded" />
            <img src={spellIcon(match.spells[1])} alt="" className="h-5 w-5 rounded" />
          </div>
        </div>

        <div className="max-lg:col-span-3">
          <div className="font-mono text-base font-bold">
            {match.kda.kills} / <span className="text-red-300">{match.kda.deaths}</span> / {match.kda.assists}
          </div>
          <div className={`text-xs font-semibold ${kdaTone}`}>{match.kda.ratio.toFixed(2)} KDA</div>
        </div>

        <div className="text-sm text-slate-300 max-lg:col-span-3">
          <div>{match.cs.total} CS <span className="text-slate-500">({match.cs.perMin}/m)</span></div>
          <div>KP <span className="font-semibold text-slate-100">{match.killParticipation}%</span></div>
          <div>{match.vision} vision</div>
        </div>

        <div className="max-lg:col-span-3">
          <div className="flex flex-wrap gap-1">
            {match.items.map((id, i) => (
              <div key={`${id}-${i}`} className="h-7 w-7 overflow-hidden rounded-md bg-[#232840]">
                {id > 0 ? <img src={itemIcon(id)} alt="" className="h-full w-full" /> : null}
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {match.multikills.penta ? <SmallBadge tone="positive">Penta</SmallBadge> : null}
            {match.multikills.quadra ? <SmallBadge tone="positive">Quadra</SmallBadge> : null}
            {match.multikills.triple ? <SmallBadge tone="neutral">Triple</SmallBadge> : null}
            {match.killParticipation >= 60 ? <SmallBadge tone="positive">High KP</SmallBadge> : null}
            {match.kda.deaths >= 8 ? <SmallBadge tone="negative">Death Heavy</SmallBadge> : null}
          </div>
        </div>

        <div className="text-right text-xs font-semibold text-slate-500 max-lg:col-span-3 max-lg:text-left">
          {open ? "Collapse" : "Expand"}
        </div>
      </button>

      {open ? (
        <div className="border-t border-[#1f2335] p-4">
          <Scoreboard blue={match.teams.blue} red={match.teams.red} platform={platform} />
        </div>
      ) : null}
    </article>
  );
}
