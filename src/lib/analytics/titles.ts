import type { MatchCardViewModel, PlayerTag } from "@/lib/analytics/types";

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function variance(nums: number[]) {
  const a = avg(nums);
  return avg(nums.map((x) => Math.pow(x - a, 2)));
}

export function derivePlayerTags(matches: MatchCardViewModel[]): PlayerTag[] {
  const sample = matches.slice(0, 20);
  if (sample.length < 3) {
    return [{
      id: "low_sample",
      label: "Low Sample",
      type: "neutral",
      score: 40,
      reason: "Not enough ranked games loaded yet.",
    }];
  }

  const tags: PlayerTag[] = [];
  const wr = Math.round((sample.filter((m) => m.win).length / sample.length) * 100);
  const avgKp = avg(sample.map((m) => m.killParticipation));
  const avgDeaths = avg(sample.map((m) => m.kda.deaths));
  const avgCs = avg(sample.map((m) => m.cs.perMin));
  const avgVision = avg(sample.map((m) => m.vision));
  const avgDamage = avg(sample.map((m) => m.damage / Math.max(1, m.gameDuration / 60)));
  const kdaVar = variance(sample.map((m) => m.kda.ratio));
  const champCount = new Set(sample.map((m) => m.champion.name)).size;

  if (wr >= 60) tags.push({ id: "hot_form", label: "Hot Form", type: "positive", score: wr, reason: `${wr}% winrate over recent ranked games.` });
  if (avgKp >= 60) tags.push({ id: "high_kp", label: "High KP", type: "positive", score: Math.round(avgKp), reason: `High kill participation: ${Math.round(avgKp)}%.` });
  if (avgCs >= 7.5) tags.push({ id: "strong_farming", label: "Strong Farming", type: "positive", score: Math.round(avgCs * 10), reason: `Strong CS/min: ${avgCs.toFixed(1)}.` });
  if (avgDamage >= 700) tags.push({ id: "carry_threat", label: "Carry Threat", type: "positive", score: 75, reason: `High damage output per minute.` });

  if (avgDeaths >= 7) tags.push({ id: "death_heavy", label: "Death Heavy", type: "negative", score: Math.round(avgDeaths * 10), reason: `High average deaths: ${avgDeaths.toFixed(1)}.` });
  if (avgVision <= 12) tags.push({ id: "low_vision", label: "Low Vision", type: "warning", score: 65, reason: `Low average vision score: ${avgVision.toFixed(1)}.` });
  if (kdaVar >= 8) tags.push({ id: "coinflip", label: "Coinflip", type: "warning", score: 70, reason: `Large performance swings across recent games.` });
  if (champCount >= Math.min(10, sample.length * 0.65)) tags.push({ id: "wide_pool", label: "Wide Champ Pool", type: "warning", score: 65, reason: `Many different champions in recent ranked games.` });

  if (!tags.length) tags.push({ id: "stable", label: "Stable", type: "neutral", score: 55, reason: "No extreme positive or negative pattern detected." });

  return tags.slice(0, 6);
}
