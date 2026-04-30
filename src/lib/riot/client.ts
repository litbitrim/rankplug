import { platformHost, regionHost, normalizePlatform } from './regions'
import type { RiotAccount, RiotSummoner, RiotLeagueEntry, RiotMatch, RiotLiveGame, RiotLeagueList } from './types'

const cache = new Map<string, { data: unknown; expiresAt: number }>()
const TTL = { account: 600_000, summoner: 600_000, ranked: 120_000, match: 86_400_000, liveGame: 30_000, leaderboard: 30_000 }

function getCache<T>(k: string): T|null {
  const h = cache.get(k); if (!h) return null
  if (h.expiresAt <= Date.now()) { cache.delete(k); return null }
  return h.data as T
}
function setCache<T>(k: string, d: T, ttl: number): T {
  cache.set(k, { data: d, expiresAt: Date.now()+ttl }); return d
}

async function rfetch<T>(url: string, key: string, ttl: number): Promise<T|null> {
  const c = getCache<T>(key); if (c) return c
  const apikey = process.env.RIOT_API_KEY
  if (!apikey) { console.error('Missing RIOT_API_KEY'); return null }
  try {
    const r = await fetch(url, { headers: { 'X-Riot-Token': apikey }, cache: 'no-store' })
    if (!r.ok) {
      if (r.status !== 404) console.warn(`Riot ${r.status}: ${url}`)
      return null
    }
    return setCache(key, await r.json() as T, ttl)
  } catch (e) { console.error('Riot fetch failed:', url, e); return null }
}

export async function getAccountByRiotId(name: string, tag: string, platform: string) {
  const p = normalizePlatform(platform), region = regionHost(p)
  return rfetch<RiotAccount>(
    `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
    `account:${p}:${name.toLowerCase()}#${tag.toLowerCase()}`, TTL.account)
}
export async function getAccountByPuuid(puuid: string, platform: string) {
  const p = normalizePlatform(platform), region = regionHost(p)
  return rfetch<RiotAccount>(
    `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`,
    `account-puuid:${p}:${puuid}`, TTL.account)
}
export async function getSummonerByPuuid(puuid: string, platform: string) {
  const p = normalizePlatform(platform), shard = platformHost(p)
  return rfetch<RiotSummoner>(
    `https://${shard}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
    `summoner:${p}:${puuid}`, TTL.summoner)
}
export async function getRankedByPuuid(puuid: string, platform: string): Promise<RiotLeagueEntry[]> {
  const p = normalizePlatform(platform), shard = platformHost(p)
  const ck = `ranked:${p}:${puuid}`
  const cached = getCache<RiotLeagueEntry[]>(ck); if (cached) return cached
  const byPuuid = await rfetch<RiotLeagueEntry[]>(
    `https://${shard}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
    `${ck}:by-puuid`, TTL.ranked)
  if (Array.isArray(byPuuid)) return setCache(ck, byPuuid, TTL.ranked)
  const summ = await getSummonerByPuuid(puuid, p)
  if (!summ?.id) return setCache(ck, [], TTL.ranked)
  const bySumm = await rfetch<RiotLeagueEntry[]>(
    `https://${shard}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summ.id}`,
    `${ck}:by-summoner`, TTL.ranked)
  return setCache(ck, Array.isArray(bySumm) ? bySumm : [], TTL.ranked)
}
export async function getMatchIdsByPuuid(puuid: string, platform: string,
  opts: { count?: number; start?: number; queue?: number } = {}): Promise<string[]> {
  const p = normalizePlatform(platform), region = regionHost(p)
  const count = Math.min(Math.max(opts.count ?? 20, 1), 100)
  const start = Math.max(opts.start ?? 0, 0)
  const qPart = opts.queue ? `&queue=${opts.queue}` : ''
  const r = await rfetch<string[]>(
    `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}${qPart}`,
    `match-ids:${p}:${puuid}:${start}:${count}:${opts.queue||'all'}`, 60_000)
  return Array.isArray(r) ? r : []
}
export async function getMatch(id: string, platform: string) {
  const p = normalizePlatform(platform), region = regionHost(p)
  return rfetch<RiotMatch>(
    `https://${region}.api.riotgames.com/lol/match/v5/matches/${id}`,
    `match:${p}:${id}`, TTL.match)
}
export async function getLiveGameByPuuid(puuid: string, platform: string) {
  const p = normalizePlatform(platform), shard = platformHost(p)
  return rfetch<RiotLiveGame>(
    `https://${shard}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,
    `live:${p}:${puuid}`, TTL.liveGame)
}
export async function getLeaderboard(platform: string, tier: 'challenger'|'grandmaster'|'master', queue: 'solo'|'flex') {
  const p = normalizePlatform(platform), shard = platformHost(p)
  const qType = queue === 'flex' ? 'RANKED_FLEX_SR' : 'RANKED_SOLO_5x5'
  const endpoint = tier === 'challenger' ? 'challengerleagues'
                 : tier === 'grandmaster' ? 'grandmasterleagues' : 'masterleagues'
  return rfetch<RiotLeagueList>(
    `https://${shard}.api.riotgames.com/lol/league/v4/${endpoint}/by-queue/${qType}`,
    `lb:${p}:${tier}:${queue}`, TTL.leaderboard)
}
