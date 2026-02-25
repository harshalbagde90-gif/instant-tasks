-- ⚡ QUICK FIX: Run this in Supabase SQL Editor
-- This fixes the tasks table mode constraint and profiles 406 error

-- Fix 1: Drop and recreate tasks mode constraint (old one only had basic/advanced)
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Find the actual constraint name (might be auto-generated)
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class r ON r.oid = c.conrelid
  WHERE c.contype = 'c'
    AND r.relname = 'tasks'
    AND pg_get_constraintdef(c.oid) LIKE '%mode%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tasks DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;

  -- Add new constraint with customize support
  ALTER TABLE public.tasks ADD CONSTRAINT tasks_mode_check
    CHECK (mode IN ('basic', 'advanced', 'customize'));

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Constraint update skipped: %', SQLERRM;
END $$;

-- Fix 2: Drop and recreate priority constraint (old one missing 'urgent')
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class r ON r.oid = c.conrelid
  WHERE c.contype = 'c'
    AND r.relname = 'tasks'
    AND pg_get_constraintdef(c.oid) LIKE '%priority%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tasks DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;

  ALTER TABLE public.tasks ADD CONSTRAINT tasks_priority_check
    CHECK (priority IN ('low', 'medium', 'high', 'urgent') OR priority IS NULL);

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Priority constraint update skipped: %', SQLERRM;
END $$;

-- Fix 3: Change due_date column type to TEXT (code sends ISO strings)
ALTER TABLE public.tasks
  ALTER COLUMN due_date TYPE TEXT USING due_date::text;

ALTER TABLE public.tasks
  ALTER COLUMN reminder TYPE TEXT USING reminder::text;

-- Fix 4: Make sure shared_tasks table exists
CREATE TABLE IF NOT EXISTS public.shared_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    task_data JSONB NOT NULL,
    checked_subtasks TEXT[] DEFAULT '{}',
    mode TEXT DEFAULT 'advanced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.shared_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view shared tasks by token" ON public.shared_tasks;
DROP POLICY IF EXISTS "Authenticated users can create shared tasks" ON public.shared_tasks;
DROP POLICY IF EXISTS "Anyone can update checked subtasks" ON public.shared_tasks;
DROP POLICY IF EXISTS "Owner can delete their shared tasks" ON public.shared_tasks;

CREATE POLICY "Anyone can view shared tasks by token" ON public.shared_tasks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create shared tasks" ON public.shared_tasks FOR INSERT WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);
CREATE POLICY "Anyone can update checked subtasks" ON public.shared_tasks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Owner can delete their shared tasks" ON public.shared_tasks FOR DELETE USING (auth.uid() = owner_id);

-- Verify: show current tasks table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;
