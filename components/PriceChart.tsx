import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickData, ColorType } from 'lightweight-charts';
import { Language } from '../types';

interface PriceChartProps {
  candles: CandlestickData[];
  timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  language?: Language;
  priceLines?: Array<{
    price: number;
    color: string;
    title: string;
  }>;
  rangePrices?: number[];
}

const buildTimeFormatter = (timeframe: PriceChartProps['timeframe'], language: Language) => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const options =
    timeframe === '1d'
      ? { month: '2-digit', day: '2-digit' }
      : timeframe === '4h' || timeframe === '1h'
        ? { month: '2-digit', day: '2-digit', hour: '2-digit' }
        : { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
  const locale = language === 'en' ? 'en-US' : 'zh-CN';
  const formatter = new Intl.DateTimeFormat(locale, {
    ...options,
    hour12: false,
    timeZone,
  });
  return (time: number) => formatter.format(new Date(time * 1000));
};

export const PriceChart: React.FC<PriceChartProps> = ({
  candles,
  priceLines,
  rangePrices,
  timeframe = '1m',
  language = 'zh',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addCandlestickSeries']> | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  const rangeSeriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addLineSeries']> | null>(null);
  const candlesRef = useRef<CandlestickData[]>([]);
  const rangePricesRef = useRef<number[] | undefined>(undefined);

  useEffect(() => {
    if (!containerRef.current) return;
    const height = containerRef.current.clientHeight || 320;
    const chart = createChart(containerRef.current, {
      height,
      layout: {
        textColor: '#ffffff',
        background: { type: ColorType.Solid, color: 'transparent' },
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.06)' },
        horzLines: { color: 'rgba(255,255,255,0.06)' },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: timeframe === '1m',
        tickMarkFormatter: (time) => buildTimeFormatter(timeframe, language)(time as number),
      },
      localization: { timeFormatter: buildTimeFormatter(timeframe, language) },
      handleScroll: false,
      handleScale: false,
    });
    const series = chart.addCandlestickSeries({
      upColor: '#0bda7a',
      downColor: '#ff3333',
      borderVisible: false,
      wickUpColor: '#0bda7a',
      wickDownColor: '#ff3333',
      autoscaleInfoProvider: () => {
        const currentCandles = candlesRef.current;
        const currentGuides = rangePricesRef.current;
        if (currentCandles.length === 0 && (!currentGuides || currentGuides.length === 0)) return null;
        const candleMin =
          currentCandles.length === 0 ? Number.POSITIVE_INFINITY : Math.min(...currentCandles.map((item) => item.low));
        const candleMax =
          currentCandles.length === 0 ? Number.NEGATIVE_INFINITY : Math.max(...currentCandles.map((item) => item.high));
        const guideMin = currentGuides?.length ? Math.min(...currentGuides) : Number.POSITIVE_INFINITY;
        const guideMax = currentGuides?.length ? Math.max(...currentGuides) : Number.NEGATIVE_INFINITY;
        const min = Math.min(candleMin, guideMin);
        const max = Math.max(candleMax, guideMax);
        if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
        return { priceRange: { minValue: min, maxValue: max } };
      },
    });
    const rangeSeries = chart.addLineSeries({
      color: 'rgba(0,0,0,0)',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    chartRef.current = chart;
    seriesRef.current = series;
    rangeSeriesRef.current = rangeSeries;

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: timeframe === '1m',
        tickMarkFormatter: (time) => buildTimeFormatter(timeframe, language)(time as number),
      },
      localization: { timeFormatter: buildTimeFormatter(timeframe, language) },
    });
  }, [timeframe, language]);

  useEffect(() => {
    candlesRef.current = candles;
    rangePricesRef.current = rangePrices;
    if (seriesRef.current) {
      seriesRef.current.applyOptions({
        autoscaleInfoProvider: () => {
          const currentCandles = candlesRef.current;
          const currentGuides = rangePricesRef.current;
          if (currentCandles.length === 0 && (!currentGuides || currentGuides.length === 0)) return null;
          const candleMin =
            currentCandles.length === 0
              ? Number.POSITIVE_INFINITY
              : Math.min(...currentCandles.map((item) => item.low));
          const candleMax =
            currentCandles.length === 0
              ? Number.NEGATIVE_INFINITY
              : Math.max(...currentCandles.map((item) => item.high));
          const guideMin = currentGuides?.length ? Math.min(...currentGuides) : Number.POSITIVE_INFINITY;
          const guideMax = currentGuides?.length ? Math.max(...currentGuides) : Number.NEGATIVE_INFINITY;
          const min = Math.min(candleMin, guideMin);
          const max = Math.max(candleMax, guideMax);
          if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
          return { priceRange: { minValue: min, maxValue: max } };
        },
      });
    }
    if (!seriesRef.current || candles.length === 0) return;
    seriesRef.current.setData(candles);
  }, [candles, rangePrices]);

  useEffect(() => {
    if (!rangeSeriesRef.current) return;
    if (candles.length === 0) {
      if (!rangePrices || rangePrices.length === 0) {
        rangeSeriesRef.current.setData([]);
        return;
      }
      const now = Math.floor(Date.now() / 1000);
      const min = Math.min(...rangePrices);
      const max = Math.max(...rangePrices);
      rangeSeriesRef.current.setData([
        { time: now - 60, value: min },
        { time: now, value: max },
      ]);
      return;
    }
    const prices = rangePrices ?? [];
    const candleMin = Math.min(...candles.map((item) => item.low));
    const candleMax = Math.max(...candles.map((item) => item.high));
    const min = Math.min(candleMin, ...prices);
    const max = Math.max(candleMax, ...prices);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return;
    const firstTime = candles[0].time;
    const lastTime = candles[candles.length - 1].time;
    rangeSeriesRef.current.setData([
      { time: firstTime, value: min },
      { time: lastTime, value: max },
    ]);
  }, [candles, rangePrices]);

  useEffect(() => {
    if (!seriesRef.current) return;
    priceLinesRef.current.forEach((line) => seriesRef.current?.removePriceLine(line));
    priceLinesRef.current = [];
    if (!priceLines || priceLines.length === 0) return;
    priceLinesRef.current = priceLines.map((line) =>
      seriesRef.current!.createPriceLine({
        price: line.price,
        color: line.color,
        lineWidth: 2,
        lineStyle: 2,
        title: line.title,
      })
    );
  }, [priceLines]);

  return <div ref={containerRef} className="h-[320px] w-full md:h-[380px]" />;
};
