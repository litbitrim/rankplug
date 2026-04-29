import type { MatchCardViewModel } from "@/lib/analytics/types";

export type ChampionStat = {
  champion: string;
  games: number;
  wins: number;
  losses: number;
  winrate: number;
  avgKda: number;
  avgCsPerMin: number;
  avgDamagePerMin: number;
  avgVision: number;
  avgKillParticipation: number;
  lastPlayed: number;
};

export function aggregateChampionStats(matches: MatchCardViewModel[]): ChampionStat[] {
  const map = new Map<string, {
    games: number;
    wins: number;
    kills: number;
    deaths: number;
    assists: number;
    csPerMin: number;
    damagePerMin: number;
    vision: number;
    kp: number;
    lastPlayed: number;
  }>();

  for (const m of matches) {
    const key = m.champion.name;
    const row = map.get(key) || {
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      csPerMin: 0,
      damagePerMin: 0,
      vision: 0,
      kp: 0,
      lastPlayed: 0,
    };

    const minutes = Math.max(1, m.gameDuration / 60);
    row.games += 1;
    row.wins += m.win ? 1 : 0;
    row.kills += m.kda.kills;
    row.deaths += m.kda.deaths;
    row.assists += m.kda.assists;
    row.csPerMin += m.cs.perMin;
    row.damagePerMin += m.damage / minutes;
    row.vision += m.vision;
    row.kp += m.killParticipation;
    row.lastPlayed = Math.max(row.lastPlayed, m.gameStart);

    map.set(key, row);
  }

  return [...map.entries()]
    .map(([champion, s]) => ({
      champion,
      games: s.games,
      wins: s.wins,
      losses: s.games - s.wins,
      winrate: Math.round((s.wins / s.games) * 100),
      avgKda: s.deaths === 0 ? s.kills + s.assists : Number(((s.kills + s.assists) / s.deaths).toFixed(2)),
      avgCsPerMin: Number((s.csPerMin / s.games).toFixed(1)),
      avgDamagePerMin: Math.round(s.damagePerMin / s.games),
      avgVision: Number((s.vision / s.games).toFixed(1)),
      avgKillParticipation: Math.round(s.kp / s.games),
      lastPlayed: s.lastPlayed,
    }))
    .sort((a, b) => b.games - a.games || b.winrate - a.winrate);
}
