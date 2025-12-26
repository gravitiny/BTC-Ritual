import { formatPrice, formatSize } from '@nktkas/hyperliquid/utils';
import { signL1Action } from '@nktkas/hyperliquid/signing';
import type { WalletClient } from 'viem';

const API_URL = 'https://api.hyperliquid.xyz';
const IS_MAINNET = true;
const COIN_SYMBOL = 'BTC';
const PERP_SYMBOL = 'BTC-PERP';

const PHANTOM_CHAIN_ID = 1337;
const DEFAULT_SLIPPAGE = 0.05;
const PERP_PRICE_DECIMALS = 6;

const roundToSig = (value: number, sig = 5) => Number(Number(value).toPrecision(sig));

const roundToDecimals = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const slippagePrice = (price: number, isBuy: boolean, slippage = DEFAULT_SLIPPAGE) => {
  const adjusted = price * (isBuy ? 1 + slippage : 1 - slippage);
  const roundedSig = roundToSig(adjusted, 5);
  return roundToDecimals(roundedSig, PERP_PRICE_DECIMALS);
};

const toHexChainId = (id: number) => `0x${id.toString(16)}`;

const getRequest = (walletClient: WalletClient) => {
  const transportRequest = (walletClient as any)?.transport?.request;
  if (transportRequest) return transportRequest.bind((walletClient as any).transport);
  const injected = (globalThis as any)?.ethereum?.request;
  if (injected) return injected.bind((globalThis as any).ethereum);
  throw new Error('No wallet request handler available');
};

const ensurePhantomChain = async (walletClient: WalletClient) => {
  const originalChainId = await walletClient.getChainId();
  if (originalChainId === PHANTOM_CHAIN_ID) {
    return { originalChainId, switched: false };
  }
  const request = getRequest(walletClient);
  try {
    await request({ method: 'eth_requestAccounts' });
    await request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: toHexChainId(PHANTOM_CHAIN_ID) }],
    });
    return { originalChainId, switched: true };
  } catch (error: any) {
    if (error?.code === 4902) {
      await request({ method: 'eth_requestAccounts' });
      await request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: toHexChainId(PHANTOM_CHAIN_ID),
            chainName: 'HL Signer',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.ankr.com/eth'],
            blockExplorerUrls: ['https://etherscan.io'],
          },
        ],
      });
      await request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: toHexChainId(PHANTOM_CHAIN_ID) }],
      });
      return { originalChainId, switched: true };
    }
    throw error;
  }
};

const restoreChain = async (walletClient: WalletClient, originalChainId: number) => {
  if (originalChainId === PHANTOM_CHAIN_ID) return;
  try {
    const request = getRequest(walletClient);
    await request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: toHexChainId(originalChainId) }],
    });
  } catch (error) {
    // If switch back fails, user can manually change; avoid blocking order flow.
  }
};

export const prepareSignerChain = async (walletClient: WalletClient) => {
  const originalChainId = await walletClient.getChainId();
  await ensurePhantomChain(walletClient);
  return originalChainId;
};

const postInfo = async <T>(payload: any): Promise<T> => {
  const response = await fetch(`${API_URL}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Info request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

const postExchange = async <T>(payload: any): Promise<T> => {
  const response = await fetch(`${API_URL}/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Exchange request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

let cachedAssetInfo: { index: number; szDecimals: number } | null = null;

const getAssetInfo = async () => {
  if (cachedAssetInfo !== null) return cachedAssetInfo;
  const meta = await postInfo<any>({ type: 'meta' });
  const universe = meta?.universe ?? meta?.[0]?.universe ?? [];
  const index = universe.findIndex((asset: { name: string }) => asset.name === COIN_SYMBOL);
  if (index < 0) {
    throw new Error(`Asset ${COIN_SYMBOL} not found in meta`);
  }
  const szDecimals = Number(universe[index]?.szDecimals ?? 0);
  cachedAssetInfo = { index, szDecimals: Number.isFinite(szDecimals) ? szDecimals : 0 };
  return cachedAssetInfo;
};

const createWalletAdapter = (walletClient: WalletClient, address: string) => {
  return {
    signTypedData: (params: any) =>
      walletClient.signTypedData({
        ...params,
        account: address as `0x${string}`,
      }),
    getAddresses: async () => [address as `0x${string}`],
    getChainId: async () => walletClient.getChainId(),
  };
};

export const getAllMids = async () => postInfo<Record<string, string>>({ type: 'allMids' });

export const getCandleSnapshot = async (startTime: number, endTime: number, interval = '1m') => {
  return postInfo<any>({
    type: 'candleSnapshot',
    req: {
      coin: COIN_SYMBOL,
      interval,
      startTime,
      endTime,
    },
  });
};

export const getClearinghouseState = async (address: string) => {
  return postInfo<any>({ type: 'clearinghouseState', user: address });
};

export const fetchUsdcBalance = async (address: string) => {
  const state = await getClearinghouseState(address);
  const withdrawable = Number(state?.withdrawable ?? 0);
  return Number.isFinite(withdrawable) ? withdrawable : 0;
};

export const fetchPositionSize = async (address: string) => {
  const state = await getClearinghouseState(address);
  const positions = state?.assetPositions ?? [];
  const match = positions.find((item: any) => item?.position?.coin === COIN_SYMBOL);
  const rawSize = match?.position?.szi ?? '0';
  const size = Number(rawSize);
  return Number.isFinite(size) ? size : 0;
};

export const placeMarketOrder = async (params: {
  walletClient: WalletClient;
  address: string;
  isBuy: boolean;
  size: number;
  referencePrice: number;
  originalChainId?: number;
}) => {
  const { walletClient, address, isBuy, size, referencePrice, originalChainId } = params;
  const assetInfo = await getAssetInfo();
  const limitPx = slippagePrice(referencePrice, isBuy);
  const limitPxWire = formatPrice(limitPx, assetInfo.szDecimals, 'perp');
  const sizeWire = formatSize(size, assetInfo.szDecimals);
  const action = {
    type: 'order',
    orders: [
      {
        a: assetInfo.index,
        b: isBuy,
        p: limitPxWire,
        s: sizeWire,
        r: false,
        t: { limit: { tif: 'Ioc' } },
      },
    ],
    grouping: 'na',
  };
  const nonce = Date.now();
  const signerChain = await ensurePhantomChain(walletClient);
  const restoreId = originalChainId ?? signerChain.originalChainId;
  const wallet = createWalletAdapter(walletClient, address);
  let signature;
  try {
    signature = await signL1Action({
      wallet,
      action,
      nonce,
      isTestnet: !IS_MAINNET,
    });
  } finally {
    if (restoreId !== PHANTOM_CHAIN_ID) {
      await restoreChain(walletClient, restoreId);
    }
  }
  return postExchange<any>({
    action,
    nonce,
    signature,
    vaultAddress: null,
  });
};

export const placeMarketOrderWithTakeProfit = async (params: {
  walletClient: WalletClient;
  address: string;
  isBuy: boolean;
  size: number;
  referencePrice: number;
  takeProfitPrice: number;
  originalChainId?: number;
}) => {
  const { walletClient, address, isBuy, size, referencePrice, takeProfitPrice, originalChainId } = params;
  const assetInfo = await getAssetInfo();
  const limitPx = slippagePrice(referencePrice, isBuy);
  const limitPxWire = formatPrice(limitPx, assetInfo.szDecimals, 'perp');
  const sizeWire = formatSize(size, assetInfo.szDecimals);
  const triggerPxWire = formatPrice(takeProfitPrice, assetInfo.szDecimals, 'perp');
  const action = {
    type: 'order',
    orders: [
      {
        a: assetInfo.index,
        b: isBuy,
        p: limitPxWire,
        s: sizeWire,
        r: false,
        t: { limit: { tif: 'Ioc' } },
      },
      {
        a: assetInfo.index,
        b: !isBuy,
        p: triggerPxWire,
        s: sizeWire,
        r: true,
        t: { limit: { tif: 'Gtc' } },
      },
    ],
    grouping: 'na',
  };
  const nonce = Date.now();
  const signerChain = await ensurePhantomChain(walletClient);
  const restoreId = originalChainId ?? signerChain.originalChainId;
  const wallet = createWalletAdapter(walletClient, address);
  let signature;
  try {
    signature = await signL1Action({
      wallet,
      action,
      nonce,
      isTestnet: !IS_MAINNET,
    });
  } finally {
    if (restoreId !== PHANTOM_CHAIN_ID) {
      await restoreChain(walletClient, restoreId);
    }
  }
  return postExchange<any>({
    action,
    nonce,
    signature,
    vaultAddress: null,
  });
};

export const cancelOrder = async (params: {
  walletClient: WalletClient;
  address: string;
  orderId: number;
}) => {
  const { walletClient, address, orderId } = params;
  const assetInfo = await getAssetInfo();
  const action = {
    type: 'cancel',
    cancels: [{ a: assetInfo.index, o: orderId }],
  };
  const nonce = Date.now();
  const { originalChainId, switched } = await ensurePhantomChain(walletClient);
  const wallet = createWalletAdapter(walletClient, address);
  let signature;
  try {
    signature = await signL1Action({
      wallet,
      action,
      nonce,
      isTestnet: !IS_MAINNET,
    });
  } finally {
    if (switched) {
      await restoreChain(walletClient, originalChainId);
    }
  }

  return postExchange<any>({
    action,
    nonce,
    signature,
    vaultAddress: null,
  });
};

export const closePositionMarket = async (params: {
  walletClient: WalletClient;
  address: string;
  referencePrice: number;
  positionSize: number;
  originalChainId?: number;
}) => {
  const { walletClient, address, referencePrice, positionSize, originalChainId } = params;
  if (!Number.isFinite(positionSize) || positionSize === 0) {
    return null;
  }
  const assetInfo = await getAssetInfo();
  const isBuy = positionSize < 0;
  const size = Math.abs(positionSize);
  const limitPx = slippagePrice(referencePrice, isBuy);
  const limitPxWire = formatPrice(limitPx, assetInfo.szDecimals, 'perp');
  const sizeWire = formatSize(size, assetInfo.szDecimals);
  const action = {
    type: 'order',
    orders: [
      {
        a: assetInfo.index,
        b: isBuy,
        p: limitPxWire,
        s: sizeWire,
        r: true,
        t: { limit: { tif: 'Ioc' } },
      },
    ],
    grouping: 'na',
  };
  const nonce = Date.now();
  const signerChain = await ensurePhantomChain(walletClient);
  const restoreId = originalChainId ?? signerChain.originalChainId;
  const wallet = createWalletAdapter(walletClient, address);
  let signature;
  try {
    signature = await signL1Action({
      wallet,
      action,
      nonce,
      isTestnet: !IS_MAINNET,
    });
  } finally {
    if (restoreId !== PHANTOM_CHAIN_ID) {
      await restoreChain(walletClient, restoreId);
    }
  }
  return postExchange<any>({
    action,
    nonce,
    signature,
    vaultAddress: null,
  });
};

export const placeTakeProfitOrder = async (params: {
  walletClient: WalletClient;
  address: string;
  triggerPrice: number;
  positionSize: number;
  originalChainId?: number;
}) => {
  const { walletClient, address, triggerPrice, positionSize, originalChainId } = params;
  if (!Number.isFinite(positionSize) || positionSize === 0) {
    return null;
  }
  const assetInfo = await getAssetInfo();
  const isBuy = positionSize < 0;
  const size = Math.abs(positionSize);
  const triggerPxWire = formatPrice(triggerPrice, assetInfo.szDecimals, 'perp');
  const sizeWire = formatSize(size, assetInfo.szDecimals);
  const action = {
    type: 'order',
    orders: [
      {
        a: assetInfo.index,
        b: isBuy,
        p: triggerPxWire,
        s: sizeWire,
        r: true,
        t: { trigger: { isMarket: true, triggerPx: triggerPxWire, tpsl: 'tp' } },
      },
    ],
    grouping: 'na',
  };
  const nonce = Date.now();
  const signerChain = await ensurePhantomChain(walletClient);
  const restoreId = originalChainId ?? signerChain.originalChainId;
  const wallet = createWalletAdapter(walletClient, address);
  let signature;
  try {
    signature = await signL1Action({
      wallet,
      action,
      nonce,
      isTestnet: !IS_MAINNET,
    });
  } finally {
    if (restoreId !== PHANTOM_CHAIN_ID) {
      await restoreChain(walletClient, restoreId);
    }
  }
  return postExchange<any>({
    action,
    nonce,
    signature,
    vaultAddress: null,
  });
};

export const getCoinSymbol = () => COIN_SYMBOL;
export const getPerpSymbol = () => PERP_SYMBOL;
