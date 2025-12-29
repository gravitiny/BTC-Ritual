create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  wallet_address text unique not null,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  side text not null,
  margin_usd numeric not null,
  leverage numeric not null,
  tp_multiple numeric not null,
  target_profit_usd numeric not null,
  entry_price numeric,
  liq_price numeric,
  tp_price numeric,
  status text not null,
  pnl_usd numeric,
  started_at timestamptz default now(),
  ended_at timestamptz
);

create index if not exists trades_user_idx on public.trades(user_id, started_at desc);

create table if not exists public.crown_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  tier_id text not null,
  count int not null default 1,
  created_at timestamptz default now()
);

create index if not exists crown_user_idx on public.crown_events(user_id, created_at desc);
