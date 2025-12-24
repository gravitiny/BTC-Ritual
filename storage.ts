import { CURRENT_SESSION_KEY, HISTORY_SESSIONS_KEY, MAX_HISTORY_DAYS } from './constants';
import { CrownEvent, CrownInventory, TradeSession } from './types';
import { getTodayDate } from './utils';

const CROWN_INVENTORY_KEY = 'crownInventory';
const CROWN_EVENT_KEY = 'crownEvent';

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
  return safeParse<TradeSession[]>(raw, []);
};

export const saveHistorySessions = (sessions: TradeSession[]) => {
  if (!isBrowser) return;
  const pruned = pruneHistory(sessions);
  window.localStorage.setItem(HISTORY_SESSIONS_KEY, JSON.stringify(pruned));
};

export const loadCrownInventory = (): CrownInventory | null => {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(CROWN_INVENTORY_KEY);
  return safeParse<CrownInventory | null>(raw, null);
};

export const saveCrownInventory = (inventory: CrownInventory) => {
  if (!isBrowser) return;
  window.localStorage.setItem(CROWN_INVENTORY_KEY, JSON.stringify(inventory));
};

export const loadCrownEvent = (): CrownEvent | null => {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(CROWN_EVENT_KEY);
  return safeParse<CrownEvent | null>(raw, null);
};

export const saveCrownEvent = (event: CrownEvent | null) => {
  if (!isBrowser) return;
  if (!event) {
    window.localStorage.removeItem(CROWN_EVENT_KEY);
    return;
  }
  window.localStorage.setItem(CROWN_EVENT_KEY, JSON.stringify(event));
};

export const pruneHistory = (sessions: TradeSession[]) => {
  const today = new Date(getTodayDate());
  return sessions.filter((session) => {
    const sessionDate = new Date(session.date);
    const diffDays = (today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= MAX_HISTORY_DAYS;
  });
};
