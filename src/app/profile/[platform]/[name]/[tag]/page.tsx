'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { championIcon, itemIcon, profileIcon } from '@/lib/ddragon'
import { aggregateChampionStats, type ChampionStat } from '@/lib/analytics/champion'
import { deriveTitles } from '@/lib/analytics/titles'
import type { ProfileViewModel, MatchCardViewModel, ParticipantViewModel } from '@/lib/analytics/types'

const TIER_COLORS: Record<string,string> = {
  IRON:'#7a7a8c', BRONZE:'#8c6a3f', SILVER:'#7a8c9e', GOLD:'#f0c040',
  PLATINUM:'#4fc3a1', EMERALD:'#2ecc71', DIAMOND:'#5b9bd5',
  MASTER:'#9b59b6', GRANDMASTER:'#e74c3c', CHALLENGER:'#f1c40f'
}
const C = { bg:'#0a0b0f', bg2:'#11131a', bg3:'#161820', border:'1px solid #1f2335',
  muted:'#8b91a8', win:'#3ecf8e', loss:'#f75a5a', gold:'#f0c040' }
const card = { background:C.bg2, border:C.border, borderRadius:'14px', padding:'18px' }

function Ring({pct,size=64}:{pct:number,size?:number}) {
  const r=size/2-5, c=2*Math.PI*r, fill=(pct/100)*c
  const color = pct>=60?C.win : pct>=50?C.gold : C.loss
  return <svg width={size} height={size} style={{transform:'rotate(-90deg)',flexShrink:0}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f2335" strokeWidth="6"/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
      strokeDasharray={`${fill} ${c}`} strokeLinecap="round"/>
  </svg>
}

function KdaBar({k,d,a}:{k:number,d:number,a:number}) {
  const t = k+d+a||1
  return <div style={{display:'flex',height:'4px',borderRadius:'2px',overflow:'hidden',marginTop:'6px'}}>
    <div style={{width:`${k/t*100}%`,background:C.win}}/>
    <div style={{width:`${d/t*100}%`,background:C.loss}}/>
    <div style={{width:`${a/t*100}%`,background:'#4f8ef7'}}/>
  </div>
}

function ChampImg({name,size=24}:{name:string,size?:number}) {
  return <div style={{width:size,height:size,borderRadius:size/4,overflow:'hidden',background:C.bg3,flexShrink:0}}>
    <img src={championIcon(name)} alt={name} style={{width:'100%',height:'100%'}} onError={(e:any)=>e.target.style.opacity='0'}/>
  </div>
}

function PlayerLink({platform,p,isMe}:{platform:string,p:ParticipantViewModel,isMe:boolean}) {
  if (!p.gameName || p.gameName === 'Unknown') return <span style={{color:'#555d78',fontSize:'11px'}}>Unknown</span>
  return <Link href={`/profile/${platform}/${encodeURIComponent(p.gameName)}/${encodeURIComponent(p.tagLine||'EUW')}`}
    onClick={e=>e.stopPropagation()}
    style={{display:'flex',alignItems:'center',gap:'4px',textDecoration:'none',
      color:isMe?'#4f8ef7':'#e8eaf2',fontWeight:isMe?700:400}}>
    <ChampImg name={p.champion} size={18}/>
    <span style={{fontSize:'11px',maxWidth:'80px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.gameName}</span>
  </Link>
}

function TeamsPreview({m,platform,myPuuid}:{m:MatchCardViewModel,platform:string,myPuuid:string}) {
  const me = [...m.teams.blue, ...m.teams.red].find(p => p.puuid === myPuuid)
  const myTeam = me?.teamId === 100 ? m.teams.blue : m.teams.red
  const enemyTeam = me?.teamId === 100 ? m.teams.red : m.teams.blue
  return <div style={{display:'flex',gap:'16px',flexShrink:0}}>
    <div>{myTeam.map((p,i) => <PlayerLink key={i} platform={platform} p={p} isMe={p.puuid===myPuuid}/>)}</div>
    <div style={{width:'1px',background:'#1f2335'}}/>
    <div>{enemyTeam.map((p,i) => <PlayerLink key={i} platform={platform} p={p} isMe={false}/>)}</div>
  </div>
}

function Scoreboard({m,myPuuid,platform}:{m:MatchCardViewModel,myPuuid:string,platform:string}) {
  const teams = [m.teams.blue, m.teams.red]
  const allParts = [...m.teams.blue, ...m.teams.red]
  const maxDmg = Math.max(...allParts.map(p => p.damage))
  return <div style={{marginTop:'12px',borderTop:C.border,paddingTop:'14px'}}>
    {teams.map((team,ti) => {
      const won = team[0]?.win
      return <div key={ti} style={{marginBottom:'14px'}}>
        <div style={{fontSize:'11px',fontWeight:700,color:won?C.win:C.loss,marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.8px'}}>
          {won?'Victory':'Defeat'} · {ti===0?'Blue':'Red'} Team
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px'}}>
          <thead><tr style={{color:'#555d78',borderBottom:C.border}}>
            <th style={{textAlign:'left',padding:'4px 8px',fontWeight:500,width:'160px'}}>Player</th>
            <th style={{padding:'4px 6px',fontWeight:500}}>KDA</th>
            <th style={{padding:'4px 6px',fontWeight:500,width:'110px'}}>Damage</th>
            <th style={{padding:'4px 6px',fontWeight:500}}>Gold</th>
            <th style={{padding:'4px 6px',fontWeight:500}}>CS</th>
            <th style={{padding:'4px 6px',fontWeight:500}}>Vis</th>
            <th style={{padding:'4px 6px',fontWeight:500,width:'140px'}}>Items</th>
          </tr></thead>
          <tbody>{team.map((p,i) => <tr key={i} style={{background:p.puuid===myPuuid?'rgba(79,142,247,0.08)':'transparent'}}>
            <td style={{padding:'5px 8px'}}><PlayerLink platform={platform} p={p} isMe={p.puuid===myPuuid}/></td>
            <td style={{padding:'5px 6px',textAlign:'center',whiteSpace:'nowrap'}}>
              <span style={{color:C.win}}>{p.kills}</span>/<span style={{color:C.loss}}>{p.deaths}</span>/<span style={{color:'#4f8ef7'}}>{p.assists}</span>
            </td>
            <td style={{padding:'5px 6px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                <div style={{flex:1,height:'4px',background:'#1f2335',borderRadius:'2px'}}>
                  <div style={{width:`${Math.min(100,Math.round(p.damage/maxDmg*100))}%`,height:'100%',background:C.loss,borderRadius:'2px'}}/>
                </div>
                <span style={{fontSize:'10px',color:C.muted,minWidth:'30px',textAlign:'right'}}>{Math.round(p.damage/1000)}k</span>
              </div>
            </td>
            <td style={{padding:'5px 6px',textAlign:'center',color:C.gold}}>{(p.gold/1000).toFixed(1)}k</td>
            <td style={{padding:'5px 6px',textAlign:'center',color:C.muted}}>{p.cs}</td>
            <td style={{padding:'5px 6px',textAlign:'center',color:C.muted}}>{p.vision}</td>
            <td style={{padding:'5px 6px'}}>
              <div style={{display:'flex',gap:'2px'}}>{p.items.map((it,ii) => (
                <div key={ii} style={{width:'18px',height:'18px',borderRadius:'3px',background:C.bg3,overflow:'hidden'}}>
                  {it>0 && <img src={itemIcon(it)} alt="" style={{width:'100%',height:'100%'}} onError={(e:any)=>e.target.style.display='none'}/>}
                </div>
              ))}</div>
            </td>
          </tr>)}</tbody>
        </table>
      </div>
    })}
  </div>
}

type SortKey = 'games'|'wr'|'kda'|'avgCs'|'avgDmg'|'avgGold'|'maxKills'|'maxDeaths'|'avgVision'
function ChampionTab({matches,puuid,loading,total}:{matches:MatchCardViewModel[],puuid:string,loading:boolean,total:number}) {
  const [queue, setQueue] = useState<'all'|'solo'|'flex'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('games')
  const [sortDir, setSortDir] = useState<'desc'|'asc'>('desc')
  const filtered = matches.filter(m => {
    if (queue === 'all') return m.queueId === 420 || m.queueId === 440
    if (queue === 'solo') return m.queueId === 420
    return m.queueId === 440
  })
  const list = aggregateChampionStats(filtered).sort((a,b) => {
    const mul = sortDir === 'desc' ? -1 : 1
    return ((a[sortKey] as number) - (b[sortKey] as number)) * mul
  })
  function SH({label, k}:{label:string,k:SortKey}) {
    const active = sortKey === k
    return <th onClick={() => active ? setSortDir(d => d==='desc'?'asc':'desc') : (setSortKey(k), setSortDir('desc'))}
      style={{padding:'10px 12px',fontWeight:500,textAlign:'center',cursor:'pointer',color:active?'#e8eaf2':C.muted,
        userSelect:'none',whiteSpace:'nowrap',background:active?'rgba(79,142,247,0.08)':'transparent'}}>
      {label} {active ? (sortDir==='desc'?'↓':'↑') : '↕'}
    </th>
  }
  return <div>
    <div style={{display:'flex',gap:'6px',marginBottom:'16px',alignItems:'center',flexWrap:'wrap'}}>
      {([['all','All Ranked'],['solo','Solo/Duo'],['flex','Flex']] as const).map(([q,l]) => (
        <button key={q} onClick={() => setQueue(q)} style={{padding:'6px 14px',borderRadius:'8px',fontSize:'12px',fontWeight:600,cursor:'pointer',border:C.border,
          background:queue===q?'#4f8ef7':'transparent',color:queue===q?'#fff':C.muted}}>{l}</button>
      ))}
      <span style={{fontSize:'12px',color:C.muted,marginLeft:'8px'}}>
        {filtered.length} ranked games
        {loading && <span style={{color:'#4f8ef7',marginLeft:'8px'}}>· Loading… ({total} total)</span>}
      </span>
    </div>
    <div style={{background:C.bg2,border:C.border,borderRadius:'12px',overflow:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px',minWidth:'700px'}}>
        <thead><tr style={{borderBottom:C.border}}>
          <th style={{padding:'10px 12px',fontWeight:500,textAlign:'left',color:C.muted}}>Champion</th>
          <SH label="Win Rate" k="wr"/><SH label="KDA" k="kda"/>
          <SH label="Avg CS" k="avgCs"/><SH label="Avg Dmg" k="avgDmg"/>
          <SH label="Avg Gold" k="avgGold"/><SH label="Max K" k="maxKills"/>
          <SH label="Max D" k="maxDeaths"/><SH label="Vision" k="avgVision"/>
          <SH label="Games" k="games"/>
        </tr></thead>
        <tbody>{list.map((c,i) => <tr key={c.name} style={{borderBottom:C.border,background:i%2===0?'transparent':'rgba(255,255,255,0.01)'}}>
          <td style={{padding:'10px 12px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <ChampImg name={c.name} size={32}/>
              <div><div style={{fontWeight:500}}>{c.name}</div><div style={{fontSize:'10px',color:C.muted}}>{c.wins}W {c.games-c.wins}L</div></div>
            </div>
          </td>
          <td style={{padding:'10px',textAlign:'center'}}>
            <div style={{fontWeight:700,color:c.wr>=60?C.win:c.wr>=50?C.gold:C.loss}}>{c.wr}%</div>
            <div style={{fontSize:'10px',color:C.muted}}>{c.games}g</div>
          </td>
          <td style={{padding:'10px',textAlign:'center'}}>
            <div style={{fontWeight:600,color:c.kda>=4?C.win:c.kda>=2?C.gold:C.muted}}>{c.kdaStr}</div>
            <div style={{fontSize:'10px',color:C.muted}}>{c.avgK}/{c.avgD}/{c.avgA}</div>
          </td>
          <td style={{padding:'10px',textAlign:'center'}}>{c.avgCs}</td>
          <td style={{padding:'10px',textAlign:'center',color:C.loss}}>{Math.round(c.avgDmg/1000)}k</td>
          <td style={{padding:'10px',textAlign:'center',color:C.gold}}>{Math.round(c.avgGold/1000)}k</td>
          <td style={{padding:'10px',textAlign:'center',color:C.win}}>{c.maxKills}</td>
          <td style={{padding:'10px',textAlign:'center',color:C.loss}}>{c.maxDeaths}</td>
          <td style={{padding:'10px',textAlign:'center',color:C.muted}}>{c.avgVision}</td>
          <td style={{padding:'10px',textAlign:'center',color:C.muted,fontWeight:600}}>{c.games}</td>
        </tr>)}</tbody>
      </table>
      {list.length === 0 && <div style={{padding:'40px',textAlign:'center',color:C.muted}}>{loading?'Loading…':'No ranked games found'}</div>}
    </div>
  </div>
}

export default function ProfilePage() {
  const { platform, name, tag } = useParams() as any
  const [d, setD] = useState<ProfileViewModel|null>(null)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState<'overview'|'champions'>('overview')
  const [expanded, setExpanded] = useState<Record<string,boolean>>({})
  const [allMatches, setAllMatches] = useState<MatchCardViewModel[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [totalLoaded, setTotalLoaded] = useState(0)
  const fetchingRef = useRef(false)

  useEffect(() => {
    setD(null); setErr(''); setAllMatches([]); setTotalLoaded(0); fetchingRef.current = false
    fetch(`/api/summoner?name=${name}&tag=${tag}&platform=${platform}`)
      .then(r => r.json()).then((data: any) => {
        if (data.error) { setErr(data.error); return }
        setD(data)
        if (data.puuid) loadStats(data.puuid)
      })
  }, [name, tag, platform])

  async function loadStats(puuid: string) {
    if (fetchingRef.current) return
    fetchingRef.current = true; setStatsLoading(true)
    let start = 0; let acc: MatchCardViewModel[] = []
    while (true) {
      try {
        const r = await fetch(`/api/stats?puuid=${puuid}&platform=${platform}&start=${start}`)
        const j = await r.json()
        if (!j.matches || j.matches.length === 0) break
        acc = [...acc, ...j.matches]
        setAllMatches([...acc]); setTotalLoaded(acc.length)
        if (j.done) break
        start = j.nextStart
        await new Promise(r => setTimeout(r, 300))
      } catch { break }
    }
    setStatsLoading(false)
  }

  if (err) return <main style={{background:C.bg,minHeight:'100vh',color:'#e8eaf2',fontFamily:'system-ui,sans-serif',padding:'24px'}}>
    <Link href="/" style={{color:'#4f8ef7',textDecoration:'none'}}>← Back</Link>
    <div style={{color:C.loss,marginTop:'20px'}}>{err}</div>
  </main>
  if (!d) return <main style={{background:C.bg,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,sans-serif'}}>
    <div style={{color:C.muted}}>Loading profile…</div>
  </main>

  const titles = deriveTitles(d.recentMatches)
  const RANKED = [420, 440]
  const champStats = aggregateChampionStats(allMatches.filter(m => RANKED.includes(m.queueId)))
    .sort((a,b) => b.games - a.games).slice(0,7)
  const meList = d.recentMatches
  const totalGames = meList.length
  const totalWins = meList.filter(m => m.win).length
  const avgK = totalGames ? (meList.reduce((s,m)=>s+m.kda.kills,0)/totalGames).toFixed(1) : '0'
  const avgD = totalGames ? (meList.reduce((s,m)=>s+m.kda.deaths,0)/totalGames).toFixed(1) : '0'
  const avgA = totalGames ? (meList.reduce((s,m)=>s+m.kda.assists,0)/totalGames).toFixed(1) : '0'
  const avgKda = Number(avgD)===0 ? '∞' : ((Number(avgK)+Number(avgA))/Number(avgD)).toFixed(2)
  const tierColor = TIER_COLORS[d.soloRank?.tier || ''] || C.muted

  return <main style={{background:C.bg,minHeight:'100vh',color:'#e8eaf2',fontFamily:'system-ui,sans-serif'}}>
    <div style={{background:C.bg2,borderBottom:C.border,padding:'0 24px',display:'flex',alignItems:'center',gap:'12px',height:'52px'}}>
      <Link href="/" style={{color:'#4f8ef7',fontSize:'13px',fontWeight:700,textDecoration:'none'}}>rankplug</Link>
      <span style={{color:'#333a50'}}>/</span>
      <span style={{fontSize:'13px',color:C.muted}}>{name}#{tag}</span>
      {d.liveGame?.active && <span style={{background:'rgba(247,90,90,0.15)',color:C.loss,fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'20px'}}>🔴 IN GAME</span>}
      <span style={{fontSize:'11px',color:C.muted,marginLeft:'auto'}}>
        {statsLoading ? `Loading ranked stats… ${totalLoaded} games` : `${totalLoaded} ranked games loaded`}
      </span>
    </div>

    <div style={{maxWidth:'1200px',margin:'0 auto',padding:'20px'}}>
      <div style={{...card,display:'flex',alignItems:'center',gap:'20px',marginBottom:'12px',flexWrap:'wrap'}}>
        <div style={{position:'relative',flexShrink:0}}>
          <img src={profileIcon(d.summoner.profileIconId)} alt="" style={{width:'72px',height:'72px',borderRadius:'12px',border:C.border}} onError={(e:any)=>e.target.style.opacity='0'}/>
          <div style={{position:'absolute',bottom:'-8px',left:'50%',transform:'translateX(-50%)',background:C.bg3,border:C.border,borderRadius:'8px',padding:'2px 8px',fontSize:'10px',fontWeight:700,color:C.muted}}>{d.summoner.summonerLevel}</div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:'26px',fontWeight:800}}>{d.account.gameName}<span style={{color:C.muted,fontWeight:400}}>#{d.account.tagLine}</span></div>
          <div style={{color:C.muted,fontSize:'13px',marginTop:'2px'}}>{platform.toUpperCase()}</div>
          {titles.length>0 && <div style={{display:'flex',gap:'6px',marginTop:'8px',flexWrap:'wrap'}}>
            {titles.map((t,i) => <span key={i} title={t.reason} style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:600,
              background:t.type==='positive'?'rgba(62,207,142,0.12)':t.type==='warning'?'rgba(247,90,90,0.12)':'rgba(139,145,168,0.12)',
              color:t.type==='positive'?C.win:t.type==='warning'?C.loss:C.muted}}>{t.label}</span>)}
          </div>}
        </div>
        <button onClick={() => window.location.reload()} style={{background:'#4f8ef7',border:'none',borderRadius:'10px',padding:'8px 20px',color:'#fff',fontWeight:600,cursor:'pointer',fontSize:'13px'}}>Update</button>
      </div>

      <div style={{display:'flex',borderBottom:C.border,marginBottom:'16px'}}>
        {([['overview','Overview'],['champions',`Champion Stats${totalLoaded>0?` (${totalLoaded})`:''}`]] as const).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{padding:'10px 20px',background:'transparent',border:'none',cursor:'pointer',
            fontSize:'14px',fontWeight:tab===k?600:400,color:tab===k?'#e8eaf2':C.muted,
            borderBottom:tab===k?'2px solid #4f8ef7':'2px solid transparent',marginBottom:'-1px'}}>{l}</button>
        ))}
      </div>

      {tab==='champions' ? <ChampionTab matches={allMatches} puuid={d.account.puuid} loading={statsLoading} total={totalLoaded}/> : (
        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:'14px'}}>
          <div>
            <div style={{...card,marginBottom:'12px'}}>
              {[{q:d.soloRank,l:'Ranked Solo/Duo'},{q:d.flexRank,l:'Ranked Flex'}].map(({q,l},i) => (
                <div key={i} style={{marginBottom:i===0?18:0,paddingBottom:i===0?18:0,borderBottom:i===0?C.border:'none'}}>
                  <div style={{fontSize:'10px',fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'1px',marginBottom:'10px'}}>{l}</div>
                  {q ? <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    <div style={{position:'relative',flexShrink:0}}>
                      <Ring pct={q.winrate} size={56}/>
                      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:700,color:q.winrate>=50?C.win:C.loss}}>{q.winrate}%</div>
                    </div>
                    <div>
                      <div style={{fontSize:'16px',fontWeight:700,color:tierColor}}>{q.tier} {q.rank}</div>
                      <div style={{fontSize:'12px',color:C.muted}}>{q.lp} LP</div>
                      <div style={{fontSize:'12px',marginTop:'3px'}}><span style={{color:C.win}}>{q.wins}W</span><span style={{color:C.muted}}> / </span><span style={{color:C.loss}}>{q.losses}L</span></div>
                    </div>
                  </div> : <div style={{color:C.muted,fontSize:'13px'}}>Unranked</div>}
                </div>
              ))}
            </div>
            <div style={{...card,marginBottom:'12px'}}>
              <div style={{fontSize:'10px',fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'1px',marginBottom:'12px'}}>Last {totalGames} Games (Ranked)</div>
              <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
                <div style={{position:'relative',flexShrink:0}}>
                  <Ring pct={totalGames?Math.round(totalWins/totalGames*100):0} size={68}/>
                  <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:(totalWins/totalGames)>=0.5?C.win:C.loss}}>{totalGames?Math.round(totalWins/totalGames*100):0}%</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'18px',fontWeight:700}}>{avgK} / <span style={{color:C.loss}}>{avgD}</span> / {avgA}</div>
                  <div style={{fontSize:'12px',color:C.muted,marginTop:'2px'}}>{avgKda} KDA</div>
                  <KdaBar k={Number(avgK)} d={Number(avgD)} a={Number(avgA)}/>
                </div>
              </div>
            </div>
            <div style={card}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                <div style={{fontSize:'10px',fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'1px'}}>
                  Most Played (Ranked) {statsLoading && <span style={{color:'#4f8ef7',marginLeft:'4px',fontWeight:400}}>loading…</span>}
                </div>
                <button onClick={() => setTab('champions')} style={{fontSize:'11px',color:'#4f8ef7',background:'transparent',border:'none',cursor:'pointer',fontWeight:600}}>See All →</button>
              </div>
              {champStats.length === 0 && statsLoading && <div style={{color:C.muted,fontSize:'12px'}}>Loading…</div>}
              {champStats.map(c => <div key={c.name} style={{display:'flex',alignItems:'center',gap:'10px',padding:'7px 0',borderBottom:C.border}}>
                <ChampImg name={c.name} size={36}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'13px',fontWeight:500}}>{c.name}</div>
                  <div style={{fontSize:'11px',color:C.muted}}>{c.kdaStr} KDA · {c.games}g</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'13px',fontWeight:700,color:c.wr>=60?C.win:c.wr>=50?C.gold:C.loss}}>{c.wr}%</div>
                  <div style={{fontSize:'10px',color:C.muted}}>{c.wins}W {c.games-c.wins}L</div>
                </div>
              </div>)}
            </div>
          </div>
          <div>
            <div style={{fontSize:'10px',fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'1px',marginBottom:'10px'}}>Match History · {d.recentMatches.length} recent ranked</div>
            {d.recentMatches.map(m => {
              const isOpen = expanded[m.matchId]
              const dur = `${Math.floor(m.gameDuration/60)}:${String(m.gameDuration%60).padStart(2,'0')}`
              return <div key={m.matchId} style={{...card,marginBottom:'6px',cursor:'pointer',borderLeft:`3px solid ${m.win?C.win:C.loss}`,
                background:m.win?'rgba(62,207,142,0.02)':'rgba(247,90,90,0.02)'}}
                onClick={() => setExpanded(e => ({...e,[m.matchId]:!e[m.matchId]}))}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                  <div style={{width:'48px',textAlign:'center',flexShrink:0}}>
                    <div style={{fontWeight:700,fontSize:'13px',color:m.win?C.win:C.loss}}>{m.win?'WIN':'LOSS'}</div>
                    <div style={{fontSize:'10px',color:C.muted,marginTop:'1px'}}>{dur}</div>
                  </div>
                  <ChampImg name={m.champion.name} size={44}/>
                  <div style={{minWidth:'120px',flexShrink:0}}>
                    <div style={{fontSize:'15px',fontWeight:700}}>{m.kda.kills} / <span style={{color:C.loss}}>{m.kda.deaths}</span> / {m.kda.assists}</div>
                    <div style={{fontSize:'11px',color:m.kda.ratio>=4?C.win:m.kda.ratio>=2?C.gold:C.muted}}>{m.kda.ratio === 999 ? '∞' : m.kda.ratio} KDA</div>
                    <KdaBar k={m.kda.kills} d={m.kda.deaths} a={m.kda.assists}/>
                  </div>
                  <div style={{fontSize:'11px',color:C.muted,minWidth:'90px',flexShrink:0}}>
                    <div>{m.cs.total} CS <span style={{color:'#3a4060'}}>({m.cs.perMin}/m)</span></div>
                    <div>KP <span style={{color:'#e8eaf2',fontWeight:500}}>{m.killParticipation}%</span></div>
                    <div>{m.vision} vision</div>
                  </div>
                  <div style={{flexShrink:0}}>
                    <div style={{display:'flex',gap:'3px'}}>
                      {m.items.map((it,i) => <div key={i} style={{width:'26px',height:'26px',borderRadius:'5px',background:C.bg3,border:C.border,overflow:'hidden'}}>
                        {it>0 && <img src={itemIcon(it)} alt="" style={{width:'100%',height:'100%'}} onError={(e:any)=>e.target.style.display='none'}/>}
                      </div>)}
                    </div>
                    <div style={{display:'flex',gap:'4px',marginTop:'4px'}}>
                      {m.multikills.penta>0 && <span style={{background:'rgba(240,192,64,0.15)',color:C.gold,fontSize:'10px',fontWeight:700,padding:'2px 6px',borderRadius:'8px'}}>PENTA!</span>}
                      {m.multikills.quadra>0 && <span style={{background:'rgba(79,142,247,0.1)',color:'#4f8ef7',fontSize:'10px',fontWeight:600,padding:'2px 6px',borderRadius:'8px'}}>Quadra</span>}
                      {m.multikills.triple>0 && <span style={{background:'rgba(79,142,247,0.1)',color:'#4f8ef7',fontSize:'10px',fontWeight:600,padding:'2px 6px',borderRadius:'8px'}}>Triple</span>}
                      {m.position!=='UNKNOWN' && <span style={{background:C.bg3,color:C.muted,fontSize:'10px',padding:'2px 6px',borderRadius:'8px'}}>{m.position}</span>}
                    </div>
                  </div>
                  <div style={{marginLeft:'auto',flexShrink:0}} onClick={e => e.stopPropagation()}>
                    <TeamsPreview m={m} platform={platform} myPuuid={d.account.puuid}/>
                  </div>
                  <div style={{color:C.muted,fontSize:'11px',flexShrink:0}}>{isOpen?'▲':'▼'}</div>
                </div>
                {isOpen && <Scoreboard m={m} myPuuid={d.account.puuid} platform={platform}/>}
              </div>
            })}
          </div>
        </div>
      )}
    </div>
  </main>
}
