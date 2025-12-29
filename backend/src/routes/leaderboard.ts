import { FastifyInstance } from 'fastify';
import { getChampionBoard, getWinRateBoard } from '../lib/leaderboard';

export const registerLeaderboardRoutes = (app: FastifyInstance) => {
  app.get('/leaderboard', async (request) => {
    const { type } = request.query as { type?: 'champions' | 'winrate' | 'clown' };
    if (type === 'winrate') {
      return getWinRateBoard('winrate');
    }
    if (type === 'clown') {
      return getWinRateBoard('clown');
    }
    return getChampionBoard();
  });
};
