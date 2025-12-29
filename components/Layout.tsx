import React, { useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useWalletClient } from 'wagmi';
import { useAppStore } from '../store';
import { formatUsd, shortAddress } from '../utils';
import { ToastStack } from './Toast';
import { fetchUsdcBalance } from '../services/hyperliquid';
import { t } from '../i18n';
import { requestNonce, verifySignature } from '../services/api';

const navItems = [
  { key: 'trade', route: '/trade' as const },
  { key: 'history', route: '/history' as const },
  { key: 'leaderboard', route: '/leaderboard' as const },
];
const DEPOSIT_URL = 'https://app.hyperliquid.xyz/trade';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const route = useAppStore((state) => state.route);
  const setRoute = useAppStore((state) => state.setRoute);
  const walletBalanceUsdc = useAppStore((state) => state.walletBalanceUsdc);
  const setWalletBalanceUsdc = useAppStore((state) => state.setWalletBalanceUsdc);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const authToken = useAppStore((state) => state.authToken);
  const setAuthToken = useAppStore((state) => state.setAuthToken);
  const pushToast = useAppStore((state) => state.pushToast);
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors, isPending } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const authInFlight = useRef(false);

  useEffect(() => {
    if (!address || !isConnected) {
      setWalletBalanceUsdc(null);
      return;
    }
    fetchUsdcBalance(address)
      .then((balance) => setWalletBalanceUsdc(balance))
      .catch(() => setWalletBalanceUsdc(null));
  }, [address, isConnected, setWalletBalanceUsdc]);

  useEffect(() => {
    if (!address || !isConnected || !walletClient) return;
    if (authToken || authInFlight.current) return;
    authInFlight.current = true;
    requestNonce(address)
      .then(async ({ nonce, message }) => {
        const signature = await walletClient.signMessage({ account: address, message });
        return verifySignature(address, signature as `0x${string}`, nonce);
      })
      .then((payload) => {
        if (payload?.token) {
          setAuthToken(payload.token);
        }
      })
      .catch(() => {
        pushToast({ kind: 'error', message: t(language, 'toast.walletUnauthorized') });
      })
      .finally(() => {
        authInFlight.current = false;
      });
  }, [address, authToken, isConnected, language, pushToast, setAuthToken, walletClient]);

  return (
    <div className="relative min-h-screen bg-grid text-white">
      <header className="sticky top-0 z-40 border-b-4 border-black bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-2xl shadow-[0_0_20px_rgba(205,43,238,0.8)]">
              ⚔️
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight font-display">{t(language, 'header.brand')}</h1>
              <p className="text-xs font-mono uppercase text-white/50">{t(language, 'header.tagline')}</p>
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
                {t(language, `nav.${item.key}`)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {address && (
              <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-mono uppercase text-white/70 md:flex">
                {shortAddress(address)}
                <span className="h-3 w-px bg-white/20" />
                <span className="text-success">
                  {walletBalanceUsdc === null ? t(language, 'wallet.balanceLoading') : `${formatUsd(walletBalanceUsdc)} USDC`}
                </span>
              </span>
            )}
            <button
              onClick={() => window.open(DEPOSIT_URL, '_blank', 'noopener,noreferrer')}
              className="rounded-full border-2 border-white/20 bg-black/30 px-3 py-2 text-xs font-black uppercase text-white/80 transition-all hover:-translate-y-0.5 hover:border-white/60"
            >
              {t(language, 'wallet.deposit')}
            </button>
            <button
              onClick={async () => {
                if (isConnected) {
                  await disconnectAsync();
                  setAuthToken(null);
                  return;
                }
                const injected = connectors.find((connector) => connector.id === 'injected') ?? connectors[0];
                if (!injected) return;
                await connectAsync({ connector: injected });
              }}
              className="rounded-full border-2 border-primary bg-black px-4 py-2 text-xs font-black uppercase text-primary shadow-[0_0_15px_rgba(205,43,238,0.6)] transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
            >
              {isConnected ? t(language, 'wallet.connected') : isPending ? t(language, 'wallet.connecting') : t(language, 'wallet.connect')}
            </button>
            <div className="ml-1 flex items-center rounded-full border border-white/10 bg-black/40 p-1 text-[10px] font-bold uppercase text-white/70">
              {(['zh', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`rounded-full px-2 py-1 transition-all ${
                    language === lang ? 'bg-primary text-black shadow-[0_0_10px_rgba(205,43,238,0.6)]' : 'text-white/70'
                  }`}
                >
                  {lang === 'zh' ? '中' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-white/10 py-6 text-center text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">
        {t(language, 'footer.disclaimer', { year: new Date().getFullYear() })}
      </footer>
      <ToastStack />
    </div>
  );
};
