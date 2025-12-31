-- Run this in your Supabase SQL Editor to update the database for the new UI features.

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Update Profiles Table (Personal Info & Wallet)
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists preferences jsonb default '{}'::jsonb;
alter table profiles add column if not exists credit_balance int default 0;

-- 3. Update Properties Table (Analysis Details)
alter table properties add column if not exists title text;
alter table properties add column if not exists location text;
alter table properties add column if not exists status text default 'completed'; 
alter table properties add column if not exists is_unlocked boolean default false;
alter table properties add column if not exists price numeric;

-- 4. Create Wallet Transactions Table
create table if not exists wallet_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  amount int not null,
  type text check (type in ('deposit', 'spend', 'reward')) not null,
  description text,
  created_at timestamptz default now()
);

-- 5. Create Balance Update Logic
create or replace function public.handle_balance_update()
returns trigger as $$
begin
  update profiles
  set credit_balance = credit_balance + new.amount
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

-- 6. Automate Balance Updates
drop trigger if exists on_wallet_transaction_created on wallet_transactions;
create trigger on_wallet_transaction_created
  after insert on wallet_transactions
  for each row execute procedure public.handle_balance_update();

-- 7. Security Policies (RLS)
alter table wallet_transactions enable row level security;

-- Allow users to see their own transactions
create policy "Users can view their own transactions"
  on wallet_transactions for select
  using ( auth.uid() = user_id );

-- Allow users to create transactions (for demo purposes)
create policy "Users can insert their own transactions"
  on wallet_transactions for insert
  with check ( auth.uid() = user_id );
