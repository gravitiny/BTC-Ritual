import jwt from 'jsonwebtoken';
import { recoverMessageAddress } from 'viem';
import { env } from './env';

export type AuthPayload = {
  userId: string;
  address: string;
};

const nonces = new Map<string, string>();

export const createNonce = (address: string) => {
  const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  nonces.set(address.toLowerCase(), nonce);
  return nonce;
};

export const verifyNonce = (address: string, nonce: string) => {
  const stored = nonces.get(address.toLowerCase());
  return stored === nonce;
};

export const clearNonce = (address: string) => {
  nonces.delete(address.toLowerCase());
};

export const buildSignMessage = (address: string, nonce: string) => {
  return `LuckyTrade login\nAddress: ${address}\nNonce: ${nonce}`;
};

export const verifySignature = async (address: string, message: string, signature: `0x${string}`) => {
  const recovered = await recoverMessageAddress({ message, signature });
  return recovered.toLowerCase() === address.toLowerCase();
};

export const signToken = (payload: AuthPayload) => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.jwtSecret) as AuthPayload;
};
