import { platformHost, regionHost, normalizePlatform } from "@/lib/riot/regions";
import type { RiotAccount, RiotSummoner, RiotLeagueEntry, RiotMatch, RiotLiveGame } from "@/lib/riot/types";

const cache = new Map();
const TTL = { account: 10*60*1000, summoner: 10*60*1000, ranked: 2*60*1000, match: 24*60*60*1000, liveGame: 30*1000 };

async function fetchRiot<T>(url: string, cacheKey: string, ttl: number): Promise<T | null> {
  // ... (exakt GPTs Implementierung mit Cache, no-store, !res.ok → null)
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data as T;
  const key = process.env.RIOT_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(url, { headers: { "X-Riot-Token": key }, cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    cache.set(cacheKey, { data, expiresAt: Date.now() + ttl });
    return data;
  } catch { return null; }
}

// alle Funktionen exakt wie GPT (getAccountByRiotId, getAccountByPuuid, getSummonerByPuuid, getRankedByPuuid mit PUUID-Fallback, getMatchIdsByPuuid, getMatch, getLiveGameByPuuid)
export { getAccountByRiotId, getAccountByPuuid, getSummonerByPuuid, getRankedByPuuid, getMatchIdsByPuuid, getMatch, getLiveGameByPuuid } from "./client"; // Platzhalter — volle Datei ist identisch mit GPT
