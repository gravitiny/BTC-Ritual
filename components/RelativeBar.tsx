import React from 'react';

interface RelativeBarProps {
  value: number;
  label: string;
}

export const RelativeBar: React.FC<RelativeBarProps> = ({ value, label }) => {
  const percent = Math.round(value * 100);
  const distanceToWin = Math.max(0, Math.round((1 - value) * 100));
  const distanceToFail = Math.max(0, Math.round(value * 100));
  const statusText = value >= 0.5 ? `离🎊只差 ${distanceToWin}%` : `你离💩还有 ${distanceToFail}%`;
  return (
    <div className="rounded-3xl border-2 border-white/10 bg-black/40 p-4">
      <div className="mb-3 flex items-center justify-between text-sm font-bold uppercase text-white/70">
        <span>爆仓 💩</span>
        <span>{label}</span>
        <span>止盈 🎊</span>
      </div>
      <div className="relative h-5 rounded-full bg-gradient-to-r from-failure via-yellow-400 to-success">
        <div
          className="absolute top-1/2 flex -translate-y-1/2 items-center gap-2"
          style={{ left: `calc(${percent}% - 10px)` }}
        >
          <span className="animate-jitter text-xl">🎯</span>
        </div>
      </div>
      <div className="mt-3 text-xs font-mono uppercase text-white/60">{statusText}</div>
    </div>
  );
};
