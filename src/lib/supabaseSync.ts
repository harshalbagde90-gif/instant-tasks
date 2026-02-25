import { supabase } from '@/integrations/supabase/client';
import { Task, Category, TagType } from '@/types/task';

// ==================== TASKS (Individual Sync) ====================

export async function upsertTaskToSupabase(userId: string, task: Task, mode: 'basic' | 'advanced' | 'customize') {
    try {
        const { error } = await supabase
            .from('tasks')
            .upsert({
                id: task.id, // Use the UUID generated on frontend
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
            });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error syncing task:', error);
        return { success: false, error };
    }
}

export async function deleteTaskFromSupabase(userId: string, taskId: string) {
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)
            .eq('user_id', userId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting task:', error);
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
        console.error('Error loading tasks:', error);
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
        const tasksToInsert = [
            ...basicTasks.map(t => ({ ...t, mode: 'basic' as const })),
            ...advancedTasks.map(t => ({ ...t, mode: 'advanced' as const }))
        ].map(task => ({
            id: task.id.startsWith('task-') ? undefined : task.id, // Keep real UUIDs, drop temp local ones
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
            const { error } = await supabase.from('tasks').upsert(tasksToInsert);
            if (error) throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('Full Migration error:', error);
        return { success: false, error };
    }
}
