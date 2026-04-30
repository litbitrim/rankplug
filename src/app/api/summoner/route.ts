import { NextRequest, NextResponse } from 'next/server'
import { getAccountByRiotId, getSummonerByPuuid, getRankedByPuuid, getMatchIdsByPuuid, getMatch, getLiveGameByPuuid } from '@/lib/riot/client'
import { normalizePlatform } from '@/lib/riot/regions'
import { rankedEntriesToRanks, toMatchCardViewModel } from '@/lib/analytics/transform'
import type { ProfileViewModel } from '@/lib/analytics/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const name = sp.get('name'), tag = sp.get('tag')
  const platform = normalizePlatform(sp.get('platform'))
  if (!name || !tag) return NextResponse.json({ error: 'Missing name or tag' }, { status: 400 })

  const account = await getAccountByRiotId(name, tag, platform)
  if (!account?.puuid) return NextResponse.json({ error: 'Summoner not found' }, { status: 404 })

  const [summ, ranked, live, ids] = await Promise.all([
    getSummonerByPuuid(account.puuid, platform),
    getRankedByPuuid(account.puuid, platform),
    getLiveGameByPuuid(account.puuid, platform),
    getMatchIdsByPuuid(account.puuid, platform, { count: 20, queue: 420 }),
  ])

  const matches = (await Promise.all(ids.map(id => getMatch(id, platform))))
    .filter(Boolean)
    .map(m => toMatchCardViewModel(m!, account.puuid))
    .filter(Boolean) as NonNullable<ReturnType<typeof toMatchCardViewModel>>[]

  const { soloRank, flexRank } = rankedEntriesToRanks(ranked)
  const vm: ProfileViewModel = {
    account: { gameName: account.gameName, tagLine: account.tagLine, puuid: account.puuid },
    summoner: { profileIconId: summ?.profileIconId ?? 0, summonerLevel: summ?.summonerLevel ?? 0 },
    soloRank, flexRank,
    liveGame: { active: !!live },
    recentMatches: matches,
    puuid: account.puuid, platform,
  }
  return NextResponse.json(vm)
}
