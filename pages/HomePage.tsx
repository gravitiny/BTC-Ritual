import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { CROWN_TIERS, DEFAULT_MARGIN_USD, LEVERAGE } from '../constants';
import { getCrownTierById, getLuckSummary, getStreakDays, getSuccessRate, getTodayCount } from '../utils';
import { StatCard } from '../components/StatCard';
import { getTierText, t } from '../i18n';

export const HomePage: React.FC = () => {
  const history = useAppStore((state) => state.historySessions);
  const lastSession = useAppStore((state) => state.lastSession);
  const crownInventory = useAppStore((state) => state.crownInventory);
  const lastCrownEvent = useAppStore((state) => state.lastCrownEvent);
  const setRoute = useAppStore((state) => state.setRoute);
  const language = useAppStore((state) => state.language);

  const luck = getLuckSummary(lastSession, language);

  return (
    <div className="flex flex-col gap-6">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[32px] border-4 border-primary bg-black/60 p-6 shadow-[0_0_30px_rgba(205,43,238,0.35)]"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-mono uppercase text-primary/80">5U Warlord · BTC</div>
            <h2 className="text-3xl font-black uppercase leading-tight md:text-4xl font-display">
              {language === 'en' ? `Crush it with ${LEVERAGE}x` : `用 ${LEVERAGE}x 打出战绩`}
              <span className="ml-2">⚔️</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              {language === 'en'
                ? `BTC only. Default margin ${DEFAULT_MARGIN_USD}U, leverage ${LEVERAGE}x. Pick side and target.`
                : `标的 BTC，默认保证金 ${DEFAULT_MARGIN_USD}U，杠杆 ${LEVERAGE}x。选择方向与目标，直接开战。`}
            </p>
          </div>
          <button
            onClick={() => setRoute('/trade')}
            className="rounded-full border-4 border-white bg-primary px-8 py-4 text-lg font-black uppercase text-black shadow-[0_0_30px_rgba(205,43,238,0.6)] transition-all hover:-translate-y-1 hover:scale-105"
          >
            {t(language, 'trade.submit')}
          </button>
        </div>
      </motion.section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={t(language, 'history.stats.streak')} value={`${getStreakDays(history)} ${t(language, 'units.days')}`} emoji="🔥" />
        <StatCard label={t(language, 'history.stats.successRate')} value={`${getSuccessRate(history)}%`} emoji="🎯" />
        <StatCard label={t(language, 'history.stats.todayCount')} value={`${getTodayCount(history)} ${t(language, 'units.times')}`} emoji="🧃" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border-2 border-white/10 bg-black/40 p-6">
          <h3 className="text-lg font-black uppercase">{language === 'en' ? 'Today luck' : '今日手气'}</h3>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-4xl">{luck.emoji}</span>
            <div>
              <div className="text-2xl font-black uppercase">{luck.label}</div>
              <div className="text-xs font-mono uppercase text-white/50">{t(language, 'run.blink')}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase">
            {CROWN_TIERS.filter((tier) => crownInventory[tier.id] > 0).map((tier) => {
              const tierText = getTierText(tier, language);
              return (
                <div
                  key={tier.id}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 ${tier.badge} ${tier.color}`}
                >
                  {tier.emoji} {tierText.label} x{crownInventory[tier.id]}
                </div>
              );
            })}
            {CROWN_TIERS.every((tier) => crownInventory[tier.id] === 0) && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-bold uppercase text-white/60">
                {t(language, 'history.empty')}
              </div>
            )}
          </div>
          {lastCrownEvent && lastCrownEvent.upgrades.length > 0 && (
            <div className="mt-3 text-xs font-mono uppercase text-white/50">
              {t(language, 'result.label.combine')}：
              {lastCrownEvent.upgrades
                .map((id) => getTierText(getCrownTierById(id), language).label)
                .join(' + ')}
            </div>
          )}
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs font-mono uppercase text-white/50">{language === 'en' ? 'Crown guide' : '冠冕说明'}</div>
            <div className="mt-3 grid gap-2 text-xs text-white/70 md:grid-cols-2">
              {CROWN_TIERS.map((tier) => {
                const tierText = getTierText(tier, language);
                return (
                  <div key={tier.id} className={`rounded-2xl border px-3 py-2 ${tier.badge} ${tier.color}`}>
                    <div className="flex items-center gap-2 font-bold uppercase">
                      <span className="text-base">{tier.emoji}</span>
                      <span>{tierText.label}</span>
                      <span className="text-white/50">· {tierText.name}</span>
                    </div>
                    <div className="mt-1 text-[10px] uppercase text-white/50">
                      {tierText.nickname} · {language === 'en' ? 'Luck' : '好运'} {tierText.luck}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="rounded-3xl border-2 border-white/10 bg-black/40 p-6">
          <h3 className="text-lg font-black uppercase">{language === 'en' ? 'How it works' : '玩法说明'}</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>{language === 'en' ? 'Enter margin, fixed 40x' : '输入保证金，固定 40x'}</li>
            <li>{language === 'en' ? 'Pick side and target multiple' : '选择方向与翻倍目标'}</li>
            <li>{language === 'en' ? 'TP or liquidation ends the run' : '命中止盈或爆仓即结算'}</li>
            <li>{language === 'en' ? 'Records & honors keep stacking' : '战绩与荣誉持续累计'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
