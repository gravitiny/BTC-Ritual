import { TradeSession } from '../types';
import { getTodayDate } from '../utils';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8787';

const jsonFetch = async <T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || 'Request failed');
  }
  return payload as T;
};

export const requestNonce = async (address: string) => {
  return jsonFetch<{ nonce: string; message: string }>('/auth/nonce', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
};

export const verifySignature = async (address: string, signature: `0x${string}`, nonce: string) => {
  return jsonFetch<{ token: string; userId: string }>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ address, signature, nonce }),
  });
};

export const createTrade = async (session: TradeSession, token: string) => {
  const payload = {
    side: session.side,
    margin_usd: session.marginUsd,
    leverage: session.leverage,
    tp_multiple: session.tpMultiple,
    target_profit_usd: session.targetProfitUsd,
    entry_price: session.entryPrice,
    liq_price: session.liqPrice,
    tp_price: session.targetPrice,
    status: session.status,
    pnl_usd: null,
    started_at: new Date(session.startedAt).toISOString(),
  };
  return jsonFetch<{
    id: string;
  }>('/trades', { method: 'POST', body: JSON.stringify(payload) }, token);
};

export const updateTrade = async (serverId: string, update: Partial<TradeSession>, token: string) => {
  const payload: Record<string, any> = {};
  if (update.status) payload.status = update.status;
  if (typeof update.currentPrice === 'number' && typeof update.entryPrice === 'number') {
    const notional = update.marginUsd && update.leverage ? update.marginUsd * update.leverage : null;
    if (notional) {
      const change = (update.currentPrice - update.entryPrice) / update.entryPrice;
      const signed = update.side === 'LONG' ? change : -change;
      payload.pnl_usd = notional * signed;
    }
  }
  if (update.endedAt) payload.ended_at = new Date(update.endedAt).toISOString();
  return jsonFetch(`/trades/${serverId}`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
};

export const fetchTrades = async (token: string) => {
  return jsonFetch<any[]>('/trades', { method: 'GET' }, token);
};

export const mapTrade = (row: any): TradeSession => {
  return {
    id: row.id ?? `${row.started_at ?? Date.now()}`,
    serverId: row.id,
    date: row.started_at ? row.started_at.slice(0, 10) : getTodayDate(),
    side: row.side ?? 'LONG',
    targetProfitUsd: Number(row.target_profit_usd ?? 0),
    tpMultiple: Number(row.tp_multiple ?? 1),
    marginUsd: Number(row.margin_usd ?? 0),
    leverage: Number(row.leverage ?? 40),
    status: row.status ?? 'running',
    luckPath: [0.5],
    startedAt: row.started_at ? new Date(row.started_at).getTime() : Date.now(),
    endedAt: row.ended_at ? new Date(row.ended_at).getTime() : null,
    entryPrice: Number(row.entry_price ?? 0),
    liqPrice: Number(row.liq_price ?? 0),
    targetPrice: Number(row.tp_price ?? 0),
    currentPrice: Number(row.entry_price ?? 0),
  };
};

export const fetchLeaderboard = async (type: 'champions' | 'winrate' | 'clown') => {
  const params = new URLSearchParams({ type });
  return jsonFetch<any[]>(`/leaderboard?${params.toString()}`, { method: 'GET' });
};

export const shareToTwitter = async (text: string, imageDataUrl: string, token: string) => {
  return jsonFetch<{ id: string }>('/share/twitter', {
    method: 'POST',
    body: JSON.stringify({ text, imageDataUrl }),
  }, token);
};
