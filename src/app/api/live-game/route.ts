import { NextRequest, NextResponse } from "next/server";
import { getLiveGameByPuuid } from "@/lib/riot/client";
import { normalizePlatform } from "@/lib/riot/regions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const puuid = sp.get("puuid");
  const platform = normalizePlatform(sp.get("platform"));

  if (!puuid) return NextResponse.json({ error: "Missing puuid" }, { status: 400 });

  const game = await getLiveGameByPuuid(puuid, platform);
  if (!game) return NextResponse.json({ active: false });

  return NextResponse.json({ active: true, game });
}
