import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  CandlestickSeries,
  LineSeries,
  UTCTimestamp,
} from 'lightweight-charts';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Sliders,
  TrendingUp,
  Activity,
  AlertOctagon,
} from 'lucide-react';
import { Candle, CurrencyPair, Timeframe } from '../types';
import { getMarketSchedule } from '../utils/marketSchedule';

interface TradingChartProps {
  pair: CurrencyPair;
  timeframe: Timeframe;
  candles: Candle[];
  livePrice: number;
  dataQuality: string;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  pair,
  timeframe,
  candles,
  livePrice,
  dataQuality,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Indicator toggles
  const [showEma9, setShowEma9] = useState(true);
  const [showEma21, setShowEma21] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);

  // Hovered candle state for tooltip
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);

  // Initialize TradingView chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    container.innerHTML = '';

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight || 450,
      layout: {
        background: { type: ColorType.Solid, color: '#070c18' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.45)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.45)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(59, 130, 246, 0.5)',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: 'rgba(59, 130, 246, 0.5)',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(51, 65, 85, 0.5)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.15,
        },
      },
      timeScale: {
        borderColor: 'rgba(51, 65, 85, 0.5)',
        timeVisible: true,
        secondsVisible: timeframe.endsWith('S'),
      },
    });

    chartRef.current = chart;

    // Add Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      priceFormat: {
        type: 'price',
        precision: pair.digits,
        minMove: Math.pow(10, -pair.digits),
      },
    });
    candleSeriesRef.current = candleSeries;

    // Add EMA 9 Series
    const ema9Series = chart.addSeries(LineSeries, {
      color: '#38bdf8',
      lineWidth: 2,
      priceLineVisible: false,
      title: 'EMA 9',
    });
    ema9SeriesRef.current = ema9Series;

    // Add EMA 21 Series
    const ema21Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      priceLineVisible: false,
      title: 'EMA 21',
    });
    ema21SeriesRef.current = ema21Series;

    // Add Bollinger Bands Upper
    const bbUpperSeries = chart.addSeries(LineSeries, {
      color: 'rgba(168, 85, 247, 0.7)',
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      title: 'BB Upper',
    });
    bbUpperSeriesRef.current = bbUpperSeries;

    // Add Bollinger Bands Lower
    const bbLowerSeries = chart.addSeries(LineSeries, {
      color: 'rgba(168, 85, 247, 0.7)',
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      title: 'BB Lower',
    });
    bbLowerSeriesRef.current = bbLowerSeries;

    // Crosshair subscribe
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData.get(candleSeries)) {
        setHoveredCandle(null);
        return;
      }
      const data = param.seriesData.get(candleSeries) as any;
      if (data && 'open' in data) {
        setHoveredCandle({
          time: param.time as number,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
        });
      }
    });

    // Handle Resize
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [pair.symbol, pair.digits, timeframe]);

  // Update chart data whenever candles change
  useEffect(() => {
    if (!candleSeriesRef.current || !candles || candles.length === 0) return;

    // Sort ascending by time and eliminate duplicates
    const sortedCandles = [...candles]
      .filter((c, idx, arr) => idx === 0 || c.time > arr[idx - 1].time)
      .map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

    candleSeriesRef.current.setData(sortedCandles);

    // Calculate and apply EMA 9
    if (ema9SeriesRef.current) {
      if (showEma9 && sortedCandles.length >= 9) {
        const k = 2 / 10;
        let prev = sortedCandles.slice(0, 9).reduce((a, b) => a + b.close, 0) / 9;
        const emaData = [{ time: sortedCandles[8].time, value: prev }];

        for (let i = 9; i < sortedCandles.length; i++) {
          const val = sortedCandles[i].close * k + prev * (1 - k);
          emaData.push({ time: sortedCandles[i].time, value: val });
          prev = val;
        }
        ema9SeriesRef.current.setData(emaData);
      } else {
        ema9SeriesRef.current.setData([]);
      }
    }

    // Calculate and apply EMA 21
    if (ema21SeriesRef.current) {
      if (showEma21 && sortedCandles.length >= 21) {
        const k = 2 / 22;
        let prev = sortedCandles.slice(0, 21).reduce((a, b) => a + b.close, 0) / 21;
        const emaData = [{ time: sortedCandles[20].time, value: prev }];

        for (let i = 21; i < sortedCandles.length; i++) {
          const val = sortedCandles[i].close * k + prev * (1 - k);
          emaData.push({ time: sortedCandles[i].time, value: val });
          prev = val;
        }
        ema21SeriesRef.current.setData(emaData);
      } else {
        ema21SeriesRef.current.setData([]);
      }
    }

    // Calculate and apply Bollinger Bands (20, 2)
    if (bbUpperSeriesRef.current && bbLowerSeriesRef.current) {
      if (showBollinger && sortedCandles.length >= 20) {
        const upperData: { time: UTCTimestamp; value: number }[] = [];
        const lowerData: { time: UTCTimestamp; value: number }[] = [];

        for (let i = 19; i < sortedCandles.length; i++) {
          const slice = sortedCandles.slice(i - 19, i + 1);
          const mean = slice.reduce((a, b) => a + b.close, 0) / 20;
          const variance = slice.reduce((a, b) => a + Math.pow(b.close - mean, 2), 0) / 20;
          const stdDev = Math.sqrt(variance);

          upperData.push({ time: sortedCandles[i].time, value: mean + 2 * stdDev });
          lowerData.push({ time: sortedCandles[i].time, value: mean - 2 * stdDev });
        }

        bbUpperSeriesRef.current.setData(upperData);
        bbLowerSeriesRef.current.setData(lowerData);
      } else {
        bbUpperSeriesRef.current.setData([]);
        bbLowerSeriesRef.current.setData([]);
      }
    }

    // Auto fit content once on load
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [candles, showEma9, showEma21, showBollinger]);

  const handleZoomIn = () => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (range) {
      const delta = (range.to - range.from) * 0.2;
      timeScale.setVisibleLogicalRange({
        from: range.from + delta,
        to: range.to - delta,
      });
    }
  };

  const handleZoomOut = () => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (range) {
      const delta = (range.to - range.from) * 0.2;
      timeScale.setVisibleLogicalRange({
        from: range.from - delta,
        to: range.to + delta,
      });
    }
  };

  const handleReset = () => {
    if (!chartRef.current) return;
    chartRef.current.timeScale().fitContent();
  };

  const activeCandle = hoveredCandle || (candles.length > 0 ? candles[candles.length - 1] : null);
  const isUp = activeCandle ? activeCandle.close >= activeCandle.open : true;
  const schedule = getMarketSchedule(pair.market);
  const isLiveClosed = pair.market === 'LIVE' && !schedule.isOpen;

  return (
    <div className="flex flex-col h-full bg-[#070c18] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Weekend Live Market Closed Banner */}
      {isLiveClosed && (
        <div className="px-4 py-2 bg-red-950/70 border-b border-red-500/30 text-xs font-mono text-red-300 flex items-center justify-between z-20">
          <div className="flex items-center gap-2 font-bold">
            <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
            <span>LIVE MARKET CLOSED ({schedule.dayOfWeek.toUpperCase()})</span>
            <span className="text-[11px] text-slate-300 font-normal hidden sm:inline">
              · Live forex session reopens Monday
            </span>
          </div>
          <span className="text-[10px] text-amber-300 font-semibold">
            OTC Market 24/7 Active
          </span>
        </div>
      )}

      {/* Chart Top Bar: Pair Info, Indicators & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#090f20] border-b border-slate-800/80 z-10">
        {/* Left: Pair symbol, flags, market badge & active prices */}
        <div className="flex items-center gap-3">
          <div className="flex items-center -space-x-1 text-base">
            <span>{pair.flagBase}</span>
            <span>{pair.flagQuote}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-base text-white font-mono tracking-tight">
              {pair.symbol}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider ${
                pair.market === 'LIVE'
                  ? isLiveClosed
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              }`}
            >
              {isLiveClosed ? 'LIVE (CLOSED)' : pair.market}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Real-time Current Price */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-white tabular-nums">
              {(livePrice || (activeCandle?.close ?? 0)).toFixed(pair.digits)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
              · {dataQuality}
            </span>
          </div>
        </div>

        {/* Right: Technical Indicator Toggles & Zoom controls */}
        <div className="flex items-center gap-2">
          {/* Indicators Toggle Buttons */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setShowEma9(!showEma9)}
              className={`px-2 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                showEma9
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EMA 9
            </button>
            <button
              onClick={() => setShowEma21(!showEma21)}
              className={`px-2 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                showEma21
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EMA 21
            </button>
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                showBollinger
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BB (20,2)
            </button>
          </div>

          {/* Zoom & Fit buttons */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={handleZoomIn}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Fit View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* OHLC Bar HUD */}
      {activeCandle && (
        <div className="flex items-center gap-4 px-4 py-1.5 bg-[#080d1c]/90 border-b border-slate-800/40 text-[11px] font-mono tabular-nums text-slate-400 z-10 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">O:</span>
            <span className={isUp ? 'text-emerald-400' : 'text-red-400'}>
              {activeCandle.open.toFixed(pair.digits)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">H:</span>
            <span className="text-slate-200">{activeCandle.high.toFixed(pair.digits)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">L:</span>
            <span className="text-slate-200">{activeCandle.low.toFixed(pair.digits)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">C:</span>
            <span className={isUp ? 'text-emerald-400' : 'text-red-400'}>
              {activeCandle.close.toFixed(pair.digits)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span>VOL:</span>
            <span className="text-slate-400">{activeCandle.volume || 100}</span>
          </div>
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="relative flex-1 w-full min-h-[380px] md:min-h-[460px]">
        <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
};
