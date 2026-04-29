import { NextRequest, NextResponse } from "next/server";
import { getLeagueListByTier } from "@/lib/riot/client";
import { normalizePlatform } from "@/lib/riot/regions";

export const dynamic = "force-dynamic";

type Params = Promise<{ platform: string }> | { platform: string };

export async function GET(
  req: NextRequest,
  context: { params: Params },
) {
  const { platform: rawPlatform } = await Promise.resolve(context.params);
  const platform = normalizePlatform(rawPlatform);

  const sp = req.nextUrl.searchParams;
  const queue = (sp.get("queue") || "solo").toLowerCase() === "flex" ? "flex" : "solo";
  const tierRaw = (sp.get("tier") || "challenger").toLowerCase();
  const tier = tierRaw === "grandmaster" || tierRaw === "master" ? tierRaw : "challenger";

  const data = await getLeagueListByTier(platform, tier, queue);

  if (!data?.entries) {
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 502 });
  }

  const entries = data.entries
    .sort((a, b) => b.leaguePoints - a.leaguePoints || b.wins - a.wins)
    .slice(0, 300)
    .map((e, idx) => {
      const games = e.wins + e.losses;
      return {
        rank: idx + 1,
        puuid: e.puuid || "",
        summonerId: e.summonerId,
        leaguePoints: e.leaguePoints,
        wins: e.wins,
        losses: e.losses,
        winrate: games ? Math.round((e.wins / games) * 100) : 0,
        hotStreak: Boolean(e.hotStreak),
        freshBlood: Boolean(e.freshBlood),
        veteran: Boolean(e.veteran),
      };
    });

  return NextResponse.json({
    tier: tier.toUpperCase(),
    queue,
    platform,
    updatedAt: Date.now(),
    entries,
  });
}
