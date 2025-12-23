
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen flex flex-col bg-grid">
      <header className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-background/90 backdrop-blur-sm z-50">
        <div className="flex items-center gap-3">
          <div className="size-8 flex items-center justify-center bg-primary text-white rounded-full">
            <span className="text-xl">⚡</span>
          </div>
          <h2 className="text-white text-xl md:text-2xl font-black italic tracking-tighter uppercase">MEME RITUAL</h2>
        </div>
        <div className="flex gap-2">
           <div className="bg-primary/20 border border-primary text-primary px-3 py-1 rounded-full text-xs font-bold font-mono">
            V6.6.6-BETA
           </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-start p-4 md:p-8 relative z-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
      <footer className="p-4 text-center text-white/20 text-[10px] font-mono uppercase tracking-[0.2em]">
        Do not break the seal • Fate is non-refundable
      </footer>
    </div>
  );
};
