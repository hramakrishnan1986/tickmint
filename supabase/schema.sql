-- TickMint Milestone 3C: production journal, multiple accounts, capital ledger and screenshots
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency text not null default 'INR',
  starting_capital numeric(14,2) not null default 120000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trading_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  broker text not null default 'Other',
  account_type text not null default 'Live' check (account_type in ('Live','Paper')),
  starting_capital numeric(14,2) not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.trading_accounts(id) on delete set null,
  trade_date date not null,
  market text not null default 'Futures',
  instrument text not null,
  instrument_type text not null default 'Futures',
  direction text not null check (direction in ('Bull','Bear')),
  option_type text check (option_type is null or option_type in ('CE','PE')),
  strike_price numeric(18,4),
  expiry_date date,
  strategy text not null,
  entry_price numeric(18,4) not null default 0,
  exit_price numeric(18,4) not null default 0,
  quantity numeric(18,4) not null default 1,
  lot_size numeric(18,4) not null default 1,
  lots numeric(18,4) not null default 1,
  stop_loss numeric(18,4),
  target numeric(18,4),
  brokerage numeric(14,2) not null default 0,
  exchange_charges numeric(14,2) not null default 0,
  taxes numeric(14,2) not null default 0,
  slippage numeric(14,2) not null default 0,
  charges numeric(14,2) not null default 0,
  gross_pnl numeric(14,2) not null default 0,
  net_pnl numeric(14,2) not null default 0,
  followed_rules boolean not null default true,
  emotion text,
  notes text,
  screenshot_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table if not exists public.daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_date date not null,
  mood text not null default 'Neutral',
  focus smallint not null default 3 check (focus between 1 and 5),
  sleep smallint not null default 3 check (sleep between 1 and 5),
  stress smallint not null default 3 check (stress between 1 and 5),
  confidence smallint not null default 3 check (confidence between 1 and 5),
  followed_plan boolean not null default true,
  overtraded boolean not null default false,
  revenge_traded boolean not null default false,
  moved_stop_loss boolean not null default false,
  position_size_correct boolean not null default true,
  went_well text,
  went_wrong text,
  lesson text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, review_date)
);

create table if not exists public.capital_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.trading_accounts(id) on delete cascade,
  entry_date date not null,
  entry_type text not null check (entry_type in ('Deposit','Withdrawal','Fee','Adjustment','Dividend')),
  amount numeric(14,2) not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists trades_user_date_idx on public.trades(user_id, trade_date desc);
create index if not exists accounts_user_idx on public.trading_accounts(user_id);
create index if not exists daily_reviews_user_date_idx on public.daily_reviews(user_id, review_date desc);
create index if not exists capital_user_date_idx on public.capital_entries(user_id, entry_date desc);

alter table public.profiles enable row level security;
alter table public.trading_accounts enable row level security;
alter table public.trades enable row level security;
alter table public.capital_entries enable row level security;
alter table public.daily_reviews enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users manage own accounts" on public.trading_accounts;
drop policy if exists "Users manage own trades" on public.trades;
drop policy if exists "Users manage own daily reviews" on public.daily_reviews;
drop policy if exists "Users manage own capital entries" on public.capital_entries;
create policy "Users manage own accounts" on public.trading_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own trades" on public.trades for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own daily reviews" on public.daily_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own capital entries" on public.capital_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('trade-screenshots','trade-screenshots',true,5242880,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/png','image/jpeg','image/webp'];

drop policy if exists "Users upload own trade screenshots" on storage.objects;
drop policy if exists "Users update own trade screenshots" on storage.objects;
drop policy if exists "Users delete own trade screenshots" on storage.objects;
drop policy if exists "Public can view trade screenshots" on storage.objects;
create policy "Users upload own trade screenshots" on storage.objects for insert to authenticated
with check (bucket_id='trade-screenshots' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Users update own trade screenshots" on storage.objects for update to authenticated
using (bucket_id='trade-screenshots' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Users delete own trade screenshots" on storage.objects for delete to authenticated
using (bucket_id='trade-screenshots' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Public can view trade screenshots" on storage.objects for select using (bucket_id='trade-screenshots');

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  insert into public.trading_accounts (user_id,name,broker,account_type,starting_capital,is_default)
  values (new.id,'Primary account','Other','Live',120000,true);
  return new;
end;$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Milestone 3D: public-beta feedback collection
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  category text not null check (category in ('Feature request','Bug report','Usability issue','Analytics question','Other')),
  message text not null check (char_length(message) between 10 and 5000),
  rating smallint check (rating between 1 and 5),
  status text not null default 'new' check (status in ('new','reviewing','planned','resolved','closed')),
  created_at timestamptz not null default now()
);
create index if not exists feedback_user_created_idx on public.feedback(user_id, created_at desc);
alter table public.feedback enable row level security;
drop policy if exists "Users submit own feedback" on public.feedback;
drop policy if exists "Users view own feedback" on public.feedback;
create policy "Users submit own feedback" on public.feedback for insert to authenticated with check (auth.uid() = user_id);
create policy "Users view own feedback" on public.feedback for select to authenticated using (auth.uid() = user_id);
