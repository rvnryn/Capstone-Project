-- Migration to fix inventory tables unique constraints
-- This fixes the issue where upsert operations fail because there's no unique constraint on (item_id, batch_date)

-- Fix inventory_surplus table
-- Drop the old primary key constraint
ALTER TABLE public.inventory_surplus DROP CONSTRAINT IF EXISTS inventory_surplus_pkey;

-- Add composite unique constraint and primary key on (item_id, batch_date)
ALTER TABLE public.inventory_surplus
ADD CONSTRAINT inventory_surplus_pkey PRIMARY KEY (item_id, batch_date);

-- Fix inventory_today table
-- Drop the old primary key constraint
ALTER TABLE public.inventory_today DROP CONSTRAINT IF EXISTS inventory_today_pkey;

-- Add composite unique constraint and primary key on (item_id, batch_date)
ALTER TABLE public.inventory_today
ADD CONSTRAINT inventory_today_pkey PRIMARY KEY (item_id, batch_date);

-- Note: The main inventory table already uses item_id as primary key
-- If you need to track multiple batches there as well, you would need to:
-- 1. Back up your data
-- 2. Apply the same changes to the inventory table
-- 3. Update any foreign key references
