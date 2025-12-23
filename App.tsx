
import React from 'react';
import { useRitualStore } from './store';
import { RitualStatus } from './types';
import { Layout } from './components/Layout';
import { OmenCard } from './components/OmenCard';
import { RitualForm } from './components/RitualForm';
import { LiveRitual } from './components/LiveRitual';
import { ResultView } from './components/ResultView';

const App: React.FC = () => {
  const { status, setStatus } = useRitualStore();

  const renderContent = () => {
    switch (status) {
      case RitualStatus.READY:
      case RitualStatus.DISCONNECTED: // Handle both as the main form now
        return (
          <div className="w-full animate-in slide-in-from-bottom-8 fade-in duration-500">
            <OmenCard />
            <RitualForm />
          </div>
        );
      case RitualStatus.OPENING:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-pulse">
            <div className="relative">
              <div className="text-9xl animate-[spin_3s_linear_infinite]">🔮</div>
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
            </div>
            <div className="space-y-2 text-center">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter">Summoning Liquidity...</h2>
              <p className="font-mono text-xs text-white/40 uppercase">Consulting the block hash of destiny</p>
            </div>
          </div>
        );
      case RitualStatus.LIVE:
        return <LiveRitual />;
      case RitualStatus.SUCCESS:
      case RitualStatus.FAIL:
      case RitualStatus.STOPPED:
        return <ResultView />;
      case RitualStatus.ERROR:
        return (
          <div className="text-center space-y-8 py-20">
            <div className="text-8xl">⚠️</div>
            <h1 className="text-6xl font-black text-failure uppercase italic">Ritual Rejected</h1>
            <p className="max-w-md mx-auto font-mono text-sm opacity-60 uppercase">The connection between your soul and the exchange has been severed by cosmic noise.</p>
            <button 
              onClick={() => setStatus(RitualStatus.READY)} 
              className="bg-white text-black px-10 py-4 rounded-xl font-black uppercase italic shadow-brutalist hover:scale-105 transition-all"
            >
              Re-ignite Altar
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
};

export default App;
