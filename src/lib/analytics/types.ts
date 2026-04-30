export type RankInfo = { tier: string; rank: string; lp: number; wins: number; losses: number; winrate: number }
export type ParticipantViewModel = {
  puuid: string; gameName: string; tagLine: string; champion: string
  win: boolean; teamId: 100|200
  kills: number; deaths: number; assists: number
  cs: number; gold: number; vision: number; damage: number
  items: number[]; spells: [number,number]
}
export type MatchCardViewModel = {
  matchId: string; queueId: number; queueName: string
  gameDuration: number; gameStart: number; win: boolean
  champion: { name: string; level: number }
  kda: { kills: number; deaths: number; assists: number; ratio: number }
  cs: { total: number; perMin: number }
  vision: number; killParticipation: number; damage: number; gold: number
  items: number[]; spells: [number,number]; position: string
  multikills: { triple: number; quadra: number; penta: number }
  teams: { blue: ParticipantViewModel[]; red: ParticipantViewModel[] }
}
export type ProfileViewModel = {
  account: { gameName: string; tagLine: string; puuid: string }
  summoner: { profileIconId: number; summonerLevel: number }
  soloRank: RankInfo|null; flexRank: RankInfo|null
  liveGame: { active: boolean }|null
  recentMatches: MatchCardViewModel[]
  puuid: string; platform: string
}
export type StatsChunkViewModel = {
  matches: MatchCardViewModel[]; done: boolean; nextStart: number; fetched: number
}
