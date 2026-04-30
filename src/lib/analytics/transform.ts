import type { RiotLeagueEntry, RiotMatch, RiotParticipant } from '@/lib/riot/types'
import type { MatchCardViewModel, ParticipantViewModel, RankInfo } from './types'

const QUEUE_NAMES: Record<number, string> = { 420: 'Ranked Solo/Duo', 440: 'Ranked Flex' }
export function queueIdToName(q: number) { return QUEUE_NAMES[q] || `Queue ${q}` }
export function isRankedQueue(q: number) { return q === 420 || q === 440 }

const sn = (v: unknown, f = 0) => typeof v === 'number' && Number.isFinite(v) ? v : f

export function toRankInfo(e: RiotLeagueEntry|null|undefined): RankInfo|null {
  if (!e) return null
  const games = e.wins + e.losses
  return { tier: e.tier, rank: e.rank, lp: e.leaguePoints,
    wins: e.wins, losses: e.losses,
    winrate: games > 0 ? Math.round(e.wins/games*100) : 0 }
}

function items(p: RiotParticipant): number[] {
  return [p.item0,p.item1,p.item2,p.item3,p.item4,p.item5,p.item6].map(x=>sn(x))
}

function toParticipantVM(p: RiotParticipant): ParticipantViewModel {
  return {
    puuid: p.puuid,
    gameName: p.riotIdGameName || p.summonerName || 'Unknown',
    tagLine: p.riotIdTagline || '',
    champion: p.championName,
    win: !!p.win, teamId: p.teamId,
    kills: sn(p.kills), deaths: sn(p.deaths), assists: sn(p.assists),
    cs: sn(p.totalMinionsKilled) + sn(p.neutralMinionsKilled),
    gold: sn(p.goldEarned), vision: sn(p.visionScore),
    damage: sn(p.totalDamageDealtToChampions),
    items: items(p),
    spells: [sn(p.summoner1Id), sn(p.summoner2Id)],
  }
}

export function toMatchCardViewModel(m: RiotMatch, viewerPuuid: string): MatchCardViewModel|null {
  const parts = m.info.participants || []
  const me = parts.find(p => p.puuid === viewerPuuid)
  if (!me) return null
  const dur = Math.max(1, sn(m.info.gameDuration, 1))
  const cs = sn(me.totalMinionsKilled) + sn(me.neutralMinionsKilled)
  const teamKills = parts.filter(p => p.teamId === me.teamId).reduce((s,p) => s+sn(p.kills), 0)
  const kp = teamKills > 0 ? Math.round((sn(me.kills)+sn(me.assists))/teamKills*100) : 0
  const d = sn(me.deaths)
  const ratio = d === 0 ? sn(me.kills)+sn(me.assists)
              : Number(((sn(me.kills)+sn(me.assists))/d).toFixed(2))
  return {
    matchId: m.metadata.matchId, queueId: m.info.queueId,
    queueName: queueIdToName(m.info.queueId),
    gameDuration: sn(m.info.gameDuration), gameStart: sn(m.info.gameStartTimestamp),
    win: !!me.win,
    champion: { name: me.championName, level: sn(me.champLevel) },
    kda: { kills: sn(me.kills), deaths: d, assists: sn(me.assists), ratio },
    cs: { total: cs, perMin: Number((cs/(dur/60)).toFixed(1)) },
    vision: sn(me.visionScore), killParticipation: kp,
    damage: sn(me.totalDamageDealtToChampions), gold: sn(me.goldEarned),
    items: items(me),
    spells: [sn(me.summoner1Id), sn(me.summoner2Id)],
    position: me.teamPosition || me.individualPosition || 'UNKNOWN',
    multikills: { triple: sn(me.tripleKills), quadra: sn(me.quadraKills), penta: sn(me.pentaKills) },
    teams: {
      blue: parts.filter(p => p.teamId === 100).map(toParticipantVM),
      red: parts.filter(p => p.teamId === 200).map(toParticipantVM),
    }
  }
}

export function rankedEntriesToRanks(entries: RiotLeagueEntry[]) {
  return {
    soloRank: toRankInfo(entries.find(e => e.queueType === 'RANKED_SOLO_5x5')),
    flexRank: toRankInfo(entries.find(e => e.queueType === 'RANKED_FLEX_SR')),
  }
}
