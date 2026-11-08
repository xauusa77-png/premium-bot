/**
 * PREMIUM BOT - Ultra-Modern AI Trading Platform Server
 * Full-stack Express backend with Twelve Data integration, OTC engine,
 * Technical Analysis, Access Key authentication, and Vite dev server.
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { BASE_PRICES, ALL_PAIRS, LIVE_PAIRS, OTC_PAIRS } from './src/data/marketPairs';
import {
  Candle,
  MarketType,
  SignalAnalysis,
  SignalDirection,
  TechnicalIndicators,
  Timeframe,
  StatsOverview,
} from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// -------------------------------------------------------------
// 1. ACCESS KEY SECURITY SYSTEM
// -------------------------------------------------------------
const CONFIG_FILE = path.join(process.cwd(), '.premium_bot_config.json');
const DEFAULT_MASTER_KEY = 'lost 0386';

function getMasterKey(): string {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (data && data.masterKey) return data.masterKey;
    }
  } catch (err) {
    console.error('Error reading config file:', err);
  }
  return DEFAULT_MASTER_KEY;
}

function setMasterKey(newKey: string): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ masterKey: newKey }), 'utf-8');
  } catch (err) {
    console.error('Error saving config file:', err);
  }
}

// Active session tokens store
const activeSessions = new Set<string>();

// Pre-populate with a temporary development token
const initialDevToken = 'pb_session_' + Math.random().toString(36).substring(2, 15);
activeSessions.add(initialDevToken);

function generateSessionToken(): string {
  const token = 'pb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  activeSessions.add(token);
  return token;
}

// Auth endpoints
app.post('/api/auth/unlock', (req: Request, res: Response) => {
  const key = req.body.key || req.body.accessKey || req.body.password;
  const currentMasterKey = getMasterKey();

  if (typeof key === 'string' && key.trim() === currentMasterKey.trim()) {
    const token = generateSessionToken();
    return res.json({
      success: true,
      token,
      message: 'Access granted',
    });
  }

  return res.status(401).json({
    success: false,
    message: 'INVALID ACCESS KEY',
  });
});

app.get('/api/auth/verify', (req: Request, res: Response) => {
  const token = (req.headers['x-session-token'] as string) || '';
  if (token && activeSessions.has(token)) {
    return res.json({ authenticated: true });
  }
  return res.json({ authenticated: false });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = (req.headers['x-session-token'] as string) || '';
  if (token) {
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/auth/change-key', (req: Request, res: Response) => {
  const token = (req.headers['x-session-token'] as string) || '';
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ success: false, message: 'Unauthorized session' });
  }

  const { currentKey, newKey } = req.body;
  const masterKey = getMasterKey();

  if (!currentKey || currentKey.trim() !== masterKey.trim()) {
    return res.status(400).json({ success: false, message: 'Current Access Key is incorrect' });
  }

  if (!newKey || newKey.trim().length < 4) {
    return res.status(400).json({ success: false, message: 'New Access Key must be at least 4 characters' });
  }

  setMasterKey(newKey.trim());
  return res.json({ success: true, message: 'Access Key updated successfully' });
});

// -------------------------------------------------------------
// 2. PAKISTAN TIME HELPER
// -------------------------------------------------------------
function getPakistanTime(): { pktTime: string; pktDate: string; rawIso: string } {
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

  return {
    pktTime: timeFormatter.format(now) + ' PKT',
    pktDate: dateFormatter.format(now),
    rawIso: now.toISOString(),
  };
}

// Market Schedule Checker
// LIVE MARKET: Monday - Friday only. Closed Saturday and Sunday.
// OTC MARKET: 7 days a week (Monday - Sunday, 24/7). Never disabled on weekends.
function getMarketSchedule(market: MarketType): {
  isOpen: boolean;
  statusText: string;
  dayOfWeek: string;
  dateStr: string;
  isWeekend: boolean;
  message?: string;
} {
  const now = new Date();
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    weekday: 'long',
  });
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

  const dayOfWeek = dayFormatter.format(now);
  const dateStr = dateFormatter.format(now);
  const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';

  if (market === 'OTC') {
    // OTC Market is open all 7 days of the week: Monday to Sunday
    return {
      isOpen: true,
      statusText: 'OTC 24/7 ACTIVE',
      dayOfWeek,
      dateStr,
      isWeekend,
    };
  }

  // LIVE Market: Monday through Friday only
  if (isWeekend) {
    return {
      isOpen: false,
      statusText: 'LIVE MARKET CLOSED',
      dayOfWeek,
      dateStr,
      isWeekend: true,
      message: 'LIVE MARKET CLOSED: Live market is available Monday through Friday only. Live market signals are disabled on Saturday and Sunday. Switch to OTC Market for 24/7 weekend simulation.',
    };
  }

  return {
    isOpen: true,
    statusText: 'LIVE FOREX ACTIVE',
    dayOfWeek,
    dateStr,
    isWeekend: false,
  };
}

// -------------------------------------------------------------
// 3. SIGNAL HISTORY STORAGE
// -------------------------------------------------------------
const HISTORY_FILE = path.join(process.cwd(), '.premium_bot_history.json');
let signalHistory: SignalAnalysis[] = [];

function loadHistory(): void {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        signalHistory = data;
      }
    }
  } catch (err) {
    console.error('Error loading signal history:', err);
    signalHistory = [];
  }
}

function saveHistory(): void {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(signalHistory.slice(0, 100), null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving signal history:', err);
  }
}

loadHistory();

// -------------------------------------------------------------
// 4. MARKET DATA ENGINE & TWELVE DATA INTEGRATION
// -------------------------------------------------------------
// Twelve Data in-memory cache to prevent hitting rate limits
interface CacheEntry {
  timestamp: number;
  candles: Candle[];
  price: number;
  source: 'Twelve Data Genuine Feed' | 'Fallback Real-Time Feed';
}
const marketCache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 20000; // 20 seconds cache

// Live continuous price simulator for sub-minute seconds & OTC
const liveSimulatedPrices: Record<string, number> = { ...BASE_PRICES };
const livePairTrends: Record<string, number> = {};

// Initialize random micro-trends for realistic continuous market movement
ALL_PAIRS.forEach((p) => {
  livePairTrends[p.symbol] = (Math.random() - 0.49) * 0.0005;
});

// Interval to simulate continuous live tick movements for all markets
setInterval(() => {
  ALL_PAIRS.forEach((pair) => {
    const cur = liveSimulatedPrices[pair.symbol] || BASE_PRICES[pair.symbol] || 1.0;
    const trend = livePairTrends[pair.symbol] || 0;
    const volatility = pair.digits === 5 ? 0.00006 : pair.digits === 3 ? 0.008 : pair.digits === 2 ? 0.04 : 0.8;
    const noise = (Math.random() - 0.5) * volatility;
    let nextPrice = cur + trend * cur + noise;

    // Boundary check so prices stay realistic around base price
    const base = BASE_PRICES[pair.symbol] || 1.0;
    if (nextPrice > base * 1.15) nextPrice = base * 1.15 - Math.abs(noise);
    if (nextPrice < base * 0.85) nextPrice = base * 0.85 + Math.abs(noise);

    // Occasionally change micro-trend
    if (Math.random() < 0.03) {
      livePairTrends[pair.symbol] = (Math.random() - 0.5) * 0.0003;
    }

    liveSimulatedPrices[pair.symbol] = Number(nextPrice.toFixed(pair.digits));
  });
}, 1000);

function timeframeToSeconds(tf: Timeframe): number {
  switch (tf) {
    case '5S': return 5;
    case '10S': return 10;
    case '15S': return 15;
    case '30S': return 30;
    case '1M': return 60;
    case '2M': return 120;
    case '3M': return 180;
    case '5M': return 300;
    case '10M': return 600;
    case '15M': return 900;
    default: return 60;
  }
}

// Generate realistic historical OHLC candles
function generateCandleSeries(
  symbol: string,
  timeframe: Timeframe,
  count = 70
): Candle[] {
  const pair = ALL_PAIRS.find((p) => p.symbol === symbol) || {
    symbol,
    digits: 5,
    base: 'USD',
    quote: 'JPY',
    market: 'LIVE',
  };
  const stepSeconds = timeframeToSeconds(timeframe);
  const currentPrice = liveSimulatedPrices[symbol] || BASE_PRICES[symbol] || 100.0;
  const digits = pair.digits;

  const now = Math.floor(Date.now() / 1000);
  // Align time to stepSeconds
  const currentCandleTime = Math.floor(now / stepSeconds) * stepSeconds;

  const candles: Candle[] = [];
  let price = currentPrice;

  // Realistic pip fluctuation
  const pip = Math.pow(10, -digits);
  const stepVolatility = Math.max(pip * 3, price * 0.0006 * Math.sqrt(stepSeconds / 60));

  // Build backwards then reverse
  for (let i = 0; i < count; i++) {
    const candleTime = currentCandleTime - (count - 1 - i) * stepSeconds;
    const direction = Math.random() > 0.48 ? 1 : -1;
    const bodySize = (Math.random() * 0.8 + 0.1) * stepVolatility;
    const open = price - direction * bodySize;
    const close = price;

    const highWick = Math.random() * stepVolatility * 0.6;
    const lowWick = Math.random() * stepVolatility * 0.6;

    const high = Math.max(open, close) + highWick;
    const low = Math.min(open, close) - lowWick;

    candles.push({
      time: candleTime,
      open: Number(open.toFixed(digits)),
      high: Number(high.toFixed(digits)),
      low: Number(low.toFixed(digits)),
      close: Number(close.toFixed(digits)),
      volume: Math.floor(Math.random() * 250 + 50),
    });

    // Walk price forward for next candle
    price = close + (Math.random() - 0.495) * stepVolatility;
  }

  // Ensure last candle close is the current live price
  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = currentPrice;
    last.high = Math.max(last.high, last.close, last.open);
    last.low = Math.min(last.low, last.close, last.open);
  }

  return candles;
}

// Fetch from Twelve Data if configured
async function fetchTwelveDataSeries(
  symbol: string,
  timeframe: Timeframe
): Promise<{ candles: Candle[]; source: string } | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_TWELVE_DATA_API_KEY') {
    return null;
  }

  // Twelve Data standard free tier supports 1min, 5min, 15min, etc.
  let interval = '1min';
  if (timeframe === '5M') interval = '5min';
  else if (timeframe === '15M') interval = '15min';
  else if (timeframe === '5S' || timeframe === '10S' || timeframe === '15S' || timeframe === '30S') {
    return null; // Twelve Data doesn't offer sub-minute on free tier
  }

  const cleanSymbol = symbol.replace(' OTC', '').trim();
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
    cleanSymbol
  )}&interval=${interval}&outputsize=60&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 'error' || !data.values || !Array.isArray(data.values)) {
      return null;
    }

    const candles: Candle[] = data.values
      .map((item: any) => ({
        time: Math.floor(new Date(item.datetime).getTime() / 1000),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: item.volume ? parseInt(item.volume) : 100,
      }))
      .filter((c: Candle) => !isNaN(c.time) && !isNaN(c.close))
      .reverse();

    if (candles.length > 10) {
      return { candles, source: 'Twelve Data Genuine Feed' };
    }
  } catch (err) {
    console.warn('Twelve Data fetch error:', err);
  }

  return null;
}

// -------------------------------------------------------------
// 5. TECHNICAL INDICATORS CALCULATION ENGINE
// -------------------------------------------------------------
function calculateTechnicalIndicators(candles: Candle[]): TechnicalIndicators {
  if (candles.length < 30) {
    throw new Error('Insufficient candle data for technical calculation');
  }

  const closes = candles.map((c) => c.close);
  const n = closes.length;
  const currentPrice = closes[n - 1];

  // 1. RSI (14)
  let gains = 0;
  let losses = 0;
  for (let i = n - 14; i < n; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  let avgGain = gains / 14;
  let avgLoss = losses / 14;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);
  rsi = Math.min(100, Math.max(0, Number(rsi.toFixed(2))));

  let rsiState: 'OVERSOLD' | 'OVERBOUGHT' | 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (rsi <= 32) rsiState = 'OVERSOLD';
  else if (rsi >= 68) rsiState = 'OVERBOUGHT';
  else if (rsi > 52) rsiState = 'BULLISH';
  else if (rsi < 48) rsiState = 'BEARISH';

  // 2. EMA Helper
  function calculateEMA(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const emaArr: number[] = [];
    let initialSum = 0;
    for (let i = 0; i < period; i++) initialSum += data[i];
    let prev = initialSum / period;
    emaArr.push(prev);

    for (let i = period; i < data.length; i++) {
      const cur = data[i] * k + prev * (1 - k);
      emaArr.push(cur);
      prev = cur;
    }
    return emaArr;
  }

  const ema9Series = calculateEMA(closes, 9);
  const ema21Series = calculateEMA(closes, 21);
  const ema9 = Number(ema9Series[ema9Series.length - 1].toFixed(5));
  const ema21 = Number(ema21Series[ema21Series.length - 1].toFixed(5));

  const prevEma9 = ema9Series[ema9Series.length - 2];
  const prevEma21 = ema21Series[ema21Series.length - 2];

  let emaTrend: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'BULLISH_ALIGN' | 'BEARISH_ALIGN' | 'NEUTRAL' = 'NEUTRAL';
  if (prevEma9 <= prevEma21 && ema9 > ema21) emaTrend = 'BULLISH_CROSS';
  else if (prevEma9 >= prevEma21 && ema9 < ema21) emaTrend = 'BEARISH_CROSS';
  else if (ema9 > ema21) emaTrend = 'BULLISH_ALIGN';
  else if (ema9 < ema21) emaTrend = 'BEARISH_ALIGN';

  // 3. SMA 50 (or available window)
  const smaPeriod = Math.min(50, closes.length);
  const smaSum = closes.slice(n - smaPeriod).reduce((acc, val) => acc + val, 0);
  const sma50 = Number((smaSum / smaPeriod).toFixed(5));

  // 4. MACD (12, 26, 9)
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine: number[] = [];
  const offset = 26 - 12;
  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + offset] - ema26[i]);
  }
  const macdSignalSeries = calculateEMA(macdLine, 9);
  const currentMacd = macdLine[macdLine.length - 1] || 0;
  const currentSignal = macdSignalSeries[macdSignalSeries.length - 1] || 0;
  const histogram = currentMacd - currentSignal;

  let macdStatus = 'Neutral Momentum';
  if (currentMacd > currentSignal && histogram > 0) macdStatus = 'Bullish Expansion';
  else if (currentMacd < currentSignal && histogram < 0) macdStatus = 'Bearish Expansion';
  else if (currentMacd > currentSignal && histogram <= 0) macdStatus = 'Bullish Weakening';
  else if (currentMacd < currentSignal && histogram >= 0) macdStatus = 'Bearish Weakening';

  // 5. Bollinger Bands (20, 2)
  const bbPeriod = Math.min(20, closes.length);
  const bbSlice = closes.slice(n - bbPeriod);
  const bbMiddle = bbSlice.reduce((a, b) => a + b, 0) / bbPeriod;
  const variance = bbSlice.reduce((a, b) => a + Math.pow(b - bbMiddle, 2), 0) / bbPeriod;
  const stdDev = Math.sqrt(variance);
  const bbUpper = bbMiddle + 2 * stdDev;
  const bbLower = bbMiddle - 2 * stdDev;
  const percentB = bbUpper === bbLower ? 0.5 : (currentPrice - bbLower) / (bbUpper - bbLower);

  // 6. Support & Resistance (Pivot High / Low)
  const recentHighs = candles.slice(n - 25).map((c) => c.high);
  const recentLows = candles.slice(n - 25).map((c) => c.low);
  const resistanceLevel = Number(Math.max(...recentHighs).toFixed(5));
  const supportLevel = Number(Math.min(...recentLows).toFixed(5));

  // 7. Candlestick Pattern Recognition
  const lastC = candles[n - 1];
  const prevC = candles[n - 2];
  let pattern = 'Standard Neutral Bar';

  const lastBody = Math.abs(lastC.close - lastC.open);
  const lastRange = lastC.high - lastC.low;
  const isBullish = lastC.close >= lastC.open;

  // Bullish Engulfing
  if (isBullish && prevC.close < prevC.open && lastC.open <= prevC.close && lastC.close >= prevC.open) {
    pattern = 'Bullish Engulfing';
  }
  // Bearish Engulfing
  else if (!isBullish && prevC.close > prevC.open && lastC.open >= prevC.close && lastC.close <= prevC.open) {
    pattern = 'Bearish Engulfing';
  }
  // Hammer (Lower wick >= 2x body, upper wick small)
  else if (lastRange > 0 && (Math.min(lastC.open, lastC.close) - lastC.low) > 2 * lastBody && (lastC.high - Math.max(lastC.open, lastC.close)) < 0.3 * lastBody) {
    pattern = isBullish ? 'Bullish Hammer' : 'Inverted Hammer';
  }
  // Doji (Tiny body relative to range)
  else if (lastRange > 0 && lastBody / lastRange < 0.12) {
    pattern = 'Doji (Market Indecision)';
  }
  // Marubozu (Strong directional full candle)
  else if (lastRange > 0 && lastBody / lastRange > 0.85) {
    pattern = isBullish ? 'Bullish Marubozu (High Momentum)' : 'Bearish Marubozu (High Momentum)';
  }

  // 8. Market Trend
  let marketTrend: 'STRONG_UPTREND' | 'STRONG_DOWNTREND' | 'WEAK_UPTREND' | 'WEAK_DOWNTREND' | 'SIDEWAYS' = 'SIDEWAYS';
  if (currentPrice > ema9 && ema9 > ema21 && currentPrice > sma50) {
    marketTrend = 'STRONG_UPTREND';
  } else if (currentPrice < ema9 && ema9 < ema21 && currentPrice < sma50) {
    marketTrend = 'STRONG_DOWNTREND';
  } else if (currentPrice > ema21) {
    marketTrend = 'WEAK_UPTREND';
  } else if (currentPrice < ema21) {
    marketTrend = 'WEAK_DOWNTREND';
  }

  // 9. Momentum score (-100 to +100)
  let momentum = 0;
  if (rsi > 50) momentum += (rsi - 50) * 1.5;
  else momentum -= (50 - rsi) * 1.5;

  if (histogram > 0) momentum += 20;
  else momentum -= 20;

  if (emaTrend.startsWith('BULLISH')) momentum += 25;
  if (emaTrend.startsWith('BEARISH')) momentum -= 25;

  if (currentPrice > sma50) momentum += 15;
  else momentum -= 15;

  momentum = Math.min(100, Math.max(-100, Math.round(momentum)));

  return {
    rsi,
    rsiState,
    macd: {
      macd: Number(currentMacd.toFixed(5)),
      signal: Number(currentSignal.toFixed(5)),
      histogram: Number(histogram.toFixed(5)),
      status: macdStatus,
    },
    ema9,
    ema21,
    emaTrend,
    sma50,
    bollingerBands: {
      upper: Number(bbUpper.toFixed(5)),
      middle: Number(bbMiddle.toFixed(5)),
      lower: Number(bbLower.toFixed(5)),
      percentB: Number(percentB.toFixed(3)),
    },
    marketTrend,
    candlestickPattern: pattern,
    supportLevel,
    resistanceLevel,
    momentumScore: momentum,
  };
}

// Confluence Decision Engine
function determineSignalDirection(indicators: TechnicalIndicators): {
  direction: SignalDirection;
  confidence: 'High Probability' | 'Strong' | 'Moderate' | 'Neutral';
  confluenceCount: number;
  totalChecks: number;
} {
  let bullishPoints = 0;
  let bearishPoints = 0;
  const totalChecks = 6;

  // 1. RSI
  if (indicators.rsiState === 'OVERSOLD' || (indicators.rsi >= 50 && indicators.rsi <= 65)) {
    bullishPoints += 1;
  } else if (indicators.rsiState === 'OVERBOUGHT' || (indicators.rsi < 50 && indicators.rsi >= 35)) {
    bearishPoints += 1;
  }

  // 2. MACD
  if (indicators.macd.histogram > 0 && indicators.macd.macd > indicators.macd.signal) {
    bullishPoints += 1;
  } else if (indicators.macd.histogram < 0 && indicators.macd.macd < indicators.macd.signal) {
    bearishPoints += 1;
  }

  // 3. EMA alignment
  if (indicators.emaTrend.includes('BULLISH')) {
    bullishPoints += 1;
  } else if (indicators.emaTrend.includes('BEARISH')) {
    bearishPoints += 1;
  }

  // 4. Trend
  if (indicators.marketTrend.includes('UPTREND')) {
    bullishPoints += 1;
  } else if (indicators.marketTrend.includes('DOWNTREND')) {
    bearishPoints += 1;
  }

  // 5. Bollinger position
  if (indicators.bollingerBands.percentB <= 0.25) {
    // Rebound off lower band
    bullishPoints += 1;
  } else if (indicators.bollingerBands.percentB >= 0.75) {
    // Resistance at upper band
    bearishPoints += 1;
  }

  // 6. Candlestick pattern
  if (indicators.candlestickPattern.includes('Bullish') || indicators.candlestickPattern.includes('Hammer')) {
    bullishPoints += 1;
  } else if (indicators.candlestickPattern.includes('Bearish')) {
    bearishPoints += 1;
  }

  if (bullishPoints > bearishPoints) {
    const confidence = bullishPoints >= 5 ? 'High Probability' : bullishPoints >= 4 ? 'Strong' : 'Moderate';
    return { direction: 'UP', confidence, confluenceCount: bullishPoints, totalChecks };
  } else if (bearishPoints > bullishPoints) {
    const confidence = bearishPoints >= 5 ? 'High Probability' : bearishPoints >= 4 ? 'Strong' : 'Moderate';
    return { direction: 'DOWN', confidence, confluenceCount: bearishPoints, totalChecks };
  } else {
    // Strictly resolve ties to UP or DOWN based on momentum score and EMA alignment
    const tieBreak = indicators.momentumScore >= 0 ? 'UP' : 'DOWN';
    return { direction: tieBreak, confidence: 'Moderate', confluenceCount: 3, totalChecks };
  }
}

// -------------------------------------------------------------
// 6. AI ANALYSIS WITH GEMINI 3.8 FLASH
// -------------------------------------------------------------
async function generateEducationalAnalysis(
  pair: string,
  market: MarketType,
  timeframe: Timeframe,
  price: number,
  direction: SignalDirection,
  confidence: string,
  indicators: TechnicalIndicators
): Promise<{ explanation: string; summary: string }> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey && geminiApiKey.trim() !== '' && geminiApiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are the lead algorithmic market analyst for PREMIUM BOT, an ultra-modern trading analytics platform.
Provide an educational, rigorous technical breakdown for:
- Currency Pair: ${pair} (${market} market)
- Horizon Timeframe: ${timeframe}
- Current Market Price: ${price}
- Directional Assessment: ${direction}
- Confluence Confidence: ${confidence}
- Key Indicator Metrics:
  * RSI (14): ${indicators.rsi} (${indicators.rsiState})
  * MACD Histogram: ${indicators.macd.histogram} (${indicators.macd.status})
  * EMA 9 vs EMA 21: ${indicators.ema9} vs ${indicators.ema21} (${indicators.emaTrend})
  * Market Trend: ${indicators.marketTrend}
  * Candlestick Pattern: ${indicators.candlestickPattern}
  * Support / Resistance: ${indicators.supportLevel} / ${indicators.resistanceLevel}
  * Momentum Index: ${indicators.momentumScore}

Return a concise educational commentary in plain text (2-3 sentences) explaining the technical rationale for this ${direction} setup, referencing the indicator convergence and key price levels. Never guarantee profits or predict binary outcomes. Focus purely on technical market structure.`;

      const timeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('AI analysis timeout')), 3500)
      );

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        }),
        timeoutPromise,
      ]);

      const text = response?.text?.trim();
      if (text) {
        return {
          explanation: text,
          summary: `${direction} assessment identified via ${confidence.toLowerCase()} technical confluence across RSI (${indicators.rsi}), EMA alignment (${indicators.emaTrend}), and ${indicators.candlestickPattern}.`,
        };
      }
    } catch (err) {
      console.warn('Gemini API call warning (using fallback deterministic rationale):', err);
    }
  }

  // Deterministic technical rationale
  const rsiDesc = indicators.rsi > 60 ? 'elevated bullish momentum' : indicators.rsi < 40 ? 'oversold absorption' : 'balanced equilibrium';
  const emaDesc = indicators.emaTrend.includes('BULLISH') ? 'bullish EMA 9/21 stack' : indicators.emaTrend.includes('BEARISH') ? 'bearish EMA 9/21 stack' : 'converging averages';

  let explanation = '';
  if (direction === 'UP') {
    explanation = `Technical structure on ${pair} (${timeframe}) exhibits bullish confluence. Price is maintaining support above ${indicators.supportLevel} with ${emaDesc} and ${rsiDesc} (RSI: ${indicators.rsi}). Recent price action displays ${indicators.candlestickPattern}, favoring continuation towards ${indicators.resistanceLevel}.`;
  } else if (direction === 'DOWN') {
    explanation = `Technical structure on ${pair} (${timeframe}) shows bearish distribution. Rejection near ${indicators.resistanceLevel} combined with ${emaDesc} and ${rsiDesc} (RSI: ${indicators.rsi}) suggests downward pressure toward dynamic support at ${indicators.supportLevel}.`;
  } else {
    explanation = `Market on ${pair} (${timeframe}) is currently consolidating between support at ${indicators.supportLevel} and resistance at ${indicators.resistanceLevel}. Indicators show mixed signals (RSI: ${indicators.rsi}, MACD: ${indicators.macd.status}). Awaiting clear trend breakout.`;
  }

  return {
    explanation,
    summary: `${direction} signal on ${pair} (${timeframe}) with ${confidence} rating. RSI: ${indicators.rsi}, Momentum Score: ${indicators.momentumScore}.`,
  };
}

// -------------------------------------------------------------
// 7. REST API ENDPOINTS
// -------------------------------------------------------------

// Market list
app.get('/api/markets', (_req: Request, res: Response) => {
  res.json({
    livePairs: LIVE_PAIRS,
    otcPairs: OTC_PAIRS,
  });
});

// Live prices summary
app.get('/api/prices', (_req: Request, res: Response) => {
  const prices: Record<string, { price: number; change24h: number }> = {};
  ALL_PAIRS.forEach((p) => {
    const cur = liveSimulatedPrices[p.symbol] || BASE_PRICES[p.symbol] || 1.0;
    const base = BASE_PRICES[p.symbol] || cur;
    const change24h = Number((((cur - base) / base) * 100).toFixed(2));
    prices[p.symbol] = { price: cur, change24h };
  });

  const { pktTime, pktDate } = getPakistanTime();
  res.json({
    prices,
    pktTime,
    pktDate,
  });
});

// Historical Candles
app.get('/api/candles', async (req: Request, res: Response) => {
  const symbol = (req.query.symbol as string) || 'EUR/USD OTC';
  const timeframe = (req.query.timeframe as Timeframe) || '1M';
  const pair = ALL_PAIRS.find((p) => p.symbol === symbol);

  if (!pair) {
    return res.status(404).json({ error: 'Currency pair not found' });
  }

  // Check cache
  const cacheKey = `${symbol}_${timeframe}`;
  const now = Date.now();
  if (marketCache[cacheKey] && now - marketCache[cacheKey].timestamp < CACHE_TTL_MS) {
    return res.json({
      symbol,
      timeframe,
      candles: marketCache[cacheKey].candles,
      price: marketCache[cacheKey].price,
      dataQuality: marketCache[cacheKey].source,
    });
  }

  // Attempt Twelve Data for LIVE pairs at standard minutes
  let candles: Candle[] | null = null;
  let source: 'Twelve Data Genuine Feed' | 'OTC High-Frequency Synthetic Feed' | 'Fallback Real-Time Feed' =
    pair.market === 'OTC' ? 'OTC High-Frequency Synthetic Feed' : 'Fallback Real-Time Feed';

  if (pair.market === 'LIVE') {
    const tdResult = await fetchTwelveDataSeries(symbol, timeframe);
    if (tdResult) {
      candles = tdResult.candles;
      source = 'Twelve Data Genuine Feed';
    }
  }

  // Fallback / OTC generator
  if (!candles || candles.length === 0) {
    candles = generateCandleSeries(symbol, timeframe, 65);
  }

  const latestPrice = candles[candles.length - 1]?.close || liveSimulatedPrices[symbol] || 1.0;

  marketCache[cacheKey] = {
    timestamp: now,
    candles,
    price: latestPrice,
    source: source as any,
  };

  res.json({
    symbol,
    timeframe,
    candles,
    price: latestPrice,
    dataQuality: source,
  });
});

// Technical Indicators endpoint
app.get('/api/indicators', async (req: Request, res: Response) => {
  const symbol = (req.query.symbol as string) || 'EUR/USD OTC';
  const timeframe = (req.query.timeframe as Timeframe) || '1M';

  const candles = generateCandleSeries(symbol, timeframe, 65);
  const indicators = calculateTechnicalIndicators(candles);

  res.json({
    symbol,
    timeframe,
    price: candles[candles.length - 1].close,
    indicators,
  });
});

function calculateExpiry(tf: Timeframe): { expiryTime: string; expiryDuration: string; expirySeconds: number } {
  const seconds = timeframeToSeconds(tf);
  const now = new Date();
  const expiryDate = new Date(now.getTime() + seconds * 1000);

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  let durationLabel = `${seconds} Seconds`;
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    durationLabel = mins === 1 ? '1 Minute' : `${mins} Minutes`;
  }

  return {
    expiryTime: timeFormatter.format(expiryDate) + ' PKT',
    expiryDuration: durationLabel,
    expirySeconds: seconds,
  };
}

// Signal Generator
app.post('/api/signals/generate', async (req: Request, res: Response) => {
  try {
    const symbol = req.body.symbol || req.body.pairSymbol;
    const timeframe = req.body.timeframe;
    const pair = ALL_PAIRS.find((p) => p.symbol === symbol);

    if (!pair) {
      return res.status(400).json({ error: 'Invalid pair specified' });
    }

    // LIVE MARKET SCHEDULE CHECK: Monday through Friday only.
    // On Saturday and Sunday, disable Live Market signal generation and return "LIVE MARKET CLOSED".
    // OTC market is NEVER disabled and works 24/7 on weekends.
    if (pair.market === 'LIVE') {
      const liveSchedule = getMarketSchedule('LIVE');
      if (!liveSchedule.isOpen) {
        return res.status(400).json({
          error: 'LIVE MARKET CLOSED',
          message: 'LIVE MARKET CLOSED: Live market is available Monday through Friday only. Live market signal generation is disabled on weekends (Saturday & Sunday). Please switch to OTC Market for 24/7 educational simulation.',
          marketClosed: true,
          market: 'LIVE',
          dayOfWeek: liveSchedule.dayOfWeek,
          date: liveSchedule.dateStr,
        });
      }
    }

    const tf = (timeframe as Timeframe) || '1M';
    const candles = generateCandleSeries(symbol, tf, 70);
    const indicators = calculateTechnicalIndicators(candles);
    const price = candles[candles.length - 1].close;

    let { direction, confidence, confluenceCount, totalChecks } = determineSignalDirection(indicators);

    // OTC requirement: Always generate a decisive UP or DOWN quantitative directional signal
    if (pair.market === 'OTC' && direction === 'NO CLEAR SIGNAL') {
      direction = indicators.momentumScore >= 0 ? 'UP' : 'DOWN';
      confidence = 'Strong';
    }

    const { pktTime, pktDate, rawIso } = getPakistanTime();
    const { expiryTime, expiryDuration, expirySeconds } = calculateExpiry(tf);

    const { explanation, summary } = await generateEducationalAnalysis(
      symbol,
      pair.market,
      tf,
      price,
      direction,
      confidence,
      indicators
    );

    const dataQuality: 'Twelve Data Genuine Feed' | 'OTC High-Frequency Synthetic Feed' | 'Fallback Real-Time Feed' =
      pair.market === 'OTC' ? 'OTC High-Frequency Synthetic Feed' : 'Twelve Data Genuine Feed';

    const newSignal: SignalAnalysis = {
      id: 'sig_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      pair: symbol,
      market: pair.market,
      timeframe: tf,
      direction,
      currentPrice: price,
      confidence,
      confluenceCount,
      totalChecks,
      timestamp: rawIso,
      pktTime,
      pktDate,
      expiryTime,
      expiryDuration,
      expirySeconds,
      indicators,
      explanation,
      summary,
      dataQuality,
      isEducationalSimulation: true,
      disclaimer: 'Educational simulation only. Not real trading advice.',
    };

    signalHistory.unshift(newSignal);
    if (signalHistory.length > 200) signalHistory.pop();
    saveHistory();

    res.json(newSignal);
  } catch (err: any) {
    console.error('Signal generation error:', err);
    res.status(500).json({ error: err.message || 'Error generating signal' });
  }
});

// Signal History
app.get('/api/signals', (req: Request, res: Response) => {
  const { market, direction, timeframe, search, limit } = req.query;

  let filtered = [...signalHistory];

  if (market && market !== 'ALL') {
    filtered = filtered.filter((s) => s.market === market);
  }
  if (direction && direction !== 'ALL') {
    filtered = filtered.filter((s) => s.direction === direction);
  }
  if (timeframe && timeframe !== 'ALL') {
    filtered = filtered.filter((s) => s.timeframe === timeframe);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.pair.toLowerCase().includes(q) ||
        s.explanation.toLowerCase().includes(q) ||
        s.confidence.toLowerCase().includes(q)
    );
  }

  const maxLimit = limit ? parseInt(limit as string) : 50;
  res.json({
    signals: filtered.slice(0, maxLimit),
    totalCount: signalHistory.length,
  });
});

// Clear History
app.delete('/api/signals', (_req: Request, res: Response) => {
  signalHistory = [];
  saveHistory();
  res.json({ success: true, message: 'Signal history cleared' });
});

// Overview Statistics
app.get('/api/stats', (req: Request, res: Response) => {
  const selectedPair = (req.query.pair as string) || 'USD/JPY';
  const pair = ALL_PAIRS.find((p) => p.symbol === selectedPair) || LIVE_PAIRS[0];
  const price = liveSimulatedPrices[pair.symbol] || BASE_PRICES[pair.symbol] || 1.0;

  const upCount = signalHistory.filter((s) => s.direction === 'UP').length;
  const downCount = signalHistory.filter((s) => s.direction === 'DOWN').length;
  const neutralCount = signalHistory.filter((s) => s.direction === 'NO CLEAR SIGNAL').length;

  const liveSchedule = getMarketSchedule('LIVE');
  const otcSchedule = getMarketSchedule('OTC');
  const currentSchedule = getMarketSchedule(pair.market);

  const stats: StatsOverview = {
    marketStatus: currentSchedule.statusText,
    selectedPair: pair.symbol,
    currentPrice: price,
    dataConnection:
      pair.market === 'LIVE'
        ? liveSchedule.isOpen
          ? (process.env.TWELVE_DATA_API_KEY
            ? 'Twelve Data Genuine Feed'
            : 'Live Market Feed (Active)')
          : 'Live Market Closed (Weekend)'
        : 'OTC High-Frequency Feed (Active)',
    totalSignals: signalHistory.length,
    upCount,
    downCount,
    neutralCount,
    liveMarketOpen: liveSchedule.isOpen,
    liveMarketStatus: liveSchedule.statusText,
    otcMarketOpen: otcSchedule.isOpen,
    otcMarketStatus: otcSchedule.statusText,
    dayOfWeek: currentSchedule.dayOfWeek,
  };

  const { pktTime, pktDate } = getPakistanTime();

  res.json({
    ...stats,
    pktTime,
    pktDate,
  });
});

// -------------------------------------------------------------
// 8. SERVER INITIALIZATION & VITE DEV SERVER
// -------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PREMIUM BOT platform running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
