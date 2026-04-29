import { normalizePlatform, platformHost, regionHost } from "@/lib/riot/regions";
import type {
  RiotAccount,
  RiotSummoner,
  RiotLeagueEntry,
  RiotMatch,
  RiotLiveGame,
  RiotLeagueList,
} from "@/lib/riot/types";

type CacheEntry<T> = { data: T; expiresAt: number };
const cache = new Map<string, CacheEntry<unknown>>();

const TTL = {
  account: 10 * 60 * 1000,
  summoner: 10 * 60 * 1000,
  ranked: 2 * 60 * 1000,
  matchIds: 60 * 1000,
  match: 24 * 60 * 60 * 1000,
  live: 30 * 1000,
  leaderboard: 30 * 1000,
};

function getCache<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.data as T;
}

function setCache<T>(key: string, data: T, ttl: number): T {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
  return data;
}

async function fetchRiot<T>(url: string, cacheKey: string, ttl: number): Promise<T | null> {
  const cached = getCache<T>(cacheKey);
  if (cached) return cached;

  const key = process.env.RIOT_API_KEY;
  if (!key) {
    console.error("Missing RIOT_API_KEY");
    return null;
  }

  try {
    const res = await fetch(url, {
      headers: { "X-Riot-Token": key },
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status !== 404) {
        const text = await res.text().catch(() => "");
        console.warn(`Riot API ${res.status}: ${url}`, text.slice(0, 300));
      }
      return null;
    }

    const data = await res.json() as T;
    return setCache(cacheKey, data, ttl);
  } catch (err) {
    console.error("Riot fetch failed:", url, err);
    return null;
  }
}

export async function getAccountByRiotId(name: string, tag: string, platform: string): Promise<RiotAccount | null> {
  const p = normalizePlatform(platform);
  const region = regionHost(p);
  const key = `account:${p}:${name.toLowerCase()}#${tag.toLowerCase()}`;
  const url = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
  return fetchRiot<RiotAccount>(url, key, TTL.account);
}

export async function getAccountByPuuid(puuid: string, platform: string): Promise<RiotAccount | null> {
  const p = normalizePlatform(platform);
  const region = regionHost(p);
  const key = `account-puuid:${p}:${puuid}`;
  const url = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`;
  return fetchRiot<RiotAccount>(url, key, TTL.account);
}

export async function getSummonerByPuuid(puuid: string, platform: string): Promise<RiotSummoner | null> {
  const p = normalizePlatform(platform);
  const shard = platformHost(p);
  const key = `summoner-puuid:${p}:${puuid}`;
  const url = `https://${shard}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
  return fetchRiot<RiotSummoner>(url, key, TTL.summoner);
}

export async function getSummonerBySummonerId(summonerId: string, platform: string): Promise<RiotSummoner | null> {
  const p = normalizePlatform(platform);
  const shard = platformHost(p);
  const key = `summoner-id:${p}:${summonerId}`;
  const url = `https://${shard}.api.riotgames.com/lol/summoner/v4/summoners/${encodeURIComponent(summonerId)}`;
  return fetchRiot<RiotSummoner>(url, key, TTL.summoner);
}

export async function getRankedByPuuid(puuid: string, platform: string): Promise<RiotLeagueEntry[]> {
  const p = normalizePlatform(platform);
  const shard = platformHost(p);
  const key = `ranked:${p}:${puuid}`;

  const cached = getCache<RiotLeagueEntry[]>(key);
  if (cached) return cached;

  const byPuuidUrl = `https://${shard}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`;
  const byPuuid = await fetchRiot<RiotLeagueEntry[]>(byPuuidUrl, `${key}:puuid`, TTL.ranked);

  if (Array.isArray(byPuuid)) return setCache(key, byPuuid, TTL.ranked);

  const summoner = await getSummonerByPuuid(puuid, p);
  if (!summoner?.id) return setCache(key, [], TTL.ranked);

  const bySummonerUrl = `https://${shard}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encodeURIComponent(summoner.id)}`;
  const bySummoner = await fetchRiot<RiotLeagueEntry[]>(bySummonerUrl, `${key}:summoner`, TTL.ranked);

  return setCache(key, Array.isArray(bySummoner) ? bySummoner : [], TTL.ranked);
}

export async function getMatchIdsByPuuid(
  puuid: string,
  platform: string,
  opts: { count?: number; start?: number; queue?: number } = {},
): Promise<string[]> {
  const p = normalizePlatform(platform);
  const region = regionHost(p);
  const count = Math.min(Math.max(opts.count ?? 20, 1), 100);
  const start = Math.max(opts.start ?? 0, 0);
  const queue = opts.queue ? `&queue=${opts.queue}` : "";
  const key = `matchids:${p}:${puuid}:${start}:${count}:${opts.queue || "all"}`;
  const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=${start}&count=${count}${queue}`;
  const data = await fetchRiot<string[]>(url, key, TTL.matchIds);
  return Array.isArray(data) ? data : [];
}

export async function getMatch(matchId: string, platform: string): Promise<RiotMatch | null> {
  const p = normalizePlatform(platform);
  const region = regionHost(p);
  const key = `match:${p}:${matchId}`;
  const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`;
  return fetchRiot<RiotMatch>(url, key, TTL.match);
}

export async function getLiveGameByPuuid(puuid: string, platform: string): Promise<RiotLiveGame | null> {
  const p = normalizePlatform(platform);
  const shard = platformHost(p);
  const key = `live:${p}:${puuid}`;
  const url = `https://${shard}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(puuid)}`;
  return fetchRiot<RiotLiveGame>(url, key, TTL.live);
}

export async function getLeagueListByTier(
  platform: string,
  tier: "challenger" | "grandmaster" | "master",
  queue: "solo" | "flex",
): Promise<RiotLeagueList | null> {
  const p = normalizePlatform(platform);
  const shard = platformHost(p);
  const queueType = queue === "flex" ? "RANKED_FLEX_SR" : "RANKED_SOLO_5x5";

  const endpoint =
    tier === "grandmaster" ? "grandmasterleagues"
      : tier === "master" ? "masterleagues"
      : "challengerleagues";

  const key = `leaderboard:${p}:${tier}:${queue}`;
  const url = `https://${shard}.api.riotgames.com/lol/league/v4/${endpoint}/by-queue/${queueType}`;

  return fetchRiot<RiotLeagueList>(url, key, TTL.leaderboard);
}
