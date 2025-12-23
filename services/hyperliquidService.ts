
import { ethers } from 'ethers';

const INFO_URL = 'https://api.hyperliquid.xyz/info';
const EXCHANGE_URL = 'https://api.hyperliquid.xyz/exchange';

// Hyperliquid BTC asset index is 0
const BTC_ASSET_INDEX = 0;

export const hyperliquidService = {
  getMeta: async () => {
    const response = await fetch(INFO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'meta' }),
    });
    return response.json();
  },

  getMidPrice: async (coin: string) => {
    const response = await fetch(INFO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'allMids' }),
    });
    const data = await response.json();
    return parseFloat(data[coin]);
  },

  getClearinghouseState: async (address: string) => {
    const response = await fetch(INFO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'clearinghouseState', user: address }),
    });
    return response.json();
  },

  // This is a simplified version of order placement for the ritual
  placeOrder: async (signer: ethers.JsonRpcSigner, params: {
    isBuy: boolean,
    size: number,
    limitPrice: number,
  }) => {
    const address = await signer.getAddress();
    const timestamp = Date.now();
    
    // Hyperliquid uses a specific EIP-712 domain for exchange actions
    const domain = {
      name: 'HyperliquidExchange',
      version: '1',
      chainId: 1337, // Hyperliquid L1 uses 1337 for signing purposes
      verifyingContract: '0x0000000000000000000000000000000000000000',
    };

    const action = {
      type: 'order',
      orders: [{
        a: BTC_ASSET_INDEX,
        b: params.isBuy,
        p: params.limitPrice.toString(),
        s: params.size.toString(),
        r: false, // Reduce only
        t: { limit: { tif: 'Gtc' } }, // Good till cancelled
      }],
      grouping: 'na',
    };

    // Note: In a production app, the 'action' hash calculation involves 
    // hashing the action JSON with the timestamp. 
    // Hyperliquid requires a specific signing format.
    // For this implementation, we simulate the structure.
    
    const signature = await signer.signTypedData(domain, {
      "Agent": [
        { name: "source", type: "string" },
        { name: "connectionId", type: "bytes32" }
      ]
    }, {
        source: "ritual_app",
        connectionId: ethers.randomBytes(32)
    });

    const body = {
      action,
      nonce: timestamp,
      signature,
    };

    const response = await fetch(EXCHANGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error("Exchange rejected order");
    }

    return response.json();
  }
};
