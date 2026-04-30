import { NextRequest, NextResponse } from 'next/server'
import { getMatchIdsByPuuid, getMatch } from '@/lib/riot/client'
import { normalizePlatform } from '@/lib/riot/regions'
import { toMatchCardViewModel } from '@/lib/analytics/transform'
import type { MatchCardViewModel, StatsChunkViewModel } from '@/lib/analytics/types'

export const dynamic = 'force-dynamic'

async function pmap<T,R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []; let i = 0
  const worker = async () => { while (i < items.length) { const c = i++; out[c] = await fn(items[c]) } }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const puuid = sp.get('puuid'), platform = normalizePlatform(sp.get('platform'))
  const start = Math.max(Number(sp.get('start')||'0')||0, 0)
  if (!puuid) return NextResponse.json({ error: 'Missing puuid' }, { status: 400 })

  const [solo, flex] = await Promise.all([
    getMatchIdsByPuuid(puuid, platform, { start, count: 50, queue: 420 }),
    getMatchIdsByPuuid(puuid, platform, { start, count: 50, queue: 440 }),
  ])
  const ids = Array.from(new Set([...solo, ...flex]))
  const results = await pmap(ids, 10, async id => {
    const m = await getMatch(id, platform); if (!m) return null
    return toMatchCardViewModel(m, puuid)
  })
  const matches = results.filter(Boolean) as MatchCardViewModel[]
  const vm: StatsChunkViewModel = {
    matches, done: solo.length < 50 && flex.length < 50,
    nextStart: start + 50, fetched: matches.length,
  }
  return NextResponse.json(vm)
}
