import React from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Layers,
  Radio,
  Sparkles,
} from 'lucide-react';
import { StatsOverview } from '../types';

interface StatsCardsProps {
  stats: StatsOverview;
  selectedPrice: number;
  digits: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  selectedPrice,
  digits,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
      {/* 1. Market Status */}
      <div className="p-3.5 rounded-xl bg-[#0c1427]/80 border border-slate-800/80 backdrop-blur hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Market Status</span>
          <Activity className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div>
          <div className="text-sm font-bold font-mono tracking-tight flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full inline-block ${
                stats.marketStatus.includes('CLOSED')
                  ? 'bg-red-400'
                  : stats.marketStatus.includes('OTC')
                  ? 'bg-blue-400 animate-pulse'
                  : 'bg-emerald-400 animate-ping'
              }`}
            />
            <span
              className={
                stats.marketStatus.includes('CLOSED')
                  ? 'text-red-400'
                  : stats.marketStatus.includes('OTC')
                  ? 'text-blue-300'
                  : 'text-white'
              }
            >
              {stats.marketStatus || 'ACTIVE'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {stats.marketStatus.includes('CLOSED')
              ? 'Weekend Session (Mon–Fri Only)'
              : stats.marketStatus.includes('OTC')
              ? '7 Days Active (Weekend Ready)'
              : 'Trading Session Open'}
          </span>
        </div>
      </div>

      {/* 2. Selected Currency Pair */}
      <div className="p-3.5 rounded-xl bg-[#0c1427]/80 border border-slate-800/80 backdrop-blur hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Selected Pair</span>
          <Layers className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div>
          <div className="text-sm font-bold text-amber-300 font-mono tracking-tight">
            {stats.selectedPair}
          </div>
          <div className="text-xs font-mono font-bold text-white tabular-nums">
            {selectedPrice.toFixed(digits)}
          </div>
        </div>
      </div>

      {/* 3. Data Connection */}
      <div className="p-3.5 rounded-xl bg-[#0c1427]/80 border border-slate-800/80 backdrop-blur hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Data Connection</span>
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-200 truncate font-mono">
            {stats.dataConnection.split(' ')[0]} {stats.dataConnection.split(' ')[1] || 'Feed'}
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">Real-Time Sync</span>
        </div>
      </div>

      {/* 4. Total Generated Analyses */}
      <div className="p-3.5 rounded-xl bg-[#0c1427]/80 border border-slate-800/80 backdrop-blur hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Total Analyses</span>
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div>
          <div className="text-base font-black text-white font-mono tabular-nums">
            {stats.totalSignals}
          </div>
          <span className="text-[10px] text-slate-400">Saved in Database</span>
        </div>
      </div>

      {/* 5. UP Analysis Count */}
      <div className="p-3.5 rounded-xl bg-[#0c1427]/80 border border-emerald-950/40 hover:border-emerald-500/30 backdrop-blur transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-400/80 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">UP Analyses</span>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div>
          <div className="text-base font-black text-emerald-400 font-mono tabular-nums">
            {stats.upCount}
          </div>
          <span className="text-[10px] text-emerald-500/80 font-medium">Bullish Signals</span>
        </div>
      </div>

      {/* 6. DOWN Analysis Count */}
      <div className="p-3.5 rounded-xl bg-[#0c1427]/80 border border-red-950/40 hover:border-red-500/30 backdrop-blur transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-red-400/80 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">DOWN Analyses</span>
          <TrendingDown className="w-3.5 h-3.5 text-red-400" />
        </div>
        <div>
          <div className="text-base font-black text-red-400 font-mono tabular-nums">
            {stats.downCount}
          </div>
          <span className="text-[10px] text-red-500/80 font-medium">Bearish Signals</span>
        </div>
      </div>
    </div>
  );
};
