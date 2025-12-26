import React, { useEffect, useRef, useState } from 'react';
import type { CandlestickData } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { useAccount, useWalletClient } from 'wagmi';
import { useAppStore } from '../store';
import { PRICE_TICK_MS } from '../constants';
import { formatPrice, priceToLuck } from '../utils';
import { RelativeBar } from '../components/RelativeBar';
import { PriceChart } from '../components/PriceChart';
import { ResultModal } from '../components/ResultModal';
import { closePositionMarket, fetchPositionSize, getAllMids, getCandleSnapshot } from '../services/hyperliquid';

const buildCandlesFromSnapshot = (snapshot: any[]): CandlestickData[] => {
  return snapshot.map((candle) => ({
    time: Math.floor(candle.t / 1000),
    open: Number(candle.o),
    high: Number(candle.h),
    low: Number(candle.l),
    close: Number(candle.c),
  }));
};

export const RunPage: React.FC = () => {
  const currentSession = useAppStore((state) => state.currentSession);
  const lastSession = useAppStore((state) => state.lastSession);
  const updateSession = useAppStore((state) => state.updateSession);
  const completeSession = useAppStore((state) => state.completeSession);
  const abortSession = useAppStore((state) => state.abortSession);
  const setRoute = useAppStore((state) => state.setRoute);
  const pushToast = useAppStore((state) => state.pushToast);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [luckValue, setLuckValue] = useState(0.5);
  const [candles, setCandles] = useState<CandlestickData[]>([]);
  const [showResult, setShowResult] = useState(false);
  const endedRef = useRef(false);
  const luckPathRef = useRef<number[]>([]);
  const hadPositionRef = useRef(false);
  const session = currentSession ?? lastSession;
  const isUserRejected = (error: any) => {
    const code = error?.code;
    const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
    return code === 4001 || message.includes('user rejected') || message.includes('rejected');
  };

  useEffect(() => {
    if (!session) {
      setRoute('/trade');
      return;
    }
    luckPathRef.current = [...session.luckPath];
    setLuckValue(luckPathRef.current[luckPathRef.current.length - 1] ?? 0.5);
    const now = Date.now();
    getCandleSnapshot(now - 60 * 60 * 1000, now)
      .then((snapshot) => {
        if (Array.isArray(snapshot)) {
          setCandles(buildCandlesFromSnapshot(snapshot));
        }
      })
      .catch(() => {});
  }, [session, setRoute]);

  useEffect(() => {
    if (!currentSession) return;
    const priceTimer = window.setInterval(() => {
      if (endedRef.current) return;
      getAllMids()
        .then((mids) => {
          const nextPrice = Number(mids.BTC ?? 0);
          if (!Number.isFinite(nextPrice) || nextPrice <= 0) return;
          const nextLuck = priceToLuck(
            nextPrice,
            currentSession.liqPrice,
            currentSession.targetPrice,
            currentSession.side
          );
          luckPathRef.current = [...luckPathRef.current, nextLuck];
          updateSession({ luckPath: luckPathRef.current, currentPrice: nextPrice });
          setLuckValue(nextLuck);

          setCandles((prev) => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            const now = Math.floor(Date.now() / 1000);
            if (now - last.time >= 60) {
              const nextCandle: CandlestickData = {
                time: now,
                open: nextPrice,
                high: nextPrice,
                low: nextPrice,
                close: nextPrice,
              };
              return [...prev.slice(-59), nextCandle];
            }
            const updated = {
              ...last,
              high: Math.max(last.high, nextPrice),
              low: Math.min(last.low, nextPrice),
              close: nextPrice,
            };
            return [...prev.slice(0, -1), updated];
          });

          if (currentSession.side === 'LONG') {
            if (nextPrice <= currentSession.liqPrice) {
              endedRef.current = true;
              completeSession('fail');
              setShowResult(true);
            } else if (nextPrice >= currentSession.targetPrice) {
              endedRef.current = true;
              completeSession('success');
              setShowResult(true);
            }
          } else {
            if (nextPrice >= currentSession.liqPrice) {
              endedRef.current = true;
              completeSession('fail');
              setShowResult(true);
            } else if (nextPrice <= currentSession.targetPrice) {
              endedRef.current = true;
              completeSession('success');
              setShowResult(true);
            }
          }
        })
        .catch(() => {});
    }, PRICE_TICK_MS);

    return () => {
      window.clearInterval(priceTimer);
    };
  }, [currentSession, completeSession, updateSession]);

  useEffect(() => {
    if (!currentSession || !address) return;
    const pollTimer = window.setInterval(() => {
      if (endedRef.current) return;
      fetchPositionSize(address)
        .then((size) => {
          if (Math.abs(size) > 0) {
            hadPositionRef.current = true;
            return;
          }
          if (hadPositionRef.current) {
            endedRef.current = true;
            const hitTarget =
              currentSession.side === 'LONG'
                ? currentSession.currentPrice >= currentSession.targetPrice
                : currentSession.currentPrice <= currentSession.targetPrice;
            if (hitTarget) {
              completeSession('success');
            } else {
              abortSession();
            }
            setShowResult(true);
          }
        })
        .catch(() => {});
    }, 3000);
    return () => {
      window.clearInterval(pollTimer);
    };
  }, [address, abortSession, completeSession, currentSession]);

  if (!session) return null;

  const progressLabel =
    luckValue >= 0.7 ? '离🎊只差一步' : luckValue <= 0.3 ? '别眨眼，风险高' : '摇摆中…';

  const handleAbort = async () => {
    if (walletClient && address) {
      try {
        const positionSize = await fetchPositionSize(address);
        const mids = await getAllMids();
        const referencePrice = Number(mids.BTC ?? 0);
        if (Number.isFinite(referencePrice) && referencePrice > 0) {
          await closePositionMarket({
            walletClient,
            address,
            referencePrice,
            positionSize,
          });
          pushToast({ kind: 'success', message: '已尝试市价平仓。' });
        }
      } catch (error) {
        if (isUserRejected(error)) {
          pushToast({ kind: 'info', message: '已取消钱包签名。' });
          return;
        }
        pushToast({ kind: 'error', message: '平仓失败，请检查钱包签名。' });
      }
    }
    abortSession();
    setShowResult(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border-2 border-white/10 bg-black/40 p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase text-white/50">当前价格</div>
            <div className="text-3xl font-black text-success">{formatPrice(session.currentPrice)}</div>
            <div className="text-xs font-mono uppercase text-white/40">别眨眼！</div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm uppercase">
            <div className="rounded-2xl border border-white/10 bg-black/50 px-4 py-2">
              开仓价 {formatPrice(session.entryPrice)}
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/50 px-4 py-2">
              爆仓价 {formatPrice(session.liqPrice)}
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/50 px-4 py-2">
              止盈价 {formatPrice(session.targetPrice)}
            </div>
          </div>
        </div>
      </motion.div>

      <RelativeBar value={luckValue} label={progressLabel} />

      <div className="rounded-3xl border-2 border-white/10 bg-black/40 p-4">
        <PriceChart candles={candles} />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm font-mono uppercase text-white/60">
          {session.side} · 翻 {session.tpMultiple ?? 1} 倍 · 目标 {session.targetProfitUsd}U · {session.leverage}x
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setRoute('/history')}
            className="rounded-full border-2 border-white/40 bg-black/40 px-6 py-3 text-sm font-black uppercase text-white/80 transition-all hover:-translate-y-1"
          >
            关闭窗口 ✖️
          </button>
          <button
            onClick={handleAbort}
            className="rounded-full border-4 border-white bg-failure px-6 py-3 text-sm font-black uppercase text-black shadow-[0_0_20px_rgba(255,51,51,0.6)] transition-all hover:-translate-y-1"
          >
            中止这单 🛑
          </button>
        </div>
      </div>
      <ResultModal
        open={showResult}
        onClose={() => {
          setShowResult(false);
          setRoute('/');
        }}
      />
    </div>
  );
};
