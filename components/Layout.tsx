
import React from 'react';
import { useRitualStore } from '../store';
import { RitualStatus } from '../types';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { context, setContext, setStatus } = useRitualStore();

  const handleDisconnect = () => {
    setContext({ walletAddress: null });
    setStatus(RitualStatus.DISCONNECTED);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-grid">
      <header className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-background/90 backdrop-blur-sm z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="size-8 flex items-center justify-center bg-primary text-white rounded-full shadow-[0_0_15px_rgba(205,43,238,0.5)]">
            <span className="text-xl">⚡</span>
          </div>
          <h2 className="text-white text-xl md:text-2xl font-black italic tracking-tighter uppercase">MEME RITUAL</h2>
        </div>
        
        <div className="flex items-center gap-4">
           {context.walletAddress && (
             <div className="hidden md:flex items-center gap-3 bg-black/60 border border-white/10 px-3 py-1.5 rounded-full font-mono text-[10px]">
               <span className="size-2 bg-success rounded-full animate-pulse shadow-[0_0_8px_#0bda7a]"></span>
               <span className="text-white/80">{context.walletAddress}</span>
               <button 
                onClick={handleDisconnect}
                className="ml-2 hover:text-failure transition-colors uppercase font-bold text-[8px] border-l border-white/20 pl-2"
               >
                 Unbind
               </button>
             </div>
           )}
           <div className="bg-primary/20 border border-primary text-primary px-3 py-1 rounded-full text-xs font-bold font-mono">
            V6.6.6-BETA
           </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-start p-4 md:p-8 relative z-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
      <footer className="p-4 text-center text-white/20 text-[10px] font-mono uppercase tracking-[0.2em]">
        Do not break the seal • Fate is non-refundable • {new Date().getFullYear()}
      </footer>
    </div>
  );
};
