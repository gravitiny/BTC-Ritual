export type TradeSide = 'LONG' | 'SHORT';

export type TradeStatus = 'idle' | 'running' | 'success' | 'fail' | 'aborted';

export type AppRoute = '/' | '/trade' | '/run' | '/history';

export type CrownTierId = 'green' | 'blue' | 'purple' | 'orange' | 'prism';

export interface CrownInventoryEntry {
  intact: number;
  broken: number;
}

export type CrownInventory = Record<CrownTierId, CrownInventoryEntry>;

export interface CrownEvent {
  awardedTierId: CrownTierId;
  broken: boolean;
  upgrades: CrownTierId[];
  createdAt: number;
}

export interface TradeSession {
  id: string;
  date: string; // YYYY-MM-DD
  side: TradeSide;
  targetProfitUsd: number;
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
