import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboard } from '@/lib/riot/client'
import { normalizePlatform } from '@/lib/riot/regions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params
  const sp = req.nextUrl.searchParams
  const queue = (sp.get('queue') || 'solo').toLowerCase() as 'solo'|'flex'
  const tier = (sp.get('tier') || 'challenger').toLowerCase() as 'challenger'|'grandmaster'|'master'
  const limit = Math.min(Number(sp.get('limit')||'300'), 300)
  const norm = normalizePlatform(platform)

  const list = await getLeaderboard(norm, tier, queue)
  if (!list) return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })

  const entries = (list.entries || [])
    .sort((a,b) => b.leaguePoints - a.leaguePoints)
    .slice(0, limit)
    .map((e, i) => ({
      rank: i + 1,
      puuid: e.puuid || '',
      summonerId: e.summonerId,
      leaguePoints: e.leaguePoints,
      wins: e.wins, losses: e.losses,
      winrate: (e.wins+e.losses) > 0 ? Math.round(e.wins/(e.wins+e.losses)*100) : 0,
      hotStreak: e.hotStreak, freshBlood: e.freshBlood, veteran: e.veteran,
    }))

  return NextResponse.json({
    tier: tier.toUpperCase(), queue, platform: norm,
    updatedAt: Date.now(), entries,
  })
}
