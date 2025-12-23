
import React, { useEffect, useState } from 'react';
import { useRitualStore } from '../store';
import { RitualStatus, Direction } from '../types';
import { MARGIN_USDT, LEVERAGE, NOTIONAL } from '../constants';
import { calculateLiqPrice, calculateTargetPrice } from '../utils';
import { priceFeed } from '../services/priceService';
import { executionService } from '../services/executionService';

export const RitualForm: React.FC = () => {
  const { context, setContext, setStatus } = useRitualStore();
  const [isLockedToday, setIsLockedToday] = useState(false);

  useEffect(() => {
    if (context.walletAddress) {
      const today = new Date().toISOString().split('T')[0];
      const ritualKey = `ritual:${context.walletAddress}:${today}`;
      const saved = localStorage.getItem(ritualKey);
      if (saved) {
        setIsLockedToday(true);
      }
    }
  }, [context.walletAddress]);

  const handleStart = async () => {
    if (!context.direction || isLockedToday) return;
    setStatus(RitualStatus.OPENING);
    try {
      const { entryPrice } = await executionService.openPosition({
        direction: context.direction,
        margin: MARGIN_USDT,
        leverage: LEVERAGE,
      });

      const liqPrice = calculateLiqPrice(entryPrice, context.direction);
      const targetPrice = calculateTargetPrice(entryPrice, context.direction, context.targetProfitUSDT, NOTIONAL);

      setContext({
        entryPrice,
        liqPrice,
        targetPrice,
        currentPrice: entryPrice,
        startedAt: Date.now()
      });
      setStatus(RitualStatus.LIVE);
    } catch (e) {
      console.error(e);
      setStatus(RitualStatus.ERROR);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 pb-10">
      {/* Constraints Panel */}
      <div className="bg-[#251628] border-2 border-white p-6 rounded-xl jagged-bottom relative">
        <div className="flex justify-between items-center border-b border-dashed border-white/20 pb-4 mb-4">
          <h3 className="font-black text-xl italic uppercase tracking-tighter">Sacred Parameters</h3>
          <span className="text-3xl">🔒</span>
        </div>
        <div className="bg-black/40 p-4 rounded-lg font-mono text-xl flex items-center justify-around">
          <div className="flex flex-col items-center">
            <span className="text-[10px] opacity-40 uppercase">Margin</span>
            <span className="text-primary font-bold">{MARGIN_USDT}U</span>
          </div>
          <span className="text-white/20 text-3xl">+</span>
          <div className="flex flex-col items-center">
            <span className="text-[10px] opacity-40 uppercase">Asset</span>
            <span className="text-[#f7931a] font-bold">BTC</span>
          </div>
          <span className="text-white/20 text-3xl">+</span>
          <div className="flex flex-col items-center">
            <span className="text-[10px] opacity-40 uppercase">Leverage</span>
            <span className="text-success font-bold">{LEVERAGE}x</span>
          </div>
        </div>
      </div>

      {isLockedToday ? (
        <div className="bg-failure/10 border-2 border-failure p-6 rounded-2xl text-center space-y-4">
          <p className="text-3xl font-black italic uppercase">Ritual Already Spent</p>
          <p className="font-mono text-sm opacity-60">You have already consulted the market gods today. Your timing has been sealed. Return after the next moon cycle (tomorrow).</p>
        </div>
      ) : (
        <>
          {/* Direction Selector */}
          <div className="space-y-4">
            <p className="text-center text-xs font-bold uppercase tracking-widest opacity-50">Step 1: Choose Direction</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setContext({ direction: 'LONG' })}
                className={`flex-1 h-24 rounded-2xl border-4 transition-all flex flex-col items-center justify-center gap-1 ${
                  context.direction === 'LONG' ? 'border-success bg-success/10 scale-105 shadow-[0_0_20px_rgba(11,218,122,0.3)]' : 'border-white/10 bg-black/40 hover:border-success/50'
                }`}
              >
                <span className="text-3xl">🐂</span>
                <span className="font-black italic uppercase">LONG 🟢📈</span>
              </button>
              <button 
                onClick={() => setContext({ direction: 'SHORT' })}
                className={`flex-1 h-24 rounded-2xl border-4 transition-all flex flex-col items-center justify-center gap-1 ${
                  context.direction === 'SHORT' ? 'border-failure bg-failure/10 scale-105 shadow-[0_0_20px_rgba(255,51,51,0.3)]' : 'border-white/10 bg-black/40 hover:border-failure/50'
                }`}
              >
                <span className="text-3xl">🐻</span>
                <span className="font-black italic uppercase">SHORT 🔴📉</span>
              </button>
            </div>
          </div>

          {/* Target Profit Selector */}
          <div className="space-y-4">
            <p className="text-center text-xs font-bold uppercase tracking-widest opacity-50">Step 2: Define Blessing Goal</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[10, 20, 50, 100].map(val => (
                <button
                  key={val}
                  onClick={() => setContext({ targetProfitUSDT: val })}
                  className={`py-3 rounded-xl border-2 font-bold transition-all ${
                    context.targetProfitUSDT === val ? 'bg-primary border-white' : 'bg-black/40 border-white/10'
                  }`}
                >
                  {val}U
                </button>
              ))}
            </div>
            <div className="relative">
              <input 
                type="number" 
                placeholder="Custom Amount..."
                value={context.targetProfitUSDT}
                onChange={(e) => setContext({ targetProfitUSDT: Number(e.target.value) })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-xl py-3 text-center font-bold focus:border-primary outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 font-bold">USDT</span>
            </div>
          </div>

          {/* CTA */}
          <button 
            disabled={!context.direction}
            onClick={handleStart}
            className={`w-full h-20 rounded-2xl border-4 border-black font-black text-3xl uppercase italic shadow-brutalist transition-all flex items-center justify-center gap-4 ${
              !context.direction ? 'bg-gray-700 opacity-50 cursor-not-allowed' : 'bg-primary hover:scale-105 active:translate-y-1'
            }`}
          >
            <span>Start the Ritual</span>
            <span className="animate-pulse">🧨</span>
          </button>
        </>
      )}
    </div>
  );
};
