'use client'
import { Suspense, useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { profileIcon } from '@/lib/ddragon'

const TIER_COLORS: Record<string,string> = {
  challenger: '#f1c40f', grandmaster: '#e74c3c', master: '#9b59b6'
}

function LeaderboardInner() {
  const params = useParams()
  const router = useRouter()
  const sp = useSearchParams()
  const platform = (params.platform as string)?.toLowerCase() || 'euw'
  const queue = (sp.get('queue') || 'solo') as 'solo'|'flex'
  const tier = (sp.get('tier') || 'challenger') as 'challenger'|'grandmaster'|'master'

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [countdown, setCountdown] = useState(30)
  const [lookups, setLookups] = useState<Map<string,any>>(new Map())
  const lookupsRef = useRef(lookups); lookupsRef.current = lookups

  const fetchLB = useCallback(async () => {
    try {
      const r = await fetch(`/api/leaderboard/${platform}?queue=${queue}&tier=${tier}`)
      if (!r.ok) throw new Error()
      const j = await r.json()
      setData(j); setError(false); setCountdown(30)
    } catch { setError(true) } finally { setLoading(false) }
  }, [platform, queue, tier])

  useEffect(() => { setLoading(true); fetchLB() }, [fetchLB])

  // Auto refresh every 30s, pause when tab hidden
  useEffect(() => {
    const tick = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      setCountdown(c => {
        if (c <= 1) { fetchLB(); return 30 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [fetchLB])

  // IntersectionObserver lazy enrichment
  const observerRef = useRef<IntersectionObserver | null>(null)
  const enrichPuuid = useCallback(async (puuid: string) => {
    if (!puuid || lookupsRef.current.has(puuid)) return
    setLookups(m => new Map(m).set(puuid, { loading: true }))
    try {
      const r = await fetch(`/api/leaderboard/${platform}/lookup?puuid=${puuid}`)
      const j = await r.json()
      setLookups(m => new Map(m).set(puuid, j))
    } catch {
      setLookups(m => new Map(m).set(puuid, { gameName: 'Unknown', tagLine: '' }))
    }
  }, [platform])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const p = (e.target as HTMLElement).dataset.puuid
          if (p) enrichPuuid(p)
        }
      })
    }, { rootMargin: '100px' })
    document.querySelectorAll('[data-puuid]').forEach(el => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [data, enrichPuuid])

  const filtered = data?.entries.filter((e: any) => {
    if (!search) return true
    const lookup = lookups.get(e.puuid)
    return lookup?.gameName?.toLowerCase().includes(search.toLowerCase())
  }) || []

  return (
    <div style={{ minHeight:'100vh', background:'#0a0b0f', color:'#e8eaf2', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ background:'#11131a', borderBottom:'1px solid #1f2335', padding:'12px 24px', display:'flex', alignItems:'center', gap:'16px' }}>
        <Link href="/" style={{ color:'#4f8ef7', fontSize:'13px', fontWeight:700, textDecoration:'none' }}>rankplug</Link>
        <span style={{ color:'#333a50' }}>/</span>
        <span style={{ fontSize:'13px', color:'#8b91a8' }}>Leaderboard · {platform.toUpperCase()}</span>
        <span style={{ fontSize:'11px', color:'#8b91a8', marginLeft:'auto' }}>
          {error ? 'Connection error, retrying…' : `Auto-refresh in ${countdown}s`}
        </span>
        <button onClick={fetchLB} style={{ background:'#1f2335', border:'1px solid #2a2f3f', borderRadius:'6px', padding:'4px 10px', color:'#e8eaf2', fontSize:'11px', cursor:'pointer' }}>Refresh</button>
      </div>

      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
          <h1 style={{ fontSize:'26px', fontWeight:800, margin:0, color: TIER_COLORS[tier] }}>
            {tier.charAt(0).toUpperCase()+tier.slice(1)} · {queue === 'solo' ? 'Solo/Duo' : 'Flex'}
          </h1>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search player..."
            style={{ background:'#11131a', border:'1px solid #1f2335', borderRadius:'8px', padding:'8px 14px', color:'#e8eaf2', fontSize:'13px', width:'200px' }}/>
        </div>

        <div style={{ display:'flex', gap:'16px', marginBottom:'18px', flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:'4px', background:'#11131a', border:'1px solid #1f2335', borderRadius:'8px', padding:'3px' }}>
            {(['challenger','grandmaster','master'] as const).map(t => (
              <button key={t} onClick={() => router.push(`/leaderboard/${platform}?queue=${queue}&tier=${t}`)} style={{
                padding:'6px 14px', borderRadius:'6px', fontSize:'12px', fontWeight:600, cursor:'pointer', border:'none',
                background: tier === t ? TIER_COLORS[t] : 'transparent',
                color: tier === t ? '#000' : '#8b91a8'
              }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
          </div>
          <div style={{ display:'flex', gap:'4px', background:'#11131a', border:'1px solid #1f2335', borderRadius:'8px', padding:'3px' }}>
            {(['solo','flex'] as const).map(q => (
              <button key={q} onClick={() => router.push(`/leaderboard/${platform}?queue=${q}&tier=${tier}`)} style={{
                padding:'6px 14px', borderRadius:'6px', fontSize:'12px', fontWeight:600, cursor:'pointer', border:'none',
                background: queue === q ? '#4f8ef7' : 'transparent',
                color: queue === q ? '#fff' : '#8b91a8'
              }}>{q === 'solo' ? 'Solo/Duo' : 'Flex'}</button>
            ))}
          </div>
          <select value={platform} onChange={e => router.push(`/leaderboard/${e.target.value}?queue=${queue}&tier=${tier}`)}
            style={{ background:'#11131a', border:'1px solid #1f2335', borderRadius:'8px', padding:'7px 12px', color:'#e8eaf2', fontSize:'12px' }}>
            {['euw','na','kr','eune','br','jp','lan','las','oce','tr','ru'].map(p =>
              <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
        </div>

        {loading && !data && <div style={{ textAlign:'center', padding:'60px', color:'#8b91a8' }}>Loading leaderboard…</div>}

        {data && (
          <div style={{ background:'#11131a', border:'1px solid #1f2335', borderRadius:'12px', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid #1f2335', color:'#8b91a8' }}>
                  <th style={{ textAlign:'left', padding:'12px', width:'60px' }}>#</th>
                  <th style={{ textAlign:'left', padding:'12px' }}>Player</th>
                  <th style={{ textAlign:'right', padding:'12px', width:'90px' }}>LP</th>
                  <th style={{ textAlign:'right', padding:'12px', width:'120px' }}>W / L</th>
                  <th style={{ textAlign:'right', padding:'12px', width:'90px' }}>WR</th>
                  <th style={{ textAlign:'center', padding:'12px', width:'120px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e: any) => {
                  const lookup = lookups.get(e.puuid)
                  const name = lookup?.gameName && lookup.gameName !== 'Unknown' ? lookup.gameName : null
                  const tagLine = lookup?.tagLine || ''
                  const iconId = lookup?.profileIconId || 0
                  const isClickable = name && tagLine
                  const RowContent = (
                    <>
                      <td style={{ padding:'10px 12px', fontFamily:'monospace', fontWeight:700,
                          color: e.rank <= 3 ? TIER_COLORS[tier] : '#8b91a8' }}>
                        {e.rank <= 3 ? ['👑','🥈','🥉'][e.rank-1] : e.rank}
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          {iconId > 0 && (
                            <img src={profileIcon(iconId)} alt="" style={{ width:'28px', height:'28px', borderRadius:'6px', flexShrink:0 }}
                              onError={(ev:any) => { ev.target.style.opacity='0' }}/>
                          )}
                          <span style={{ fontWeight:500 }}>
                            {name || <span style={{ color:'#555d78', fontSize:'11px' }}>Loading…</span>}
                            {tagLine && <span style={{ color:'#555d78' }}>#{tagLine}</span>}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding:'10px 12px', textAlign:'right', color:'#f0c040', fontWeight:700 }}>{e.leaguePoints}</td>
                      <td style={{ padding:'10px 12px', textAlign:'right' }}>
                        <span style={{ color:'#3ecf8e' }}>{e.wins}</span>
                        <span style={{ color:'#555d78' }}> / </span>
                        <span style={{ color:'#f75a5a' }}>{e.losses}</span>
                      </td>
                      <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:600,
                          color: e.winrate >= 60 ? '#3ecf8e' : e.winrate >= 50 ? '#f0c040' : '#f75a5a' }}>{e.winrate}%</td>
                      <td style={{ padding:'10px 12px', textAlign:'center' }}>
                        {e.hotStreak && <span style={{ background:'rgba(247,90,90,0.15)', color:'#f75a5a', fontSize:'10px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', marginRight:'4px' }}>🔥</span>}
                        {e.freshBlood && <span style={{ background:'rgba(62,207,142,0.15)', color:'#3ecf8e', fontSize:'10px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', marginRight:'4px' }}>NEW</span>}
                        {e.veteran && <span style={{ background:'rgba(155,89,182,0.15)', color:'#9b59b6', fontSize:'10px', fontWeight:700, padding:'2px 6px', borderRadius:'4px' }}>VET</span>}
                      </td>
                    </>
                  )
                  if (isClickable) return (
                    <tr key={e.summonerId || e.rank} data-puuid={e.puuid}
                      onClick={() => router.push(`/profile/${platform}/${encodeURIComponent(name)}/${encodeURIComponent(tagLine)}`)}
                      style={{ borderBottom:'1px solid #1f2335', cursor:'pointer', transition:'background 0.15s' }}
                      onMouseOver={ev => (ev.currentTarget as HTMLElement).style.background = 'rgba(79,142,247,0.05)'}
                      onMouseOut={ev => (ev.currentTarget as HTMLElement).style.background = 'transparent'}>
                      {RowContent}
                    </tr>
                  )
                  return (
                    <tr key={e.summonerId || e.rank} data-puuid={e.puuid} style={{ borderBottom:'1px solid #1f2335' }}>
                      {RowContent}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  return <Suspense fallback={<div style={{ minHeight:'100vh', background:'#0a0b0f', color:'#8b91a8', display:'flex', alignItems:'center', justifyContent:'center' }}>Loading…</div>}>
    <LeaderboardInner />
  </Suspense>
}
