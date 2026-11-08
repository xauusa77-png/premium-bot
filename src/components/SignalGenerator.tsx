import React, { useState, useEffect } from 'react';
import {
  Zap,
  ArrowUp,
  ArrowDown,
  Cpu,
  Clock,
  Sparkles,
  BarChart2,
  Timer,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CurrencyPair, SignalAnalysis, Timeframe } from '../types';
import { api } from '../services/api';
import { soundService } from '../services/sound';
import { getMarketSchedule } from '../utils/marketSchedule';

interface SignalGeneratorProps {
  selectedPair: CurrencyPair;
  selectedTimeframe: Timeframe;
  onSignalGenerated: (signal: SignalAnalysis) => void;
  latestSignal: SignalAnalysis | null;
}

export const SignalGenerator: React.FC<SignalGeneratorProps> = ({
  selectedPair,
  selectedTimeframe,
  onSignalGenerated,
  latestSignal,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // When a new signal arrives, initialize countdown timer if expirySeconds is present
  useEffect(() => {
    if (latestSignal?.expirySeconds) {
      setCountdown(latestSignal.expirySeconds);
    }
  }, [latestSignal?.id, latestSignal?.expirySeconds]);

  // Live countdown ticker
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleGenerate = async () => {
    // Prevent duplicate clicks while already generating
    if (isGenerating) return;

    // Play crisp digital click sound upon user interaction
    soundService.playClick();

    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratingStep('Analyzing market data...');

    try {
      setTimeout(() => {
        setGeneratingStep('Calculating indicators & momentum...');
      }, 400);

      const signal = await api.generateSignal(selectedPair.symbol, selectedTimeframe);

      setTimeout(() => {
        // Play premium signal arrival sound
        soundService.playSignalArrival(signal.direction);

        onSignalGenerated(signal);
        setIsGenerating(false);
        setGeneratingStep('');
      }, 900);
    } catch (err: any) {
      console.error('Signal generation error:', err);
      setErrorMessage(
        err.message || 'Market data connection unavailable. Please check your data feed.'
      );
      setIsGenerating(false);
      setGeneratingStep('');
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const schedule = getMarketSchedule(selectedPair.market);
  const isLiveMarketClosed = selectedPair.market === 'LIVE' && !schedule.isOpen;

  return (
    <div className="flex flex-col h-full bg-[#0a1022] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-[#080d1c] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-md shadow-blue-900/30">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide">
              SIGNAL GENERATOR
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Quantitative Algorithmic Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {selectedTimeframe}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              selectedPair.market === 'LIVE'
                ? isLiveMarketClosed
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
            }`}
          >
            {selectedPair.market === 'LIVE' && isLiveMarketClosed
              ? 'LIVE (CLOSED)'
              : selectedPair.market === 'OTC'
              ? 'OTC 24/7'
              : 'LIVE'}
          </span>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4 overflow-y-auto">
        {/* Selected Horizon Info Bar - uses selectedPair stored in application state */}
        <div className="p-3.5 rounded-xl bg-[#080d1c] border border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center -space-x-1 text-base">
              <span>{selectedPair.flagBase}</span>
              <span>{selectedPair.flagQuote}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white font-mono text-sm leading-tight">
                {selectedPair.symbol}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedPair.market} Market
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Horizon: <strong className="text-white">{selectedTimeframe}</strong></span>
          </div>
        </div>

        {/* Market Status Banner */}
        {selectedPair.market === 'OTC' ? (
          <div className="px-3 py-2 rounded-xl bg-blue-950/30 border border-blue-500/25 flex items-center justify-between text-xs font-mono">
            <span className="text-blue-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              OTC 24/7 ACTIVE
            </span>
            <span className="text-amber-300 text-[11px] font-semibold">
              Available All 7 Days
            </span>
          </div>
        ) : isLiveMarketClosed ? (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-400 flex items-center gap-1.5 uppercase">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                LIVE MARKET CLOSED ({schedule.dayOfWeek.toUpperCase()})
              </span>
              <span className="px-2 py-0.5 rounded bg-red-900/60 text-red-300 text-[10px] font-bold">
                WEEKEND
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Live Forex market operates Monday through Friday only. On Saturday and Sunday, Live Market signal generation is disabled.
            </p>
            <div className="pt-1 text-amber-300 text-[11px] font-semibold flex items-center gap-1">
              <span>👉 Switch to OTC Market for 24/7 weekend educational simulation.</span>
            </div>
          </div>
        ) : null}

        {/* GENERATE SIGNAL Button (Duplicate click protected, disabled on Live weekends) */}
        <div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || isLiveMarketClosed}
            className={`w-full relative group overflow-hidden py-4 px-6 rounded-2xl font-black text-sm tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-3 border ${
              isLiveMarketClosed
                ? 'bg-red-950/30 text-red-400 border-red-500/40 cursor-not-allowed shadow-none'
                : isGenerating
                ? 'bg-slate-800 text-slate-400 border-slate-700 shadow-none cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 hover:from-blue-500 hover:to-amber-400 active:scale-[0.99] text-white shadow-blue-900/40 border-blue-400/30 cursor-pointer'
            }`}
          >
            {!isGenerating && !isLiveMarketClosed && (
              <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out" />
            )}

            {isLiveMarketClosed ? (
              <div className="flex items-center gap-2 text-red-400">
                <AlertOctagon className="w-5 h-5 text-red-400" />
                <span className="tracking-widest">LIVE MARKET CLOSED</span>
              </div>
            ) : isGenerating ? (
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                <span className="font-mono text-xs text-amber-300 font-bold tracking-wide">
                  {generatingStep || 'PROCESSING MARKET DATA...'}
                </span>
              </div>
            ) : (
              <>
                <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
                <span className="tracking-widest">GENERATE SIGNAL</span>
                <Sparkles className="w-4 h-4 text-amber-200" />
              </>
            )}
          </button>
        </div>

        {/* Error notification if market data is unavailable */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SIGNAL RESULT CARD - SHOW ONLY PAIR, DIRECTION (🟢 UP or 🔴 DOWN), and EXPIRY TIME */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {latestSignal ? (
              <motion.div
                key={latestSignal.id}
                initial={{ opacity: 0, y: 15, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={`p-5 rounded-2xl border transition-all ${
                  latestSignal.direction === 'UP'
                    ? 'bg-gradient-to-b from-[#0c2419] via-[#081710] to-[#050d09] border-emerald-500/60 glow-up'
                    : 'bg-gradient-to-b from-[#260c0c] via-[#180808] to-[#0e0505] border-red-500/60 glow-down'
                }`}
              >
                {/* Trading Pair Display */}
                <div className="text-center pb-3 border-b border-white/10 mb-4">
                  <div className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider mb-1">
                    Selected Trading Pair
                  </div>
                  <div className="text-xl md:text-2xl font-black font-mono text-white tracking-wide">
                    {latestSignal.pair}
                  </div>
                </div>

                {/* ONLY ONE RESULT: 🟢 UP or 🔴 DOWN */}
                <div className="py-6 px-4 text-center">
                  {latestSignal.direction === 'UP' ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-950/80 mb-3 animate-pulse">
                        <ArrowUp className="w-12 h-12 stroke-[3.5]" />
                      </div>
                      <div className="text-4xl md:text-5xl font-black font-mono text-emerald-400 tracking-wider flex items-center gap-2">
                        <span>🟢</span>
                        <span>UP</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 rounded-3xl bg-red-500/20 border-2 border-red-400 flex items-center justify-center text-red-400 shadow-2xl shadow-red-950/80 mb-3 animate-pulse">
                        <ArrowDown className="w-12 h-12 stroke-[3.5]" />
                      </div>
                      <div className="text-4xl md:text-5xl font-black font-mono text-red-400 tracking-wider flex items-center gap-2">
                        <span>🔴</span>
                        <span>DOWN</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expiry Time Card */}
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 font-mono mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-amber-400" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Expiry Time
                        </span>
                        <span className="text-xs md:text-sm font-black text-white">
                          {latestSignal.expiryTime || `${latestSignal.timeframe} Expiry`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Horizon ({latestSignal.expiryDuration || latestSignal.timeframe})
                      </span>
                      {countdown !== null && (
                        <span
                          className={`text-sm md:text-base font-black tabular-nums ${
                            countdown > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'
                          }`}
                        >
                          {countdown > 0 ? formatCountdown(countdown) : '00:00'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generation Timestamp in PKT */}
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Generated: {latestSignal.pktTime}</span>
                  </div>
                  <span className="text-slate-400">{latestSignal.pktDate}</span>
                </div>

                {/* Educational Simulation Notice */}
                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-center">
                  <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-semibold tracking-wider flex items-center gap-1.5 uppercase text-center">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Educational Simulation • Not Real Trading Advice</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[220px] rounded-2xl bg-[#080d1c] border border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                <BarChart2 className="w-10 h-10 text-slate-600 mb-2" />
                <div className="text-xs font-semibold text-slate-400 mb-1">
                  Ready For Signal Analysis
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Select your trading pair and timeframe, then click{' '}
                  <strong className="text-slate-300">GENERATE SIGNAL</strong> to output directional
                  trend and expiry time.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
