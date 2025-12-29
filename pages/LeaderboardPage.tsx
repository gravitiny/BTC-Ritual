import React, { useMemo, useState } from 'react';
import { CROWN_TIERS } from '../constants';
import { useAppStore } from '../store';
import { CrownInventory } from '../types';
import { getTierText, t } from '../i18n';

const crownScoreMap: Record<keyof CrownInventory, number> = {
  fragment: 0,
  green: 1,
  blue: 5,
  purple: 20,
  orange: 100,
  prism: 500,
};

const buildInventory = (overrides: Partial<CrownInventory>): CrownInventory => ({
  fragment: 0,
  green: 0,
  blue: 0,
  purple: 0,
  orange: 0,
  prism: 0,
  ...overrides,
});

const mockChampionData = {
  zh: [
    { name: '火箭哥', inventory: buildInventory({ green: 6, blue: 3, purple: 2, orange: 1 }) },
    { name: '反杀王', inventory: buildInventory({ green: 12, blue: 6, purple: 1 }) },
    { name: '顶级战神', inventory: buildInventory({ green: 2, blue: 4, purple: 3, orange: 1, prism: 1 }) },
    { name: '夜航鲸', inventory: buildInventory({ green: 18, blue: 5, purple: 2 }) },
    { name: '土味卷王', inventory: buildInventory({ green: 20, blue: 8 }) },
  ],
  en: [
    { name: 'Rocket Bro', inventory: buildInventory({ green: 6, blue: 3, purple: 2, orange: 1 }) },
    { name: 'Clutch King', inventory: buildInventory({ green: 12, blue: 6, purple: 1 }) },
    { name: 'Top Warlord', inventory: buildInventory({ green: 2, blue: 4, purple: 3, orange: 1, prism: 1 }) },
    { name: 'Night Whale', inventory: buildInventory({ green: 18, blue: 5, purple: 2 }) },
    { name: 'Grind Lord', inventory: buildInventory({ green: 20, blue: 8 }) },
  ],
};

const mockWinRateData = {
  zh: [
    { name: '稳定哥', wins: 32, losses: 6 },
    { name: '神速姐', wins: 19, losses: 4 },
    { name: '风控王', wins: 11, losses: 3 },
    { name: '双倍跳', wins: 25, losses: 8 },
    { name: '手感帝', wins: 17, losses: 6 },
  ],
  en: [
    { name: 'Stable Guy', wins: 32, losses: 6 },
    { name: 'Speed Queen', wins: 19, losses: 4 },
    { name: 'Risk Master', wins: 11, losses: 3 },
    { name: 'Double Jump', wins: 25, losses: 8 },
    { name: 'Hot Hand', wins: 17, losses: 6 },
  ],
};

const mockClownData = {
  zh: [
    { name: '反向锦鲤', wins: 2, losses: 19 },
    { name: '爆仓侠', wins: 4, losses: 23 },
    { name: '又怂又刚', wins: 3, losses: 15 },
    { name: '梭哈怪', wins: 5, losses: 24 },
    { name: '空单倒霉', wins: 6, losses: 25 },
  ],
  en: [
    { name: 'Reverse Luck', wins: 2, losses: 19 },
    { name: 'Liquidator', wins: 4, losses: 23 },
    { name: 'Brave & Scared', wins: 3, losses: 15 },
    { name: 'All-in Beast', wins: 5, losses: 24 },
    { name: 'Short Misery', wins: 6, losses: 25 },
  ],
};

export const LeaderboardPage: React.FC = () => {
  const crownInventory = useAppStore((state) => state.crownInventory);
  const language = useAppStore((state) => state.language);
  const [leaderboardTab, setLeaderboardTab] = useState<'champions' | 'winrate' | 'clown'>('champions');

  const topRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const topRankClass = (rank: number) => {
    if (rank === 1) return 'border-yellow-400/60 bg-yellow-400/10 shadow-[0_0_24px_rgba(250,204,21,0.35)]';
    if (rank === 2) return 'border-slate-300/60 bg-slate-200/10 shadow-[0_0_24px_rgba(226,232,240,0.25)]';
    if (rank === 3) return 'border-orange-300/70 bg-orange-400/10 shadow-[0_0_24px_rgba(251,146,60,0.3)]';
    return 'border-white/10 bg-black/60';
  };

  const championRows = useMemo(() => {
    const withUser = [{ name: t(language, 'misc.you'), inventory: crownInventory }, ...mockChampionData[language]];
    return withUser
      .map((entry) => {
        const score = Object.entries(entry.inventory).reduce(
          (sum, [tier, count]) => sum + (crownScoreMap[tier as keyof CrownInventory] ?? 0) * count,
          0
        );
        return { ...entry, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [crownInventory, language]);

  const winRateRows = useMemo(() => {
    return mockWinRateData[language]
      .map((entry) => ({
        ...entry,
        rate: (entry.wins / Math.max(entry.wins + entry.losses, 1)) * 100,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [language]);

  const clownRows = useMemo(() => {
    return mockClownData[language]
      .map((entry) => ({
        ...entry,
        rate: (entry.losses / Math.max(entry.wins + entry.losses, 1)) * 100,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [language]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border-2 border-white/10 bg-black/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black uppercase">{t(language, 'leaderboard.title')}</h2>
          <div className="text-xs font-mono uppercase text-white/50">{t(language, 'leaderboard.scoreRule')}</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { id: 'champions', label: t(language, 'leaderboard.tabs.champions') },
            { id: 'winrate', label: t(language, 'leaderboard.tabs.winrate') },
            { id: 'clown', label: t(language, 'leaderboard.tabs.clown') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLeaderboardTab(tab.id as 'champions' | 'winrate' | 'clown')}
              className={`rounded-full border px-4 py-2 text-xs font-bold uppercase transition-all ${
                leaderboardTab === tab.id
                  ? 'border-primary bg-primary text-black shadow-[0_0_18px_rgba(205,43,238,0.5)]'
                  : 'border-white/10 bg-black/30 text-white/60 hover:border-primary/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {leaderboardTab === 'champions' && (
          <div className="mt-4 grid gap-3">
            {championRows.map((entry, index) => {
              const rank = index + 1;
              return (
                <div
                  key={entry.name}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${topRankClass(rank)}`}
                >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black">{topRankBadge(rank)}</span>
                  <div>
                    <div className="font-bold uppercase">{entry.name}</div>
                    <div className="text-xs text-white/60">
                      {CROWN_TIERS.filter((tier) => tier.id !== 'fragment' && entry.inventory[tier.id] > 0)
                        .map((tier) => {
                          const tierText = getTierText(tier, language);
                          return `${tierText.label}x${entry.inventory[tier.id]}`;
                        })
                        .join(' · ') || t(language, 'leaderboard.noCrown')}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono uppercase text-white/50">
                  {t(language, 'leaderboard.score', { score: entry.score })}
                </div>
              </div>
              );
            })}
          </div>
        )}

        {leaderboardTab === 'winrate' && (
          <div className="mt-4 grid gap-3">
            {winRateRows.map((entry, index) => {
              const rank = index + 1;
              return (
                <div
                  key={entry.name}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${topRankClass(rank)}`}
                >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black">{topRankBadge(rank)}</span>
                  <div>
                    <div className="font-bold uppercase">{entry.name}</div>
                    <div className="text-xs text-white/60">
                      {t(language, 'leaderboard.record', { wins: entry.wins, losses: entry.losses })}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono uppercase text-white/50">
                  {t(language, 'leaderboard.winrate', { rate: entry.rate.toFixed(1) })}
                </div>
              </div>
              );
            })}
          </div>
        )}

        {leaderboardTab === 'clown' && (
          <div className="mt-4 grid gap-3">
            {clownRows.map((entry, index) => {
              const rank = index + 1;
              return (
                <div
                  key={entry.name}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${topRankClass(rank)}`}
                >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black">{topRankBadge(rank)}</span>
                  <div>
                    <div className="font-bold uppercase">{entry.name}</div>
                    <div className="text-xs text-white/60">
                      {t(language, 'leaderboard.record', { wins: entry.wins, losses: entry.losses })}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono uppercase text-white/50">
                  {t(language, 'leaderboard.clownrate', { rate: entry.rate.toFixed(1) })}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
