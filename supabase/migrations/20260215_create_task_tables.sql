-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    due_date TIMESTAMP WITH TIME ZONE,
    reminder TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    mode TEXT NOT NULL CHECK (mode IN ('basic', 'advanced')),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
    attachments JSONB DEFAULT '[]',
    subtasks JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create big_data_sheets table
CREATE TABLE IF NOT EXISTS public.big_data_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('General', 'Script', 'Code', 'Prompts')),
    name TEXT NOT NULL,
    content TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.big_data_sheets ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for categories
CREATE POLICY "Users can view their own categories"
    ON public.categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS Policies for tags
CREATE POLICY "Users can view their own tags"
    ON public.tags FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
    ON public.tags FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
    ON public.tags FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
    ON public.tags FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS Policies for tasks
CREATE POLICY "Users can view their own tasks"
    ON public.tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
    ON public.tasks FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS Policies for big_data_sheets
CREATE POLICY "Users can view their own sheets"
    ON public.big_data_sheets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sheets"
    ON public.big_data_sheets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sheets"
    ON public.big_data_sheets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sheets"
    ON public.big_data_sheets FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_category_id ON public.tasks(category_id);
CREATE INDEX idx_tasks_mode ON public.tasks(mode);
CREATE INDEX idx_tasks_completed ON public.tasks(completed);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_big_data_sheets_user_id ON public.big_data_sheets(user_id);
CREATE INDEX idx_big_data_sheets_mode ON public.big_data_sheets(mode);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON public.tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_big_data_sheets_updated_at
    BEFORE UPDATE ON public.big_data_sheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
