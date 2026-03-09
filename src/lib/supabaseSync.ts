import { supabase } from '@/integrations/supabase/client';
import { Task, Category, TagType } from '@/types/task';

type TaskMode = 'basic' | 'advanced' | 'customize';
type BigDataWorkspaces = Record<string, Array<{ id: string; name: string; content: string; metadata?: any }>>;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEFAULT_SHEET_METADATA = {
    styles: {
        bold: [],
        italic: [],
        colors: [],
        bg: []
    }
};

function isUuid(value?: string) {
    return !!value && UUID_REGEX.test(value);
}

function mapTaskRowToTask(item: any): Task {
    const categoryName = item?.categories?.name || undefined;
    return {
        id: item.id,
        text: item.title,
        description: item.description || undefined,
        category: categoryName,
        tags: item.tags || [],
        dueDate: item.due_date || undefined,
        reminder: item.reminder || undefined,
        completed: item.completed,
        priority: item.priority as Task['priority'],
        attachments: (item.attachments as any) || [],
        subtasks: (item.subtasks as any) || [],
        notes: item.notes || '',
        createdAt: new Date(item.created_at).getTime(),
        // ── Reminder preferences ──────────────────────────────
        emailReminderEnabled: item.email_reminder_enabled ?? false,
        reminderEmail: item.reminder_email || undefined,
        whatsappReminderEnabled: item.whatsapp_reminder_enabled ?? false,
        whatsappNumber: item.whatsapp_number || undefined,
        whatsappVerified: item.whatsapp_verified ?? false,
        reminderSent: item.reminder_sent ?? false,
    };
}

// ==================== TASKS (Individual Sync) ====================

export async function upsertTaskToSupabase(
    userId: string,
    task: Task,
    mode: TaskMode,
    categories: Category[] = []
) {
    try {
        const matchedCategory = task.category
            ? categories.find(c => c.name === task.category && isUuid(c.id))
            : undefined;
        let categoryId = matchedCategory?.id || null;

        if (!categoryId && task.category) {
            const { data: categoryByName } = await supabase
                .from('categories')
                .select('id')
                .eq('user_id', userId)
                .eq('name', task.category)
                .limit(1)
                .maybeSingle();
            categoryId = categoryByName?.id || null;
        }

        const payload: any = {
            user_id: userId,
            title: task.text,
            description: task.description || '',
            category_id: categoryId,
            tags: task.tags || [],
            due_date: task.dueDate || null,
            reminder: task.reminder || null,
            completed: task.completed,
            mode,
            priority: task.priority || null,
            attachments: (task.attachments || []) as any,
            subtasks: (task.subtasks || []) as any,
            notes: task.notes || '',
            updated_at: new Date().toISOString(),
            // ── Reminder preferences ──────────────────────────
            email_reminder_enabled: task.emailReminderEnabled ?? false,
            reminder_email: task.reminderEmail || null,
            whatsapp_reminder_enabled: task.whatsappReminderEnabled ?? false,
            whatsapp_number: task.whatsappNumber || null,
            whatsapp_verified: task.whatsappVerified ?? false,
            reminder_sent: task.reminderSent ?? false,
        };

        if (isUuid(task.id)) {
            payload.id = task.id;
        }
        if (task.createdAt) {
            payload.created_at = new Date(task.createdAt).toISOString();
        }

        const { error } = await supabase.from('tasks').upsert(payload);
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

export async function loadTasksFromSupabase(userId: string, mode: TaskMode): Promise<Task[]> {
    const grouped = await loadAllTasksFromSupabase(userId);
    return grouped[mode];
}

function normalizeMode(mode: unknown): TaskMode {
    if (mode === 'basic' || mode === 'advanced' || mode === 'customize') {
        return mode;
    }
    return 'advanced';
}

async function fetchTaskRows(userId: string) {
    const runQuery = (withCategoryJoin: boolean) => {
        return supabase
            .from('tasks')
            .select(withCategoryJoin ? '*, categories(name)' : '*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
    };

    let { data, error } = await runQuery(true);
    if (error) {
        console.warn('Tasks query with categories join failed. Retrying without join.', error);
        const fallback = await runQuery(false);
        data = fallback.data;
        error = fallback.error;
    }
    if (error) throw error;

    return data || [];
}

export async function loadAllTasksFromSupabase(userId: string): Promise<Record<TaskMode, Task[]>> {
    try {
        const rows = await fetchTaskRows(userId);
        const grouped: Record<TaskMode, Task[]> = {
            basic: [],
            advanced: [],
            customize: []
        };

        for (const row of rows) {
            const mode = normalizeMode((row as any).mode);
            grouped[mode].push(mapTaskRowToTask(row));
        }

        return grouped;
    } catch (error) {
        console.error('Error loading tasks:', error);
        return {
            basic: [],
            advanced: [],
            customize: []
        };
    }
}

// ==================== CATEGORIES + TAGS ====================

export async function loadCategoriesFromSupabase(userId: string): Promise<Category[]> {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            icon: item.icon,
            color: item.color
        }));
    } catch (error) {
        console.error('Error loading categories:', error);
        return [];
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

        return (data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            color: item.color
        }));
    } catch (error) {
        console.error('Error loading tags:', error);
        return [];
    }
}

export async function saveCategoriesToSupabase(userId: string, categories: Category[]) {
    try {
        const { data: existingRows, error: existingError } = await supabase
            .from('categories')
            .select('id, name')
            .eq('user_id', userId);
        if (existingError) throw existingError;

        const existingByName = new Map((existingRows || []).map(row => [row.name, row.id]));
        const desiredNames = new Set(categories.map(item => item.name));

        const normalized = categories.map(item => ({
            id: isUuid(item.id) ? item.id : existingByName.get(item.name),
            user_id: userId,
            name: item.name,
            icon: item.icon,
            color: item.color
        }));

        if (normalized.length > 0) {
            const { error: upsertError } = await supabase
                .from('categories')
                .upsert(normalized as any);
            if (upsertError) throw upsertError;
        }

        const rowsToDelete = (existingRows || [])
            .filter(row => !desiredNames.has(row.name))
            .map(row => row.id);

        if (rowsToDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('categories')
                .delete()
                .eq('user_id', userId)
                .in('id', rowsToDelete);
            if (deleteError) throw deleteError;
        }

        return { success: true };
    } catch (error) {
        console.error('Error saving categories:', error);
        return { success: false, error };
    }
}

export async function saveTagsToSupabase(userId: string, tags: TagType[]) {
    try {
        const { data: existingRows, error: existingError } = await supabase
            .from('tags')
            .select('id, name')
            .eq('user_id', userId);
        if (existingError) throw existingError;

        const existingByName = new Map((existingRows || []).map(row => [row.name, row.id]));
        const desiredNames = new Set(tags.map(item => item.name));

        const normalized = tags.map(item => ({
            id: isUuid(item.id) ? item.id : existingByName.get(item.name),
            user_id: userId,
            name: item.name,
            color: item.color
        }));

        if (normalized.length > 0) {
            const { error: upsertError } = await supabase
                .from('tags')
                .upsert(normalized as any);
            if (upsertError) throw upsertError;
        }

        const rowsToDelete = (existingRows || [])
            .filter(row => !desiredNames.has(row.name))
            .map(row => row.id);

        if (rowsToDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('tags')
                .delete()
                .eq('user_id', userId)
                .in('id', rowsToDelete);
            if (deleteError) throw deleteError;
        }

        return { success: true };
    } catch (error) {
        console.error('Error saving tags:', error);
        return { success: false, error };
    }
}

// ==================== BIG DATA ====================

export async function loadBigDataWorkspacesFromSupabase(userId: string): Promise<BigDataWorkspaces> {
    try {
        const { data, error } = await supabase
            .from('big_data_sheets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const result: BigDataWorkspaces = {};
        for (const row of data || []) {
            const mode = row.mode || 'General';
            const metadata = (row.metadata || {}) as any;
            const clientId = typeof metadata?.client_id === 'string' ? metadata.client_id : row.id;
            const { client_id, ...restMeta } = metadata || {};

            if (!result[mode]) result[mode] = [];
            result[mode].push({
                id: clientId,
                name: row.name,
                content: row.content || '',
                metadata: Object.keys(restMeta).length > 0 ? restMeta : DEFAULT_SHEET_METADATA
            });
        }

        return result;
    } catch (error) {
        console.error('Error loading Big Data sheets:', error);
        return {};
    }
}

export async function saveBigDataWorkspacesToSupabase(userId: string, workspaces: BigDataWorkspaces) {
    try {
        const rows = Object.entries(workspaces || {}).flatMap(([mode, sheets]) => {
            return (sheets || []).map(sheet => {
                const metadata = sheet.metadata || DEFAULT_SHEET_METADATA;
                return {
                    user_id: userId,
                    mode,
                    name: sheet.name || 'Untitled',
                    content: sheet.content || '',
                    metadata: {
                        ...metadata,
                        client_id: sheet.id
                    }
                };
            });
        });

        const { error: deleteError } = await supabase
            .from('big_data_sheets')
            .delete()
            .eq('user_id', userId);
        if (deleteError) throw deleteError;

        if (rows.length > 0) {
            const { error: insertError } = await supabase
                .from('big_data_sheets')
                .insert(rows as any);
            if (insertError) throw insertError;
        }

        return { success: true };
    } catch (error) {
        console.error('Error saving Big Data sheets:', error);
        return { success: false, error };
    }
}

// ==================== MIGRATION ====================

export async function migrateLocalDataToSupabase(
    userId: string,
    basicTasks: Task[],
    advancedTasks: Task[],
    customizeTasks: Task[],
    categories: Category[],
    tags: TagType[],
    bigDataWorkspaces?: BigDataWorkspaces
) {
    try {
        const normalizeText = (value?: string | null) => (value || '').trim().toLowerCase();
        const normalizeDate = (value?: string | null) => (value || '').trim();
        const makeTaskFingerprint = (payload: {
            title?: string | null;
            mode?: string | null;
            createdAt?: string | null;
            dueDate?: string | null;
        }) => {
            return [
                normalizeText(payload.title),
                payload.mode || 'advanced',
                normalizeDate(payload.createdAt),
                normalizeDate(payload.dueDate)
            ].join('::');
        };

        const [categoriesResult, tagsResult] = await Promise.all([
            saveCategoriesToSupabase(userId, categories),
            saveTagsToSupabase(userId, tags)
        ]);

        if (!categoriesResult.success) throw categoriesResult.error;
        if (!tagsResult.success) throw tagsResult.error;

        const cloudCategories = await loadCategoriesFromSupabase(userId);
        const categoryIdByName = new Map(
            cloudCategories
                .filter(c => isUuid(c.id))
                .map(c => [c.name, c.id] as const)
        );

        const { data: existingRows, error: existingRowsError } = await supabase
            .from('tasks')
            .select('id, title, mode, created_at, due_date')
            .eq('user_id', userId);
        if (existingRowsError) throw existingRowsError;

        const existingIdByFingerprint = new Map<string, string>();
        for (const row of existingRows || []) {
            if (!isUuid(row.id)) continue;
            const fingerprint = makeTaskFingerprint({
                title: row.title,
                mode: row.mode,
                createdAt: row.created_at,
                dueDate: row.due_date
            });
            if (!existingIdByFingerprint.has(fingerprint)) {
                existingIdByFingerprint.set(fingerprint, row.id);
            }
        }

        const localTasksWithMode = [
            ...basicTasks.map(t => ({ ...t, mode: 'basic' as TaskMode })),
            ...advancedTasks.map(t => ({ ...t, mode: 'advanced' as TaskMode })),
            ...customizeTasks.map(t => ({ ...t, mode: 'customize' as TaskMode }))
        ];

        const seenFingerprints = new Set<string>();
        const tasksToInsert = localTasksWithMode
            .map(task => {
                const createdAtIso = task.createdAt ? new Date(task.createdAt).toISOString() : '';
                const dueDate = task.dueDate || '';
                const fingerprint = makeTaskFingerprint({
                    title: task.text,
                    mode: task.mode,
                    createdAt: createdAtIso,
                    dueDate
                });

                if (seenFingerprints.has(fingerprint)) {
                    return null;
                }
                seenFingerprints.add(fingerprint);

                const existingIdForLegacyTask = !isUuid(task.id)
                    ? existingIdByFingerprint.get(fingerprint)
                    : undefined;

                return {
                    id: isUuid(task.id) ? task.id : existingIdForLegacyTask,
                    user_id: userId,
                    title: task.text,
                    description: task.description || '',
                    category_id: task.category ? categoryIdByName.get(task.category) || null : null,
                    tags: task.tags || [],
                    due_date: task.dueDate || null,
                    reminder: task.reminder || null,
                    completed: task.completed,
                    mode: task.mode,
                    priority: task.priority || null,
                    attachments: (task.attachments || []) as any,
                    subtasks: (task.subtasks || []) as any,
                    notes: task.notes || '',
                    created_at: createdAtIso || undefined,
                    updated_at: new Date().toISOString()
                };
            })
            .filter(Boolean) as any[];

        if (tasksToInsert.length > 0) {
            const { error } = await supabase.from('tasks').upsert(tasksToInsert as any);
            if (error) throw error;
        }

        if (bigDataWorkspaces && Object.keys(bigDataWorkspaces).length > 0) {
            const bigDataResult = await saveBigDataWorkspacesToSupabase(userId, bigDataWorkspaces);
            if (!bigDataResult.success) throw bigDataResult.error;
        }

        return { success: true };
    } catch (error) {
        console.error('Full migration error:', error);
        return { success: false, error };
    }
}
