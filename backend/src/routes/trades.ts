import { FastifyInstance } from 'fastify';
import { supabase } from '../lib/supabase';

export const registerTradeRoutes = (app: FastifyInstance) => {
  app.post('/trades', async (request) => {
    const user = request.user as { userId: string };
    const payload = request.body as Record<string, any>;
    const { data, error } = await supabase
      .from('trades')
      .insert({
        user_id: user.userId,
        ...payload,
      })
      .select('*')
      .single();
    if (error) {
      return { error: error.message };
    }
    return data;
  });

  app.patch('/trades/:id', async (request) => {
    const user = request.user as { userId: string };
    const { id } = request.params as { id: string };
    const payload = request.body as Record<string, any>;
    const { data, error } = await supabase
      .from('trades')
      .update({ ...payload })
      .eq('id', id)
      .eq('user_id', user.userId)
      .select('*')
      .single();
    if (error) {
      return { error: error.message };
    }
    return data;
  });

  app.get('/trades', async (request) => {
    const user = request.user as { userId: string };
    const { status, cursor, limit } = request.query as { status?: string; cursor?: string; limit?: string };
    let query = supabase.from('trades').select('*').eq('user_id', user.userId).order('started_at', { ascending: false });
    if (status) {
      query = query.eq('status', status);
    }
    if (cursor) {
      query = query.lt('started_at', cursor);
    }
    const { data, error } = await query.limit(Number(limit ?? 50));
    if (error) {
      return { error: error.message };
    }
    return data ?? [];
  });
};
