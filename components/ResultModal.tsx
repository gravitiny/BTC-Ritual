import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../store';
import { RESULT_COPY } from '../constants';
import { EmojiBurst } from './EmojiBurst';
import { formatPrice, getCrownTierById } from '../utils';

interface ResultModalProps {
  open: boolean;
  onClose: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ open, onClose }) => {
  const lastSession = useAppStore((state) => state.lastSession);
  const lastCrownEvent = useAppStore((state) => state.lastCrownEvent);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!open) return;
    setShowDetails(false);
    const timer = window.setTimeout(() => setShowDetails(true), 1800);
    return () => window.clearTimeout(timer);
  }, [open, lastSession?.id, lastCrownEvent?.createdAt]);

  if (!open || !lastSession || !lastCrownEvent) return null;

  const status = lastSession.status;
  const awardedTier = getCrownTierById(lastCrownEvent.awardedTierId);
  const rewardLabel = `获得${awardedTier.label} x${lastCrownEvent.awardedCount}`;
  const copyList = RESULT_COPY[status] || RESULT_COPY.aborted;
  const copy = copyList[Math.floor(Math.random() * copyList.length)];
  const upgradeSummary =
    lastCrownEvent.upgrades.length > 0
      ? lastCrownEvent.upgrades.reduce<Record<string, number>>((acc, tierId) => {
          acc[tierId] = (acc[tierId] ?? 0) + 1;
          return acc;
        }, {})
      : null;

  const toneStyles = {
    success: 'border-success bg-success/10',
    fail: 'border-failure bg-failure/10',
    aborted: 'border-white/20 bg-black/60',
  } as const;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`relative w-full max-w-xl overflow-hidden rounded-[32px] border-4 p-8 text-center shadow-[0_0_30px_rgba(0,0,0,0.4)] ${toneStyles[status]}`}
        >
          <EmojiBurst emojis={status === 'success' ? ['🎊', '✨', '💥'] : status === 'fail' ? ['💩', '💣', '😵'] : ['🫥', '🧊']} tone={status} />
          {!showDetails ? (
            <div className="flex flex-col items-center gap-4">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}>
                {lastCrownEvent.awardedTierId === 'fragment' ? '🧩' : '👑'}
              </motion.div>
              <div className="text-lg font-black uppercase">结算中...</div>
              <div className={`rounded-full border px-4 py-2 text-xs font-bold uppercase ${awardedTier.badge} ${awardedTier.color}`}>
                {rewardLabel}
              </div>
            </div>
          ) : (
            <>
              <div className="text-6xl">{status === 'success' ? '🎊' : status === 'fail' ? '💩' : '🫥'}</div>
              <h2 className="mt-4 text-3xl font-black uppercase">{status === 'success' ? '好运命中' : status === 'fail' ? '爆仓来袭' : '中止结算'}</h2>
              <p className="mt-2 text-sm text-white/70">{copy}</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs uppercase">
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2">方向 {lastSession.side}</div>
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2">目标 {lastSession.targetProfitUsd}U</div>
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2">开仓 {formatPrice(lastSession.entryPrice)}</div>
                <div className={`rounded-2xl border px-4 py-2 ${awardedTier.badge} ${awardedTier.color}`}>
                  奖励 {awardedTier.label} +{lastCrownEvent.awardedCount}
                </div>
                {upgradeSummary && (
                  <div className="rounded-2xl border border-white/20 bg-black/40 px-4 py-2 text-white/70">
                    合成{' '}
                    {Object.entries(upgradeSummary)
                      .map(([tierId, count]) => `${getCrownTierById(tierId as any).label} x${count}`)
                      .join(' + ')}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="mt-8 rounded-full border-4 border-white bg-primary px-8 py-4 text-lg font-black uppercase text-black shadow-[0_0_30px_rgba(205,43,238,0.6)] transition-all hover:-translate-y-1"
              >
                回到首页 🏠
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
