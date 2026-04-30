import type { MatchCardViewModel } from './types'

export type ChampionStat = {
  name: string; games: number; wins: number; wr: number
  kills: number; deaths: number; assists: number
  kda: number; kdaStr: string
  avgK: number; avgD: number; avgA: number
  avgCs: number; avgDmg: number; avgGold: number; avgVision: number
  maxKills: number; maxDeaths: number
}

export function aggregateChampionStats(matches: MatchCardViewModel[]): ChampionStat[] {
  const acc: Record<string, any> = {}
  for (const m of matches) {
    const c = m.champion.name
    if (!acc[c]) acc[c] = { wins:0, games:0, kills:0, deaths:0, assists:0, cs:0, dmg:0, gold:0, vision:0, maxK:0, maxD:0 }
    const a = acc[c]
    a.games++; if (m.win) a.wins++
    a.kills += m.kda.kills; a.deaths += m.kda.deaths; a.assists += m.kda.assists
    a.cs += m.cs.total; a.dmg += m.damage; a.gold += m.gold; a.vision += m.vision
    a.maxK = Math.max(a.maxK, m.kda.kills); a.maxD = Math.max(a.maxD, m.kda.deaths)
  }
  return Object.entries(acc).map(([name, s]: any) => ({
    name, games: s.games, wins: s.wins,
    wr: Math.round(s.wins/s.games*100),
    kills: s.kills, deaths: s.deaths, assists: s.assists,
    kda: s.deaths === 0 ? 999 : Number(((s.kills+s.assists)/s.deaths).toFixed(2)),
    kdaStr: s.deaths === 0 ? '∞' : ((s.kills+s.assists)/s.deaths).toFixed(2),
    avgK: Number((s.kills/s.games).toFixed(1)),
    avgD: Number((s.deaths/s.games).toFixed(1)),
    avgA: Number((s.assists/s.games).toFixed(1)),
    avgCs: Math.round(s.cs/s.games),
    avgDmg: Math.round(s.dmg/s.games),
    avgGold: Math.round(s.gold/s.games),
    avgVision: Math.round(s.vision/s.games),
    maxKills: s.maxK, maxDeaths: s.maxD,
  }))
}
