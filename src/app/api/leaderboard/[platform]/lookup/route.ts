import { NextRequest, NextResponse } from "next/server";
import {
  getAccountByPuuid,
  getSummonerByPuuid,
  getSummonerBySummonerId,
} from "@/lib/riot/client";
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

  let puuid = sp.get("puuid") || "";
  const summonerId = sp.get("summonerId") || "";

  let profileIconId = 0;

  if (!puuid && summonerId) {
    const summoner = await getSummonerBySummonerId(summonerId, platform);
    puuid = summoner?.puuid || "";
    profileIconId = summoner?.profileIconId || 0;
  }

  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid or summonerId" }, { status: 400 });
  }

  const [account, summoner] = await Promise.all([
    getAccountByPuuid(puuid, platform),
    getSummonerByPuuid(puuid, platform),
  ]);

  if (!account) {
    return NextResponse.json({
      puuid,
      gameName: "Unknown",
      tagLine: "",
      profileIconId: profileIconId || summoner?.profileIconId || 0,
    });
  }

  return NextResponse.json({
    puuid,
    gameName: account.gameName,
    tagLine: account.tagLine,
    profileIconId: profileIconId || summoner?.profileIconId || 0,
  });
}
