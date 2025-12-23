
import React, { useState } from 'react';
import { useRitualStore } from '../store';
import { RitualStatus } from '../types';

export const WalletBar: React.FC = () => {
  const { setContext, setStatus } = useRitualStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = () => {
    setIsConnecting(true);
    
    // Simulate a "soul connection" handshake
    setTimeout(() => {
      const mockAddr = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
      setContext({ walletAddress: mockAddr });
      setStatus(RitualStatus.READY);
      setIsConnecting(false);
    }, 1500);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <button 
        disabled={isConnecting}
        onClick={connectWallet}
        className={`group relative overflow-hidden bg-primary text-white font-black px-12 py-5 rounded-2xl shadow-brutalist border-4 border-black transition-all hover:scale-105 active:translate-y-1 uppercase italic text-xl ${
          isConnecting ? 'opacity-90 cursor-wait' : 'hover:shadow-[0_0_30px_rgba(205,43,238,0.4)]'
        }`}
      >
        <span className="relative z-10 flex items-center gap-3">
          {isConnecting ? (
            <>
              <span className="size-5 border-4 border-white border-t-transparent rounded-full animate-spin"></span>
              Binding Soul...
            </>
          ) : (
            <>
              Connect Soul Wallet 🧿
            </>
          )}
        </span>
        {!isConnecting && (
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        )}
      </button>
      
      <p className="mt-6 text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] animate-pulse">
        {isConnecting ? "Synchronizing with the Great Chain..." : "Awaiting your signature on the void"}
      </p>
    </div>
  );
};
