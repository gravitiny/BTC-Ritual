import { FastifyInstance } from 'fastify';
import { TwitterApi } from 'twitter-api-v2';
import { env, hasTwitterConfig } from '../lib/env';

export const registerShareRoutes = (app: FastifyInstance) => {
  app.post('/share/twitter', async (request) => {
    if (!hasTwitterConfig()) {
      return { error: 'Twitter API not configured' };
    }
    const { text, imageDataUrl } = request.body as { text?: string; imageDataUrl?: string };
    if (!text) {
      return { error: 'Missing text' };
    }
    const client = new TwitterApi({
      appKey: env.twitter.apiKey,
      appSecret: env.twitter.apiSecret,
      accessToken: env.twitter.accessToken,
      accessSecret: env.twitter.accessTokenSecret,
    });

    let mediaId: string | undefined;
    if (imageDataUrl) {
      const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
      mediaId = await client.v1.uploadMedia(Buffer.from(base64, 'base64'), { mimeType: 'image/png' });
    }

    const tweet = await client.v2.tweet({
      text,
      ...(mediaId ? { media: { media_ids: [mediaId] } } : {}),
    });

    return { id: tweet.data?.id };
  });
};
