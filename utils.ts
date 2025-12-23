
import { LEVERAGE } from './constants';

export const formatPrice = (price: number | null) => {
  if (price === null) return "$0.00";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const calculateLiqPrice = (entryPrice: number, direction: 'LONG' | 'SHORT') => {
  // “This liquidation price is an approximation for ritual UX, not an exchange-accurate formula.”
  if (direction === 'LONG') {
    return entryPrice * (1 - 1 / LEVERAGE);
  } else {
    return entryPrice * (1 + 1 / LEVERAGE);
  }
};

export const calculateTargetPrice = (entryPrice: number, direction: 'LONG' | 'SHORT', targetProfit: number, notional: number) => {
  const positionSizeBTC = notional / entryPrice;
  if (direction === 'LONG') {
    return entryPrice + targetProfit / positionSizeBTC;
  } else {
    return entryPrice - targetProfit / positionSizeBTC;
  }
};
