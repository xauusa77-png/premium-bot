/**
 * PREMIUM BOT - Core Types & Interfaces
 */

export type MarketType = 'LIVE' | 'OTC';

export interface CurrencyPair {
  symbol: string;         // e.g. "USD/JPY" or "EUR/USD OTC"
  base: string;           // e.g. "USD"
  quote: string;          // e.g. "JPY"
  market: MarketType;
  apiSymbol: string;      // Twelve Data symbol format e.g. "USD/JPY"
  digits: number;         // Decimal precision e.g. 3 for JPY, 5 for EUR/USD
  flagBase: string;
  flagQuote: string;
}

export type Timeframe = '5S' | '10S' | '15S' | '30S' | '1M' | '2M' | '3M' | '5M' | '10M' | '15M';

export interface Candle {
  time: number;           // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type SignalDirection = 'UP' | 'DOWN' | 'NO CLEAR SIGNAL';

export interface TechnicalIndicators {
  rsi: number;
  rsiState: 'OVERSOLD' | 'OVERBOUGHT' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  macd: {
    macd: number;
    signal: number;
    histogram: number;
    status: string;
  };
  ema9: number;
  ema21: number;
  emaTrend: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'BULLISH_ALIGN' | 'BEARISH_ALIGN' | 'NEUTRAL';
  sma50: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    percentB: number;
  };
  marketTrend: 'STRONG_UPTREND' | 'STRONG_DOWNTREND' | 'WEAK_UPTREND' | 'WEAK_DOWNTREND' | 'SIDEWAYS';
  candlestickPattern: string;
  supportLevel: number;
  resistanceLevel: number;
  momentumScore: number; // -100 to +100
}

export interface SignalAnalysis {
  id: string;
  pair: string;
  market: MarketType;
  timeframe: Timeframe;
  direction: SignalDirection;
  currentPrice: number;
  confidence: 'High Probability' | 'Strong' | 'Moderate' | 'Neutral';
  confluenceCount: number;
  totalChecks: number;
  timestamp: string;          // ISO string
  pktTime: string;            // Pakistan Standard Time string
  pktDate: string;            // Pakistan Standard Date string
  expiryTime?: string;        // Calculated Expiry Time in PKT e.g. "07:15:30 PM PKT"
  expiryDuration?: string;    // e.g. "1 Minute" or "30 Seconds"
  expirySeconds?: number;     // Expiry seconds countdown
  indicators: TechnicalIndicators;
  explanation: string;
  summary: string;
  dataQuality: 'Twelve Data Genuine Feed' | 'OTC High-Frequency Synthetic Feed' | 'Fallback Real-Time Feed';
  isEducationalSimulation?: boolean;
  disclaimer?: string;
}

export interface MarketSummary {
  symbol: string;
  market: MarketType;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: string;
}

export interface StatsOverview {
  marketStatus: string;
  selectedPair: string;
  currentPrice: number;
  dataConnection: string;
  totalSignals: number;
  upCount: number;
  downCount: number;
  neutralCount: number;
  liveMarketOpen?: boolean;
  liveMarketStatus?: string;
  otcMarketOpen?: boolean;
  otcMarketStatus?: string;
  dayOfWeek?: string;
}
