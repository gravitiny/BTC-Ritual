
import React, { useEffect } from 'react';
import { useRitualStore } from '../store';
import { FORTUNE_CONTENT } from '../constants';

export const OmenCard: React.FC = () => {
  const { context, setContext } = useRitualStore();

  useEffect(() => {
    if (context.omen === 'Seeking omens...') {
      const omen = FORTUNE_CONTENT.omens[Math.floor(Math.random() * FORTUNE_CONTENT.omens.length)];
      const whisper = FORTUNE_CONTENT.whispers[Math.floor(Math.random() * FORTUNE_CONTENT.whispers.length)];
      setContext({ omen, whisper });
    }
  }, [context.omen, setContext]);

  return (
    <div className="w-full max-w-md mx-auto mb-10 text-center space-y-4">
      <div className="bg-gradient-to-br from-[#362839] to-background border-4 border-[#362839] rounded-3xl p-6 shadow-2xl rotate-1">
        <div className="h-32 flex items-center justify-center text-7xl animate-pulse">
           {context.direction === 'LONG' ? '🐂' : context.direction === 'SHORT' ? '🐻' : '🐸'}
        </div>
        <div className="mt-4">
          <p className="text-primary font-bold text-xs uppercase tracking-widest mb-1">Daily Omen Revealed</p>
          <p className="text-white font-black text-2xl italic">"{context.omen}"</p>
        </div>
      </div>
      <div className="bg-yellow-200 text-black px-4 py-2 font-mono text-sm font-bold rotate-[-2deg] shadow-lg inline-block">
        Whisper from Fate: "{context.whisper}"
      </div>
    </div>
  );
};
