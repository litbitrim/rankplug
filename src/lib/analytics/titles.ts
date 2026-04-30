import type { MatchCardViewModel } from './types'

export type Title = { label: string; type: 'positive'|'warning'|'neutral'; reason: string }

export function deriveTitles(matches: MatchCardViewModel[]): Title[] {
  if (!matches.length) return []
  const t: Title[] = []
  const wins = matches.filter(m => m.win).length
  const wr = wins / matches.length
  const avgD = matches.reduce((s,m) => s+m.kda.deaths, 0) / matches.length
  const avgKda = matches.reduce((s,m) => s+m.kda.ratio, 0) / matches.length
  const avgKp = matches.reduce((s,m) => s+m.killParticipation, 0) / matches.length / 100
  const avgVision = matches.reduce((s,m) => s+m.vision, 0) / matches.length
  const champs = new Set(matches.map(m => m.champion.name)).size

  if (avgKda >= 3) t.push({ label:'Consistent Performer', type:'positive', reason:`${avgKda.toFixed(1)} avg KDA` })
  if (avgKp >= 0.65) t.push({ label:'Team Player', type:'positive', reason:`${Math.round(avgKp*100)}% avg KP` })
  if (wr >= 0.6) t.push({ label:'On Fire', type:'positive', reason:`${Math.round(wr*100)}% WR` })
  if (avgD >= 7) t.push({ label:'Death Heavy', type:'warning', reason:`${avgD.toFixed(1)} deaths/game` })
  if (wr < 0.45) t.push({ label:'Struggling', type:'warning', reason:`${Math.round(wr*100)}% WR` })
  if (avgVision < 15) t.push({ label:'Low Vision', type:'warning', reason:`${avgVision.toFixed(0)} vision avg` })
  if (champs >= 7 && matches.length >= 10) t.push({ label:'Wide Pool', type:'neutral', reason:`${champs} champs` })
  return t.slice(0,5)
}
