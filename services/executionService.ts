
import { priceFeed } from './priceService';

export interface TradeParams {
  direction: 'LONG' | 'SHORT';
  margin: number;
  leverage: number;
}

export interface ExecutionResult {
  entryPrice: number;
  positionId: string;
}

/**
 * ENVIRONMENT CONFIGURATION
 * Set NEXT_PUBLIC_MODE=real to enable Hyperliquid integration
 */
const EXECUTION_MODE = 'mock'; // 'mock' | 'real'

export const executionService = {
  openPosition: async (params: TradeParams): Promise<ExecutionResult> => {
    if (EXECUTION_MODE === 'mock') {
      // Simulate network delay for opening ritual
      await new Promise(r => setTimeout(r, 2000));
      const entryPrice = priceFeed.getLatest();
      if (!entryPrice) {
        throw new Error("Price feed not ready. The spirits are silent.");
      }
      return {
        entryPrice,
        positionId: `mock-${Date.now()}`
      };
    } else {
      /**
       * REAL MODE (HYPERLIQUID INTEGRATION)
       * Requires server-side implementation for signing and API management.
       */
      try {
        // Example logic for real mode
        // const response = await fetch('/api/hyperliquid/open', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ ...params, symbol: 'BTC-PERP' })
        // });
        // if (!response.ok) throw new Error("Exchange rejected ritual");
        // return await response.json();
        throw new Error("Real execution requires active API backend.");
      } catch (e) {
        console.error("Hyperliquid Error:", e);
        throw e;
      }
    }
  },

  closePosition: async (positionId: string): Promise<void> => {
    if (EXECUTION_MODE === 'mock') {
      await new Promise(r => setTimeout(r, 500));
      return;
    } else {
      // TODO: Implementation for closing real positions on Hyperliquid
      // await fetch('/api/hyperliquid/close', { method: 'POST', body: JSON.stringify({ positionId }) });
    }
  }
};
