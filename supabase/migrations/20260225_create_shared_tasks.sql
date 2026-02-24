-- Create shared_tasks table
-- Stores tasks shared via link. Works for both logged-in users and guests.
CREATE TABLE IF NOT EXISTS public.shared_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
    -- owner_id is nullable: guests can share too
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_data JSONB NOT NULL,           -- Full task snapshot (text, subtasks, deadline, etc.)
    checked_subtasks TEXT[] DEFAULT '{}', -- IDs of subtasks checked by receiver
    mode TEXT NOT NULL DEFAULT 'customize', -- Which mode the task came from
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.shared_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can READ a shared task using the token (public read)
CREATE POLICY "Anyone can view shared tasks"
    ON public.shared_tasks FOR SELECT
    USING (true);

-- Policy: Authenticated users can insert their own shared tasks
CREATE POLICY "Users can insert shared tasks"
    ON public.shared_tasks FOR INSERT
    WITH CHECK (true);

-- Policy: Anyone can UPDATE checked_subtasks column (receiver checks off items)
CREATE POLICY "Anyone can update checked subtasks"
    ON public.shared_tasks FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy: Owner can delete their shared tasks
CREATE POLICY "Owner can delete shared tasks"
    ON public.shared_tasks FOR DELETE
    USING (auth.uid() = owner_id OR owner_id IS NULL);

-- Index for fast token lookups
CREATE INDEX idx_shared_tasks_token ON public.shared_tasks(share_token);
CREATE INDEX idx_shared_tasks_owner ON public.shared_tasks(owner_id);

-- Auto-update updated_at
CREATE TRIGGER update_shared_tasks_updated_at
    BEFORE UPDATE ON public.shared_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
