import React from 'react';
import {
  Globe,
  Radio,
  Clock,
  Shield,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Info,
  Layers,
} from 'lucide-react';
import { CurrencyPair, TechnicalIndicators, Timeframe } from '../types';

interface OtcTerminalOverviewProps {
  pair: CurrencyPair;
  timeframe: Timeframe;
  livePrice: number;
  indicators: TechnicalIndicators | null;
  dataQuality: string;
}

export const OtcTerminalOverview: React.FC<OtcTerminalOverviewProps> = ({
  pair,
  timeframe,
  livePrice,
  indicators,
  dataQuality,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#0a1022] border border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-2xl justify-between space-y-6">
      {/* Top Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-1 text-2xl">
              <span>{pair.flagBase}</span>
              <span>{pair.flagQuote}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white font-mono tracking-tight">
                  {pair.symbol}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  OTC SYNTHETIC
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {pair.base} / {pair.quote} · 24/7 High-Frequency Weekend Feed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Interval: <strong className="text-white">{timeframe}</strong></span>
            </div>
          </div>
        </div>

        {/* Live Execution Price Hero Card */}
        <div className="mt-5 p-5 rounded-2xl bg-[#080d1c] border border-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                Current OTC Synthetic Market Price
              </span>
              <div className="text-3xl md:text-4xl font-black font-mono text-white tabular-nums tracking-tight mt-1 flex items-baseline gap-2">
                <span>{livePrice.toFixed(pair.digits)}</span>
                <span className="text-xs font-semibold text-blue-400 font-mono">
                  {pair.quote}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>FEED ACTIVE</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Key Metrics Grid (Clean & Simple, No TradingView) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#080d1c] border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Market Mode</span>
          <div className="text-sm font-bold text-white font-mono mt-0.5">24/7 OTC Feed</div>
          <span className="text-[10px] text-blue-400 font-mono">Continuous Stream</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#080d1c] border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-mono">RSI Momentum</span>
          <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
            {indicators ? indicators.rsi : '50.0'}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {indicators?.rsiState || 'Neutral'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#080d1c] border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Support Floor</span>
          <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
            {indicators ? indicators.supportLevel : '---'}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Pivot Extreme</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#080d1c] border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Resistance Ceiling</span>
          <div className="text-sm font-bold text-red-400 font-mono mt-0.5">
            {indicators ? indicators.resistanceLevel : '---'}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Supply Zone</span>
        </div>
      </div>

      {/* Simplified Operational Guide */}
      <div className="p-4 rounded-xl bg-[#080d1c] border border-slate-800/80 text-xs space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Direct OTC Signal Delivery</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          TradingView chart is disabled for OTC markets to ensure a clean, high-speed execution
          environment. Select your target expiry timeframe and click{' '}
          <strong className="text-white">GENERATE SIGNAL</strong> to receive directional trading assessments.
        </p>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>{dataQuality}</span>
        </span>
        <span className="text-slate-400">TradingView Chart Bypassed (OTC Mode)</span>
      </div>
    </div>
  );
};
