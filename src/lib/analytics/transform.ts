import type { RiotLeagueEntry, RiotMatch, RiotParticipant } from "@/lib/riot/types";
import type { MatchCardViewModel, ParticipantViewModel, RankInfo } from "@/lib/analytics/types";

const QUEUE_NAMES: Record<number, string> = {
  420: "Ranked Solo/Duo",
  440: "Ranked Flex",
};

export function queueIdToName(queueId: number): string {
  return QUEUE_NAMES[queueId] || `Queue ${queueId}`;
}

export function isRankedQueue(queueId: number): boolean {
  return queueId === 420 || queueId === 440;
}

export function toRankInfo(entry: RiotLeagueEntry | null | undefined): RankInfo | null {
  if (!entry) return null;
  const games = entry.wins + entry.losses;
  return {
    tier: entry.tier,
    rank: entry.rank,
    lp: entry.leaguePoints,
    wins: entry.wins,
    losses: entry.losses,
    winrate: games > 0 ? Math.round((entry.wins / games) * 100) : 0,
  };
}

function n(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function items(p: RiotParticipant): number[] {
  return [n(p.item0), n(p.item1), n(p.item2), n(p.item3), n(p.item4), n(p.item5), n(p.item6)];
}

function pname(p: RiotParticipant) {
  return {
    gameName: p.riotIdGameName || p.summonerName || "Unknown",
    tagLine: p.riotIdTagline || "",
  };
}

function toParticipantVM(p: RiotParticipant): ParticipantViewModel {
  const name = pname(p);
  return {
    puuid: p.puuid,
    gameName: name.gameName,
    tagLine: name.tagLine,
    champion: p.championName,
    win: Boolean(p.win),
    teamId: p.teamId,
    kills: n(p.kills),
    deaths: n(p.deaths),
    assists: n(p.assists),
    cs: n(p.totalMinionsKilled) + n(p.neutralMinionsKilled),
    gold: n(p.goldEarned),
    vision: n(p.visionScore),
    damage: n(p.totalDamageDealtToChampions),
    items: items(p),
    spells: [n(p.summoner1Id), n(p.summoner2Id)],
  };
}

export function toMatchCardViewModel(match: RiotMatch, viewerPuuid: string): MatchCardViewModel | null {
  if (!isRankedQueue(match.info.queueId)) return null;

  const participants = match.info.participants || [];
  const me = participants.find((p) => p.puuid === viewerPuuid);
  if (!me) return null;

  const durationSec = Math.max(1, n(match.info.gameDuration, 1));
  const durationMin = durationSec / 60;
  const cs = n(me.totalMinionsKilled) + n(me.neutralMinionsKilled);
  const teamKills = participants
    .filter((p) => p.teamId === me.teamId)
    .reduce((sum, p) => sum + n(p.kills), 0);

  const kp = teamKills > 0 ? Math.round(((n(me.kills) + n(me.assists)) / teamKills) * 100) : 0;
  const deaths = n(me.deaths);
  const ratio = deaths === 0
    ? n(me.kills) + n(me.assists)
    : Number(((n(me.kills) + n(me.assists)) / deaths).toFixed(2));

  const blue = participants.filter((p) => p.teamId === 100).map(toParticipantVM);
  const red = participants.filter((p) => p.teamId === 200).map(toParticipantVM);

  return {
    matchId: match.metadata.matchId,
    queueId: match.info.queueId,
    queueName: queueIdToName(match.info.queueId),
    gameDuration: durationSec,
    gameStart: n(match.info.gameStartTimestamp || match.info.gameCreation),
    win: Boolean(me.win),
    champion: {
      name: me.championName,
      level: n(me.champLevel),
    },
    kda: {
      kills: n(me.kills),
      deaths,
      assists: n(me.assists),
      ratio,
    },
    cs: {
      total: cs,
      perMin: Number((cs / durationMin).toFixed(1)),
    },
    vision: n(me.visionScore),
    killParticipation: kp,
    damage: n(me.totalDamageDealtToChampions),
    gold: n(me.goldEarned),
    items: items(me),
    spells: [n(me.summoner1Id), n(me.summoner2Id)],
    position: me.teamPosition || me.individualPosition || "UNKNOWN",
    multikills: {
      triple: n(me.tripleKills),
      quadra: n(me.quadraKills),
      penta: n(me.pentaKills),
    },
    teams: { blue, red },
  };
}

export function rankedEntriesToRanks(entries: RiotLeagueEntry[]) {
  return {
    soloRank: toRankInfo(entries.find((e) => e.queueType === "RANKED_SOLO_5x5")),
    flexRank: toRankInfo(entries.find((e) => e.queueType === "RANKED_FLEX_SR")),
  };
}
