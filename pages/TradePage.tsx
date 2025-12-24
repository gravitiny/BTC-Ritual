import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWalletClient } from 'wagmi';
import { DAILY_LIMIT_ENABLED, DEFAULT_MARGIN_USD, LEVERAGE, TARGET_PROFIT_OPTIONS } from '../constants';
import { useAppStore } from '../store';
import { TradeSide } from '../types';
import { getAllMids, placeMarketOrder, prepareSignerChain } from '../services/hyperliquid';
import { calculateLiqPrice, calculateTargetPrice, getCrownTier, getTodayCount } from '../utils';

export const TradePage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const startSession = useAppStore((state) => state.startSession);
  const updateSession = useAppStore((state) => state.updateSession);
  const setRoute = useAppStore((state) => state.setRoute);
  const pushToast = useAppStore((state) => state.pushToast);
  const history = useAppStore((state) => state.historySessions);

  const [side, setSide] = useState<TradeSide>('LONG');
  const [targetProfitUsd, setTargetProfitUsd] = useState<number>(TARGET_PROFIT_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!isConnected || !address || !walletClient) {
      pushToast({ kind: 'error', message: '先连接钱包，仪式才会开始。' });
      return;
    }
    if (DAILY_LIMIT_ENABLED && getTodayCount(history) >= 1) {
      pushToast({ kind: 'error', message: '今日次数已用完。明天再来。' });
      return;
    }
    if (targetProfitUsd < 0.1 || targetProfitUsd > 100) {
      pushToast({ kind: 'error', message: '目标收益建议在 0.1U ~ 100U 之间。' });
      return;
    }
    setIsSubmitting(true);
    try {
      const originalChainId = await prepareSignerChain(walletClient);
      const allMids = await getAllMids();
      const referencePrice = Number(allMids.BTC ?? 0);
      if (!Number.isFinite(referencePrice) || referencePrice <= 0) {
        throw new Error('Invalid BTC price');
      }
      const session = startSession({ side, targetProfitUsd, entryPrice: referencePrice });
      setRoute('/run');
      const size = (DEFAULT_MARGIN_USD * LEVERAGE) / referencePrice;
      const orderResponse = await placeMarketOrder({
        walletClient,
        address,
        isBuy: side === 'LONG',
        size,
        referencePrice,
        originalChainId,
      });
      const status = orderResponse?.response?.data?.statuses?.[0];
      const filled = status?.filled;
      const resting = status?.resting;
      if (filled?.avgPx) {
        const filledPrice = Number(filled.avgPx);
        const liqPrice = calculateLiqPrice(filledPrice, side);
        const targetPrice = calculateTargetPrice(filledPrice, side, targetProfitUsd);
        updateSession({
          entryPrice: filledPrice,
          currentPrice: filledPrice,
          liqPrice,
          targetPrice,
        });
      }
      if (filled?.oid) {
        updateSession({ orderId: filled.oid });
      } else if (resting?.oid) {
        updateSession({ orderId: resting.oid });
      }
    } catch (error) {
      pushToast({ kind: 'error', message: '下单失败，宇宙在卡顿。' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-3xl border-2 border-white/10 bg-black/40 p-6"
      >
        <h2 className="text-2xl font-black uppercase">选择方向</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {(['LONG', 'SHORT'] as TradeSide[]).map((option) => (
            <button
              key={option}
              onClick={() => setSide(option)}
              className={`rounded-3xl border-4 p-6 text-xl font-black uppercase transition-all ${
                side === option
                  ? 'border-success bg-success/20 text-success shadow-[0_0_25px_rgba(11,218,122,0.5)]'
                  : 'border-white/10 bg-black/30 text-white/60 hover:border-success/60'
              }`}
            >
              {option === 'LONG' ? '🚀 Long' : '🧨 Short'}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-3xl border-2 border-white/10 bg-black/40 p-6"
      >
        <h2 className="text-2xl font-black uppercase">目标收益 (USDC)</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {TARGET_PROFIT_OPTIONS.map((profit) => {
            const tier = getCrownTier(profit);
            return (
            <button
              key={profit}
              onClick={() => setTargetProfitUsd(profit)}
              className={`rounded-2xl border-2 px-4 py-3 text-sm font-black uppercase transition-all ${
                targetProfitUsd === profit
                  ? 'border-primary bg-primary text-black shadow-[0_0_20px_rgba(205,43,238,0.6)]'
                  : 'border-white/10 bg-black/30 text-white/60 hover:border-primary/60'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span>{profit} U</span>
                <span className={`text-[10px] ${tier.color}`}>{tier.name}</span>
              </div>
            </button>
          );})}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:col-span-2 rounded-[32px] border-4 border-primary bg-primary/10 p-6"
      >
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-black uppercase">准备好了？</h3>
            <p className="text-sm text-white/70">点下按钮进入 Run 页，价格会跳动到爆。</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-full border-4 border-white bg-primary px-8 py-4 text-lg font-black uppercase text-black shadow-[0_0_30px_rgba(205,43,238,0.6)] transition-all hover:-translate-y-1 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? '占卜中...' : '占卜下单 ⚡️'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
