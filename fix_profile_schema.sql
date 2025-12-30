-- Run this in Supabase SQL Editor to fix the profile update error.

alter table profiles add column if not exists updated_at timestamptz;
