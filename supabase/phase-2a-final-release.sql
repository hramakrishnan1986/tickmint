-- TickMint Phase 2A final release hardening
create unique index if not exists one_default_account_per_user on public.trading_accounts(user_id) where is_default = true;
create index if not exists trading_accounts_user_default_idx on public.trading_accounts(user_id,is_default desc);
create index if not exists trades_user_trade_date_idx on public.trades(user_id,trade_date desc);
create index if not exists trades_user_account_date_idx on public.trades(user_id,account_id,trade_date desc);
create index if not exists trades_user_instrument_idx on public.trades(user_id,instrument);
create index if not exists trades_user_strategy_idx on public.trades(user_id,strategy);
create index if not exists capital_entries_user_entry_date_idx on public.capital_entries(user_id,entry_date desc);
create index if not exists daily_reviews_user_review_date_idx on public.daily_reviews(user_id,review_date desc);
grant usage on schema public to authenticated;
grant select,insert,update,delete on public.profiles to authenticated;
grant select,insert,update,delete on public.trading_accounts to authenticated;
grant select,insert,update,delete on public.trades to authenticated;
grant select,insert,update,delete on public.capital_entries to authenticated;
grant select,insert,update,delete on public.daily_reviews to authenticated;
grant insert on public.feedback to authenticated;
notify pgrst,'reload schema';
