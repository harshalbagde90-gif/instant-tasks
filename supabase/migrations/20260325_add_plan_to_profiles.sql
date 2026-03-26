-- ============================================================
-- Migration: Add Plan & Trial columns to profiles table
-- Date: 2026-03-25
-- Paste this directly in Supabase SQL Editor and RUN
-- ============================================================

-- Step 1: Add plan column (free | pro | power)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'pro', 'power'));

-- Step 2: Add trial end date
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT NULL;

-- Step 3: Add plan start & expiry dates
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Step 4: AI action tracking (resets monthly)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_actions_used INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_actions_reset_at TIMESTAMPTZ DEFAULT NOW();

-- Step 5: Payment provider subscription IDs
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT DEFAULT NULL;

-- Step 6: Auto-set 7-day trial for all NEW signups
-- (This sets trial for all existing users too, comment out if not needed)
-- UPDATE public.profiles
-- SET trial_ends_at = NOW() + INTERVAL '7 days'
-- WHERE plan = 'free' AND trial_ends_at IS NULL;

-- ============================================================
-- Verify: Run this SELECT to confirm columns were added
-- ============================================================
-- SELECT id, full_name, plan, trial_ends_at, ai_actions_used
-- FROM public.profiles
-- LIMIT 5;
