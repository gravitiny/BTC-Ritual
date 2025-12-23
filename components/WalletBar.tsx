
import React from 'react';
import { useRitualStore } from '../store';
import { RitualStatus } from '../types';

export const WalletBar: React.FC = () => {
  const { context, setContext, setStatus } = useRitualStore();

  const connectWallet = () => {
    // Mock wallet connection
    const mockAddr = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    setContext({ walletAddress: mockAddr });
    setStatus(RitualStatus.READY);
  };

  return (
    <div className="w-full flex justify-center mb-8">
      {!context.walletAddress ? (
        <button 
          onClick={connectWallet}
          className="bg-primary text-white font-black px-8 py-4 rounded-xl shadow-brutalist border-2 border-black hover:scale-105 transition-transform uppercase italic"
        >
          Connect Soul Wallet
        </button>
      ) : (
        <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-full font-mono text-xs flex items-center gap-3">
          <span className="text-success">●</span>
          <span>{context.walletAddress}</span>
        </div>
      )}
    </div>
  );
};
