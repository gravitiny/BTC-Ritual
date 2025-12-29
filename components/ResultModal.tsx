import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../store';
import { RESULT_COPY } from '../constants';
import { EmojiBurst } from './EmojiBurst';
import { formatPrice, getCrownTierById } from '../utils';
import { getTierText, t } from '../i18n';

interface ResultModalProps {
  open: boolean;
  onClose: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ open, onClose }) => {
  const lastSession = useAppStore((state) => state.lastSession);
  const lastCrownEvent = useAppStore((state) => state.lastCrownEvent);
  const language = useAppStore((state) => state.language);
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
  const awardedText = getTierText(awardedTier, language);
  const rewardLabel = t(language, 'result.rewardLabel', {
    label: awardedText.label,
    count: lastCrownEvent.awardedCount,
  });
  const copyList = RESULT_COPY[language]?.[status] || RESULT_COPY[language].aborted;
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
              <div className="text-lg font-black uppercase">{t(language, 'result.settling')}</div>
              <div className={`rounded-full border px-4 py-2 text-xs font-bold uppercase ${awardedTier.badge} ${awardedTier.color}`}>
                {rewardLabel}
              </div>
            </div>
          ) : (
            <>
              <div className="text-6xl">{status === 'success' ? '🎊' : status === 'fail' ? '💥' : '🫥'}</div>
              <h2 className="mt-4 text-3xl font-black uppercase">{t(language, `result.title.${status}`)}</h2>
              <p className="mt-2 text-sm text-white/70">{copy}</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs uppercase">
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2">
                  {t(language, 'result.label.side', { side: lastSession.side })}
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2">
                  {t(language, 'result.label.target', { target: lastSession.targetProfitUsd.toFixed(3) })}
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2">
                  {t(language, 'result.label.entry', { price: formatPrice(lastSession.entryPrice) })}
                </div>
                <div className={`rounded-2xl border px-4 py-2 ${awardedTier.badge} ${awardedTier.color}`}>
                  {t(language, 'result.label.reward', { label: awardedText.label, count: lastCrownEvent.awardedCount })}
                </div>
                {upgradeSummary && (
                  <div className="rounded-2xl border border-white/20 bg-black/40 px-4 py-2 text-white/70">
                    {t(language, 'result.label.combine')}{' '}
                    {Object.entries(upgradeSummary)
                      .map(([tierId, count]) => {
                        const tierText = getTierText(getCrownTierById(tierId as any), language);
                        return `${tierText.label} x${count}`;
                      })
                      .join(' + ')}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="mt-8 rounded-full border-4 border-white bg-primary px-8 py-4 text-lg font-black uppercase text-black shadow-[0_0_30px_rgba(205,43,238,0.6)] transition-all hover:-translate-y-1"
              >
                {t(language, 'result.backHome')}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
