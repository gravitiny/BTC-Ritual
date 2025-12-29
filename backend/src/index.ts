import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './lib/env';
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

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.frontendOrigin,
  credentials: true,
});

app.addHook('preHandler', async (request) => {
  if (request.url.startsWith('/auth') || request.url.startsWith('/leaderboard')) return;
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    throw app.httpErrors.unauthorized('Missing token');
  }
  const token = auth.replace('Bearer ', '');
  const payload = verifyToken(token);
  request.user = payload;
});

registerAuthRoutes(app);
registerTradeRoutes(app);
registerLeaderboardRoutes(app);
registerShareRoutes(app);

app.get('/health', async () => ({ ok: true }));

await app.listen({ port: env.port, host: '0.0.0.0' });
