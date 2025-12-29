import { FastifyInstance } from 'fastify';
import { buildSignMessage, clearNonce, createNonce, signToken, verifyNonce, verifySignature } from '../lib/auth';
import { supabase } from '../lib/supabase';

export const registerAuthRoutes = (app: FastifyInstance) => {
  app.post('/auth/nonce', async (request) => {
    const { address } = request.body as { address: string };
    if (!address) {
      return { error: 'Missing address' };
    }
    const nonce = createNonce(address);
    const message = buildSignMessage(address, nonce);
    return { nonce, message };
  });

  app.post('/auth/verify', async (request) => {
    const { address, signature, nonce } = request.body as {
      address: string;
      signature: `0x${string}`;
      nonce: string;
    };
    if (!address || !signature || !nonce) {
      return { error: 'Missing params' };
    }
    if (!verifyNonce(address, nonce)) {
      return { error: 'Invalid nonce' };
    }
    const message = buildSignMessage(address, nonce);
    const ok = await verifySignature(address, message, signature);
    if (!ok) {
      return { error: 'Invalid signature' };
    }
    clearNonce(address);

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', address.toLowerCase())
      .maybeSingle();

    let userId = existing?.id;
    if (!userId) {
      const { data, error } = await supabase
        .from('users')
        .insert({ wallet_address: address.toLowerCase() })
        .select('id')
        .single();
      if (error) {
        return { error: error.message };
      }
      userId = data.id;
    }

    const token = signToken({ userId, address: address.toLowerCase() });
    return { token, userId };
  });
};
