import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { CandlestickData } from 'lightweight-charts';
import { useAccount, useWalletClient } from 'wagmi';
import {
  DAILY_LIMIT_ENABLED,
  DEFAULT_MARGIN_USD,
  LEVERAGE,
  MIN_NOTIONAL_USD,
  PRICE_TICK_MS,
  TP_MULTIPLE_OPTIONS,
} from '../constants';
import { useAppStore } from '../store';
import { TradeSide } from '../types';
import { getAllMids, getCandleSnapshot, placeMarketOrderWithTakeProfit, prepareSignerChain } from '../services/hyperliquid';
import { calculateLiqPrice, calculateTargetPrice, formatPrice, getCrownTier, getTodayCount } from '../utils';
import { PriceChart } from '../components/PriceChart';
import { getTierText, t } from '../i18n';

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
  const walletBalanceUsdc = useAppStore((state) => state.walletBalanceUsdc);
  const language = useAppStore((state) => state.language);

  const [side, setSide] = useState<TradeSide>('LONG');
  const [tpMultiple, setTpMultiple] = useState<number>(TP_MULTIPLE_OPTIONS[0]);
  const [customMultiple, setCustomMultiple] = useState<string>('');
  const [marginUsd, setMarginUsd] = useState<number>(DEFAULT_MARGIN_USD);
  const [marginInput, setMarginInput] = useState<string>(String(DEFAULT_MARGIN_USD));
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('1m');

  const isUserRejected = (error: any) => {
    const code = error?.code;
    const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
    return code === 4001 || message.includes('user rejected') || message.includes('rejected');
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [candles, setCandles] = useState<CandlestickData[]>([]);
  const [referencePrice, setReferencePrice] = useState<number | null>(null);
  const selectedTier = useMemo(() => getCrownTier(tpMultiple), [tpMultiple]);
  const selectedTierText = useMemo(() => getTierText(selectedTier, language), [selectedTier, language]);

  const normalizeDecimalInput = (value: string) => {
    if (value === '') return '';
    let next = value.replace(/[^0-9.]/g, '');
    const parts = next.split('.');
    if (parts.length > 2) {
      next = `${parts[0]}.${parts.slice(1).join('')}`;
    }
    if (next === '.') return '0.';
    if (next.startsWith('.')) return `0${next}`;
    if (next.startsWith('0') && next.length > 1 && next[1] !== '.') {
      next = next.replace(/^0+/, '');
      if (next === '') next = '0';
    }
    return next;
  };

  const timeframeOptions = [
    { label: '1m', value: '1m', lookbackMs: 2 * 60 * 60 * 1000 },
    { label: '5m', value: '5m', lookbackMs: 12 * 60 * 60 * 1000 },
    { label: '15m', value: '15m', lookbackMs: 24 * 60 * 60 * 1000 },
    { label: '1h', value: '1h', lookbackMs: 7 * 24 * 60 * 60 * 1000 },
    { label: '4h', value: '4h', lookbackMs: 30 * 24 * 60 * 60 * 1000 },
    { label: '1d', value: '1d', lookbackMs: 180 * 24 * 60 * 60 * 1000 },
  ] as const;

  useEffect(() => {
    const now = Date.now();
    const range = timeframeOptions.find((option) => option.value === timeframe)?.lookbackMs ?? 2 * 60 * 60 * 1000;
    getCandleSnapshot(now - range, now, timeframe)
      .then((snapshot) => {
        if (Array.isArray(snapshot)) {
          setCandles(buildCandlesFromSnapshot(snapshot));
        }
      })
      .catch(() => {});
  }, [timeframe]);

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

  const targetProfitUsd = useMemo(() => marginUsd * tpMultiple, [marginUsd, tpMultiple]);

  const priceGuides = useMemo(() => {
    const latestCandle = candles[candles.length - 1]?.close;
    const basePrice = referencePrice ?? latestCandle ?? null;
    if (!Number.isFinite(basePrice) || basePrice === null) return null;
    const liqPrice = calculateLiqPrice(basePrice, side);
    const targetPrice = calculateTargetPrice(basePrice, side, targetProfitUsd, LEVERAGE, marginUsd);
    return { liqPrice, targetPrice };
  }, [candles, referencePrice, side, targetProfitUsd, marginUsd]);

  const handleSubmit = async () => {
    if (!isConnected || !address || !walletClient) {
      pushToast({ kind: 'error', message: t(language, 'toast.connectFirst') });
      return;
    }
    if (DAILY_LIMIT_ENABLED && getTodayCount(history) >= 1) {
      pushToast({ kind: 'error', message: t(language, 'toast.dailyLimit') });
      return;
    }
    if (marginUsd <= 0) {
      pushToast({ kind: 'error', message: t(language, 'toast.marginPositive') });
      return;
    }
    if (walletBalanceUsdc !== null && marginUsd > walletBalanceUsdc) {
      pushToast({ kind: 'error', message: t(language, 'toast.balanceLow') });
      return;
    }
    if (marginUsd * LEVERAGE < MIN_NOTIONAL_USD) {
      pushToast({ kind: 'error', message: t(language, 'toast.minNotional') });
      return;
    }
    if (tpMultiple < 0.05) {
      pushToast({ kind: 'error', message: t(language, 'toast.multipleMin') });
      return;
    }
    setIsSubmitting(true);
    try {
      pushToast({ kind: 'info', message: t(language, 'toast.prepSign') });
      const originalChainId = await prepareSignerChain(walletClient);
      pushToast({ kind: 'info', message: t(language, 'toast.walletReady') });
      const allMids = await getAllMids();
      const referencePrice = Number(allMids.BTC ?? 0);
      if (!Number.isFinite(referencePrice) || referencePrice <= 0) {
        throw new Error('Invalid BTC price');
      }
      pushToast({ kind: 'info', message: t(language, 'toast.priceReady') });
      const size = (marginUsd * LEVERAGE) / referencePrice;
      pushToast({ kind: 'info', message: t(language, 'toast.signed') });
      const orderResponse = await placeMarketOrderWithTakeProfit({
        walletClient,
        address,
        isBuy: side === 'LONG',
        size,
        referencePrice,
        takeProfitPrice:
          priceGuides?.targetPrice ?? calculateTargetPrice(referencePrice, side, targetProfitUsd, LEVERAGE, marginUsd),
        originalChainId,
      });
      pushToast({ kind: 'info', message: t(language, 'toast.orderReceived') });
      console.info('Hyperliquid order response', orderResponse);
      const statuses = orderResponse?.response?.data?.statuses ?? [];
      const mainStatus = statuses[0];
      const tpStatus = statuses[1];
      const filled = mainStatus?.filled;
      const errorMessage = mainStatus?.error ?? orderResponse?.error;
      if (errorMessage) {
        pushToast({ kind: 'error', message: t(language, 'toast.orderFailed', { message: errorMessage }) });
        return;
      }
      if (!filled) {
        pushToast({ kind: 'error', message: t(language, 'toast.orderNotFilled') });
        return;
      }
      const filledPrice = Number(filled.avgPx ?? referencePrice);
      const filledSize = Number(filled.totalSz ?? size);
      const actualMarginUsd = (filledSize * filledPrice) / LEVERAGE;
      const actualTargetProfitUsd = actualMarginUsd * tpMultiple;
      startSession({
        side,
        targetProfitUsd: actualTargetProfitUsd,
        tpMultiple,
        marginUsd: actualMarginUsd,
        entryPrice: filledPrice,
      });
      setRoute('/run');
      const liqPrice = calculateLiqPrice(filledPrice, side);
      const targetPrice = calculateTargetPrice(filledPrice, side, actualTargetProfitUsd, LEVERAGE, actualMarginUsd);
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
        pushToast({ kind: 'error', message: t(language, 'toast.tpFailed', { message: tpStatus.error }) });
      } else {
        pushToast({ kind: 'success', message: t(language, 'toast.tpPlaced') });
      }
    } catch (error: any) {
      if (isUserRejected(error)) {
        pushToast({ kind: 'info', message: t(language, 'toast.signCanceled') });
        return;
      }
      const rawMessage = typeof error?.message === 'string' ? error.message : '';
      const friendly =
        rawMessage.includes('not been authorized') || rawMessage.includes('WalletConnect')
          ? t(language, 'toast.walletUnauthorized')
          : rawMessage
            ? t(language, 'toast.orderFailed', { message: rawMessage })
            : t(language, 'toast.orderFailedGeneric');
      pushToast({ kind: 'error', message: friendly });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative pb-28">
      <div className="grid gap-6 md:grid-cols-[1fr_1.35fr]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-3xl border-2 border-white/10 bg-black/40 p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black uppercase">{t(language, 'trade.title')}</h2>
            <span className="text-xs font-mono uppercase text-white/50">
              {t(language, 'trade.fixedLeverage', { leverage: LEVERAGE })}
            </span>
          </div>

          <div className="mt-3 grid gap-3">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-mono uppercase text-white/60">
              <span>{t(language, 'trade.marginSummary', { margin: marginUsd.toFixed(2) })}</span>
              <span>{t(language, 'trade.notionalSummary', { notional: formatPrice(marginUsd * LEVERAGE) })}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-mono uppercase text-white/60">{t(language, 'trade.marginInput')}</label>
              <input
                inputMode="decimal"
                value={marginInput}
                onChange={(event) => {
                  const normalized = normalizeDecimalInput(event.target.value);
                  setMarginInput(normalized);
                  const parsed = Number(normalized);
                  if (Number.isFinite(parsed)) {
                    setMarginUsd(parsed);
                  }
                }}
                onBlur={() => {
                  if (marginInput === '') return;
                  const parsed = Number(marginInput);
                  if (Number.isFinite(parsed)) {
                    setMarginInput(parsed.toString());
                  }
                }}
                className="w-28 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-bold text-white outline-none"
              />
            </div>
          </div>

          <div className="mt-4 text-[11px] font-mono uppercase text-white/50">{t(language, 'trade.direction')}</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(['LONG', 'SHORT'] as TradeSide[]).map((option) => (
              <button
                key={option}
                onClick={() => setSide(option)}
                className={`rounded-xl border px-3 py-2 text-xs font-black uppercase transition-all ${
                  side === option
                    ? 'border-success bg-success/20 text-success shadow-[0_0_12px_rgba(11,218,122,0.45)]'
                    : 'border-white/10 bg-black/30 text-white/60 hover:border-success/60'
                }`}
              >
                {option === 'LONG' ? '🚀 Long' : '🧨 Short'}
              </button>
            ))}
          </div>

          <div className="mt-4 text-[11px] font-mono uppercase text-white/50">{t(language, 'trade.multiple')}</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {TP_MULTIPLE_OPTIONS.map((multiple) => {
              const tier = getCrownTier(multiple);
              const tierText = getTierText(tier, language);
              return (
                <button
                  key={multiple}
                  onClick={() => {
                    setTpMultiple(multiple);
                    setCustomMultiple('');
                  }}
                  className={`rounded-xl border px-2 py-2 text-[11px] font-black uppercase transition-all ${
                    tpMultiple === multiple && customMultiple === ''
                      ? 'border-primary bg-primary text-black shadow-[0_0_16px_rgba(205,43,238,0.6)]'
                      : 'border-white/10 bg-black/30 text-white/60 hover:border-primary/60'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{t(language, 'trade.multipleItem', { multiple })}</span>
                    <span className={`text-[9px] ${tier.color}`}>{tierText.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase text-white/60">
            <span className={`text-sm ${selectedTier.color}`}>{selectedTier.emoji}</span>
            {t(language, 'trade.rewardEstimate', { label: selectedTierText.label, name: selectedTierText.name })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <label className="text-xs font-mono uppercase text-white/60">{t(language, 'trade.customMultiple')}</label>
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
              placeholder={t(language, 'trade.customPlaceholder')}
              className="w-28 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-bold text-white outline-none"
            />
          </div>
          <div className="text-[10px] font-mono uppercase text-white/40">{t(language, 'trade.customMin')}</div>

          <div className="mt-4 rounded-2xl border border-primary/70 bg-black px-4 py-3 text-sm font-black uppercase text-primary shadow-[0_0_18px_rgba(205,43,238,0.45)]">
            {t(language, 'trade.targetProfit', { value: targetProfitUsd.toFixed(3) })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border-2 border-white/10 bg-black/40 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-3 text-xs font-mono uppercase text-white/60">
            <div className="flex items-center gap-3">
              <span>{t(language, 'trade.chartTitle')}</span>
              <span>
                {referencePrice
                  ? t(language, 'trade.referencePrice', { price: formatPrice(referencePrice) })
                  : t(language, 'trade.priceLoading')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {timeframeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeframe(option.value)}
                  className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase transition-all ${
                    timeframe === option.value
                      ? 'border-primary bg-primary text-black shadow-[0_0_12px_rgba(205,43,238,0.6)]'
                      : 'border-white/10 bg-black/30 text-white/60 hover:border-primary/60'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <PriceChart
            candles={candles}
            timeframe={timeframe}
            language={language}
            priceLines={
              priceGuides
                ? [
                    { price: priceGuides.liqPrice, color: '#ff3333', title: t(language, 'relative.liqLabel') },
                    { price: priceGuides.targetPrice, color: '#0bda7a', title: t(language, 'relative.tpLabel') },
                  ]
                : undefined
            }
            rangePrices={priceGuides ? [priceGuides.liqPrice, priceGuides.targetPrice] : undefined}
          />
        </motion.div>
      </div>

      <div className="rounded-[32px] border-4 border-primary bg-primary/10 p-6">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-black uppercase">{t(language, 'trade.readyTitle')}</h3>
            <p className="text-sm text-white/70">{t(language, 'trade.readyCopy')}</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-full border-4 border-white bg-primary px-8 py-4 text-lg font-black uppercase text-black shadow-[0_0_30px_rgba(205,43,238,0.6)] transition-all hover:-translate-y-1 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t(language, 'trade.submitting') : t(language, 'trade.submit')}
          </button>
        </div>
      </div>
    </div>
  );
};
