export type RiotAccount = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

export type RiotSummoner = {
  id?: string;
  accountId?: string;
  puuid: string;
  profileIconId: number;
  revisionDate?: number;
  summonerLevel: number;
};

export type RiotLeagueEntry = {
  leagueId?: string;
  summonerId?: string;
  puuid?: string;
  queueType: "RANKED_SOLO_5x5" | "RANKED_FLEX_SR" | string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak?: boolean;
  veteran?: boolean;
  freshBlood?: boolean;
  inactive?: boolean;
};

export type RiotLeagueList = {
  tier: string;
  leagueId: string;
  queue: string;
  name: string;
  entries: Array<{
    summonerId: string;
    puuid?: string;
    leaguePoints: number;
    rank: string;
    wins: number;
    losses: number;
    hotStreak: boolean;
    veteran: boolean;
    freshBlood: boolean;
    inactive: boolean;
  }>;
};

export type RiotTeam = {
  teamId: 100 | 200;
  win: boolean;
  objectives?: Record<string, { first: boolean; kills: number }>;
};

export type RiotParticipant = {
  puuid: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  summonerName?: string;

  teamId: 100 | 200;
  win: boolean;

  championName: string;
  champLevel: number;
  teamPosition?: string;
  individualPosition?: string;

  kills: number;
  deaths: number;
  assists: number;

  totalMinionsKilled: number;
  neutralMinionsKilled: number;

  goldEarned: number;
  totalDamageDealtToChampions: number;
  visionScore: number;

  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;

  summoner1Id: number;
  summoner2Id: number;

  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
};

export type RiotMatch = {
  metadata: {
    dataVersion?: string;
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation?: number;
    gameStartTimestamp: number;
    gameEndTimestamp?: number;
    gameDuration: number;
    queueId: number;
    gameMode?: string;
    mapId?: number;
    participants: RiotParticipant[];
    teams?: RiotTeam[];
  };
};

export type RiotLiveGameParticipant = {
  puuid?: string;
  summonerId?: string;
  teamId: 100 | 200;
  championId: number;
  spell1Id: number;
  spell2Id: number;
  perks?: {
    perkIds: number[];
    perkStyle: number;
    perkSubStyle: number;
  };
};

export type RiotLiveGame = {
  gameId: number;
  mapId: number;
  gameMode: string;
  gameType: string;
  gameQueueConfigId: number;
  participants: RiotLiveGameParticipant[];
  gameStartTime: number;
  gameLength: number;
  bannedChampions?: Array<{
    championId: number;
    teamId: 100 | 200;
    pickTurn: number;
  }>;
};
