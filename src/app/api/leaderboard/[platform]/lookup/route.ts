import { NextRequest, NextResponse } from 'next/server'
import { getAccountByPuuid, getSummonerByPuuid } from '@/lib/riot/client'
import { normalizePlatform } from '@/lib/riot/regions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params
  const norm = normalizePlatform(platform)
  const puuid = req.nextUrl.searchParams.get('puuid')
  if (!puuid) return NextResponse.json({ error: 'Missing puuid' }, { status: 400 })

  const [acc, summ] = await Promise.all([
    getAccountByPuuid(puuid, norm),
    getSummonerByPuuid(puuid, norm),
  ])
  return NextResponse.json({
    gameName: acc?.gameName || 'Unknown',
    tagLine: acc?.tagLine || '',
    profileIconId: summ?.profileIconId || 0,
  })
}
