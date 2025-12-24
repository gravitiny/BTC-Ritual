import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import { arbitrum, mainnet } from 'wagmi/chains';

const hlSigner = defineChain({
  id: 1337,
  name: 'HL Signer',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.ankr.com/eth'] } },
  blockExplorers: { default: { name: 'Etherscan', url: 'https://etherscan.io' } },
});

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('Missing VITE_WALLETCONNECT_PROJECT_ID. WalletConnect may not work.');
}

export const wagmiConfig = getDefaultConfig({
  appName: 'LuckyTrade',
  projectId,
  chains: [mainnet, arbitrum, hlSigner],
  ssr: false,
});
