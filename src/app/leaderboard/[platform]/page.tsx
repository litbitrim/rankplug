import { Suspense } from "react";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#0a0b0f] p-6 text-slate-400">Loading leaderboard...</main>}>
      <LeaderboardClient />
    </Suspense>
  );
}
