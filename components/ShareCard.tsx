import React from 'react';
import { TradeSession } from '../types';
import { calculatePnlUsd, formatPrice, getCrownTier, getCrownTierById } from '../utils';
import { getTierText, t } from '../i18n';
import { useAppStore } from '../store';

interface ShareCardProps {
  session: TradeSession;
}

export const ShareCard: React.FC<ShareCardProps> = ({ session }) => {
  const language = useAppStore((state) => state.language);
  const status = session.status === 'running' ? 'running' : session.status;
  const statusLabel = t(language, `share.${status}`);
  const pnl = calculatePnlUsd(session);
  const awardedTier = status === 'success' ? getCrownTier(session.tpMultiple ?? 1) : getCrownTierById('fragment');
  const tierText = getTierText(awardedTier, language);

  return (
    <div className="flex h-[560px] w-[960px] flex-col justify-between rounded-[32px] border-4 border-primary bg-gradient-to-br from-black via-[#100017] to-[#1d0128] p-10 text-white shadow-[0_0_40px_rgba(205,43,238,0.45)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-mono uppercase text-primary/80">{t(language, 'share.shareCardSub')}</div>
          <div className="text-4xl font-black uppercase">{t(language, 'share.shareCardTitle')}</div>
        </div>
        <div className="rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-bold uppercase text-white/80">
          {statusLabel}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
          <div className="text-xs font-mono uppercase text-white/50">{t(language, 'trade.direction')}</div>
          <div className="mt-2 text-3xl font-black uppercase">{session.side}</div>
          <div className="mt-4 text-xs font-mono uppercase text-white/50">{t(language, 'trade.multiple')}</div>
          <div className="mt-2 text-2xl font-black">x{session.tpMultiple ?? 1}</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
          <div className="text-xs font-mono uppercase text-white/50">{t(language, 'share.pnlLabel')}</div>
          <div className={`mt-2 text-3xl font-black ${pnl >= 0 ? 'text-success' : 'text-failure'}`}>
            {pnl >= 0 ? '+' : ''}
            {pnl.toFixed(3)}U
          </div>
          <div className="mt-4 text-xs font-mono uppercase text-white/50">{t(language, 'share.targetLabel')}</div>
          <div className="mt-2 text-2xl font-black">{session.targetProfitUsd.toFixed(3)}U</div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/40 p-6">
        <div>
          <div className="text-xs font-mono uppercase text-white/50">{t(language, 'share.entryLabel')}</div>
          <div className="mt-2 text-lg font-bold">{formatPrice(session.entryPrice)}</div>
        </div>
        <div>
          <div className="text-xs font-mono uppercase text-white/50">{t(language, 'share.liqLabel')}</div>
          <div className="mt-2 text-lg font-bold">{formatPrice(session.liqPrice)}</div>
        </div>
        <div>
          <div className="text-xs font-mono uppercase text-white/50">{t(language, 'share.tpLabel')}</div>
          <div className="mt-2 text-lg font-bold">{formatPrice(session.targetPrice)}</div>
        </div>
        <div className={`rounded-2xl border px-4 py-2 text-xs font-bold uppercase ${awardedTier.badge} ${awardedTier.color}`}>
          {tierText.label}
        </div>
      </div>
    </div>
  );
};
