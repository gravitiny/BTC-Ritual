

# LuckyTrade (Daily BTC Divination)

Meme-flavored BTC divination prototype with mock execution, price simulation, and local history.

## Run Locally

**Prerequisites:** Node.js + pnpm

1. Install dependencies: `pnpm install`
2. Set WalletConnect Project ID: `VITE_WALLETCONNECT_PROJECT_ID=...` in `.env.local`
3. The app will prompt to add/switch to a signing network named `HL Signer` (chainId 1337) for Hyperliquid order signatures.
4. Start dev server: `pnpm dev`
