'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Entry = { rank: number; puuid: string; leaguePoints: number; wins: number; losses: number; winrate: number }

export default function Home() {
  const [input, setInput] = useState('')
  const [region, setRegion] = useState('euw')
  const [top, setTop] = useState<Entry[]>([])
  const [topLoading, setTopLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/leaderboard/euw?queue=solo&tier=challenger&limit=10')
      .then(r => r.json()).then(j => { setTop(j.entries || []); setTopLoading(false) })
      .catch(() => setTopLoading(false))
  }, [])

  function search() {
    const [n, t] = input.split('#')
    if (!n || !t) return alert('Format: Name#TAG')
    router.push(`/profile/${region}/${encodeURIComponent(n.trim())}/${encodeURIComponent(t.trim())}`)
  }

  return <main style={{background:'#0a0b0f',minHeight:'100vh',color:'#e8eaf2',fontFamily:'system-ui,sans-serif',padding:'40px 20px'}}>
    <div style={{maxWidth:'720px',margin:'0 auto',textAlign:'center',marginBottom:'48px'}}>
      <div style={{fontSize:'11px',color:'#4f8ef7',fontWeight:700,letterSpacing:'2px',marginBottom:'8px',textTransform:'uppercase'}}>Alpha</div>
      <h1 style={{fontSize:'3.5rem',fontWeight:800,letterSpacing:'-1.5px',margin:'0 0 8px 0'}}>rankplug</h1>
      <p style={{color:'#8b91a8',fontSize:'15px',marginBottom:'32px'}}>Multi-account ranked tracker · LoL stats done right</p>
      <div style={{display:'flex',gap:'8px',justifyContent:'center'}}>
        <select value={region} onChange={e => setRegion(e.target.value)} style={{background:'#11131a',border:'1px solid #1f2335',borderRadius:'10px',padding:'12px',color:'#e8eaf2',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>
          {['euw','na','kr','eune','br','jp','lan','las','oce','tr','ru'].map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
        </select>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && search()}
          placeholder="stacksmaxxing#69420"
          style={{background:'#11131a',border:'1px solid #1f2335',borderRadius:'10px',padding:'12px 18px',color:'#e8eaf2',fontSize:'15px',width:'320px'}}/>
        <button onClick={search} style={{background:'#4f8ef7',border:'none',borderRadius:'10px',padding:'12px 24px',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'14px'}}>Search</button>
      </div>
      <div style={{marginTop:'14px',display:'flex',gap:'8px',justifyContent:'center'}}>
        {['stacksmaxxing#69420','Faker#KR1','Caps#EUW'].map(s => (
          <button key={s} onClick={() => setInput(s)} style={{background:'#11131a',border:'1px solid #1f2335',borderRadius:'6px',padding:'5px 11px',color:'#8b91a8',fontSize:'11px',cursor:'pointer'}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{maxWidth:'720px',margin:'0 auto',background:'#11131a',border:'1px solid #1f2335',borderRadius:'14px',padding:'18px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
        <div style={{fontSize:'11px',fontWeight:700,color:'#8b91a8',letterSpacing:'1px',textTransform:'uppercase'}}>EUW Challenger · Top 10</div>
        <Link href="/leaderboard/euw" style={{fontSize:'11px',color:'#4f8ef7',textDecoration:'none',fontWeight:600}}>Full leaderboard →</Link>
      </div>
      {topLoading && <div style={{color:'#8b91a8',fontSize:'13px',padding:'20px',textAlign:'center'}}>Loading…</div>}
      {!topLoading && top.length === 0 && <div style={{color:'#8b91a8',fontSize:'13px',padding:'20px',textAlign:'center'}}>Leaderboard unavailable</div>}
      {top.map(e => (
        <div key={e.puuid} style={{display:'flex',alignItems:'center',gap:'12px',padding:'8px 0',borderBottom:'1px solid #1f2335',fontSize:'13px'}}>
          <div style={{width:'30px',color:e.rank<=3?'#f1c40f':'#8b91a8',fontWeight:700,fontFamily:'monospace'}}>{e.rank<=3?['👑','🥈','🥉'][e.rank-1]:`#${e.rank}`}</div>
          <div style={{flex:1,color:'#8b91a8',fontSize:'12px'}}>Challenger</div>
          <div style={{color:'#f0c040',fontWeight:700}}>{e.leaguePoints} LP</div>
          <div style={{color:'#8b91a8',fontSize:'11px'}}>
            <span style={{color:'#3ecf8e'}}>{e.wins}W</span> / <span style={{color:'#f75a5a'}}>{e.losses}L</span>
          </div>
          <div style={{color:e.winrate>=60?'#3ecf8e':e.winrate>=50?'#f0c040':'#f75a5a',fontWeight:600,minWidth:'40px',textAlign:'right'}}>{e.winrate}%</div>
        </div>
      ))}
    </div>
  </main>
}
