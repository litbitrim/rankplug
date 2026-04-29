"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { profileIcon } from "@/lib/ddragon";

type Entry = {
  rank: number;
  puuid: string;
  summonerId: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  winrate: number;
  hotStreak: boolean;
  freshBlood: boolean;
  veteran: boolean;
};

type Lookup = {
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIconId: number;
};

type Data = {
  tier: string;
  queue: string;
  platform: string;
  updatedAt: number;
  entries: Entry[];
};

export function LeaderboardClient() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const platform = String(params.platform || "euw");
  const queue = searchParams.get("queue") || "solo";
  const tier = searchParams.get("tier") || "challenger";

  const [data, setData] = useState<Data | null>(null);
  const [lookup, setLookup] = useState<Record<string, Lookup>>({});
  const [loadingRows, setLoadingRows] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(50);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/leaderboard/${platform}?queue=${queue}&tier=${tier}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed to load leaderboard");
      setData(json);
      setCountdown(30);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [platform, queue, tier]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((v) => Math.max(0, v - 1));
    }, 1000);

    const refresh = setInterval(() => {
      if (document.visibilityState !== "hidden") loadLeaderboard();
    }, 30000);

    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, [loadLeaderboard]);

  const keyFor = (e: Entry) => e.puuid || e.summonerId;

  const loadLookup = useCallback(async (entry: Entry) => {
    const key = keyFor(entry);
    if (!key || lookup[key] || loadingRows[key]) return;

    setLoadingRows((m) => ({ ...m, [key]: true }));

    try {
      const q = entry.puuid
        ? `puuid=${encodeURIComponent(entry.puuid)}`
        : `summonerId=${encodeURIComponent(entry.summonerId)}`;

      const res = await fetch(`/api/leaderboard/${platform}/lookup?${q}`);
      const json = await res.json();
      if (res.ok) {
        setLookup((m) => ({ ...m, [key]: json }));
      }
    } finally {
      setLoadingRows((m) => ({ ...m, [key]: false }));
    }
  }, [lookup, loadingRows, platform]);

  const filtered = useMemo(() => {
    const rows = data?.entries || [];
    if (!search.trim()) return rows;
    const s = search.toLowerCase();

    return rows.filter((e) => {
      const l = lookup[keyFor(e)];
      return l?.gameName?.toLowerCase().includes(s) || String(e.rank).includes(s);
    });
  }, [data?.entries, lookup, search]);

  const displayed = filtered.slice(0, visibleCount);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const idx = Number((entry.target as HTMLElement).dataset.index);
        const row = displayed[idx];
        if (row) loadLookup(row);
      }
    }, { rootMargin: "200px" });

    const rows = document.querySelectorAll("[data-lb-row='true']");
    rows.forEach((r) => observerRef.current?.observe(r));

    return () => observerRef.current?.disconnect();
  }, [displayed, loadLookup]);

  function setQuery(next: { queue?: string; tier?: string; platform?: string }) {
    const q = next.queue || queue;
    const t = next.tier || tier;
    const p = next.platform || platform;
    router.push(`/leaderboard/${p}?queue=${q}&tier=${t}`);
  }

  return (
    <main className="min-h-screen bg-[#0a0b0f] p-5 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button onClick={() => router.push("/")} className="mb-2 text-sm font-bold text-sky-300">← RankPlug</button>
            <h1 className="text-4xl font-black tracking-tight">Leaderboards</h1>
            <p className="text-sm text-slate-500">Ranked ladder · auto-refresh every 30s</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={platform}
              onChange={(e) => setQuery({ platform: e.target.value })}
              className="rounded-xl border border-[#1f2335] bg-[#11131a] px-3 py-2 text-sm"
            >
              {["euw", "na", "kr", "eune", "br", "jp", "lan", "las", "oce", "tr", "ru"].map((p) => (
                <option key={p} value={p}>{p.toUpperCase()}</option>
              ))}
            </select>

            <div className="rounded-xl bg-[#11131a] p-1">
              {["solo", "flex"].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuery({ queue: q })}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${queue === q ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {q === "solo" ? "Solo/Duo" : "Flex"}
                </button>
              ))}
            </div>

            <button onClick={loadLeaderboard} className="rounded-xl bg-[#1f2335] px-4 py-2 text-sm font-bold hover:bg-[#2a2f3f]">
              Refresh ({countdown}s)
            </button>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-xl bg-[#11131a] p-1">
            {["challenger", "grandmaster", "master"].map((t) => (
              <button
                key={t}
                onClick={() => setQuery({ tier: t })}
                className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${tier === t ? "bg-[#1f2335] text-white" : "text-slate-400 hover:text-white"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter visible players..."
            className="w-full max-w-xs rounded-xl border border-[#1f2335] bg-[#11131a] px-4 py-2 text-sm outline-none focus:border-sky-500"
          />
        </div>

        {error ? <div className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">{error}</div> : null}
        {loading && !data ? <div className="rounded-2xl border border-[#1f2335] bg-[#11131a] p-10 text-center text-slate-400">Loading leaderboard...</div> : null}

        {data ? (
          <div className="overflow-hidden rounded-3xl border border-[#1f2335] bg-[#11131a]">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-[#1f2335] bg-[#0d0f14] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Rank</th>
                  <th className="px-4 py-3 text-left">Player</th>
                  <th className="px-4 py-3 text-right">LP</th>
                  <th className="px-4 py-3 text-right">W/L</th>
                  <th className="px-4 py-3 text-right">WR</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((e, idx) => {
                  const l = lookup[keyFor(e)];
                  const canNav = l?.gameName && l.gameName !== "Unknown" && l.tagLine;

                  return (
                    <tr
                      key={keyFor(e)}
                      data-lb-row="true"
                      data-index={idx}
                      onClick={() => {
                        if (canNav) router.push(`/profile/${platform}/${encodeURIComponent(l.gameName)}/${encodeURIComponent(l.tagLine)}`);
                      }}
                      className="cursor-pointer border-b border-[#1f2335] hover:bg-[#171a24]"
                    >
                      <td className="px-4 py-3 font-mono text-lg font-bold">
                        {e.rank <= 3 ? ["🥇", "🥈", "🥉"][e.rank - 1] : `#${e.rank}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={profileIcon(l?.profileIconId || 0)} alt="" className="h-9 w-9 rounded-lg bg-[#232840]" />
                          <div>
                            <div className="font-bold">
                              {l ? (
                                <>
                                  {l.gameName}<span className="text-slate-500">{l.tagLine ? `#${l.tagLine}` : ""}</span>
                                </>
                              ) : (
                                <span className="text-slate-500">Loading player...</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{platform.toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-amber-300">{e.leaguePoints} LP</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-emerald-300">{e.wins}</span>
                        <span className="mx-1 text-slate-600">/</span>
                        <span className="text-red-300">{e.losses}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold">{e.winrate}%</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          {e.hotStreak ? <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] font-bold text-emerald-300">Hot</span> : null}
                          {e.freshBlood ? <span className="rounded-full bg-sky-400/15 px-2 py-1 text-[11px] font-bold text-sky-300">Fresh</span> : null}
                          {e.veteran ? <span className="rounded-full bg-purple-400/15 px-2 py-1 text-[11px] font-bold text-purple-300">Vet</span> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {visibleCount < filtered.length ? (
              <div className="p-4 text-center">
                <button onClick={() => setVisibleCount((v) => v + 50)} className="rounded-xl bg-[#1f2335] px-5 py-2 text-sm font-bold hover:bg-[#2a2f3f]">
                  Load more
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
