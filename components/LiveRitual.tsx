
import React, { useEffect, useState, useRef } from 'react';
import { useRitualStore } from '../store';
import { RitualStatus } from '../types';
import { priceFeed } from '../services/priceService';
import { formatPrice } from '../utils';
import { FORTUNE_CONTENT } from '../constants';

export const LiveRitual: React.FC = () => {
  const { status, context, setStatus, setContext } = useRitualStore();
  const [history, setHistory] = useState<number[]>([]);
  const [narration, setNarration] = useState("Vibes are aligning...");
  const lastPriceRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = priceFeed.subscribe((price) => {
      setContext({ currentPrice: price });
      setHistory(prev => {
        const next = [...prev, price];
        return next.length > 50 ? next.slice(1) : next;
      });

      // State Machine transitions based on price
      if (context.direction === 'LONG') {
        if (context.liqPrice && price <= context.liqPrice) setStatus(RitualStatus.FAIL);
        if (context.targetPrice && price >= context.targetPrice) setStatus(RitualStatus.SUCCESS);
      } else if (context.direction === 'SHORT') {
        if (context.liqPrice && price >= context.liqPrice) setStatus(RitualStatus.FAIL);
        if (context.targetPrice && price <= context.targetPrice) setStatus(RitualStatus.SUCCESS);
      }

      // Narration Logic
      if (lastPriceRef.current !== null) {
        const delta = price - lastPriceRef.current;
        const isFavorable = context.direction === 'LONG' ? delta > 0 : delta < 0;
        
        // Randomly update narration on movement
        if (Math.abs(delta) > 0.05) { 
           const pool = isFavorable ? FORTUNE_CONTENT.narrations.favorable : FORTUNE_CONTENT.narrations.unfavorable;
           if (Math.random() > 0.85) {
             setNarration(pool[Math.floor(Math.random() * pool.length)]);
           }
        }
      }
      lastPriceRef.current = price;
    });

    return () => unsub();
  }, [context.direction, context.liqPrice, context.targetPrice, setContext, setStatus]);

  const handleStop = () => {
    setStatus(RitualStatus.STOPPED);
  };

  // Chart view bounds
  const visiblePrices = [...history, context.liqPrice || 0, context.targetPrice || 0, context.entryPrice || 0];
  const minPrice = Math.min(...visiblePrices);
  const maxPrice = Math.max(...visiblePrices);
  const range = (maxPrice - minPrice) || 1;
  const padding = range * 0.1;
  
  const getPos = (p: number) => {
    return 100 - (((p - (minPrice - padding)) / (range + padding * 2)) * 100);
  };

  return (
    <div className="w-full flex flex-col items-center gap-8 relative">
      {/* Header Narration */}
      <div className="text-center space-y-4 max-w-2xl px-4">
        <div className="inline-flex items-center gap-2 bg-failure/20 px-4 py-2 rounded-full font-bold text-xs uppercase animate-pulse border-2 border-failure text-failure">
          <span className="size-2 bg-failure rounded-full animate-ping"></span>
          Live Ritual Syncing...
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] min-h-[4rem]">
          {narration}
        </h1>
      </div>

      {/* Ritual visualization (Not a pro chart) */}
      <div className="w-full max-w-5xl aspect-[2/1] bg-black/40 border-8 border-black rounded-[3rem] relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-grid"></div>
        <div className="absolute inset-0 border-[20px] border-primary/5 rounded-[3rem] pointer-events-none"></div>
        
        {/* Viz Area */}
        <div className="relative h-full w-full p-8">
           {/* Liquidation Line (Danger) */}
           <div 
            className="absolute left-0 right-0 border-t-4 border-failure border-dashed z-10 transition-all duration-700"
            style={{ top: `${getPos(context.liqPrice || 0)}%` }}
           >
             <div className="absolute right-8 -top-8 bg-failure text-white px-3 py-1 text-xs font-black uppercase italic rounded-t-lg">
               DEATH POINT 💀
             </div>
           </div>

           {/* Target Line (Blessing) */}
           <div 
            className="absolute left-0 right-0 border-t-4 border-success border-dashed z-10 transition-all duration-700"
            style={{ top: `${getPos(context.targetPrice || 0)}%` }}
           >
             <div className="absolute right-8 -top-8 bg-success text-black px-3 py-1 text-xs font-black uppercase italic rounded-t-lg">
               ASCENSION POINT 👑
             </div>
           </div>

           {/* Entry Line */}
           <div 
            className="absolute left-0 right-0 border-t-2 border-white/20 z-0 transition-all duration-700"
            style={{ top: `${getPos(context.entryPrice || 0)}%` }}
           >
             <div className="absolute left-8 -top-6 text-white/40 text-[10px] font-black uppercase">Start of Journey</div>
           </div>

           {/* Path of Fate */}
           <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="100%" stopColor="#cd2bee" />
                </linearGradient>
              </defs>
              <path 
                d={`M ${history.map((p, i) => `${(i / Math.max(1, history.length - 1)) * 100},${getPos(p)}`).join(' L ')}`}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_15px_rgba(205,43,238,0.8)]"
              />
           </svg>

           {/* The Orb of Destiny */}
           <div 
            className="absolute right-4 transition-all duration-300 transform -translate-y-1/2 flex items-center justify-center"
            style={{ top: `${getPos(context.currentPrice || 0)}%` }}
           >
             <div className="size-16 bg-primary rounded-full flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(205,43,238,1)] animate-pulse">
               {context.direction === 'LONG' ? '🚀' : '📉'}
             </div>
             <div className="ml-4 bg-white text-black px-4 py-2 rounded-xl font-black text-xl shadow-xl italic whitespace-nowrap">
               {formatPrice(context.currentPrice)}
             </div>
           </div>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
         <div className="bg-black/80 border-2 border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">Distance to Death</span>
            <div className="text-3xl font-black text-failure italic">
              {context.currentPrice && context.liqPrice ? Math.abs(((context.currentPrice - context.liqPrice) / context.liqPrice) * 100).toFixed(2) : "0"}%
            </div>
         </div>
         <div className="bg-primary/10 border-2 border-primary p-5 rounded-2xl flex flex-col items-center justify-center text-center scale-110">
            <span className="text-primary text-[10px] font-black uppercase tracking-widest mb-2">Fate Direction</span>
            <div className="text-3xl font-black italic">
              {context.direction === 'LONG' ? 'BUYING THE UNIVERSE' : 'SHORTING REALITY'}
            </div>
         </div>
         <div className="bg-black/80 border-2 border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">Distance to Blessing</span>
            <div className="text-3xl font-black text-success italic">
              {context.currentPrice && context.targetPrice ? Math.abs(((context.targetPrice - context.currentPrice) / context.currentPrice) * 100).toFixed(2) : "0"}%
            </div>
         </div>
      </div>

      {/* Emergency Stop */}
      <div className="pb-12">
        <button 
          onClick={handleStop}
          className="group relative bg-failure text-white px-12 py-6 rounded-full font-black text-2xl uppercase italic border-b-8 border-red-900 transition-all hover:scale-105 active:translate-y-2"
        >
          <span className="relative z-10">STOP (I'M SCARED) 😰</span>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-full transition-opacity"></div>
        </button>
        <p className="text-center text-[10px] opacity-20 uppercase font-bold mt-4">Manual override interrupts fate</p>
      </div>
    </div>
  );
};
