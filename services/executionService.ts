
import { priceFeed } from './priceService';
import { hyperliquidService } from './hyperliquidService';
import { ethers } from 'ethers';

export interface TradeParams {
  direction: 'LONG' | 'SHORT';
  margin: number;
  leverage: number;
  signer?: ethers.JsonRpcSigner;
}

export interface ExecutionResult {
  entryPrice: number;
  positionId: string;
}

export const executionService = {
  openPosition: async (params: TradeParams): Promise<ExecutionResult> => {
    if (!params.signer) {
        throw new Error("Soul not bound. Connect wallet first.");
    }

    // 1. Get current market price from HL to ensure slippage protection
    const midPrice = await hyperliquidService.getMidPrice('BTC');
    
    // 2. Adjust limit price based on direction to ensure fill (Market Order emulation)
    const limitPrice = params.direction === 'LONG' 
        ? midPrice * 1.01 
        : midPrice * 0.99;

    // 3. Calculate size in BTC based on notional
    const notional = params.margin * params.leverage;
    const size = parseFloat((notional / midPrice).toFixed(4));

    try {
        // In this 'Ritual' mode, we're assuming the user has margin on HL already.
        // We trigger the signing request.
        const result = await hyperliquidService.placeOrder(params.signer, {
            isBuy: params.direction === 'LONG',
            size: size,
            limitPrice: parseFloat(limitPrice.toFixed(2))
        });

        // If successful, return the data to drive the UI
        return {
            entryPrice: midPrice,
            positionId: result.response?.data?.statuses?.[0]?.resting?.oid?.toString() || `hl-${Date.now()}`
        };
    } catch (e) {
        console.error("Hyperliquid placement failed:", e);
        throw e;
    }
  },

  closePosition: async (positionId: string): Promise<void> => {
    // Logic to close position via Hyperliquid cancel or opposite order
  }
};
