-- Contact / "trouble signing in" messages, submitted from the login page.
-- Anyone (even not signed in) can insert; only admins can read.

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  email       text,
  message     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Anyone (anon or signed-in) can submit, with length guards to limit abuse
drop policy if exists "anyone can submit contact" on public.contact_messages;
create policy "anyone can submit contact" on public.contact_messages
  for insert to anon, authenticated
  with check (char_length(message) between 1 and 2000 and (email is null or char_length(email) <= 200));

-- Only admins can read submissions
drop policy if exists "admins read contact" on public.contact_messages;
create policy "admins read contact" on public.contact_messages
  for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- Only admins can mark as read
drop policy if exists "admins update contact" on public.contact_messages;
create policy "admins update contact" on public.contact_messages
  for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));
