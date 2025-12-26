import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { CandlestickData } from 'lightweight-charts';
import { useAccount, useWalletClient } from 'wagmi';
import { DAILY_LIMIT_ENABLED, DEFAULT_MARGIN_USD, LEVERAGE, PRICE_TICK_MS, TP_MULTIPLE_OPTIONS } from '../constants';
import { useAppStore } from '../store';
import { TradeSide } from '../types';
import { getAllMids, getCandleSnapshot, placeMarketOrderWithTakeProfit, prepareSignerChain } from '../services/hyperliquid';
import { calculateLiqPrice, calculateTargetPrice, formatPrice, getCrownTier, getTodayCount } from '../utils';
import { PriceChart } from '../components/PriceChart';

const buildCandlesFromSnapshot = (snapshot: any[]): CandlestickData[] => {
  return snapshot.map((candle) => ({
    time: Math.floor(candle.t / 1000),
    open: Number(candle.o),
    high: Number(candle.h),
    low: Number(candle.l),
    close: Number(candle.c),
  }));
};

export const TradePage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const startSession = useAppStore((state) => state.startSession);
  const updateSession = useAppStore((state) => state.updateSession);
  const setRoute = useAppStore((state) => state.setRoute);
  const pushToast = useAppStore((state) => state.pushToast);
  const history = useAppStore((state) => state.historySessions);

  const [side, setSide] = useState<TradeSide>('LONG');
  const [tpMultiple, setTpMultiple] = useState<number>(TP_MULTIPLE_OPTIONS[0]);
  const [customMultiple, setCustomMultiple] = useState<string>('');

  const isUserRejected = (error: any) => {
    const code = error?.code;
    const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
    return code === 4001 || message.includes('user rejected') || message.includes('rejected');
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [candles, setCandles] = useState<CandlestickData[]>([]);
  const [referencePrice, setReferencePrice] = useState<number | null>(null);

  useEffect(() => {
    const now = Date.now();
    getCandleSnapshot(now - 60 * 60 * 1000, now)
      .then((snapshot) => {
        if (Array.isArray(snapshot)) {
          setCandles(buildCandlesFromSnapshot(snapshot));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchPrice = () => {
      getAllMids()
        .then((mids) => {
          const nextPrice = Number(mids.BTC ?? 0);
          if (!Number.isFinite(nextPrice) || nextPrice <= 0) return;
          if (mounted) setReferencePrice(nextPrice);
        })
        .catch(() => {});
    };
    fetchPrice();
    const timer = window.setInterval(fetchPrice, PRICE_TICK_MS);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const targetProfitUsd = useMemo(() => DEFAULT_MARGIN_USD * tpMultiple, [tpMultiple]);

  const priceGuides = useMemo(() => {
    if (!referencePrice) return null;
    const liqPrice = calculateLiqPrice(referencePrice, side);
    const targetPrice = calculateTargetPrice(referencePrice, side, targetProfitUsd);
    return { liqPrice, targetPrice };
  }, [referencePrice, side, targetProfitUsd]);

  const handleSubmit = async () => {
    if (!isConnected || !address || !walletClient) {
      pushToast({ kind: 'error', message: '先连接钱包，仪式才会开始。' });
      return;
    }
    if (DAILY_LIMIT_ENABLED && getTodayCount(history) >= 1) {
      pushToast({ kind: 'error', message: '今日次数已用完。明天再来。' });
      return;
    }
    if (tpMultiple < 0.05) {
      pushToast({ kind: 'error', message: '自定义倍数建议不低于 0.05 倍。' });
      return;
    }
    setIsSubmitting(true);
    try {
      pushToast({ kind: 'info', message: '准备签名，读取实时价格...' });
      const originalChainId = await prepareSignerChain(walletClient);
      pushToast({ kind: 'info', message: '钱包已就绪，拉取 BTC 价格...' });
      const allMids = await getAllMids();
      const referencePrice = Number(allMids.BTC ?? 0);
      if (!Number.isFinite(referencePrice) || referencePrice <= 0) {
        throw new Error('Invalid BTC price');
      }
      pushToast({ kind: 'info', message: '价格就绪，创建下单并签名...' });
      const size = (DEFAULT_MARGIN_USD * LEVERAGE) / referencePrice;
      pushToast({ kind: 'info', message: '签名完成，发送 /exchange...' });
      const orderResponse = await placeMarketOrderWithTakeProfit({
        walletClient,
        address,
        isBuy: side === 'LONG',
        size,
        referencePrice,
        takeProfitPrice: priceGuides?.targetPrice ?? calculateTargetPrice(referencePrice, side, targetProfitUsd),
        originalChainId,
      });
      pushToast({ kind: 'info', message: '收到订单响应，解析状态...' });
      console.info('Hyperliquid order response', orderResponse);
      const statuses = orderResponse?.response?.data?.statuses ?? [];
      const mainStatus = statuses[0];
      const tpStatus = statuses[1];
      const filled = mainStatus?.filled;
      const errorMessage = mainStatus?.error ?? orderResponse?.error;
      if (errorMessage) {
        pushToast({ kind: 'error', message: `下单失败：${errorMessage}` });
        return;
      }
      if (!filled) {
        pushToast({ kind: 'error', message: '下单失败：主单未成交，请重新下单。' });
        return;
      }
      const filledPrice = Number(filled.avgPx ?? referencePrice);
      const filledSize = Number(filled.totalSz ?? size);
      const actualMarginUsd = (filledSize * filledPrice) / LEVERAGE;
      const actualTargetProfitUsd = actualMarginUsd * tpMultiple;
      startSession({ side, targetProfitUsd: actualTargetProfitUsd, tpMultiple, entryPrice: filledPrice });
      setRoute('/run');
      const liqPrice = calculateLiqPrice(filledPrice, side);
      const targetPrice = calculateTargetPrice(filledPrice, side, actualTargetProfitUsd);
      updateSession({
        entryPrice: filledPrice,
        currentPrice: filledPrice,
        liqPrice,
        targetPrice,
        orderId: filled.oid,
        marginUsd: actualMarginUsd,
        targetProfitUsd: actualTargetProfitUsd,
      });
      if (tpStatus?.error) {
        pushToast({ kind: 'error', message: `止盈单失败：${tpStatus.error}` });
      } else {
        pushToast({ kind: 'success', message: '已挂止盈单（限价）。' });
      }
    } catch (error: any) {
      if (isUserRejected(error)) {
        pushToast({ kind: 'info', message: '已取消钱包签名。' });
        return;
      }
      const rawMessage = typeof error?.message === 'string' ? error.message : '';
      const friendly =
        rawMessage.includes('not been authorized') || rawMessage.includes('WalletConnect')
          ? '钱包连接未授权，请关闭 WalletConnect 或确认允许域名。'
          : rawMessage
            ? `下单失败：${rawMessage}`
            : '下单失败，宇宙在卡顿。';
      pushToast({ kind: 'error', message: friendly });
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
        <h2 className="text-2xl font-black uppercase">目标倍数</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {TP_MULTIPLE_OPTIONS.map((multiple) => {
            const tier = getCrownTier(DEFAULT_MARGIN_USD * multiple);
            return (
              <button
                key={multiple}
                onClick={() => {
                  setTpMultiple(multiple);
                  setCustomMultiple('');
                }}
                className={`rounded-2xl border-2 px-4 py-3 text-sm font-black uppercase transition-all ${
                  tpMultiple === multiple && customMultiple === ''
                    ? 'border-primary bg-primary text-black shadow-[0_0_20px_rgba(205,43,238,0.6)]'
                    : 'border-white/10 bg-black/30 text-white/60 hover:border-primary/60'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span>翻 {multiple} 倍</span>
                  <span className={`text-[10px] ${tier.color}`}>{tier.name}</span>
                </div>
              </button>
            );
          })}
          <div className="col-span-2 rounded-2xl border-2 border-white/10 bg-black/30 px-4 py-3 text-sm font-black uppercase text-white/60">
            <div className="flex flex-wrap items-center gap-3">
              <span>翻自定义倍数</span>
              <input
                value={customMultiple}
                onChange={(event) => {
                  const next = event.target.value;
                  setCustomMultiple(next);
                  const parsed = Number(next);
                  if (Number.isFinite(parsed) && parsed > 0) {
                    setTpMultiple(parsed);
                  }
                }}
                placeholder="0.05 起"
                className="w-28 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-sm font-bold text-white outline-none"
              />
              <span className="text-xs font-mono uppercase text-white/40">最低 0.05 倍</span>
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs font-mono uppercase text-white/50">
          目标收益约 {targetProfitUsd.toFixed(3)}U
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:col-span-2 rounded-3xl border-2 border-white/10 bg-black/40 p-4"
      >
        <div className="flex items-center justify-between px-2 pb-3 text-xs font-mono uppercase text-white/60">
          <span>BTC 走势预览</span>
          <span>{referencePrice ? `参考价 ${formatPrice(referencePrice)}` : '实时价加载中'}</span>
        </div>
        <PriceChart
          candles={candles}
          priceLines={
            priceGuides
              ? [
                  { price: priceGuides.liqPrice, color: '#ff3333', title: '💩 爆仓' },
                  { price: priceGuides.targetPrice, color: '#0bda7a', title: '🎊 止盈' },
                ]
              : undefined
          }
          rangePrices={priceGuides ? [priceGuides.liqPrice, priceGuides.targetPrice] : undefined}
        />
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
