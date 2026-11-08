import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  MinusCircle,
  Clock,
  Sparkles,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';
import { SignalAnalysis } from '../types';
import { api } from '../services/api';

interface SignalHistoryProps {
  signals: SignalAnalysis[];
  onRefresh: () => void;
  onSelectSignal?: (signal: SignalAnalysis) => void;
}

export const SignalHistory: React.FC<SignalHistoryProps> = ({
  signals,
  onRefresh,
  onSelectSignal,
}) => {
  const [search, setSearch] = useState('');
  const [filterMarket, setFilterMarket] = useState('ALL');
  const [filterDirection, setFilterDirection] = useState('ALL');
  const [filterTimeframe, setFilterTimeframe] = useState('ALL');
  const [selectedSignalModal, setSelectedSignalModal] = useState<SignalAnalysis | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const filteredSignals = useMemo(() => {
    return signals.filter((sig) => {
      const matchSearch =
        sig.pair.toLowerCase().includes(search.toLowerCase()) ||
        sig.explanation.toLowerCase().includes(search.toLowerCase()) ||
        sig.confidence.toLowerCase().includes(search.toLowerCase());

      const matchMarket = filterMarket === 'ALL' || sig.market === filterMarket;
      const matchDirection = filterDirection === 'ALL' || sig.direction === filterDirection;
      const matchTimeframe = filterTimeframe === 'ALL' || sig.timeframe === filterTimeframe;

      return matchSearch && matchMarket && matchDirection && matchTimeframe;
    });
  }, [signals, search, filterMarket, filterDirection, filterTimeframe]);

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all signal history records?')) {
      return;
    }
    setIsClearing(true);
    try {
      await api.clearSignals();
      onRefresh();
    } catch (err) {
      console.error('Error clearing signals:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const exportCSV = () => {
    if (signals.length === 0) return;
    const headers = ['ID,Pair,Market,Timeframe,Direction,Price,Confidence,PKT_Date,PKT_Time,DataQuality'];
    const rows = signals.map(
      (s) =>
        `"${s.id}","${s.pair}","${s.market}","${s.timeframe}","${s.direction}",${s.currentPrice},"${s.confidence}","${s.pktDate}","${s.pktTime}","${s.dataQuality}"`
    );
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `premium_bot_signals_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a1022] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800/80 bg-[#080d1c] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide">
              HISTORICAL SIGNALS & AUDIT LOG
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Saved Database Records ({signals.length} total)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={signals.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={handleClearHistory}
            disabled={signals.length === 0 || isClearing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/30 border border-red-900/40 hover:bg-red-900/30 text-xs font-semibold text-red-400 hover:text-red-300 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear History</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-[#080d1c]/60 border-b border-slate-800/60 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search signals by pair or reasoning..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Market Filter */}
        <select
          value={filterMarket}
          onChange={(e) => setFilterMarket(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="ALL">All Markets</option>
          <option value="LIVE">Live Forex</option>
          <option value="OTC">OTC Market</option>
        </select>

        {/* Direction Filter */}
        <select
          value={filterDirection}
          onChange={(e) => setFilterDirection(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="ALL">All Directions</option>
          <option value="UP">UP Only</option>
          <option value="DOWN">DOWN Only</option>
          <option value="NO CLEAR SIGNAL">Neutral Only</option>
        </select>

        {/* Timeframe Filter */}
        <select
          value={filterTimeframe}
          onChange={(e) => setFilterTimeframe(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="ALL">All Horizons</option>
          <option value="5S">5S</option>
          <option value="10S">10S</option>
          <option value="15S">15S</option>
          <option value="30S">30S</option>
          <option value="1M">1M</option>
          <option value="2M">2M</option>
          <option value="3M">3M</option>
          <option value="5M">5M</option>
          <option value="10M">10M</option>
          <option value="15M">15M</option>
        </select>
      </div>

      {/* Signals Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-[#090f22] text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800 z-10">
            <tr>
              <th className="py-2.5 px-4">Direction</th>
              <th className="py-2.5 px-3">Pair</th>
              <th className="py-2.5 px-3">Market</th>
              <th className="py-2.5 px-3">Horizon</th>
              <th className="py-2.5 px-3">Expiry Time</th>
              <th className="py-2.5 px-3">Confidence</th>
              <th className="py-2.5 px-3">Date (PKT)</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 font-mono text-slate-300">
            {filteredSignals.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <History className="w-8 h-8 text-slate-600 mb-1" />
                    <span className="font-semibold text-xs">No Signal Records Found</span>
                    <span className="text-[11px] text-slate-600">
                      Generate new analyses from the AI Signal Generator panel
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSignals.map((sig) => (
                <tr
                  key={sig.id}
                  onClick={() => setSelectedSignalModal(sig)}
                  className="hover:bg-slate-900/60 transition-colors cursor-pointer group"
                >
                  {/* Direction */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-bold">
                      {sig.direction === 'UP' ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                          <span>UP</span>
                        </span>
                      ) : sig.direction === 'DOWN' ? (
                        <span className="flex items-center gap-1 text-red-400">
                          <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                          <span>DOWN</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400">
                          <MinusCircle className="w-4 h-4" />
                          <span>NEUTRAL</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Pair */}
                  <td className="py-3 px-3 font-bold text-white">{sig.pair}</td>

                  {/* Market */}
                  <td className="py-3 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        sig.market === 'LIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {sig.market}
                    </span>
                  </td>

                  {/* Horizon */}
                  <td className="py-3 px-3 font-semibold text-slate-300">{sig.timeframe}</td>

                  {/* Expiry Time */}
                  <td className="py-3 px-3 font-bold text-amber-400 font-mono">
                    {sig.expiryTime || `${sig.timeframe} Exp`}
                  </td>

                  {/* Confidence */}
                  <td className="py-3 px-3">
                    <span
                      className={`text-[11px] font-semibold ${
                        sig.confidence.includes('High')
                          ? 'text-emerald-400'
                          : sig.confidence.includes('Strong')
                          ? 'text-blue-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {sig.confidence}
                    </span>
                  </td>

                  {/* Pakistan Time */}
                  <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                    <span>{sig.pktTime}</span>
                    <span className="block text-[10px] text-slate-500">{sig.pktDate}</span>
                  </td>

                  {/* View Details */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSignalModal(sig);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700/80 text-[11px] text-blue-400 hover:text-white hover:bg-blue-600 transition-colors"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedSignalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0c1427] border border-slate-700 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">{selectedSignalModal.pair}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-500/20 text-blue-400">
                  {selectedSignalModal.timeframe}
                </span>
                <span className="text-xs text-slate-400 font-mono">({selectedSignalModal.market})</span>
              </div>
              <button
                onClick={() => setSelectedSignalModal(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Direction</span>
                  <div
                    className={`text-lg font-black font-mono flex items-center gap-1 ${
                      selectedSignalModal.direction === 'UP'
                        ? 'text-emerald-400'
                        : selectedSignalModal.direction === 'DOWN'
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}
                  >
                    <span>{selectedSignalModal.direction}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Expiry Time</span>
                  <div className="text-sm font-bold text-amber-400 font-mono">
                    {selectedSignalModal.expiryTime || `${selectedSignalModal.timeframe} Duration`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">RSI (14):</span>
                  <div className="font-bold text-white">{selectedSignalModal.indicators.rsi}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">MACD:</span>
                  <div className="font-bold text-white">{selectedSignalModal.indicators.macd.status}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">EMA 9 / 21:</span>
                  <div className="font-bold text-white">{selectedSignalModal.indicators.emaTrend}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Pattern:</span>
                  <div className="font-bold text-amber-300 truncate">
                    {selectedSignalModal.indicators.candlestickPattern}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <div className="font-bold text-amber-400 text-[11px] mb-1">Technical Rationale</div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {selectedSignalModal.explanation}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>PKT: {selectedSignalModal.pktTime} ({selectedSignalModal.pktDate})</span>
                </div>
                <span>{selectedSignalModal.dataQuality}</span>
              </div>

              <div className="pt-2 text-center border-t border-slate-800/80">
                <span className="text-[10px] font-mono text-amber-300 font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 uppercase tracking-wider inline-block">
                  Educational Simulation • Not Real Trading Advice
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
