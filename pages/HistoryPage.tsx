import React from 'react';
import { useAppStore } from '../store';
import { getStreakDays, getSuccessRate, getTodayCount } from '../utils';
import { StatCard } from '../components/StatCard';

const statusEmoji: Record<string, string> = {
  success: '🎊',
  fail: '💩',
  aborted: '🫥',
  running: '⏳',
};

const statusCopy: Record<string, string> = {
  success: '好运爆棚，走路带风。',
  fail: '宇宙给了你一巴掌。',
  aborted: '你怂了，但安全。',
  running: '待结算',
};

export const HistoryPage: React.FC = () => {
  const history = useAppStore((state) => state.historySessions);
  const resumeSession = useAppStore((state) => state.resumeSession);
  const setRoute = useAppStore((state) => state.setRoute);

  const handleResume = (sessionId: string) => {
    const session = history.find((item) => item.id === sessionId);
    if (!session || session.status !== 'running') return;
    resumeSession(session);
    setRoute('/run');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="连续天数" value={`${getStreakDays(history)} 天`} emoji="🔥" />
        <StatCard label="成功率" value={`${getSuccessRate(history)}%`} emoji="🎯" />
        <StatCard label="今日次数" value={`${getTodayCount(history)} 次`} emoji="🧃" />
      </div>

      <div className="rounded-3xl border-2 border-white/10 bg-black/40 p-6">
        <h2 className="text-xl font-black uppercase">历史记录</h2>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">还没开过单，先去占卜一把吧。</p>
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
                      {session.date} · {session.side} · 目标 {session.targetProfitUsd}U
                    </div>
                    <div className="text-xs text-white/60">{statusCopy[session.status]}</div>
                  </div>
                </div>
                <div className="text-xs font-mono uppercase text-white/40">
                  {session.status === 'running' ? '点击继续' : new Date(session.startedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
