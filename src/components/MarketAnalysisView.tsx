import React from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Shield,
  Gauge,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { CurrencyPair, TechnicalIndicators, Timeframe } from '../types';

interface MarketAnalysisViewProps {
  pair: CurrencyPair;
  timeframe: Timeframe;
  indicators: TechnicalIndicators | null;
  livePrice: number;
}

export const MarketAnalysisView: React.FC<MarketAnalysisViewProps> = ({
  pair,
  timeframe,
  indicators,
  livePrice,
}) => {
  if (!indicators) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#0a1022] border border-slate-800 rounded-2xl">
        <Activity className="w-8 h-8 text-blue-400 animate-spin mb-3" />
        <span className="text-sm font-semibold text-slate-300">Computing Technical Indicators...</span>
      </div>
    );
  }

  const rsi = indicators.rsi;
  const isRsiOverbought = rsi >= 70;
  const isRsiOversold = rsi <= 30;

  return (
    <div className="flex flex-col space-y-4">
      {/* Header Info */}
      <div className="p-4 rounded-2xl bg-[#0a1022] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white font-mono">
              TECHNICAL ANALYSIS SCANNER: {pair.symbol}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>Horizon: {timeframe}</span>
              <span>·</span>
              <span className="text-amber-400">Market: {pair.market}</span>
              <span>·</span>
              <span className="text-white font-bold">
                Price: {livePrice.toFixed(pair.digits)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400 mr-2">Structure:</span>
            <span
              className={`font-bold ${
                indicators.marketTrend.includes('UPTREND')
                  ? 'text-emerald-400'
                  : indicators.marketTrend.includes('DOWNTREND')
                  ? 'text-red-400'
                  : 'text-amber-400'
              }`}
            >
              {indicators.marketTrend.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400 mr-2">Momentum:</span>
            <span
              className={`font-bold ${
                indicators.momentumScore > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {indicators.momentumScore > 0 ? `+${indicators.momentumScore}` : indicators.momentumScore}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Indicator Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. RSI (14) Meter */}
        <div className="p-4 rounded-2xl bg-[#0a1022] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">RSI (14 Period)</span>
              <Gauge className="w-4 h-4 text-blue-400" />
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black font-mono text-white tabular-nums">
                {rsi}
              </span>
              <span
                className={`text-xs font-bold font-mono uppercase ${
                  isRsiOverbought
                    ? 'text-red-400'
                    : isRsiOversold
                    ? 'text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                {indicators.rsiState}
              </span>
            </div>

            {/* Gauge bar */}
            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden relative mb-2">
              <div
                className={`h-full transition-all duration-500 ${
                  rsi > 60
                    ? 'bg-emerald-500'
                    : rsi < 40
                    ? 'bg-red-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${rsi}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Oversold (30)</span>
            <span>Neutral (50)</span>
            <span>Overbought (70)</span>
          </div>
        </div>

        {/* 2. MACD (12, 26, 9) */}
        <div className="p-4 rounded-2xl bg-[#0a1022] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">MACD (12, 26, 9)</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">MACD Line:</span>
                <span className="font-bold text-white tabular-nums">
                  {indicators.macd.macd}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Signal Line:</span>
                <span className="font-bold text-slate-300 tabular-nums">
                  {indicators.macd.signal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Histogram:</span>
                <span
                  className={`font-bold tabular-nums ${
                    indicators.macd.histogram >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {indicators.macd.histogram >= 0 ? '+' : ''}
                  {indicators.macd.histogram}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-amber-400 font-semibold truncate">
            {indicators.macd.status}
          </div>
        </div>

        {/* 3. Moving Averages Stack */}
        <div className="p-4 rounded-2xl bg-[#0a1022] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Moving Averages</span>
              <Sliders className="w-4 h-4 text-amber-400" />
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-sky-400">EMA 9:</span>
                <span className="font-bold text-white tabular-nums">
                  {indicators.ema9}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400">EMA 21:</span>
                <span className="font-bold text-white tabular-nums">
                  {indicators.ema21}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SMA 50:</span>
                <span className="font-bold text-slate-300 tabular-nums">
                  {indicators.sma50}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono font-semibold">
            <span className="text-slate-400">Stack: </span>
            <span
              className={
                indicators.emaTrend.includes('BULLISH')
                  ? 'text-emerald-400'
                  : indicators.emaTrend.includes('BEARISH')
                  ? 'text-red-400'
                  : 'text-slate-300'
              }
            >
              {indicators.emaTrend.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* 4. Bollinger Bands & Price Channels */}
        <div className="p-4 rounded-2xl bg-[#0a1022] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Bollinger Bands (20, 2)</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-purple-400">Upper Band:</span>
                <span className="font-bold text-white tabular-nums">
                  {indicators.bollingerBands.upper}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Middle (Basis):</span>
                <span className="font-bold text-slate-300 tabular-nums">
                  {indicators.bollingerBands.middle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400">Lower Band:</span>
                <span className="font-bold text-white tabular-nums">
                  {indicators.bollingerBands.lower}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Band Position %B:</span>
            <span className="text-amber-400 font-bold">
              {(indicators.bollingerBands.percentB * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Pattern Recognition & Key Horizontal Levels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Candlestick Pattern Card */}
        <div className="p-5 rounded-2xl bg-[#0a1022] border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Algorithmic Pattern Scanner</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-400/10 text-amber-400 border border-amber-400/30">
              ACTIVE DETECTOR
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 mb-3">
            <span className="text-[11px] text-slate-400 font-mono">Current Identified Formation:</span>
            <div className="text-base font-extrabold text-white font-mono mt-0.5">
              {indicators.candlestickPattern}
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Real-time scanner verifies body-to-wick proportions, engulfing coverage, hammer tail
            extensions, and marubozu dominance across the active candlestick sequence.
          </p>
        </div>

        {/* Dynamic Key Price Levels */}
        <div className="p-5 rounded-2xl bg-[#0a1022] border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Support & Resistance Pivots</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-400/10 text-blue-400 border border-blue-400/30">
              25-BAR WINDOW
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20">
              <span className="text-[10px] text-red-400 uppercase font-mono font-bold">
                Resistance Ceiling
              </span>
              <div className="text-lg font-black font-mono text-white tabular-nums mt-0.5">
                {indicators.resistanceLevel}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold">
                Support Floor
              </span>
              <div className="text-lg font-black font-mono text-white tabular-nums mt-0.5">
                {indicators.supportLevel}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Calculated via algorithmic swing extremes to identify supply and demand equilibrium
            zones on the selected timeframe.
          </p>
        </div>
      </div>
    </div>
  );
};
