import { NextRequest, NextResponse } from 'next/server';
import { getAccountByPuuid } from '@/lib/riot/client';
import { normalizePlatform } from '@/lib/riot/regions';

export async function GET(req: NextRequest) {
  const puuid = req.nextUrl.searchParams.get('puuid');
  const platform = normalizePlatform(req.nextUrl.searchParams.get('platform'));
  if (!puuid) return NextResponse.json({ error: 'Missing puuid' }, { status: 400 });

  const account = await getAccountByPuuid(puuid, platform);
  return NextResponse.json({
    gameName: account?.gameName || 'Unknown',
    tagLine: account?.tagLine || '',
    profileIconId: 1
  });
}
