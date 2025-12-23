
import React, { useEffect, useState } from 'react';
import { useRitualStore } from '../store';
import { RitualStatus } from '../types';

const Confetti = () => {
  const pieces = Array.from({ length: 50 });
  return (
    <>
      {pieces.map((_, i) => (
        <div 
          key={i} 
          className="confetti-piece text-2xl"
          style={{ 
            left: `${Math.random() * 100}%`, 
            animationDelay: `${Math.random() * 3}s`,
            fontSize: `${Math.random() * 20 + 10}px`
          }}
        >
          {['✨', '💰', '👑', '🎉', '🟢'][Math.floor(Math.random() * 5)]}
        </div>
      ))}
    </>
  );
};

const PoopExplosion = () => {
  const pieces = Array.from({ length: 20 });
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {pieces.map((_, i) => (
        <div 
          key={i} 
          className="absolute text-4xl animate-explode"
          style={{ 
            rotate: `${i * (360 / 20)}deg`,
            translate: `0 -100px`,
            animationDelay: `${Math.random() * 0.5}s`
          }}
        >
          💩
        </div>
      ))}
    </div>
  );
};

export const ResultView: React.FC = () => {
  const { status, context, reset } = useRitualStore();
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (context.walletAddress && !hasSaved) {
      const today = new Date().toISOString().split('T')[0];
      const ritualKey = `ritual:${context.walletAddress}:${today}`;
      const data = {
        status,
        timestamp: Date.now(),
        direction: context.direction,
        profit: status === RitualStatus.SUCCESS ? context.targetProfitUSDT : 0
      };
      localStorage.setItem(ritualKey, JSON.stringify(data));
      setHasSaved(true);
    }
  }, [status, context.walletAddress, context.direction, context.targetProfitUSDT, hasSaved]);

  const isSuccess = status === RitualStatus.SUCCESS;
  const isFail = status === RitualStatus.FAIL;
  const isStopped = status === RitualStatus.STOPPED;

  const handleShare = () => {
    const text = isSuccess 
      ? `The stars aligned! I just received a ${context.targetProfitUSDT}U Luck Buff from the Meme Ritual. 👑✨ #BTC #Ritual`
      : isFail 
      ? "Fate was cruel today. My ritual was rejected by the market gods. 💩💀 #Rekt"
      : "I interrupted fate. The ritual remains unfinished. 🧿 #PaperHands";
    navigator.clipboard.writeText(text);
    alert("Shareable omen copied to clipboard!");
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10 p-6 relative">
      {isSuccess && <Confetti />}
      
      <div className="relative z-10">
        {isSuccess && (
          <div className="animate-bounce">
            <h1 className="text-7xl md:text-9xl font-black text-success drop-shadow-[4px_4px_0px_#fff] rotate-2">BLESSED 👑</h1>
            <p className="text-xl mt-4 font-mono font-bold text-white/70 max-w-lg mx-auto">
              The market stood with you today. Timing is everything. Skill is a myth.
            </p>
            <div className="absolute -top-10 -left-10 text-6xl animate-pulse">✨</div>
            <div className="absolute -bottom-10 -right-10 text-6xl animate-pulse delay-500">🎇</div>
          </div>
        )}

        {isFail && (
          <div className="animate-shake">
            <PoopExplosion />
            <h1 className="text-7xl md:text-9xl font-black text-failure drop-shadow-[4px_4px_0px_#000] -rotate-2">REKT 💩</h1>
            <p className="text-xl mt-4 font-mono font-bold text-white/70 max-w-lg mx-auto">
              Today wasn't your day. Fate has reclaimed its toll. Return tomorrow to try and balance the scales.
            </p>
            <div className="absolute -top-10 -left-10 text-6xl">💨</div>
            <div className="absolute -bottom-10 -right-10 text-6xl">📉</div>
          </div>
        )}

        {isStopped && (
          <div className="">
            <h1 className="text-7xl md:text-9xl font-black text-white drop-shadow-[4px_4px_0px_#cd2bee] rotate-1">ABORTED 🧿</h1>
            <p className="text-xl mt-4 font-mono font-bold text-white/70">You interrupted fate. Dignity preserved, but destiny remains unwritten.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 w-full max-w-md relative z-10">
        <button 
          onClick={handleShare}
          className="flex-1 bg-primary text-white font-black py-4 rounded-xl border-2 border-white shadow-brutalist uppercase hover:scale-105 transition-transform"
        >
          Spread the Omen 📤
        </button>
        <button 
          onClick={reset}
          className="flex-1 bg-black text-white/50 hover:text-white font-black py-4 rounded-xl border-2 border-white/20 uppercase transition-colors"
        >
          Back to Altar
        </button>
      </div>

      <div className="mt-8 p-4 border border-white/10 rounded-xl bg-black/20 font-mono text-[10px] uppercase tracking-tighter opacity-50">
        Record logged: {new Date().toLocaleDateString()} • {context.walletAddress}
      </div>
    </div>
  );
};
