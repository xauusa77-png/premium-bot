/**
 * PREMIUM BOT - Frontend API Client
 */

import {
  Candle,
  CurrencyPair,
  SignalAnalysis,
  StatsOverview,
  TechnicalIndicators,
  Timeframe,
} from '../types';

const TOKEN_KEY = 'pb_session_token';

export const authStorage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },
  clearToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['x-session-token'] = token;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network response was not ok' }));
    throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  async unlock(key: string): Promise<{ success: boolean; token?: string; message: string }> {
    const data = await request<{ success: boolean; token?: string; message: string }>('/api/auth/unlock', {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
    if (data.token) {
      authStorage.setToken(data.token);
    }
    return data;
  },

  async verifyAuth(): Promise<boolean> {
    const token = authStorage.getToken();
    if (!token) return false;
    try {
      const data = await request<{ authenticated: boolean }>('/api/auth/verify');
      return data.authenticated;
    } catch {
      return false;
    }
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      authStorage.clearToken();
    }
  },

  async changeKey(currentKey: string, newKey: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/auth/change-key', {
      method: 'POST',
      body: JSON.stringify({ currentKey, newKey }),
    });
  },

  // Market & Prices
  async getMarkets(): Promise<{ livePairs: CurrencyPair[]; otcPairs: CurrencyPair[] }> {
    return request('/api/markets');
  },

  async getPrices(): Promise<{
    prices: Record<string, { price: number; change24h: number }>;
    pktTime: string;
    pktDate: string;
  }> {
    return request('/api/prices');
  },

  // Candles
  async getCandles(
    symbol: string,
    timeframe: Timeframe
  ): Promise<{
    symbol: string;
    timeframe: Timeframe;
    candles: Candle[];
    price: number;
    dataQuality: string;
  }> {
    return request(
      `/api/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`
    );
  },

  // Technical Indicators
  async getIndicators(
    symbol: string,
    timeframe: Timeframe
  ): Promise<{
    symbol: string;
    timeframe: Timeframe;
    price: number;
    indicators: TechnicalIndicators;
  }> {
    return request(
      `/api/indicators?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`
    );
  },

  // Signal Generator
  async generateSignal(symbol: string, timeframe: Timeframe): Promise<SignalAnalysis> {
    return request<SignalAnalysis>('/api/signals/generate', {
      method: 'POST',
      body: JSON.stringify({ symbol, timeframe }),
    });
  },

  // Signal History
  async getSignals(filters?: {
    market?: string;
    direction?: string;
    timeframe?: string;
    search?: string;
    limit?: number;
  }): Promise<{ signals: SignalAnalysis[]; totalCount: number }> {
    const params = new URLSearchParams();
    if (filters?.market) params.set('market', filters.market);
    if (filters?.direction) params.set('direction', filters.direction);
    if (filters?.timeframe) params.set('timeframe', filters.timeframe);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.limit) params.set('limit', String(filters.limit));

    return request(`/api/signals?${params.toString()}`);
  },

  async clearSignals(): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/signals', {
      method: 'DELETE',
    });
  },

  // Overview Stats
  async getStats(pair: string): Promise<
    StatsOverview & {
      pktTime: string;
      pktDate: string;
    }
  > {
    return request(`/api/stats?pair=${encodeURIComponent(pair)}`);
  },
};
