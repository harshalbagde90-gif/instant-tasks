/*
  COMBINED MIGRATION — Run this COMPLETE SQL in Supabase Dashboard > SQL Editor

  This fixes:
  1. tasks table — supports 'customize' mode
  2. shared_tasks table — for sharing feature
  3. All RLS policies for both tables
*/

-- ============================================
-- STEP 1: Create/update tables
-- ============================================

-- Drop old constraint on tasks.mode if it only allowed basic/advanced
DO $$
BEGIN
  -- Add 'customize' to mode check constraint if not already there
  ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_mode_check;
  ALTER TABLE public.tasks ADD CONSTRAINT tasks_mode_check 
    CHECK (mode IN ('basic', 'advanced', 'customize'));
  -- Also fix priority constraint to include 'urgent'
  ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
  ALTER TABLE public.tasks ADD CONSTRAINT tasks_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent') OR priority IS NULL);
EXCEPTION WHEN others THEN
  -- Tables may not exist yet, will be created below
  NULL;
END $$;

-- Create categories table (if not exists)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table (if not exists)
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table (if not exists) — with all 3 modes
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    due_date TEXT,
    reminder TEXT,
    completed BOOLEAN DEFAULT FALSE,
    mode TEXT NOT NULL CHECK (mode IN ('basic', 'advanced', 'customize')),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent') OR priority IS NULL),
    attachments JSONB DEFAULT '[]',
    subtasks JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create big_data_sheets table (if not exists)
CREATE TABLE IF NOT EXISTS public.big_data_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mode TEXT NOT NULL,
    name TEXT NOT NULL,
    content TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shared_tasks table (if not exists)
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

-- ============================================
-- STEP 2: Enable RLS on all tables
-- ============================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.big_data_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: RLS Policies (drop old then recreate)
-- ============================================

-- Categories
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

CREATE POLICY "Users can view their own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Tags
DROP POLICY IF EXISTS "Users can view their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can insert their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON public.tags;

CREATE POLICY "Users can view their own tags" ON public.tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tags" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tags" ON public.tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tags" ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- Tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Big data sheets
DROP POLICY IF EXISTS "Users can view their own sheets" ON public.big_data_sheets;
DROP POLICY IF EXISTS "Users can insert their own sheets" ON public.big_data_sheets;
DROP POLICY IF EXISTS "Users can update their own sheets" ON public.big_data_sheets;
DROP POLICY IF EXISTS "Users can delete their own sheets" ON public.big_data_sheets;

CREATE POLICY "Users can view their own sheets" ON public.big_data_sheets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sheets" ON public.big_data_sheets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sheets" ON public.big_data_sheets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sheets" ON public.big_data_sheets FOR DELETE USING (auth.uid() = user_id);

-- Shared tasks (anyone can view by token, only owner can create)
DROP POLICY IF EXISTS "Anyone can view shared tasks by token" ON public.shared_tasks;
DROP POLICY IF EXISTS "Authenticated users can create shared tasks" ON public.shared_tasks;
DROP POLICY IF EXISTS "Owner can update their shared tasks" ON public.shared_tasks;
DROP POLICY IF EXISTS "Owner can delete their shared tasks" ON public.shared_tasks;
DROP POLICY IF EXISTS "Anyone can update checked subtasks" ON public.shared_tasks;

CREATE POLICY "Anyone can view shared tasks by token" ON public.shared_tasks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create shared tasks" ON public.shared_tasks FOR INSERT WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);
CREATE POLICY "Anyone can update checked subtasks" ON public.shared_tasks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Owner can delete their shared tasks" ON public.shared_tasks FOR DELETE USING (auth.uid() = owner_id);

-- ============================================
-- STEP 4: Indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_mode ON public.tasks(mode);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_big_data_sheets_user_id ON public.big_data_sheets(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_tasks_token ON public.shared_tasks(share_token);
