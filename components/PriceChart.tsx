import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickData, ColorType } from 'lightweight-charts';

interface PriceChartProps {
  candles: CandlestickData[];
}

export const PriceChart: React.FC<PriceChartProps> = ({ candles }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addCandlestickSeries']> | null>(null);

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
    chartRef.current = chart;
    seriesRef.current = series;

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

  return <div ref={containerRef} className="h-[260px] w-full" />;
};
