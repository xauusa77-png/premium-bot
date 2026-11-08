import React, { useState, useMemo } from 'react';
import {
  Search,
  Star,
  Globe,
  TrendingUp,
  Activity,
  Layers,
  AlertOctagon,
} from 'lucide-react';
import { CurrencyPair, MarketType } from '../types';
import { LIVE_PAIRS, OTC_PAIRS } from '../data/marketPairs';
import { getMarketSchedule } from '../utils/marketSchedule';

interface MarketSelectorProps {
  currentMarket: MarketType;
  onChangeMarket: (market: MarketType) => void;
  selectedPair: CurrencyPair;
  onSelectPair: (pair: CurrencyPair) => void;
  prices: Record<string, { price: number; change24h: number }>;
}

export const MarketSelector: React.FC<MarketSelectorProps> = ({
  currentMarket,
  onChangeMarket,
  selectedPair,
  onSelectPair,
  prices,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pb_favorite_pairs');
      return saved ? JSON.parse(saved) : ['USD/JPY', 'EUR/USD OTC', 'USD/PKR OTC'];
    } catch {
      return ['USD/JPY', 'EUR/USD OTC'];
    }
  });
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol];
      try {
        localStorage.setItem('pb_favorite_pairs', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const currentPairList = currentMarket === 'LIVE' ? LIVE_PAIRS : OTC_PAIRS;

  const filteredPairs = useMemo(() => {
    return currentPairList.filter((p) => {
      const matchesSearch =
        p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.base.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.quote.toLowerCase().includes(searchQuery.toLowerCase());

      if (onlyFavorites) {
        return matchesSearch && favorites.includes(p.symbol);
      }
      return matchesSearch;
    });
  }, [currentPairList, searchQuery, onlyFavorites, favorites]);

  const liveSchedule = getMarketSchedule('LIVE');
  const otcSchedule = getMarketSchedule('OTC');

  return (
    <div className="flex flex-col h-full bg-[#0a1022] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Header: Market Tabs */}
      <div className="p-3 border-b border-slate-800/80 bg-[#080d1c]">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              onChangeMarket('LIVE');
              // Automatically switch to first pair in live list if not live
              if (selectedPair.market !== 'LIVE') {
                onSelectPair(LIVE_PAIRS[0]);
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentMarket === 'LIVE'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>LIVE MARKET</span>
            {!liveSchedule.isOpen ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 font-mono font-bold border border-red-500/30">
                CLOSED
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono font-semibold">
                18
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onChangeMarket('OTC');
              // Automatically switch to first pair in otc list if not otc
              if (selectedPair.market !== 'OTC') {
                onSelectPair(OTC_PAIRS[0]);
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentMarket === 'OTC'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>OTC MARKET</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-mono font-bold border border-emerald-500/30">
              7 DAYS
            </span>
          </button>
        </div>

        {/* Weekend Closed Advisory Banner for Live Market */}
        {currentMarket === 'LIVE' && !liveSchedule.isOpen && (
          <div className="mt-2.5 p-2 rounded-lg bg-red-950/40 border border-red-500/30 text-[11px] font-mono text-red-300 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>LIVE MARKET CLOSED ({liveSchedule.dayOfWeek.toUpperCase()}) · Mon–Fri Only</span>
          </div>
        )}

        {/* Search & Favorites Filter Bar */}
        <div className="flex items-center gap-2 mt-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pair (e.g. USD, EUR, PKR)..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/80"
            />
          </div>

          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            title="Filter Favorites"
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
              onlyFavorites
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Pairs List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-1.5 space-y-0.5">
        {filteredPairs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No pairs found matching filter
          </div>
        ) : (
          filteredPairs.map((pair) => {
            const isSelected = selectedPair.symbol === pair.symbol;
            const isFav = favorites.includes(pair.symbol);
            const priceData = prices[pair.symbol];
            const price = priceData ? priceData.price : 0;
            const change = priceData ? priceData.change24h : 0;
            const isPositive = change >= 0;

            return (
              <div
                key={pair.symbol}
                onClick={() => onSelectPair(pair)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? currentMarket === 'LIVE'
                      ? 'bg-emerald-950/40 border border-emerald-500/40 shadow-sm'
                      : 'bg-blue-950/40 border border-blue-500/40 shadow-sm'
                    : 'hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                {/* Left: Star + Flags + Pair Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={(e) => toggleFavorite(pair.symbol, e)}
                    className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-500'
                      }`}
                    />
                  </button>

                  <div className="flex items-center -space-x-1 text-sm shrink-0">
                    <span title={pair.base}>{pair.flagBase}</span>
                    <span title={pair.quote}>{pair.flagQuote}</span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white truncate font-mono">
                        {pair.symbol}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {pair.base}/{pair.quote}
                    </span>
                  </div>
                </div>

                {/* Right: Live Price & 24h Change */}
                <div className="text-right shrink-0">
                  <div className="font-mono text-xs font-bold text-white tabular-nums">
                    {price > 0 ? price.toFixed(pair.digits) : '---'}
                  </div>
                  <div
                    className={`font-mono text-[10px] font-semibold tabular-nums flex items-center justify-end gap-0.5 ${
                      isPositive ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    <span>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-[#080d1c] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>{currentMarket === 'LIVE' ? 'Twelve Data Engine (Active)' : 'OTC Synthetic Feed (24/7)'}</span>
        </span>
        <span className="text-slate-500">{filteredPairs.length} pairs</span>
      </div>
    </div>
  );
};
