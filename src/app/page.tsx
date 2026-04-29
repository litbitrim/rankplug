"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LbEntry = {
  rank: number;
  summonerId: string;
  puuid: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  winrate: number;
};

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("stacksmaxxing#69420");
  const [platform, setPlatform] = useState("euw");
  const [leaders, setLeaders] = useState<LbEntry[]>([]);

  function search() {
    const [name, tag] = input.split("#");
    if (!name || !tag) return;
    router.push(`/profile/${platform}/${encodeURIComponent(name.trim())}/${encodeURIComponent(tag.trim())}`);
  }

  useEffect(() => {
    fetch("/api/leaderboard/euw?queue=solo&tier=challenger")
      .then((r) => r.json())
      .then((d) => setLeaders((d.entries || []).slice(0, 10)))
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0b0f] text-slate-100">
      <section className="mx-auto flex min-h-[70vh] max-w-6xl flex-col items-center justify-center px-5 py-20 text-center">
        <div className="mb-4 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-1 text-xs font-black uppercase tracking-[0.18em] text-sky-300">
          RankPlug Alpha
        </div>
        <h1 className="text-6xl font-black tracking-tight max-md:text-4xl">
          Multi-account ranked tracker.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          League first. Built to become the ranked control center for mains, smurfs, streamers and pro watchlists.
        </p>

        <div className="mt-10 flex w-full max-w-2xl gap-2 rounded-2xl border border-[#1f2335] bg-[#11131a] p-2 max-sm:flex-col">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-xl bg-[#0d0f14] px-4 py-3 text-sm font-bold outline-none"
          >
            {["euw", "na", "kr", "eune", "br", "jp", "lan", "las", "oce", "tr", "ru"].map((p) => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="GameName#TAG"
            className="min-w-0 flex-1 rounded-xl bg-[#0d0f14] px-4 py-3 text-sm outline-none"
          />
          <button onClick={search} className="rounded-xl bg-sky-500 px-6 py-3 text-sm font-black text-white hover:bg-sky-400">
            Search
          </button>
        </div>

        <div className="mt-4 flex gap-3 text-sm">
          <button onClick={() => router.push("/leaderboard/euw")} className="text-sky-300 hover:text-sky-200">Open EUW Leaderboard →</button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="overflow-hidden rounded-3xl border border-[#1f2335] bg-[#11131a]">
          <div className="border-b border-[#1f2335] px-5 py-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Live Preview</div>
            <h2 className="mt-1 text-xl font-black">EUW Challenger Solo/Duo Top 10</h2>
          </div>
          <div className="divide-y divide-[#1f2335]">
            {leaders.length ? leaders.map((e) => (
              <div key={e.summonerId} className="grid grid-cols-[80px_1fr_100px_100px] items-center px-5 py-3 text-sm">
                <div className="font-mono font-bold text-slate-400">#{e.rank}</div>
                <div className="font-semibold text-slate-300">Leaderboard Player</div>
                <div className="text-right font-bold text-amber-300">{e.leaguePoints} LP</div>
                <div className="text-right font-bold">{e.winrate}% WR</div>
              </div>
            )) : (
              <div className="p-6 text-center text-sm text-slate-500">Loading preview...</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
