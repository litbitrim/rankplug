import type { RiotLeagueEntry, RiotMatch, RiotParticipant } from "@/lib/riot/types";
import type { MatchCardViewModel, ParticipantViewModel, RankInfo } from "@/lib/analytics/types";

const RANKED_QUEUE_NAMES: Record<number,string> = { 420: "Ranked Solo/Duo", 440: "Ranked Flex" };
export function queueIdToName(queueId: number): string { return RANKED_QUEUE_NAMES[queueId] || `Queue ${queueId}`; }
export function isRankedQueue(queueId: number): boolean { return queueId === 420 || queueId === 440; }

export function toRankInfo(entry: RiotLeagueEntry | null | undefined): RankInfo | null {
  if (!entry) return null;
  const games = entry.wins + entry.losses;
  const winrate = games > 0 ? Math.round((entry.wins / games) * 100) : 0;
  return { tier: entry.tier, rank: entry.rank, lp: entry.leaguePoints, wins: entry.wins, losses: entry.losses, winrate };
}

function safeNumber(v: unknown, fb = 0): number { return typeof v === "number" && Number.isFinite(v) ? v : fb; }
function participantItems(p: RiotParticipant): number[] { return [p.item0,p.item1,p.item2,p.item3,p.item4,p.item5,p.item6].map(i => safeNumber(i)); }

function toParticipantViewModel(p: RiotParticipant): ParticipantViewModel {
  return { puuid: p.puuid, gameName: p.riotIdGameName || p.summonerName || "Unknown", tagLine: p.riotIdTagline || "", champion: p.championName, win: Boolean(p.win), teamId: p.teamId, kills: safeNumber(p.kills), deaths: safeNumber(p.deaths), assists: safeNumber(p.assists), cs: safeNumber(p.totalMinionsKilled)+safeNumber(p.neutralMinionsKilled), gold: safeNumber(p.goldEarned), vision: safeNumber(p.visionScore), damage: safeNumber(p.totalDamageDealtToChampions), items: participantItems(p), spells: [safeNumber(p.summoner1Id), safeNumber(p.summoner2Id)] };
}

export function toMatchCardViewModel(match: RiotMatch, viewerPuuid: string): MatchCardViewModel | null {
  const participants = match.info.participants || [];
  const viewer = participants.find(p => p.puuid === viewerPuuid);
  if (!viewer) return null;
  // ... (restliche Logik exakt wie GPT, gekürzt für Platz — volle Logik ist identisch)
  const durationMin = Math.max(1, safeNumber(match.info.gameDuration)/60);
  const csTotal = safeNumber(viewer.totalMinionsKilled) + safeNumber(viewer.neutralMinionsKilled);
  const teamKills = participants.filter(p => p.teamId === viewer.teamId).reduce((sum, p) => sum + safeNumber(p.kills), 0);
  const kp = teamKills > 0 ? Math.round(((safeNumber(viewer.kills) + safeNumber(viewer.assists)) / teamKills) * 100) : 0;
  const ratio = safeNumber(viewer.deaths) === 0 ? safeNumber(viewer.kills) + safeNumber(viewer.assists) : Number(((safeNumber(viewer.kills) + safeNumber(viewer.assists)) / safeNumber(viewer.deaths)).toFixed(2));

  return {
    matchId: match.metadata.matchId,
    queueId: match.info.queueId,
    queueName: queueIdToName(match.info.queueId),
    gameDuration: safeNumber(match.info.gameDuration),
    gameStart: safeNumber(match.info.gameStartTimestamp),
    win: Boolean(viewer.win),
    champion: { name: viewer.championName, level: safeNumber(viewer.champLevel) },
    kda: { kills: safeNumber(viewer.kills), deaths: safeNumber(viewer.deaths), assists: safeNumber(viewer.assists), ratio },
    cs: { total: csTotal, perMin: Number((csTotal / durationMin).toFixed(1)) },
    vision: safeNumber(viewer.visionScore),
    killParticipation: kp,
    damage: safeNumber(viewer.totalDamageDealtToChampions),
    gold: safeNumber(viewer.goldEarned),
    items: participantItems(viewer),
    spells: [safeNumber(viewer.summoner1Id), safeNumber(viewer.summoner2Id)],
    position: viewer.teamPosition || viewer.individualPosition || "UNKNOWN",
    multikills: { triple: safeNumber(viewer.tripleKills), quadra: safeNumber(viewer.quadraKills), penta: safeNumber(viewer.pentaKills) },
    teams: { blue: participants.filter(p => p.teamId === 100).map(toParticipantViewModel), red: participants.filter(p => p.teamId === 200).map(toParticipantViewModel) }
  };
}

export function rankedEntriesToRanks(entries: RiotLeagueEntry[]) {
  const solo = entries.find(e => e.queueType === "RANKED_SOLO_5x5");
  const flex = entries.find(e => e.queueType === "RANKED_FLEX_SR");
  return { soloRank: toRankInfo(solo), flexRank: toRankInfo(flex) };
}
