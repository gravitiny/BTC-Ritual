import { supabase } from './supabase';

const crownScores: Record<string, number> = {
  green: 1,
  blue: 5,
  purple: 20,
  orange: 100,
  prism: 500,
  fragment: 0,
};

export const getChampionBoard = async () => {
  const { data: crowns, error } = await supabase
    .from('crown_events')
    .select('user_id,tier_id,count')
    .limit(10000);
  if (error) throw error;
  const scoreMap = new Map<string, number>();
  for (const row of crowns ?? []) {
    const score = (crownScores[row.tier_id] ?? 0) * (row.count ?? 0);
    scoreMap.set(row.user_id, (scoreMap.get(row.user_id) ?? 0) + score);
  }
  const { data: users } = await supabase.from('users').select('id,wallet_address,display_name');
  return Array.from(scoreMap.entries())
    .map(([userId, score]) => {
      const user = users?.find((u) => u.id === userId);
      return {
        userId,
        score,
        displayName: user?.display_name ?? user?.wallet_address ?? 'Unknown',
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
};

export const getWinRateBoard = async (mode: 'winrate' | 'clown') => {
  const { data: trades, error } = await supabase
    .from('trades')
    .select('user_id,status')
    .in('status', ['success', 'fail', 'aborted'])
    .limit(20000);
  if (error) throw error;
  const stats = new Map<string, { wins: number; losses: number }>();
  for (const row of trades ?? []) {
    const entry = stats.get(row.user_id) ?? { wins: 0, losses: 0 };
    if (row.status === 'success') entry.wins += 1;
    else entry.losses += 1;
    stats.set(row.user_id, entry);
  }
  const { data: users } = await supabase.from('users').select('id,wallet_address,display_name');
  const ranked = Array.from(stats.entries()).map(([userId, entry]) => {
    const total = entry.wins + entry.losses;
    const ratio = total === 0 ? 0 : entry.wins / total;
    const clownRatio = total === 0 ? 0 : entry.losses / total;
    const user = users?.find((u) => u.id === userId);
    return {
      userId,
      displayName: user?.display_name ?? user?.wallet_address ?? 'Unknown',
      wins: entry.wins,
      losses: entry.losses,
      ratio: mode === 'winrate' ? ratio : clownRatio,
    };
  });
  return ranked.sort((a, b) => b.ratio - a.ratio).slice(0, 50);
};
