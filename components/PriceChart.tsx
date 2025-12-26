import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickData, ColorType } from 'lightweight-charts';

interface PriceChartProps {
  candles: CandlestickData[];
  priceLines?: Array<{
    price: number;
    color: string;
    title: string;
  }>;
  rangePrices?: number[];
}

export const PriceChart: React.FC<PriceChartProps> = ({ candles, priceLines, rangePrices }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addCandlestickSeries']> | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  const rangeSeriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addLineSeries']> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      height: 260,
      layout: {
        textColor: '#ffffff',
        background: { type: ColorType.Solid, color: 'transparent' },
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.06)' },
        horzLines: { color: 'rgba(255,255,255,0.06)' },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      handleScroll: false,
      handleScale: false,
    });
    const series = chart.addCandlestickSeries({
      upColor: '#0bda7a',
      downColor: '#ff3333',
      borderVisible: false,
      wickUpColor: '#0bda7a',
      wickDownColor: '#ff3333',
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
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;
    seriesRef.current.setData(candles);
  }, [candles]);

  useEffect(() => {
    if (!rangeSeriesRef.current) return;
    if (candles.length === 0) {
      rangeSeriesRef.current.setData([]);
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

  return <div ref={containerRef} className="h-[260px] w-full" />;
};
