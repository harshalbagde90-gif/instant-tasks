import { supabase } from '@/integrations/supabase/client';
import { Task, Category, TagType } from '@/types/task';

// ==================== TASKS (Fine-grained Sync) ====================

/**
 * Upserts a single task to Supabase.
 * This prevents overwriting other devices' data.
 */
export async function upsertTaskToSupabase(userId: string, task: Task, mode: 'basic' | 'advanced' | 'customize') {
    try {
        const { error } = await supabase
            .from('tasks')
            .upsert({
                id: task.id.startsWith('task-') ? undefined : task.id, // Let Supabase handle IDs if they are temporary local IDs
                user_id: userId,
                title: task.text,
                description: task.description || '',
                tags: task.tags || [],
                due_date: task.dueDate || null,
                reminder: task.reminder || null,
                completed: task.completed,
                mode: mode,
                priority: task.priority || null,
                attachments: (task.attachments || []) as any,
                subtasks: (task.subtasks || []) as any,
                notes: task.notes || '',
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error upserting task to Supabase:', error);
        return { success: false, error };
    }
}

/**
 * Deletes a single task from Supabase.
 */
export async function deleteTaskFromSupabase(userId: string, taskId: string) {
    try {
        // If it's a temporary local ID, we don't need to delete from cloud
        if (taskId.startsWith('task-')) return { success: true };

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)
            .eq('user_id', userId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting task from Supabase:', error);
        return { success: false, error };
    }
}

/**
 * Loads all tasks for a specific mode.
 */
export async function loadTasksFromSupabase(userId: string, mode: 'basic' | 'advanced' | 'customize'): Promise<Task[]> {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .eq('mode', mode)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(item => ({
            id: item.id,
            text: item.title,
            description: item.description || undefined,
            tags: item.tags || [],
            dueDate: item.due_date || undefined,
            reminder: item.reminder || undefined,
            completed: item.completed,
            priority: item.priority as Task['priority'],
            attachments: (item.attachments as any) || [],
            subtasks: (item.subtasks as any) || [],
            notes: item.notes || '',
            createdAt: new Date(item.created_at).getTime(),
        }));
    } catch (error) {
        console.error('Error loading tasks from Supabase:', error);
        return [];
    }
}

// ==================== CATEGORIES & TAGS (Bulk Sync is fine here as they change rarely) ====================

export async function syncCategoriesToSupabase(userId: string, categories: Category[]) {
    try {
        const categoriesToInsert = categories.map(cat => ({
            user_id: userId,
            name: cat.name,
            color: cat.color,
            icon: cat.icon
        }));

        const { error } = await supabase
            .from('categories')
            .upsert(categoriesToInsert, { onConflict: 'user_id,name' });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error syncing categories:', error);
        return { success: false, error };
    }
}

export async function loadCategoriesFromSupabase(userId: string): Promise<Category[]> {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return (data || []).map(item => ({
            id: item.id,
            name: item.name,
            color: item.color,
            icon: item.icon
        }));
    } catch (error) {
        console.error('Error loading categories:', error);
        return [];
    }
}

// ==================== MIGRATION ====================

export async function migrateLocalDataToSupabase(
    userId: string,
    basicTasks: Task[],
    advancedTasks: Task[],
    categories: Category[],
    tags: TagType[]
) {
    try {
        // Migration still uses bulk-like approach but doesn't delete cloud data
        // It just merges local data INTO cloud data
        const tasksToInsert = [
            ...basicTasks.map(t => ({ ...t, mode: 'basic' as const })),
            ...advancedTasks.map(t => ({ ...t, mode: 'advanced' as const }))
        ].map(task => ({
            user_id: userId,
            title: task.text,
            description: task.description || '',
            tags: task.tags || [],
            due_date: task.dueDate || null,
            completed: task.completed,
            mode: task.mode as 'basic' | 'advanced' | 'customize',
            priority: task.priority || null,
            subtasks: (task.subtasks || []) as any,
        }));

        if (tasksToInsert.length > 0) {
            const { error } = await supabase.from('tasks').insert(tasksToInsert);
            if (error) throw error;
        }

        await syncCategoriesToSupabase(userId, categories);

        return { success: true };
    } catch (error) {
        console.error('Migration error:', error);
        return { success: false, error };
    }
}
