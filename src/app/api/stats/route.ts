import { NextRequest, NextResponse } from "next/server";
import { getMatchIdsByPuuid, getMatch } from "@/lib/riot/client";
import { normalizePlatform } from "@/lib/riot/regions";
import { toMatchCardViewModel } from "@/lib/analytics/transform";
import type { MatchCardViewModel, StatsChunkViewModel } from "@/lib/analytics/types";

export const dynamic = "force-dynamic";

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      out[i] = await fn(items[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const puuid = sp.get("puuid");
  const platform = normalizePlatform(sp.get("platform"));
  const start = Math.max(Number(sp.get("start") || "0") || 0, 0);

  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid" }, { status: 400 });
  }

  const [soloIds, flexIds] = await Promise.all([
    getMatchIdsByPuuid(puuid, platform, { count: 50, start, queue: 420 }),
    getMatchIdsByPuuid(puuid, platform, { count: 50, start, queue: 440 }),
  ]);

  const ids = Array.from(new Set([...soloIds, ...flexIds]));
  const matches = await mapLimit(ids, 8, async (id) => {
    const m = await getMatch(id, platform);
    return m ? toMatchCardViewModel(m, puuid) : null;
  });

  const clean = (matches.filter(Boolean) as MatchCardViewModel[])
    .sort((a, b) => b.gameStart - a.gameStart);

  const vm: StatsChunkViewModel = {
    matches: clean,
    done: soloIds.length < 50 && flexIds.length < 50,
    nextStart: start + 50,
    fetched: clean.length,
  };

  return NextResponse.json(vm);
}
