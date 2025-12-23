
import { create } from 'zustand';
import { RitualStatus, RitualStore, RitualContext } from './types';

const initialContext: RitualContext = {
  walletAddress: null,
  direction: null,
  targetProfitUSDT: 10,
  entryPrice: null,
  currentPrice: null,
  liqPrice: null,
  targetPrice: null,
  startedAt: null,
  endedAt: null,
  omen: 'Seeking omens...',
  whisper: 'Awaiting the whisper...',
};

export const useRitualStore = create<RitualStore>((set) => ({
  status: RitualStatus.DISCONNECTED,
  context: initialContext,
  setStatus: (status) => set({ status }),
  setContext: (update) => set((state) => ({ 
    context: { ...state.context, ...update } 
  })),
  reset: () => set({ status: RitualStatus.READY, context: { ...initialContext } }),
}));
