import { NextRequest, NextResponse } from "next/server";
import {
  getAccountByRiotId,
  getSummonerByPuuid,
  getRankedByPuuid,
  getMatchIdsByPuuid,
  getMatch,
  getLiveGameByPuuid,
} from "@/lib/riot/client";
import { normalizePlatform } from "@/lib/riot/regions";
import { rankedEntriesToRanks, toMatchCardViewModel } from "@/lib/analytics/transform";
import type { MatchCardViewModel, ProfileViewModel } from "@/lib/analytics/types";

export const dynamic = "force-dynamic";

async function fetchMatchCards(ids: string[], platform: string, puuid: string): Promise<MatchCardViewModel[]> {
  const rows = await Promise.all(ids.map(async (id) => {
    const m = await getMatch(id, platform);
    return m ? toMatchCardViewModel(m, puuid) : null;
  }));

  return rows
    .filter(Boolean)
    .sort((a, b) => (b!.gameStart || 0) - (a!.gameStart || 0)) as MatchCardViewModel[];
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const name = sp.get("name");
  const tag = sp.get("tag");
  const platform = normalizePlatform(sp.get("platform"));

  if (!name || !tag) {
    return NextResponse.json({ error: "Missing required params: name, tag" }, { status: 400 });
  }

  const account = await getAccountByRiotId(name, tag, platform);
  if (!account?.puuid) {
    return NextResponse.json({ error: "Summoner not found" }, { status: 404 });
  }

  const [summoner, ranked, liveGame, soloIds, flexIds] = await Promise.all([
    getSummonerByPuuid(account.puuid, platform),
    getRankedByPuuid(account.puuid, platform),
    getLiveGameByPuuid(account.puuid, platform),
    getMatchIdsByPuuid(account.puuid, platform, { count: 20, start: 0, queue: 420 }),
    getMatchIdsByPuuid(account.puuid, platform, { count: 20, start: 0, queue: 440 }),
  ]);

  const ids = Array.from(new Set([...soloIds, ...flexIds])).slice(0, 30);
  const recentMatches = await fetchMatchCards(ids, platform, account.puuid);
  const { soloRank, flexRank } = rankedEntriesToRanks(ranked);

  const vm: ProfileViewModel = {
    account: {
      gameName: account.gameName,
      tagLine: account.tagLine,
      puuid: account.puuid,
    },
    summoner: {
      profileIconId: summoner?.profileIconId ?? 0,
      summonerLevel: summoner?.summonerLevel ?? 0,
    },
    soloRank,
    flexRank,
    liveGame: { active: Boolean(liveGame) },
    recentMatches,
    puuid: account.puuid,
    platform,
  };

  return NextResponse.json(vm);
}
