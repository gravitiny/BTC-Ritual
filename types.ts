
export enum RitualStatus {
  DISCONNECTED = 'DISCONNECTED',
  READY = 'READY',
  OPENING = 'OPENING',
  LIVE = 'LIVE',
  STOPPED = 'STOPPED',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  ERROR = 'ERROR'
}

export type Direction = 'LONG' | 'SHORT';

export interface RitualContext {
  walletAddress: string | null;
  balanceUSDC: number;
  direction: Direction | null;
  targetProfitUSDT: number;
  entryPrice: number | null;
  currentPrice: number | null;
  liqPrice: number | null;
  targetPrice: number | null;
  startedAt: number | null;
  endedAt: number | null;
  omen: string;
  whisper: string;
}

export interface RitualStore {
  status: RitualStatus;
  context: RitualContext;
  setStatus: (status: RitualStatus) => void;
  setContext: (context: Partial<RitualContext>) => void;
  reset: () => void;
}

export interface FortuneContent {
  omens: string[];
  whispers: string[];
  narrations: {
    favorable: string[];
    unfavorable: string[];
    neutral: string[];
  };
}
