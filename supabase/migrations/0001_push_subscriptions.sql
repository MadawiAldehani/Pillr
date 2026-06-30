-- Push subscriptions for Web Push (one row per device/browser per user)
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- A user may only see / create / remove their own subscriptions.
-- The edge functions use the service-role key, which bypasses RLS to send to everyone.
drop policy if exists "own subs select" on public.push_subscriptions;
create policy "own subs select" on public.push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "own subs insert" on public.push_subscriptions;
create policy "own subs insert" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "own subs update" on public.push_subscriptions;
create policy "own subs update" on public.push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own subs delete" on public.push_subscriptions;
create policy "own subs delete" on public.push_subscriptions
  for delete using (auth.uid() = user_id);
