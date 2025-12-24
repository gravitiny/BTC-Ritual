import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { DEFAULT_MARGIN_USD, LEVERAGE } from '../constants';
import { getCrownTierById, getHighestCrownTier, getLuckSummary, getStreakDays, getSuccessRate, getTodayCount } from '../utils';
import { StatCard } from '../components/StatCard';

export const HomePage: React.FC = () => {
  const history = useAppStore((state) => state.historySessions);
  const lastSession = useAppStore((state) => state.lastSession);
  const crownInventory = useAppStore((state) => state.crownInventory);
  const lastCrownEvent = useAppStore((state) => state.lastCrownEvent);
  const setRoute = useAppStore((state) => state.setRoute);

  const luck = getLuckSummary(lastSession);
  const highestTierId = getHighestCrownTier(crownInventory);
  const highestTier = highestTierId ? getCrownTierById(highestTierId) : null;
  const crownCount = highestTierId ? crownInventory[highestTierId].intact : 0;

  return (
    <div className="flex flex-col gap-6">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[32px] border-4 border-primary bg-black/60 p-6 shadow-[0_0_30px_rgba(205,43,238,0.35)]"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-mono uppercase text-primary/80">每日实盘占卜 · LuckyTrade</div>
            <h2 className="text-3xl font-black uppercase leading-tight md:text-4xl font-display">
              用 100x 去问宇宙
              <span className="ml-2">🔮</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              标的 BTC，保证金 {DEFAULT_MARGIN_USD}U，杠杆 {LEVERAGE}x。你只需选择方向和目标收益。
            </p>
          </div>
          <button
            onClick={() => setRoute('/trade')}
            className="rounded-full border-4 border-white bg-primary px-8 py-4 text-lg font-black uppercase text-black shadow-[0_0_30px_rgba(205,43,238,0.6)] transition-all hover:-translate-y-1 hover:scale-105"
          >
            开始占卜下单 🎲
          </button>
        </div>
      </motion.section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="连续天数" value={`${getStreakDays(history)} 天`} emoji="🔥" />
        <StatCard label="成功率" value={`${getSuccessRate(history)}%`} emoji="🎯" />
        <StatCard label="今日次数" value={`${getTodayCount(history)} 次`} emoji="🧃" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border-2 border-white/10 bg-black/40 p-6">
          <h3 className="text-lg font-black uppercase">今日手气</h3>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-4xl">{luck.emoji}</span>
            <div>
              <div className="text-2xl font-black uppercase">{luck.label}</div>
              <div className="text-xs font-mono uppercase text-white/50">别眨眼！</div>
            </div>
          </div>
          {highestTier ? (
            <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase ${highestTier.badge} ${highestTier.color}`}>
              👑 好运皇冠 · {highestTier.name} · x{crownCount}
            </div>
          ) : (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-bold uppercase text-white/60">
              👑 还没有皇冠，先来一单
            </div>
          )}
          {lastCrownEvent && lastCrownEvent.upgrades.length > 0 && (
            <div className="mt-3 text-xs font-mono uppercase text-white/50">
              合成完成：{lastCrownEvent.upgrades.map((tierId) => getCrownTierById(tierId).label).join(' + ')}
            </div>
          )}
        </div>
        <div className="rounded-3xl border-2 border-white/10 bg-black/40 p-6">
          <h3 className="text-lg font-black uppercase">玩法说明</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>选择 Long / Short + 目标收益</li>
            <li>进入 Run 页看价格跳动与相对位置条</li>
            <li>命中止盈或爆仓即结算</li>
            <li>不做每日限制，梗多多益善</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
