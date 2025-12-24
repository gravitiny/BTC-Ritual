import { CROWN_TIERS, DEFAULT_MARGIN_USD, LEVERAGE, LUCK_TIER_LABELS, MOCK_BASE_PRICE, MOCK_PRICE_VARIANCE } from './constants';
import { CrownInventory, CrownTierId, TradeSide, TradeSession } from './types';

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

export const getLuckSummary = (session: TradeSession | null) => {
  if (!session || session.luckPath.length === 0) {
    return { label: '未知', emoji: '🧿', value: 0.5 };
  }
  const lastLuck = session.luckPath[session.luckPath.length - 1];
  const tier = getLuckTier(lastLuck);
  return { label: tier.label, emoji: tier.emoji, value: lastLuck };
};

export const getCrownTier = (targetProfitUsd: number) => {
  const sorted = [...CROWN_TIERS].sort((a, b) => a.profit - b.profit);
  let chosen = sorted[0];
  for (const tier of sorted) {
    if (targetProfitUsd >= tier.profit) {
      chosen = tier;
    }
  }
  return chosen;
};

export const getCrownTierById = (id: CrownTierId) => {
  return CROWN_TIERS.find((tier) => tier.id === id) ?? CROWN_TIERS[0];
};

export const createEmptyCrownInventory = (): CrownInventory => ({
  green: { intact: 0, broken: 0 },
  blue: { intact: 0, broken: 0 },
  purple: { intact: 0, broken: 0 },
  orange: { intact: 0, broken: 0 },
  prism: { intact: 0, broken: 0 },
});

export const getHighestCrownTier = (inventory: CrownInventory) => {
  const order: CrownTierId[] = ['prism', 'orange', 'purple', 'blue', 'green'];
  return order.find((id) => inventory[id].intact > 0) ?? null;
};

export const applyCrownReward = (
  inventory: CrownInventory,
  tierId: CrownTierId,
  broken: boolean
) => {
  const next: CrownInventory = JSON.parse(JSON.stringify(inventory));
  if (broken) {
    next[tierId].broken += 1;
  } else {
    next[tierId].intact += 1;
  }

  const upgrades: CrownTierId[] = [];

  while (next.green.broken >= 3) {
    next.green.broken -= 3;
    next.green.intact += 1;
    upgrades.push('green');
  }

  while (next.green.intact >= 3) {
    next.green.intact -= 3;
    next.blue.intact += 1;
    upgrades.push('blue');
  }

  while (next.blue.broken >= 3) {
    next.blue.broken -= 3;
    next.blue.intact += 1;
    upgrades.push('blue');
  }

  while (next.blue.intact >= 3) {
    next.blue.intact -= 3;
    next.purple.intact += 1;
    upgrades.push('purple');
  }

  while (next.orange.intact >= 3) {
    next.orange.intact -= 3;
    next.prism.intact += 1;
    upgrades.push('prism');
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

export const parseRoute = (hash: string) => {
  const trimmed = hash.replace('#', '');
  if (trimmed.startsWith('/trade')) return '/trade';
  if (trimmed.startsWith('/run')) return '/run';
  if (trimmed.startsWith('/history')) return '/history';
  return '/';
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
