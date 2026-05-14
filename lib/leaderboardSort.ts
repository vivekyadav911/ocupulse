export type RankedEntry = {
  teamId: string;
  score: number;
  submittedAt: number;
};

/** Higher score wins; ties broken by earlier submission. */
export function sortLeaderboard(entries: RankedEntry[]): RankedEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.submittedAt - b.submittedAt;
  });
}
