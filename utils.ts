import { CROWN_TIERS, DEFAULT_MARGIN_USD, LEVERAGE, LUCK_TIER_LABELS, MOCK_BASE_PRICE, MOCK_PRICE_VARIANCE } from './constants';
import { CrownInventory, CrownTierId, Language, TradeSide, TradeSession } from './types';

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

export const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const getTodayDate = () => new Date().toISOString().slice(0, 10);

export const createMockAddress = () => {
  const hex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `0x${hex}`;
};

export const calculateLiqPrice = (entryPrice: number, side: TradeSide, leverage = LEVERAGE) => {
  if (side === 'LONG') {
    return entryPrice * (1 - 1 / leverage);
  }
  return entryPrice * (1 + 1 / leverage);
};

export const calculateTargetPrice = (
  entryPrice: number,
  side: TradeSide,
  targetProfitUsd: number,
  leverage = LEVERAGE,
  marginUsd = DEFAULT_MARGIN_USD
) => {
  const notional = marginUsd * leverage;
  const profit = targetProfitUsd;
  const priceMove = (profit / notional) * entryPrice;
  if (side === 'LONG') {
    return entryPrice + priceMove;
  }
  return entryPrice - priceMove;
};

export const getLuckTier = (value: number) => {
  return LUCK_TIER_LABELS.find((tier) => value >= tier.min) ?? LUCK_TIER_LABELS[LUCK_TIER_LABELS.length - 1];
};

export const getLuckSummary = (session: TradeSession | null, language: Language = 'zh') => {
  if (!session || session.luckPath.length === 0) {
    return { label: language === 'en' ? 'Unknown' : '未知', emoji: '🧿', value: 0.5 };
  }
  const lastLuck = session.luckPath[session.luckPath.length - 1];
  const tier = getLuckTier(lastLuck);
  const label = language === 'en' ? tier.labelEn : tier.label;
  return { label, emoji: tier.emoji, value: lastLuck };
};

export const getCrownTier = (tpMultiple: number) => {
  const rewardTiers = CROWN_TIERS.filter((tier) => tier.id !== 'fragment').sort(
    (a, b) => a.multiple - b.multiple
  );
  let chosen = rewardTiers[0];
  for (const tier of rewardTiers) {
    if (tpMultiple >= tier.multiple) {
      chosen = tier;
    }
  }
  return chosen;
};

export const getCrownTierById = (id: CrownTierId) => {
  return CROWN_TIERS.find((tier) => tier.id === id) ?? CROWN_TIERS[0];
};

export const createEmptyCrownInventory = (): CrownInventory => ({
  fragment: 0,
  green: 0,
  blue: 0,
  purple: 0,
  orange: 0,
  prism: 0,
});

const crownOrder: CrownTierId[] = ['fragment', 'green', 'blue', 'purple', 'orange', 'prism'];

export const applyCrownReward = (inventory: CrownInventory, awardedTierId: CrownTierId) => {
  const next: CrownInventory = { ...inventory };
  next[awardedTierId] += 1;

  const upgrades: CrownTierId[] = [];
  for (let i = 0; i < crownOrder.length - 1; i += 1) {
    const tier = crownOrder[i];
    const nextTier = crownOrder[i + 1];
    while (next[tier] >= 3) {
      next[tier] -= 3;
      next[nextTier] += 1;
      upgrades.push(nextTier);
    }
  }

  return { inventory: next, upgrades };
};

export const nextLuckValue = (prev: number) => {
  const drift = (Math.random() - 0.5) * 0.18;
  const inertia = (prev - 0.5) * 0.04;
  return clamp(prev + drift - inertia, 0.01, 0.99);
};

export const randomizeEntryPrice = () => {
  const offset = (Math.random() - 0.5) * MOCK_PRICE_VARIANCE * 2;
  return MOCK_BASE_PRICE + offset;
};

export const priceFromLuck = (luck: number, liqPrice: number, targetPrice: number) => {
  return liqPrice + (targetPrice - liqPrice) * luck;
};

export const priceToLuck = (price: number, liqPrice: number, targetPrice: number, side: TradeSide) => {
  if (side === 'LONG') {
    return clamp((price - liqPrice) / (targetPrice - liqPrice), 0, 1);
  }
  return clamp((liqPrice - price) / (liqPrice - targetPrice), 0, 1);
};

export const calculatePnlUsd = (session: TradeSession, currentPrice?: number) => {
  const price = currentPrice ?? session.currentPrice;
  if (!Number.isFinite(price) || price <= 0 || session.entryPrice <= 0) return 0;
  const notional = session.marginUsd * session.leverage;
  const change = (price - session.entryPrice) / session.entryPrice;
  const signedChange = session.side === 'LONG' ? change : -change;
  return notional * signedChange;
};

export const parseRoute = (hash: string) => {
  const trimmed = hash.replace('#', '');
  if (trimmed.startsWith('/trade')) return '/trade';
  if (trimmed.startsWith('/run')) return '/run';
  if (trimmed.startsWith('/history')) return '/history';
  if (trimmed.startsWith('/leaderboard')) return '/leaderboard';
  return '/trade';
};

export const getSuccessRate = (sessions: TradeSession[]) => {
  if (sessions.length === 0) return 0;
  const wins = sessions.filter((session) => session.status === 'success').length;
  return Math.round((wins / sessions.length) * 100);
};

export const getStreakDays = (sessions: TradeSession[]) => {
  const dates = Array.from(new Set(sessions.map((session) => session.date))).sort();
  let streak = 0;
  let current = getTodayDate();
  while (dates.includes(current)) {
    streak += 1;
    const prev = new Date(current);
    prev.setDate(prev.getDate() - 1);
    current = prev.toISOString().slice(0, 10);
  }
  return streak;
};

export const getTodayCount = (sessions: TradeSession[]) => {
  const today = getTodayDate();
  return sessions.filter((session) => session.date === today).length;
};
