"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { profileIcon } from "@/lib/ddragon";
import { aggregateChampionStats } from "@/lib/analytics/champion";
import { derivePlayerTags } from "@/lib/analytics/titles";
import type { MatchCardViewModel, ProfileViewModel, StatsChunkViewModel } from "@/lib/analytics/types";
import { StatCard } from "@/components/ui/StatCard";
import { Ring } from "@/components/ui/Ring";
import { BehaviorTags } from "@/components/profile/BehaviorTags";
import { ChampionTable } from "@/components/profile/ChampionTable";
import { MatchCard } from "@/components/profile/MatchCard";

type Tab = "overview" | "champions" | "matches" | "live";

function lastResults(matches: MatchCardViewModel[], count: number) {
  return matches.slice(0, count).map((m) => m.win);
}

function RankBlock({ title, rank }: { title: string; rank: ProfileViewModel["soloRank"] }) {
  return (
    <StatCard title={title}>
      {rank ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-black text-amber-300">{rank.tier} {rank.rank}</div>
            <div className="text-sm text-slate-400">{rank.lp} LP</div>
            <div className="mt-1 text-sm">
              <span className="text-emerald-300">{rank.wins}W</span>
              <span className="mx-1 text-slate-600">/</span>
              <span className="text-red-300">{rank.losses}L</span>
            </div>
          </div>
          <Ring value={rank.winrate} />
        </div>
      ) : (
        <div className="text-sm text-slate-400">Unranked</div>
      )}
    </StatCard>
  );
}

export function ProfileClient({
  platform,
  name,
  tag,
}: {
  platform: string;
  name: string;
  tag: string;
}) {
  const [data, setData] = useState<ProfileViewModel | null>(null);
  const [extraMatches, setExtraMatches] = useState<MatchCardViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/summoner?name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}&platform=${platform}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed to load profile");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    if (!data?.puuid || statsLoading) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/stats?puuid=${encodeURIComponent(data.puuid)}&platform=${platform}&start=0`);
      const json = await res.json() as StatsChunkViewModel;
      if (Array.isArray(json.matches)) setExtraMatches(json.matches);
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [platform, name, tag]);

  useEffect(() => {
    if (data?.puuid) loadStats();
  }, [data?.puuid]);

  const allMatches = useMemo(() => {
    const map = new Map<string, MatchCardViewModel>();
    [...extraMatches, ...(data?.recentMatches || [])].forEach((m) => map.set(m.matchId, m));
    return [...map.values()].sort((a, b) => b.gameStart - a.gameStart);
  }, [data?.recentMatches, extraMatches]);

  const champStats = useMemo(() => aggregateChampionStats(allMatches), [allMatches]);
  const tags = useMemo(() => derivePlayerTags(allMatches), [allMatches]);

  if (loading) {
    return <main className="min-h-screen bg-[#0a0b0f] p-6 text-slate-200"><div className="mx-auto max-w-7xl">Loading profile...</div></main>;
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#0a0b0f] p-6 text-slate-200">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="text-sm font-semibold text-sky-300">← RankPlug</Link>
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-6 text-red-200">{error || "Profile not found"}</div>
        </div>
      </main>
    );
  }

  const last5 = lastResults(allMatches, 5);
  const last20 = lastResults(allMatches, 20);
  const last20Wr = last20.length ? Math.round((last20.filter(Boolean).length / last20.length) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#0a0b0f] text-slate-100">
      <header className="border-b border-[#1f2335] bg-[#0d0f14]/95 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="text-sm font-black tracking-wide text-sky-300">RankPlug</Link>
          <Link href="/leaderboard/euw" className="text-sm text-slate-400 hover:text-slate-100">Leaderboards</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-5">
        <section className="mb-4 rounded-3xl border border-[#1f2335] bg-[#11131a] p-5">
          <div className="flex flex-wrap items-center gap-5">
            <div className="relative">
              <img src={profileIcon(data.summoner.profileIconId)} alt="" className="h-20 w-20 rounded-2xl bg-[#232840]" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-lg border border-[#1f2335] bg-[#0d0f14] px-2 py-0.5 text-[11px] font-bold text-slate-300">
                {data.summoner.summonerLevel}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-3xl font-black tracking-tight">
                {data.account.gameName}<span className="text-slate-500">#{data.account.tagLine}</span>
              </h1>
              <div className="mt-1 text-sm font-semibold uppercase text-slate-500">{platform} · Ranked only</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {last5.map((w, i) => (
                  <span key={i} className={`rounded px-2 py-1 text-xs font-black ${w ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"}`}>
                    {w ? "W" : "L"}
                  </span>
                ))}
                <span className="rounded bg-[#232840] px-2 py-1 text-xs font-bold text-slate-300">Last 20 WR: {last20Wr}%</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={loadProfile} className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white hover:bg-sky-400">Update</button>
              <button onClick={() => setTab("live")} className={`rounded-xl px-4 py-2 text-sm font-bold ${data.liveGame?.active ? "bg-emerald-400 text-black" : "bg-[#232840] text-slate-200"}`}>
                {data.liveGame?.active ? "Live Now" : "Live Game"}
              </button>
            </div>
          </div>
        </section>

        <nav className="mb-4 flex flex-wrap gap-2">
          {[
            ["overview", "Overview"],
            ["champions", `Champion Stats (${champStats.length})`],
            ["matches", `Match History (${allMatches.length})`],
            ["live", "Live Game"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id as Tab)}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === id ? "bg-sky-500 text-white" : "bg-[#11131a] text-slate-400 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "overview" ? (
          <div className="grid grid-cols-[330px_1fr] gap-4 max-lg:grid-cols-1">
            <aside className="space-y-4">
              <RankBlock title="Ranked Solo/Duo" rank={data.soloRank} />
              <RankBlock title="Ranked Flex" rank={data.flexRank} />
              <BehaviorTags tags={tags} />
            </aside>
            <section className="space-y-3">
              <ChampionTable stats={champStats.slice(0, 8)} />
              <div className="rounded-2xl border border-[#1f2335] bg-[#11131a] p-4">
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Recent Ranked</div>
                <div className="space-y-3">
                  {allMatches.slice(0, 5).map((m) => <MatchCard key={m.matchId} match={m} platform={platform} />)}
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {tab === "champions" ? <ChampionTable stats={champStats} /> : null}

        {tab === "matches" ? (
          <section className="space-y-3">
            {allMatches.map((m) => <MatchCard key={m.matchId} match={m} platform={platform} />)}
          </section>
        ) : null}

        {tab === "live" ? (
          <section className="rounded-2xl border border-[#1f2335] bg-[#11131a] p-8 text-center">
            <div className={`text-2xl font-black ${data.liveGame?.active ? "text-emerald-300" : "text-slate-300"}`}>
              {data.liveGame?.active ? "Player is currently in game" : "Player is not currently in game"}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Full live-game scouting comes after dashboard/auth foundation.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
