import { encode } from '@msgpack/msgpack';
import { ethers, getBytes, keccak256 } from 'ethers';
import type { WalletClient } from 'viem';

const API_URL = 'https://api.hyperliquid.xyz';
const IS_MAINNET = true;
const COIN_SYMBOL = 'BTC';
const PERP_SYMBOL = 'BTC-PERP';

const phantomDomain = {
  name: 'Exchange',
  version: '1',
  chainId: 1337,
  verifyingContract: '0x0000000000000000000000000000000000000000',
};

const agentTypes = {
  Agent: [
    { name: 'source', type: 'string' },
    { name: 'connectionId', type: 'bytes32' },
  ],
} as const;

const PHANTOM_CHAIN_ID = 1337;

const addressToBytes = (address: string) => getBytes(address);

const normalizeTrailingZeros = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => normalizeTrailingZeros(item));
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (value && typeof value === 'object') {
      result[key] = normalizeTrailingZeros(value);
    } else if ((key === 'p' || key === 's') && typeof value === 'string') {
      result[key] = value.replace(/\.?0+$/, '');
    }
  }
  return result;
};

const actionHash = (action: unknown, vaultAddress: string | null, nonce: number) => {
  const normalizedAction = normalizeTrailingZeros(action);
  const msgPackBytes = encode(normalizedAction);
  const additionalBytesLength = vaultAddress === null ? 9 : 29;
  const data = new Uint8Array(msgPackBytes.length + additionalBytesLength);
  data.set(msgPackBytes);
  const view = new DataView(data.buffer);
  view.setBigUint64(msgPackBytes.length, BigInt(nonce), false);
  if (vaultAddress === null) {
    view.setUint8(msgPackBytes.length + 8, 0);
  } else {
    view.setUint8(msgPackBytes.length + 8, 1);
    data.set(addressToBytes(vaultAddress), msgPackBytes.length + 9);
  }
  return keccak256(data);
};

const floatToWire = (value: number) => {
  const rounded = value.toFixed(8);
  let normalized = rounded.replace(/\.?0+$/, '');
  if (normalized === '-0') normalized = '0';
  return normalized;
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

let cachedAssetIndex: number | null = null;

const getAssetIndex = async () => {
  if (cachedAssetIndex !== null) return cachedAssetIndex;
  const meta = await postInfo<any>({ type: 'meta' });
  const universe = meta?.[0]?.universe ?? [];
  const index = universe.findIndex((asset: { name: string }) => asset.name === COIN_SYMBOL);
  if (index < 0) {
    throw new Error(`Asset ${COIN_SYMBOL} not found in meta`);
  }
  cachedAssetIndex = index;
  return index;
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

export const placeMarketOrder = async (params: {
  walletClient: WalletClient;
  address: string;
  isBuy: boolean;
  size: number;
  referencePrice: number;
  originalChainId?: number;
}) => {
  const { walletClient, address, isBuy, size, referencePrice, originalChainId } = params;
  const assetIndex = await getAssetIndex();
  const limitPx = referencePrice * (isBuy ? 1.005 : 0.995);
  const action = {
    type: 'order',
    orders: [
      {
        a: assetIndex,
        b: isBuy,
        p: floatToWire(limitPx),
        s: floatToWire(size),
        r: false,
        t: { limit: { tif: 'Ioc' } },
      },
    ],
    grouping: 'na',
  };
  const nonce = Date.now();
  const hash = actionHash(action, null, nonce);
  const phantomAgent = { source: IS_MAINNET ? 'a' : 'b', connectionId: hash };
  const signerChain = await ensurePhantomChain(walletClient);
  const restoreId = originalChainId ?? signerChain.originalChainId;
  let signatureHex = '';
  try {
    signatureHex = await walletClient.signTypedData({
      account: address as `0x${string}`,
      domain: phantomDomain,
      types: agentTypes,
      primaryType: 'Agent',
      message: phantomAgent,
    });
  } finally {
    if (restoreId !== PHANTOM_CHAIN_ID) {
      await restoreChain(walletClient, restoreId);
    }
  }
  const { r, s, v } = ethers.Signature.from(signatureHex);

  return postExchange<any>({
    action,
    nonce,
    signature: { r, s, v },
    vaultAddress: null,
  });
};

export const cancelOrder = async (params: {
  walletClient: WalletClient;
  address: string;
  orderId: number;
}) => {
  const { walletClient, address, orderId } = params;
  const assetIndex = await getAssetIndex();
  const action = {
    type: 'cancel',
    cancels: [{ a: assetIndex, o: orderId }],
  };
  const nonce = Date.now();
  const hash = actionHash(action, null, nonce);
  const phantomAgent = { source: IS_MAINNET ? 'a' : 'b', connectionId: hash };
  const { originalChainId, switched } = await ensurePhantomChain(walletClient);
  let signatureHex = '';
  try {
    signatureHex = await walletClient.signTypedData({
      account: address as `0x${string}`,
      domain: phantomDomain,
      types: agentTypes,
      primaryType: 'Agent',
      message: phantomAgent,
    });
  } finally {
    if (switched) {
      await restoreChain(walletClient, originalChainId);
    }
  }
  const { r, s, v } = ethers.Signature.from(signatureHex);

  return postExchange<any>({
    action,
    nonce,
    signature: { r, s, v },
    vaultAddress: null,
  });
};

export const getCoinSymbol = () => COIN_SYMBOL;
export const getPerpSymbol = () => PERP_SYMBOL;
