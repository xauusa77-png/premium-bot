/**
 * PREMIUM BOT - Ultimate Modern AI Trading Platform
 * SP Trader Inspired Architecture with Access Key Security & Genuine Market Feeds
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AccessKeyModal,
} from './components/AccessKeyModal';
import { Header } from './components/Header';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { StatsCards } from './components/StatsCards';
import { MarketSelector } from './components/MarketSelector';
import { TimeframeSelector } from './components/TimeframeSelector';
import { TradingChart } from './components/TradingChart';
import { OtcTerminalOverview } from './components/OtcTerminalOverview';
import { SignalGenerator } from './components/SignalGenerator';
import { SignalHistory } from './components/SignalHistory';
import { MarketAnalysisView } from './components/MarketAnalysisView';
import { SettingsModal } from './components/SettingsModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { LIVE_PAIRS, OTC_PAIRS, ALL_PAIRS } from './data/marketPairs';
import {
  Candle,
  CurrencyPair,
  MarketType,
  SignalAnalysis,
  StatsOverview,
  TechnicalIndicators,
  Timeframe,
} from './types';
import { api, authStorage } from './services/api';
import {
  Activity,
  Layers,
  TrendingUp,
  Globe,
  Sliders,
  Sparkles,
  History,
  AlertOctagon,
} from 'lucide-react';
import { getMarketSchedule } from './utils/marketSchedule';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Market & Selection State
  const [currentMarket, setCurrentMarket] = useState<MarketType>('LIVE');
  const [selectedPair, setSelectedPair] = useState<CurrencyPair>(LIVE_PAIRS[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1M');

  // Data States
  const [candles, setCandles] = useState<Candle[]>([]);
  const [prices, setPrices] = useState<Record<string, { price: number; change24h: number }>>({});
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [dataQuality, setDataQuality] = useState<string>('Initializing Feed...');
  const [signals, setSignals] = useState<SignalAnalysis[]>([]);
  const [latestSignal, setLatestSignal] = useState<SignalAnalysis | null>(null);
  const [stats, setStats] = useState<StatsOverview>({
    marketStatus: 'LIVE FOREX ACTIVE',
    selectedPair: 'USD/JPY',
    currentPrice: 153.42,
    dataConnection: 'Twelve Data Genuine Feed',
    totalSignals: 0,
    upCount: 0,
    downCount: 0,
    neutralCount: 0,
  });

  // UI Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial Authentication Check
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await api.verifyAuth();
      setIsAuthenticated(isAuth);
    };
    checkAuth();
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    showToast('Terminal session locked successfully');
  };

  // Handle Unlock Success
  const handleUnlockSuccess = () => {
    setIsAuthenticated(true);
    showToast('Welcome to PREMIUM BOT Terminal');
  };

  // 2. Fetch Prices on Interval (every 2.5s)
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchLivePrices = async () => {
      try {
        const data = await api.getPrices();
        setPrices(data.prices);
      } catch (err) {
        console.warn('Error fetching live prices:', err);
      }
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 2500);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // 3. Fetch Candles & Indicators for selected pair & timeframe
  const fetchMarketData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const candleData = await api.getCandles(selectedPair.symbol, selectedTimeframe);
      setCandles(candleData.candles);
      setDataQuality(candleData.dataQuality);

      const indData = await api.getIndicators(selectedPair.symbol, selectedTimeframe);
      setIndicators(indData.indicators);
    } catch (err) {
      console.error('Error fetching candles/indicators:', err);
    }
  }, [isAuthenticated, selectedPair.symbol, selectedTimeframe]);

  useEffect(() => {
    fetchMarketData();
    // Refresh candles every 6 seconds to capture live micro-wicks
    const interval = setInterval(fetchMarketData, 6000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // 4. Fetch Signals History & Statistics
  const fetchSignalsAndStats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const sigData = await api.getSignals({ limit: 100 });
      setSignals(sigData.signals);
      if (sigData.signals.length > 0 && !latestSignal) {
        setLatestSignal(sigData.signals[0]);
      }

      const statData = await api.getStats(selectedPair.symbol);
      setStats(statData);
    } catch (err) {
      console.warn('Error fetching stats:', err);
    }
  }, [isAuthenticated, selectedPair.symbol, latestSignal]);

  useEffect(() => {
    fetchSignalsAndStats();
  }, [fetchSignalsAndStats]);

  // Handle newly generated signal
  const handleSignalGenerated = (signal: SignalAnalysis) => {
    setLatestSignal(signal);
    setSignals((prev) => [signal, ...prev]);
    fetchSignalsAndStats();
    showToast(`New ${signal.direction} signal generated for ${signal.pair}`);
  };

  // Switch to pair and sync its market type
  const handleSelectPair = (pair: CurrencyPair) => {
    setSelectedPair(pair);
    if (pair.market !== currentMarket) {
      setCurrentMarket(pair.market);
    }
  };

  // Loading Screen while verifying session
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center text-white mb-4 animate-pulse shadow-lg shadow-blue-900/50">
          <Activity className="w-6 h-6 animate-spin" />
        </div>
        <div className="font-mono text-sm tracking-widest text-slate-300">
          INITIALIZING PREMIUM BOT TERMINAL...
        </div>
      </div>
    );
  }

  // If not authenticated, display Master Access Key lock screen first
  if (!isAuthenticated) {
    return <AccessKeyModal onSuccess={handleUnlockSuccess} />;
  }

  const livePriceData = prices[selectedPair.symbol];
  const livePrice = livePriceData ? livePriceData.price : (candles[candles.length - 1]?.close || 1.0);

  return (
    <div className="flex h-screen w-screen bg-[#070b14] text-slate-100 overflow-hidden font-sans select-none">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#0c1830] border border-blue-500/40 text-blue-200 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-3 fade-in duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modern Sidebar (Desktop + Mobile drawer) */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block shrink-0 h-full`}>
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Professional Top Header with Pakistan Time */}
        <Header
          onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onLogout={handleLogout}
          unreadCount={signals.length}
          connectionStatus={dataQuality}
          isLiveMarket={selectedPair.market === 'LIVE'}
        />

        {/* Scrollable Dashboard Canvas */}
        <main className="flex-1 overflow-y-auto p-3 md:p-5 space-y-4">
          {/* Top Modern Animated Statistics Cards */}
          <StatsCards
            stats={{
              ...stats,
              selectedPair: selectedPair.symbol,
              currentPrice: livePrice,
            }}
            selectedPrice={livePrice}
            digits={selectedPair.digits}
          />

          {/* TAB 1: MAIN DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Row 1: Timeframe Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <TimeframeSelector
                  selectedTimeframe={selectedTimeframe}
                  onSelectTimeframe={setSelectedTimeframe}
                />

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="hidden sm:inline">Active Pair:</span>
                  <span className="font-bold text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    {selectedPair.symbol}
                  </span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    {livePrice.toFixed(selectedPair.digits)}
                  </span>
                </div>
              </div>

              {/* Row 2: 3-Column SP Trader Grid (Market Selector | Trading Chart | AI Signal Generator) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* Column 1: Market Selector (3 cols) */}
                <div className="lg:col-span-3 min-h-[460px]">
                  <MarketSelector
                    currentMarket={currentMarket}
                    onChangeMarket={setCurrentMarket}
                    selectedPair={selectedPair}
                    onSelectPair={handleSelectPair}
                    prices={prices}
                  />
                </div>

                {/* Column 2: TradingView Chart for LIVE vs Clean OTC Overview for OTC */}
                <div className="lg:col-span-5 min-h-[460px]">
                  {selectedPair.market === 'LIVE' ? (
                    <TradingChart
                      pair={selectedPair}
                      timeframe={selectedTimeframe}
                      candles={candles}
                      livePrice={livePrice}
                      dataQuality={dataQuality}
                    />
                  ) : (
                    <OtcTerminalOverview
                      pair={selectedPair}
                      timeframe={selectedTimeframe}
                      livePrice={livePrice}
                      indicators={indicators}
                      dataQuality={dataQuality}
                    />
                  )}
                </div>

                {/* Column 3: AI Signal Generator & Result Card (4 cols) */}
                <div className="lg:col-span-4 min-h-[460px]">
                  <SignalGenerator
                    selectedPair={selectedPair}
                    selectedTimeframe={selectedTimeframe}
                    onSignalGenerated={handleSignalGenerated}
                    latestSignal={latestSignal}
                  />
                </div>
              </div>

              {/* Row 3: Quick Recent Signal Audit Strip */}
              <div className="p-4 rounded-2xl bg-[#0a1022] border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Recent Signal Stream
                    </h4>
                  </div>
                  <button
                    onClick={() => setActiveTab('signal-history')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-mono hover:underline cursor-pointer"
                  >
                    View All History ({signals.length}) →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {signals.slice(0, 3).map((sig) => (
                    <div
                      key={sig.id}
                      onClick={() => setActiveTab('signal-history')}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-white font-mono">
                          {sig.pair}
                        </span>
                        <span
                          className={`text-xs font-black font-mono ${
                            sig.direction === 'UP'
                              ? 'text-emerald-400'
                              : sig.direction === 'DOWN'
                              ? 'text-red-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {sig.direction}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mb-1 font-mono">
                        {sig.summary || sig.explanation}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>{sig.pktTime}</span>
                        <span className="text-blue-400">{sig.confidence}</span>
                      </div>
                    </div>
                  ))}
                  {signals.length === 0 && (
                    <div className="col-span-3 py-4 text-center text-xs text-slate-500">
                      No recent signals yet. Click "GENERATE SIGNAL" above to produce live analyses.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE MARKET DEDICATED VIEW */}
          {activeTab === 'live-market' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-[#0a1022] border border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-white">LIVE FOREX MARKET HUB</h2>
                      {!getMarketSchedule('LIVE').isOpen && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          CLOSED ({getMarketSchedule('LIVE').dayOfWeek.toUpperCase()})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Genuine Twelve Data Integration · 18 Live Currency Pairs · Mon–Fri Schedule
                    </p>
                  </div>
                </div>
                <TimeframeSelector
                  selectedTimeframe={selectedTimeframe}
                  onSelectTimeframe={setSelectedTimeframe}
                />
              </div>

              {!getMarketSchedule('LIVE').isOpen && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs font-mono text-red-300 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                    <span>LIVE MARKET CLOSED ({getMarketSchedule('LIVE').dayOfWeek.toUpperCase()})</span>
                    <span className="text-slate-300 font-normal hidden sm:inline">
                      · Available Monday–Friday only. Weekend signal generation disabled.
                    </span>
                  </div>
                  <span className="text-amber-300 font-semibold">
                    Switch to OTC for 24/7 simulation
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 min-h-[500px]">
                  <MarketSelector
                    currentMarket="LIVE"
                    onChangeMarket={setCurrentMarket}
                    selectedPair={selectedPair}
                    onSelectPair={handleSelectPair}
                    prices={prices}
                  />
                </div>
                <div className="lg:col-span-8 min-h-[500px]">
                  <TradingChart
                    pair={selectedPair}
                    timeframe={selectedTimeframe}
                    candles={candles}
                    livePrice={livePrice}
                    dataQuality={dataQuality}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OTC MARKET DEDICATED VIEW */}
          {activeTab === 'otc-market' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-[#0a1022] border border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-white">OTC SYNTHETIC MARKET HUB</h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        24/7 ALL 7 DAYS OPEN
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      High-Frequency Synthetic Feeds · 18 Exotic & Weekend Pairs · 24/7 Simulation
                    </p>
                  </div>
                </div>
                <TimeframeSelector
                  selectedTimeframe={selectedTimeframe}
                  onSelectTimeframe={setSelectedTimeframe}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 min-h-[500px]">
                  <MarketSelector
                    currentMarket="OTC"
                    onChangeMarket={setCurrentMarket}
                    selectedPair={selectedPair}
                    onSelectPair={handleSelectPair}
                    prices={prices}
                  />
                </div>
                <div className="lg:col-span-4 min-h-[500px]">
                  <OtcTerminalOverview
                    pair={selectedPair}
                    timeframe={selectedTimeframe}
                    livePrice={livePrice}
                    indicators={indicators}
                    dataQuality={dataQuality}
                  />
                </div>
                <div className="lg:col-span-4 min-h-[500px]">
                  <SignalGenerator
                    selectedPair={selectedPair}
                    selectedTimeframe={selectedTimeframe}
                    onSignalGenerated={handleSignalGenerated}
                    latestSignal={latestSignal}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DEDICATED AI SIGNAL GENERATOR VIEW */}
          {activeTab === 'signal-generator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 space-y-4">
                <TimeframeSelector
                  selectedTimeframe={selectedTimeframe}
                  onSelectTimeframe={setSelectedTimeframe}
                />
                <SignalGenerator
                  selectedPair={selectedPair}
                  selectedTimeframe={selectedTimeframe}
                  onSignalGenerated={handleSignalGenerated}
                  latestSignal={latestSignal}
                />
              </div>
              <div className="lg:col-span-7 min-h-[550px]">
                {selectedPair.market === 'LIVE' ? (
                  <TradingChart
                    pair={selectedPair}
                    timeframe={selectedTimeframe}
                    candles={candles}
                    livePrice={livePrice}
                    dataQuality={dataQuality}
                  />
                ) : (
                  <OtcTerminalOverview
                    pair={selectedPair}
                    timeframe={selectedTimeframe}
                    livePrice={livePrice}
                    indicators={indicators}
                    dataQuality={dataQuality}
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SIGNAL HISTORY AUDIT */}
          {activeTab === 'signal-history' && (
            <div className="h-[calc(100vh-170px)]">
              <SignalHistory
                signals={signals}
                onRefresh={fetchSignalsAndStats}
                onSelectSignal={(s) => setLatestSignal(s)}
              />
            </div>
          )}

          {/* TAB 6: MARKET ANALYSIS SCANNER */}
          {activeTab === 'market-analysis' && (
            <MarketAnalysisView
              pair={selectedPair}
              timeframe={selectedTimeframe}
              indicators={indicators}
              livePrice={livePrice}
            />
          )}

          {/* TAB 7: SETTINGS & SECURITY */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto">
              <div className="p-6 rounded-2xl bg-[#0a1022] border border-slate-800 space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white">TERMINAL SYSTEM SETTINGS</h2>
                  <p className="text-xs text-slate-400">
                    Access control, market configuration, and diagnostics
                  </p>
                </div>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Open Full Security & Key Management Modal
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={handleLogout}
        connectionStatus={dataQuality}
      />

      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        signals={signals}
        onSelectSignal={(s) => {
          setLatestSignal(s);
          const matchedPair = ALL_PAIRS.find((p) => p.symbol === s.pair);
          if (matchedPair) {
            setSelectedPair(matchedPair);
            setCurrentMarket(matchedPair.market);
          }
          setSelectedTimeframe(s.timeframe);
          setActiveTab('dashboard');
        }}
      />
    </div>
  );
}
