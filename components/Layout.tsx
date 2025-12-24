import React, { useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useAppStore } from '../store';
import { formatUsd, shortAddress } from '../utils';
import { ToastStack } from './Toast';
import { fetchUsdcBalance } from '../services/hyperliquid';

const navItems = [
  { label: '首页', route: '/' as const },
  { label: '下单', route: '/trade' as const },
  { label: '历史', route: '/history' as const },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const route = useAppStore((state) => state.route);
  const setRoute = useAppStore((state) => state.setRoute);
  const walletBalanceUsdc = useAppStore((state) => state.walletBalanceUsdc);
  const setWalletBalanceUsdc = useAppStore((state) => state.setWalletBalanceUsdc);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (!address || !isConnected) {
      setWalletBalanceUsdc(null);
      return;
    }
    fetchUsdcBalance(address)
      .then((balance) => setWalletBalanceUsdc(balance))
      .catch(() => setWalletBalanceUsdc(null));
  }, [address, isConnected, setWalletBalanceUsdc]);

  return (
    <div className="relative min-h-screen bg-grid text-white">
      <header className="sticky top-0 z-40 border-b-4 border-black bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-2xl shadow-[0_0_20px_rgba(205,43,238,0.8)]">
              🎰
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight font-display">LuckyTrade</h1>
              <p className="text-xs font-mono uppercase text-white/50">Daily BTC Divination</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.route}
                onClick={() => setRoute(item.route)}
                className={`rounded-full border-2 px-3 py-1 text-xs font-bold uppercase transition-all ${
                  route === item.route
                    ? 'border-primary bg-primary text-black shadow-[0_0_15px_rgba(205,43,238,0.8)]'
                    : 'border-white/10 bg-black/30 text-white/70 hover:border-primary/60 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {address && (
              <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-mono uppercase text-white/70 md:flex">
                {shortAddress(address)}
                <span className="h-3 w-px bg-white/20" />
                <span className="text-success">{walletBalanceUsdc === null ? 'USDC 加载中' : `${formatUsd(walletBalanceUsdc)} USDC`}</span>
              </span>
            )}
            <ConnectButton.Custom>
              {({ account, mounted, openConnectModal, openAccountModal }) => {
                const ready = mounted;
                const connected = ready && account;
                return (
                  <button
                    onClick={connected ? openAccountModal : openConnectModal}
                    className="rounded-full border-2 border-primary bg-black px-4 py-2 text-xs font-black uppercase text-primary shadow-[0_0_15px_rgba(205,43,238,0.6)] transition-all hover:scale-105"
                  >
                    {connected ? '钱包已连接' : '连接钱包'}
                  </button>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-white/10 py-6 text-center text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">
        Meme fortune only • 别当真 • {new Date().getFullYear()}
      </footer>
      <ToastStack />
    </div>
  );
};
