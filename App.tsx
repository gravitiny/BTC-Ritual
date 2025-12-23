
import React, { useEffect } from 'react';
import { useRitualStore } from './store';
import { RitualStatus } from './types';
import { Layout } from './components/Layout';
import { WalletBar } from './components/WalletBar';
import { OmenCard } from './components/OmenCard';
import { RitualForm } from './components/RitualForm';
import { LiveRitual } from './components/LiveRitual';
import { ResultView } from './components/ResultView';

const App: React.FC = () => {
  const { status, context, setStatus, setContext } = useRitualStore();

  useEffect(() => {
    // Basic LocalStorage Lock Enforcement
    const today = new Date().toISOString().split('T')[0];
    const ritualKey = `ritual-lock-${today}`;
    const hasPerformed = localStorage.getItem(ritualKey);

    // If we're in real mode, we'd check the chain. 
    // In mock mode, we just check local storage.
    // (Disabled for development convenience but structure exists)
  }, []);

  const renderContent = () => {
    switch (status) {
      case RitualStatus.DISCONNECTED:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
            <div className="space-y-4">
               <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase drop-shadow-brutalist">
                Daily BTC<br/>
                <span className="text-primary bg-white px-4 text-black rotate-2 inline-block">Luck</span> Ritual
               </h1>
               <p className="text-white/40 font-mono text-sm tracking-widest uppercase italic">Est. 2024 • Do Not Fades</p>
            </div>
            <WalletBar />
          </div>
        );
      case RitualStatus.READY:
        return (
          <>
            <OmenCard />
            <RitualForm />
          </>
        );
      case RitualStatus.OPENING:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="text-9xl animate-spin">🔮</div>
            <h2 className="text-4xl font-black italic uppercase animate-pulse">Consulting the Blockchain...</h2>
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
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-black text-failure">SYSTEM ERROR 💀</h1>
            <p>The vibes were too chaotic for the network to handle.</p>
            <button onClick={() => setStatus(RitualStatus.READY)} className="bg-primary px-8 py-4 rounded-xl font-bold">Retry Ritual</button>
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
