import { create } from 'zustand';
import { AppRoute, CrownEvent, CrownInventory, Language, ToastMessage, TradeSession, TradeSide, TradeStatus } from './types';
import { DEFAULT_MARGIN_USD, LEVERAGE } from './constants';
import {
  applyCrownReward,
  calculateLiqPrice,
  calculateTargetPrice,
  createId,
  createEmptyCrownInventory,
  getCrownTier,
  getTodayDate,
  randomizeEntryPrice,
} from './utils';
import { detectLanguage } from './i18n';
import {
  loadCrownEvent,
  loadCrownInventory,
  loadCurrentSession,
  loadHistorySessions,
  loadLanguage,
  saveCrownEvent,
  saveCrownInventory,
  saveCurrentSession,
  saveHistorySessions,
  saveLanguage,
} from './storage';

interface AppState {
  route: AppRoute;
  walletBalanceUsdc: number | null;
  language: Language;
  crownInventory: CrownInventory;
  lastCrownEvent: CrownEvent | null;
  currentSession: TradeSession | null;
  lastSession: TradeSession | null;
  historySessions: TradeSession[];
  toasts: ToastMessage[];
  setRoute: (route: AppRoute) => void;
  setWalletBalanceUsdc: (balance: number | null) => void;
  setLanguage: (language: Language) => void;
  startSession: (payload: {
    side: TradeSide;
    targetProfitUsd: number;
    tpMultiple: number;
    marginUsd: number;
    entryPrice?: number;
  }) => TradeSession;
  updateSession: (update: Partial<TradeSession>) => void;
  resumeSession: (session: TradeSession) => void;
  completeSession: (status: TradeStatus) => void;
  abortSession: () => void;
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const bootstrapSession = () => {
  const stored = loadCurrentSession();
  if (!stored) return null;
  if (stored.date !== getTodayDate()) {
    return null;
  }
  return stored;
};

const bootstrapInventory = () => loadCrownInventory() ?? createEmptyCrownInventory();
const bootstrapCrownEvent = () => loadCrownEvent();
const bootstrapLanguage = () => loadLanguage() ?? detectLanguage();
const bootstrapCurrent = () => bootstrapSession();
const bootstrapHistory = (current: TradeSession | null) => {
  const history = loadHistorySessions();
  if (current && !history.find((session) => session.id === current.id)) {
    return [current, ...history];
  }
  return history;
};

const initialCurrent = bootstrapCurrent();
const initialHistory = bootstrapHistory(initialCurrent);

export const useAppStore = create<AppState>((set, get) => ({
  route: '/trade',
  walletBalanceUsdc: null,
  language: bootstrapLanguage(),
  crownInventory: bootstrapInventory(),
  lastCrownEvent: bootstrapCrownEvent(),
  currentSession: initialCurrent,
  lastSession: null,
  historySessions: initialHistory,
  toasts: [],
  setRoute: (route) => set({ route }),
  setWalletBalanceUsdc: (balance) => set({ walletBalanceUsdc: balance }),
  setLanguage: (language) => {
    saveLanguage(language);
    set({ language });
  },
  startSession: ({ side, targetProfitUsd, tpMultiple, marginUsd, entryPrice: providedEntry }) => {
    const entryPrice = providedEntry ?? randomizeEntryPrice();
    const liqPrice = calculateLiqPrice(entryPrice, side);
    const targetPrice = calculateTargetPrice(entryPrice, side, targetProfitUsd, LEVERAGE, marginUsd);
    const session: TradeSession = {
      id: createId(),
      date: getTodayDate(),
      side,
      targetProfitUsd,
      tpMultiple,
      marginUsd,
      leverage: LEVERAGE,
      status: 'running',
      luckPath: [0.5],
      startedAt: Date.now(),
      endedAt: null,
      entryPrice,
      liqPrice,
      targetPrice,
      currentPrice: entryPrice,
    };
    saveCurrentSession(session);
    const history = [session, ...get().historySessions];
    saveHistorySessions(history);
    set({ currentSession: session, lastSession: session, historySessions: history });
    return session;
  },
  updateSession: (update) => {
    const current = get().currentSession;
    if (!current) return;
    const next = { ...current, ...update };
    const history = get().historySessions.map((session) => (session.id === next.id ? next : session));
    saveCurrentSession(next);
    saveHistorySessions(history);
    set({ currentSession: next, lastSession: next, historySessions: history });
  },
  resumeSession: (session) => {
    saveCurrentSession(session);
    set({ currentSession: session, lastSession: session });
  },
  completeSession: (status) => {
    const current = get().currentSession;
    if (!current) return;
    const completed = { ...current, status, endedAt: Date.now() };
    const history = get().historySessions.map((session) => (session.id === completed.id ? completed : session));
    const isSuccess = status === 'success';
    const awardedTier = isSuccess ? getCrownTier(current.tpMultiple).id : 'fragment';
    const crownResult = applyCrownReward(get().crownInventory, awardedTier);
    const crownEvent: CrownEvent = {
      awardedTierId: awardedTier,
      awardedCount: 1,
      upgrades: crownResult.upgrades,
      createdAt: Date.now(),
    };
    saveHistorySessions(history);
    saveCurrentSession(null);
    saveCrownInventory(crownResult.inventory);
    saveCrownEvent(crownEvent);
    set({
      currentSession: null,
      lastSession: completed,
      historySessions: history,
      crownInventory: crownResult.inventory,
      lastCrownEvent: crownEvent,
    });
  },
  abortSession: () => {
    get().completeSession('aborted');
  },
  pushToast: (toast) => {
    const id = createId();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
