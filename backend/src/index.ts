import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env, getAllowedOrigins } from './lib/env';
import { registerAuthRoutes } from './routes/auth';
import { registerTradeRoutes } from './routes/trades';
import { registerLeaderboardRoutes } from './routes/leaderboard';
import { registerShareRoutes } from './routes/share';
import { verifyToken } from './lib/auth';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      address: string;
    };
  }
}

const app = Fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 });

const allowedOrigins = getAllowedOrigins();

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
      return;
    }
    cb(new Error('Not allowed'), false);
  },
  credentials: true,
});

app.addHook('preHandler', async (request, reply) => {
  if (request.url.startsWith('/auth') || request.url.startsWith('/leaderboard')) return;
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing token' });
    return;
  }
  const token = auth.replace('Bearer ', '');
  try {
    const payload = verifyToken(token);
    request.user = payload;
  } catch {
    reply.code(401).send({ error: 'Invalid token' });
  }
});

registerAuthRoutes(app);
registerTradeRoutes(app);
registerLeaderboardRoutes(app);
registerShareRoutes(app);

app.get('/health', async () => ({ ok: true }));

await app.listen({ port: env.port, host: '0.0.0.0' });
