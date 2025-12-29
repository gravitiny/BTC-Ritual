# LuckyTrade backend (Fastify + Supabase)

## Setup
1. Copy `.env.example` to `.env` and fill values.
2. Install deps:
   ```bash
   npm install
   ```
3. Run dev:
   ```bash
   npm run dev
   ```

## Endpoints
- `POST /auth/nonce` `{ address }`
- `POST /auth/verify` `{ address, signature, nonce }`
- `POST /trades` (auth) create trade
- `PATCH /trades/:id` (auth) update trade
- `GET /trades?status=&cursor=&limit=` (auth)
- `GET /leaderboard?type=champions|winrate|clown`
- `POST /share/twitter` (auth) `{ text, imageDataUrl }`

## Supabase
Apply `sql/schema.sql` in Supabase SQL editor.

## Notes
- Twitter upload requires OAuth 1.0a credentials.
- For local dev, set `FRONTEND_ORIGIN` to your Vite URL.
