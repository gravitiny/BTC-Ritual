import { defineChain } from 'viem';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { arbitrum, mainnet } from 'wagmi/chains';

const hlSigner = defineChain({
  id: 1337,
  name: 'HL Signer',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.ankr.com/eth'] } },
  blockExplorers: { default: { name: 'Etherscan', url: 'https://etherscan.io' } },
});

const chains = [mainnet, arbitrum, hlSigner] as const;

if (typeof window !== 'undefined') {
  const keys = Object.keys(window.localStorage);
  for (const key of keys) {
    if (key.includes('walletconnect') || key.startsWith('wc@')) {
      window.localStorage.removeItem(key);
    }
  }
}

export const wagmiConfig = createConfig({
  chains,
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [hlSigner.id]: http('https://rpc.ankr.com/eth'),
  },
  ssr: false,
});
