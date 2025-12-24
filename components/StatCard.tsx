import React from 'react';

export const StatCard: React.FC<{ label: string; value: string; emoji?: string }> = ({ label, value, emoji }) => {
  return (
    <div className="flex flex-col gap-2 rounded-3xl border-2 border-white/10 bg-black/40 p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      <span className="text-xs font-mono uppercase text-white/50">{label}</span>
      <div className="flex items-center gap-2">
        {emoji && <span className="text-2xl">{emoji}</span>}
        <span className="text-xl font-black uppercase">{value}</span>
      </div>
    </div>
  );
};
