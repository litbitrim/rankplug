import { championIcon } from "@/lib/ddragon";
import type { ChampionStat } from "@/lib/analytics/champion";

export function ChampionTable({ stats }: { stats: ChampionStat[] }) {
  if (!stats.length) {
    return (
      <div className="rounded-2xl border border-[#1f2335] bg-[#11131a] p-8 text-center text-sm text-slate-400">
        No ranked champion stats loaded yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1f2335] bg-[#11131a]">
      <div className="border-b border-[#1f2335] px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        Champion Stats ({stats.reduce((s, c) => s + c.games, 0)} Ranked Games)
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-[#0d0f14] text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Champion</th>
              <th className="px-4 py-3 text-right">Games</th>
              <th className="px-4 py-3 text-right">WR</th>
              <th className="px-4 py-3 text-right">KDA</th>
              <th className="px-4 py-3 text-right">CS/min</th>
              <th className="px-4 py-3 text-right">DMG/min</th>
              <th className="px-4 py-3 text-right">KP</th>
              <th className="px-4 py-3 text-right">Vision</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((c) => (
              <tr key={c.champion} className="border-t border-[#1f2335] hover:bg-[#171a24]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={championIcon(c.champion)} alt="" className="h-9 w-9 rounded-lg" />
                    <span className="font-semibold">{c.champion}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{c.games}</td>
                <td className={`px-4 py-3 text-right font-bold ${c.winrate >= 55 ? "text-emerald-300" : c.winrate >= 50 ? "text-amber-300" : "text-red-300"}`}>
                  {c.winrate}%
                </td>
                <td className="px-4 py-3 text-right">{c.avgKda}</td>
                <td className="px-4 py-3 text-right">{c.avgCsPerMin}</td>
                <td className="px-4 py-3 text-right">{c.avgDamagePerMin}</td>
                <td className="px-4 py-3 text-right">{c.avgKillParticipation}%</td>
                <td className="px-4 py-3 text-right">{c.avgVision}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
