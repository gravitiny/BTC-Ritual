export type TradeSide = 'LONG' | 'SHORT';

export type TradeStatus = 'idle' | 'running' | 'success' | 'fail' | 'aborted';

export type AppRoute = '/' | '/trade' | '/run' | '/history' | '/leaderboard';

export type Language = 'zh' | 'en';

export type CrownTierId = 'fragment' | 'green' | 'blue' | 'purple' | 'orange' | 'prism';

export type CrownInventory = Record<CrownTierId, number>;

export interface CrownEvent {
  awardedTierId: CrownTierId;
  awardedCount: number;
  upgrades: CrownTierId[];
  createdAt: number;
}

export interface TradeSession {
  id: string;
  serverId?: string;
  date: string; // YYYY-MM-DD
  side: TradeSide;
  targetProfitUsd: number;
  tpMultiple: number;
  marginUsd: number;
  leverage: number;
  status: TradeStatus;
  luckPath: number[];
  startedAt: number;
  endedAt: number | null;
  entryPrice: number;
  liqPrice: number;
  targetPrice: number;
  currentPrice: number;
  orderId?: number;
}

export type ToastKind = 'info' | 'success' | 'error';

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  message: string;
}
