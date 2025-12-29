import React, { useRef, useState } from 'react';
import { CROWN_TIERS } from '../constants';
import { useAppStore } from '../store';
import { calculatePnlUsd, getStreakDays, getSuccessRate, getTodayCount } from '../utils';
import { StatCard } from '../components/StatCard';
import { getTierText, t } from '../i18n';
import { ShareCard } from '../components/ShareCard';
import { toPng } from 'html-to-image';

const statusEmoji: Record<string, string> = {
  success: '🎊',
  fail: '💩',
  aborted: '🫥',
  running: '⏳',
};

export const HistoryPage: React.FC = () => {
  const history = useAppStore((state) => state.historySessions);
  const resumeSession = useAppStore((state) => state.resumeSession);
  const setRoute = useAppStore((state) => state.setRoute);
  const crownInventory = useAppStore((state) => state.crownInventory);
  const language = useAppStore((state) => state.language);
  const pushToast = useAppStore((state) => state.pushToast);
  const [shareSession, setShareSession] = useState<(typeof history)[number] | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const shareRef = useRef<HTMLDivElement | null>(null);

  const handleResume = (sessionId: string) => {
    const session = history.find((item) => item.id === sessionId);
    if (!session || session.status !== 'running') return;
    resumeSession(session);
    setRoute('/run');
  };

  const buildTweetText = (session: (typeof history)[number]) => {
    const target = session.targetProfitUsd.toFixed(3);
    const key =
      session.status === 'running'
        ? 'share.tweetRunning'
        : session.status === 'success'
          ? 'share.tweetSuccess'
          : session.status === 'fail'
            ? 'share.tweetFail'
            : 'share.tweetAborted';
    return t(language, key, { target });
  };

  const handleShare = async (session: (typeof history)[number]) => {
    try {
      setSharingId(session.id);
      pushToast({ kind: 'info', message: t(language, 'share.generating') });
      setShareSession(session);
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (!shareRef.current) return;
      const dataUrl = await toPng(shareRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#05010a' });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `5u-warlord-${session.date}.png`;
      link.click();
      pushToast({ kind: 'success', message: t(language, 'share.downloaded') });
      const tweetText = buildTweetText(session);
      const url = new URL('https://twitter.com/intent/tweet');
      url.searchParams.set('text', tweetText);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    } catch (error) {
      pushToast({ kind: 'error', message: t(language, 'toast.orderFailedGeneric') });
    } finally {
      setSharingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={t(language, 'history.stats.streak')} value={`${getStreakDays(history)} ${t(language, 'units.days')}`} emoji="🔥" />
        <StatCard label={t(language, 'history.stats.successRate')} value={`${getSuccessRate(history)}%`} emoji="🎯" />
        <StatCard label={t(language, 'history.stats.todayCount')} value={`${getTodayCount(history)} ${t(language, 'units.times')}`} emoji="🧃" />
      </div>

      <div className="rounded-3xl border-2 border-white/10 bg-black/40 p-6">
        <h2 className="text-xl font-black uppercase">{t(language, 'history.badgesTitle')}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {CROWN_TIERS.filter((tier) => crownInventory[tier.id] > 0).map((tier) => {
            const tierText = getTierText(tier, language);
            return (
              <div
                key={tier.id}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold uppercase ${tier.badge} ${tier.color}`}
              >
                <span className="text-base">{tier.emoji}</span>
                {tierText.label} x{crownInventory[tier.id]}
              </div>
            );
          })}
          {CROWN_TIERS.every((tier) => crownInventory[tier.id] === 0) && (
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-xs font-bold uppercase text-white/60">
              {t(language, 'history.badgesEmpty')}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border-2 border-white/10 bg-black/40 p-6">
        <h2 className="text-xl font-black uppercase">{t(language, 'history.recordsTitle')}</h2>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">{t(language, 'history.empty')}</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {history.map((session) => (
              <div
                key={session.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm ${session.status === 'running' ? 'cursor-pointer hover:border-primary/60' : 'opacity-80'}`}
                onClick={() => handleResume(session.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{statusEmoji[session.status]}</span>
                  <div>
                    <div className="font-bold uppercase">
                      {t(language, 'history.recordLine', {
                        date: session.date,
                        side: session.side,
                        multiple: session.tpMultiple ?? 1,
                        target: session.targetProfitUsd.toFixed(3),
                      })}
                    </div>
                    <div className="text-xs text-white/60">{t(language, `history.status.${session.status}`)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono uppercase text-white/40">
                  {session.status === 'running' ? (
                    <span>{t(language, 'history.resume')}</span>
                  ) : (
                    <span>{new Date(session.startedAt).toLocaleTimeString()}</span>
                  )}
                  {session.status === 'running' && (
                    <span className={`${calculatePnlUsd(session) >= 0 ? 'text-success' : 'text-failure'}`}>
                      {calculatePnlUsd(session) >= 0 ? '+' : ''}
                      {calculatePnlUsd(session).toFixed(3)}U
                    </span>
                  )}
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleShare(session);
                    }}
                    className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase text-white/70 transition-all hover:border-primary/60 hover:text-white"
                    disabled={sharingId === session.id}
                  >
                    {sharingId === session.id ? t(language, 'share.generating') : t(language, 'share.button')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed left-[-2000px] top-0 z-[-1] pointer-events-none">
        {shareSession && (
          <div ref={shareRef}>
            <ShareCard session={shareSession} />
          </div>
        )}
      </div>
    </div>
  );
};
