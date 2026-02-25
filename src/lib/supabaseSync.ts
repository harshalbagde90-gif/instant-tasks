import { supabase } from '@/integrations/supabase/client';
import { Task, Category, TagType } from '@/types/task';

// ==================== TASKS ====================

export async function syncTasksToSupabase(userId: string, tasks: Task[], mode: 'basic' | 'advanced' | 'customize') {
    try {
        // Delete existing tasks for this mode
        await supabase
            .from('tasks')
            .delete()
            .eq('user_id', userId)
            .eq('mode', mode);

        // Insert new tasks
        if (tasks.length > 0) {
            const tasksToInsert = tasks.map(task => ({
                user_id: userId,
                title: task.text,
                description: task.description || '',
                category_id: null as string | null,  // we store category name not id
                tags: task.tags || [],
                due_date: task.dueDate || null,
                reminder: task.reminder || null,
                completed: task.completed,
                mode: mode,
                priority: task.priority || null,
                attachments: (task.attachments || []) as unknown as import('@/integrations/supabase/types').Json,
                subtasks: (task.subtasks || []) as unknown as import('@/integrations/supabase/types').Json,
                notes: task.notes || '',
            }));

            const { error } = await supabase
                .from('tasks')
                .insert(tasksToInsert);

            if (error) throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('Error syncing tasks to Supabase:', error);
        return { success: false, error };
    }
}

export async function loadTasksFromSupabase(userId: string, mode: 'basic' | 'advanced' | 'customize'): Promise<Task[]> {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .eq('mode', mode)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Convert Supabase format to Task format
        const tasks: Task[] = (data || []).map(item => ({
            id: item.id,
            text: item.title,
            description: item.description || undefined,
            category: undefined,  // category name not stored in tasks table directly
            tags: item.tags || [],
            dueDate: item.due_date || undefined,
            reminder: item.reminder || undefined,
            completed: item.completed,
            priority: item.priority as Task['priority'],
            attachments: Array.isArray(item.attachments) ? (item.attachments as unknown as { id: string; name: string; url: string }[]) : [],
            subtasks: Array.isArray(item.subtasks) ? (item.subtasks as unknown as import('@/types/task').Subtask[]) : [],
            notes: item.notes || '',
            createdAt: new Date(item.created_at).getTime(),
        }));

        return tasks;
    } catch (error) {
        console.error('Error loading tasks from Supabase:', error);
        return [];
    }
}

// Load all three modes at once
export async function loadAllTasksFromSupabase(userId: string): Promise<{
    basicTasks: Task[];
    advancedTasks: Task[];
    customizeTasks: Task[];
}> {
    const [basicTasks, advancedTasks, customizeTasks] = await Promise.all([
        loadTasksFromSupabase(userId, 'basic'),
        loadTasksFromSupabase(userId, 'advanced'),
        loadTasksFromSupabase(userId, 'customize'),
    ]);
    return { basicTasks, advancedTasks, customizeTasks };
}

// ==================== CATEGORIES ====================

export async function syncCategoriesToSupabase(userId: string, categories: Category[]) {
    try {
        // Delete existing categories
        await supabase
            .from('categories')
            .delete()
            .eq('user_id', userId);

        // Insert new categories
        if (categories.length > 0) {
            const categoriesToInsert = categories.map(cat => ({
                user_id: userId,
                name: cat.name,
                color: cat.color,
                icon: cat.icon
            }));

            const { error } = await supabase
                .from('categories')
                .insert(categoriesToInsert);

            if (error) throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('Error syncing categories to Supabase:', error);
        return { success: false, error };
    }
}

export async function loadCategoriesFromSupabase(userId: string): Promise<Category[]> {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const categories: Category[] = (data || []).map(item => ({
            id: item.id,
            name: item.name,
            color: item.color,
            icon: item.icon
        }));

        return categories;
    } catch (error) {
        console.error('Error loading categories from Supabase:', error);
        return [];
    }
}

// ==================== TAGS ====================

export async function syncTagsToSupabase(userId: string, tags: TagType[]) {
    try {
        // Delete existing tags
        await supabase
            .from('tags')
            .delete()
            .eq('user_id', userId);

        // Insert new tags
        if (tags.length > 0) {
            const tagsToInsert = tags.map(tag => ({
                user_id: userId,
                name: tag.name,
                color: tag.color
            }));

            const { error } = await supabase
                .from('tags')
                .insert(tagsToInsert);

            if (error) throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('Error syncing tags to Supabase:', error);
        return { success: false, error };
    }
}

export async function loadTagsFromSupabase(userId: string): Promise<TagType[]> {
    try {
        const { data, error } = await supabase
            .from('tags')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const tags: TagType[] = (data || []).map(item => ({
            id: item.id,
            name: item.name,
            color: item.color
        }));

        return tags;
    } catch (error) {
        console.error('Error loading tags from Supabase:', error);
        return [];
    }
}

// ==================== BIG DATA SHEETS ====================

export async function syncSheetsToSupabase(userId: string, sheets: any[], mode: string) {
    try {
        // Delete existing sheets for this mode
        await supabase
            .from('big_data_sheets')
            .delete()
            .eq('user_id', userId)
            .eq('mode', mode);

        // Insert new sheets
        if (sheets.length > 0) {
            const sheetsToInsert = sheets.map(sheet => ({
                user_id: userId,
                mode: mode,
                name: sheet.name,
                content: sheet.content || '',
                metadata: (sheet.metadata || {}) as import('@/integrations/supabase/types').Json
            }));

            const { error } = await supabase
                .from('big_data_sheets')
                .insert(sheetsToInsert);

            if (error) throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('Error syncing sheets to Supabase:', error);
        return { success: false, error };
    }
}

export async function loadSheetsFromSupabase(userId: string, mode: string) {
    try {
        const { data, error } = await supabase
            .from('big_data_sheets')
            .select('*')
            .eq('user_id', userId)
            .eq('mode', mode)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error loading sheets from Supabase:', error);
        return [];
    }
}

// ==================== FULL MIGRATION ====================

export async function migrateLocalDataToSupabase(
    userId: string,
    basicTasks: Task[],
    advancedTasks: Task[],
    categories: Category[],
    tags: TagType[],
    bigDataWorkspaces: Record<string, any[]>
) {
    try {
        // Sync all data in parallel for speed
        const results = await Promise.allSettled([
            syncTasksToSupabase(userId, basicTasks, 'basic'),
            syncTasksToSupabase(userId, advancedTasks, 'advanced'),
            syncCategoriesToSupabase(userId, categories),
            syncTagsToSupabase(userId, tags),
            // Sync big data sheets for all modes
            ...Object.entries(bigDataWorkspaces).map(([mode, sheets]) =>
                syncSheetsToSupabase(userId, sheets, mode)
            )
        ]);

        // Check if any failed
        const failures = results.filter(r => r.status === 'rejected');

        if (failures.length > 0) {
            console.error('Some migrations failed:', failures);
            return { success: false, partialFailure: true };
        }

        return { success: true };
    } catch (error) {
        console.error('Error during full migration:', error);
        return { success: false, error };
    }
}
