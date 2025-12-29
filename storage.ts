import { CURRENT_SESSION_KEY, HISTORY_SESSIONS_KEY, MAX_HISTORY_DAYS } from './constants';
import { CrownEvent, CrownInventory, Language, TradeSession } from './types';
import { getTodayDate } from './utils';

const CROWN_INVENTORY_KEY = 'crownInventory';
const CROWN_EVENT_KEY = 'crownEvent';
const LANGUAGE_KEY = 'appLanguage';
const AUTH_TOKEN_KEY = 'authToken';

const isBrowser = typeof window !== 'undefined';

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('Failed to parse localStorage payload', error);
    return fallback;
  }
};

export const loadCurrentSession = (): TradeSession | null => {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(CURRENT_SESSION_KEY);
  return safeParse<TradeSession | null>(raw, null);
};

export const saveCurrentSession = (session: TradeSession | null) => {
  if (!isBrowser) return;
  if (!session) {
    window.localStorage.removeItem(CURRENT_SESSION_KEY);
    return;
  }
  window.localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
};

export const loadHistorySessions = (): TradeSession[] => {
  if (!isBrowser) return [];
  const raw = window.localStorage.getItem(HISTORY_SESSIONS_KEY);
  const parsed = safeParse<TradeSession[]>(raw, []);
  return dedupeHistory(parsed);
};

export const saveHistorySessions = (sessions: TradeSession[]) => {
  if (!isBrowser) return;
  const pruned = pruneHistory(dedupeHistory(sessions));
  window.localStorage.setItem(HISTORY_SESSIONS_KEY, JSON.stringify(pruned));
};

const normalizeCrownInventory = (raw: any): CrownInventory | null => {
  if (!raw || typeof raw !== 'object') return null;
  if (
    typeof raw.fragment === 'number' &&
    typeof raw.green === 'number' &&
    typeof raw.blue === 'number' &&
    typeof raw.purple === 'number' &&
    typeof raw.orange === 'number' &&
    typeof raw.prism === 'number'
  ) {
    return raw as CrownInventory;
  }
  if (typeof raw.fragment === 'number' && typeof raw.green === 'number') {
    return {
      fragment: raw.fragment,
      green: raw.green,
      blue: 0,
      purple: 0,
      orange: 0,
      prism: 0,
    };
  }
  if (raw.green && typeof raw.green === 'object') {
    const fragment = Object.values(raw).reduce(
      (sum: number, tier: any) => sum + (tier?.broken ?? 0),
      0
    );
    return {
      fragment,
      green: raw.green?.intact ?? 0,
      blue: raw.blue?.intact ?? 0,
      purple: raw.purple?.intact ?? 0,
      orange: raw.orange?.intact ?? 0,
      prism: raw.prism?.intact ?? 0,
    };
  }
  return null;
};

export const loadCrownInventory = (): CrownInventory | null => {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(CROWN_INVENTORY_KEY);
  const parsed = safeParse<CrownInventory | null>(raw, null);
  return normalizeCrownInventory(parsed);
};

export const saveCrownInventory = (inventory: CrownInventory) => {
  if (!isBrowser) return;
  window.localStorage.setItem(CROWN_INVENTORY_KEY, JSON.stringify(inventory));
};

export const loadCrownEvent = (): CrownEvent | null => {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(CROWN_EVENT_KEY);
  const parsed = safeParse<CrownEvent | null>(raw, null);
  if (!parsed) return null;
  if (typeof parsed.awardedTierId === 'string' && typeof parsed.awardedCount === 'number') {
    return parsed;
  }
  const legacy = parsed as any;
  if (typeof legacy?.fragmentAwarded === 'number' && typeof legacy?.greenCrafted === 'number') {
    const craftedCount = Math.max(0, legacy.greenCrafted);
    return {
      awardedTierId: legacy.fragmentAwarded > 0 ? 'fragment' : 'green',
      awardedCount: legacy.fragmentAwarded > 0 ? legacy.fragmentAwarded : craftedCount,
      upgrades: craftedCount > 0 ? Array.from({ length: craftedCount }, () => 'green') : [],
      createdAt: typeof legacy?.createdAt === 'number' ? legacy.createdAt : Date.now(),
    };
  }
  const awardedTierId = legacy?.broken ? 'fragment' : legacy?.awardedTierId || 'green';
  return {
    awardedTierId,
    awardedCount: 1,
    upgrades: Array.isArray(legacy?.upgrades) ? legacy.upgrades : [],
    createdAt: typeof legacy?.createdAt === 'number' ? legacy.createdAt : Date.now(),
  };
};

export const saveCrownEvent = (event: CrownEvent | null) => {
  if (!isBrowser) return;
  if (!event) {
    window.localStorage.removeItem(CROWN_EVENT_KEY);
    return;
  }
  window.localStorage.setItem(CROWN_EVENT_KEY, JSON.stringify(event));
};

export const loadLanguage = (): Language | null => {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(LANGUAGE_KEY);
  return raw === 'zh' || raw === 'en' ? raw : null;
};

export const saveLanguage = (language: Language) => {
  if (!isBrowser) return;
  window.localStorage.setItem(LANGUAGE_KEY, language);
};

export const loadAuthToken = (): string | null => {
  if (!isBrowser) return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const saveAuthToken = (token: string | null) => {
  if (!isBrowser) return;
  if (!token) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const pruneHistory = (sessions: TradeSession[]) => {
  const today = new Date(getTodayDate());
  return sessions.filter((session) => {
    const sessionDate = new Date(session.date);
    const diffDays = (today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= MAX_HISTORY_DAYS;
  });
};

const dedupeHistory = (sessions: TradeSession[]) => {
  const seen = new Set<string>();
  const output: TradeSession[] = [];
  for (const session of sessions) {
    if (seen.has(session.id)) continue;
    seen.add(session.id);
    output.push(session);
  }
  return output;
};
