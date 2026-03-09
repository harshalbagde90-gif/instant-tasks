import React, { useState, useEffect, useCallback, useRef } from 'react';
import Lottie from 'lottie-react';
import { Sidebar } from '@/components/Sidebar';
import { TaskDetail } from '@/components/TaskDetail';
import { CategoryManageModal } from '@/components/CategoryManageModal';
import { AuthModal } from '@/components/AuthModal';
import { ReminderDialog } from '@/components/ReminderDialog';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { InfoIcon } from '@/components/InfoIcon';
import { UseCaseCard } from '@/components/UseCaseCard';
import { UseCaseModal } from '@/components/UseCaseModal';
import { GuestWarningDialog } from '@/components/GuestWarningDialog';
import { MigrationDialog } from '@/components/MigrationDialog';
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import BigDataConsole from '@/components/BigDataConsole';
import { CustomizeTaskView } from '@/components/CustomizeTaskView';
import { Task, AIAction, Category, TagType } from '@/types/task';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';
import * as supabaseSync from '@/lib/supabaseSync';
import * as guestDataUtils from '@/lib/guestDataUtils';
import * as LucideIcons from 'lucide-react';
import { isToday, isTomorrow, isAfter, startOfToday, parseISO, addDays, format, startOfWeek, isSameDay, subDays } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import {
    Search,
    Bell,
    Inbox,
    RefreshCw,
    Plus,
    Settings,
    MoreHorizontal,
    LayoutGrid,
    Filter,
    ChevronDown,
    Calendar,
    ListTodo,
    RotateCcw,
    Sparkles,
    Trash2,
    CheckSquare,
    Paperclip,
    Tag,
    ChevronsRight,
    Layout,
    Layers,
    Database,
    FileText,
    Check,
    Pencil,
    Clipboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { WallPrint } from '@/components/WallPrint';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";


const DEFAULT_CATEGORIES: Category[] = [
    { id: 'cat-1', name: 'Personal', icon: 'User', color: '#3b82f6' },
    { id: 'cat-2', name: 'Work', icon: 'Briefcase', color: '#10b981' },
    { id: 'cat-3', name: 'Mission', icon: 'Target', color: '#f59e0b' },
    { id: 'cat-4', name: 'Education', icon: 'GraduationCap', color: '#8b5cf6' },
    { id: 'cat-5', name: 'Health', icon: 'HeartPulse', color: '#ef4444' },
    { id: 'cat-6', name: 'Finance', icon: 'Wallet', color: '#14b8a6' },
    { id: 'cat-7', name: 'Shopping', icon: 'ShoppingCart', color: '#ec4899' },
    { id: 'cat-8', name: 'Home', icon: 'Home', color: '#f97316' },
    { id: 'cat-9', name: 'Travel', icon: 'Plane', color: '#06b6d4' },
    { id: 'cat-10', name: 'Hobby', icon: 'Palette', color: '#a855f7' },
];

const DEFAULT_TAGS: TagType[] = [
    { id: 'tag-1', name: 'Priority', color: '#fbbf24' },
    { id: 'tag-2', name: 'Important', color: '#ef4444' },
    { id: 'tag-3', name: 'Family', color: '#fb923c' },
    { id: 'tag-4', name: 'Deadline', color: '#ca8a04' },
    { id: 'tag-5', name: 'Personal', color: '#3b82f6' },
    { id: 'tag-6', name: 'Trackback', color: '#10b981' },
    { id: 'tag-7', name: 'Project', color: '#047857' },
    { id: 'tag-8', name: 'Work', color: '#6366f1' },
    { id: 'tag-9', name: 'Urgent', color: '#dc2626' },
    { id: 'tag-10', name: 'Meeting', color: '#8b5cf6' },
    { id: 'tag-11', name: 'Client', color: '#ec4899' },
    { id: 'tag-12', name: 'Research', color: '#06b6d4' },
];

const Index = () => {
    const [basicTasks, setBasicTasks] = useLocalStorage<Task[]>('taskflow-tasks-basic', []);
    const [advancedTasks, setAdvancedTasks] = useLocalStorage<Task[]>('taskflow-tasks-advanced', []);
    const [customizeTasks, setCustomizeTasks] = useLocalStorage<Task[]>('taskflow-tasks-customize', []);
    const [appMode, setAppMode] = useLocalStorage<'basic' | 'advanced' | 'big-data' | 'customize'>('app-mode', 'advanced');

    const [categories, setCategories] = useLocalStorage<Category[]>('task-categories', DEFAULT_CATEGORIES);
    const [availableTags, setAvailableTags] = useLocalStorage<TagType[]>('task-tags', DEFAULT_TAGS);

    const itemsPerRow = 3;
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [manageType, setManageType] = useState<'categories' | 'tags'>('categories');

    const tasks = appMode === 'basic' ? basicTasks : appMode === 'customize' ? customizeTasks : advancedTasks;
    const setTasks = (val: Task[] | ((prev: Task[]) => Task[])) => {
        if (appMode === 'basic') setBasicTasks(val);
        else if (appMode === 'customize') setCustomizeTasks(val);
        else setAdvancedTasks(val);
    };
    const [activeView, setActiveView] = useState('my-day');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [tasksToDelete, setTasksToDelete] = useState<string[]>([]);
    const [isModePopoverOpen, setIsModePopoverOpen] = useState(false);
    const [advancedViewMode, setAdvancedViewMode] = useLocalStorage<'one-day' | 'day-to-day'>('advanced-view-mode', 'one-day');
    const [activeMode, setActiveMode] = useState<'General' | 'Script' | 'Code' | 'Prompts'>('General');

    const [sidebarWidth, setSidebarWidth] = useLocalStorage<number>('sidebar-width', 288);
    const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage<boolean>('sidebar-open', true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [heroSubtitle, setHeroSubtitle] = useLocalStorage<string>('hero-subtitle', 'Time to make your own luck');
    const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isAuthBootstrapped, setIsAuthBootstrapped] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [pendingMode, setPendingMode] = useState<'advanced' | 'big-data' | 'customize' | null>(null);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [isUseCaseModalOpen, setIsUseCaseModalOpen] = useState(false);
    const [isUseCasePopoverOpen, setIsUseCasePopoverOpen] = useState(false);
    const [isGuestWarningOpen, setIsGuestWarningOpen] = useState(false);
    const [isMigrationOpen, setIsMigrationOpen] = useState(false);
    const [isMigrationComplete, setIsMigrationComplete] = useState(false);

    // 🔑 Guard: ensures cloud sync runs ONLY ONCE per app lifecycle
    // useRef because it persists across re-renders without causing them
    const cloudSyncDone = useRef(false);
    const lastCategoriesSynced = useRef('');
    const lastTagsSynced = useRef('');
    const lastBigDataSynced = useRef('');
    const [cloudBootstrapComplete, setCloudBootstrapComplete] = useState(false);

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [weekStartDate, setWeekStartDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));
    const [isTaskNoteOpen, setIsTaskNoteOpen] = useState(false);

    const [bigDataWorkspaces, setBigDataWorkspaces] = useState<Record<string, any[]>>(() => {
        const saved = localStorage.getItem('big-data-workspaces');
        return saved ? JSON.parse(saved) : {};
    });

    // Neural Sync: Monitoring Big Data workspace changes
    useEffect(() => {
        const handleStorageChange = () => {
            const saved = localStorage.getItem('big-data-workspaces');
            if (saved) setBigDataWorkspaces(JSON.parse(saved));
        };
        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(handleStorageChange, 2000); // Polling fallback
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    // Auto-activate pending mode after login
    useEffect(() => {
        if (user && pendingMode) {
            setAppMode(pendingMode);
            setPendingMode(null);
            toast.success(`${pendingMode === 'advanced' ? 'Advanced' : 'Big Data'} Mode Activated!`);
        }
    }, [user, pendingMode]);

    const handleTaskJump = (taskId: string) => {
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }

        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        setAppMode('advanced');
        setSelectedTaskId(taskId);

        if (task.dueDate) {
            setSelectedDate(new Date(task.dueDate));
            setAdvancedViewMode('day-to-day');
        } else {
            setAdvancedViewMode('one-day');
        }

        toast.success(`Neural Jump: Active Mission Focused`, {
            description: task.text.substring(0, 40) + '...'
        });
    };

    const handleSheetJump = (mode: string, sheetId: string) => {
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }

        setAppMode('big-data');
        setActiveMode(mode as any);

        // Update active sheet in localStorage for BigDataConsole
        const activeIds = JSON.parse(localStorage.getItem('big-data-active-ids') || '{}');
        activeIds[mode] = sheetId;
        localStorage.setItem('big-data-active-ids', JSON.stringify(activeIds));

        // Dispatch custom event for BigDataConsole to sync immediately
        window.dispatchEvent(new CustomEvent('big-data-jump', { detail: { mode, sheetId } }));

        toast.success(`Neural Jump: Data Sector Accessed`, {
            description: `${mode} > Sheet Reference: ${sheetId}`
        });
    };

    const fetchProfile = async (uid: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', uid)
            .single();

        if (data) {
            setProfile(data);
            setNewName(data.full_name || user?.user_metadata?.full_name || '');
            if (!data.onboarding_completed) {
                setTimeout(() => setIsOnboardingOpen(true), 1500);
            }
        } else if (error && user) {
            // If profile table fails, use auth metadata as fallback
            setNewName(user.user_metadata?.full_name || '');
        }
    };

    const updateProfileName = async () => {
        if (!user) return;

        try {
            // 1. Always update Auth Metadata first (stores in auth.users)
            const { data: authData, error: authError } = await supabase.auth.updateUser({
                data: { full_name: newName }
            });

            if (authError) throw authError;

            // 2. Attempt to update Profiles table (stores in public.profiles)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: newName,
                    updated_at: new Date().toISOString()
                });

            // If profile table doesn't exist, we skip it but keep the auth update
            if (profileError && !profileError.message.includes("Could not find the table")) {
                throw profileError;
            }

            setProfile(prev => ({ ...prev, full_name: newName }));
            setIsEditingName(false);
            toast.success("Identity Updated!");
        } catch (error: any) {
            console.error("Profile Update Error:", error);
            toast.error(`Sync Failed: ${error.message}`);
        }
    };

    useEffect(() => {
        if (user) {
            fetchProfile(user.id);
        } else {
            setProfile(null);
        }
    }, [user]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setIsAuthBootstrapped(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            setIsAuthBootstrapped(true);

            if (event === 'SIGNED_OUT') {
                guestDataUtils.setCloudOnlyModeActive(false);
                guestDataUtils.clearCloudCachedData();

                setAppMode('basic');
                setPendingMode(null);
                setBasicTasks([]);
                setAdvancedTasks([]);
                setCustomizeTasks([]);
                setCategories(DEFAULT_CATEGORIES);
                setAvailableTags(DEFAULT_TAGS);
                setBigDataWorkspaces({});
                localStorage.setItem('big-data-workspaces', JSON.stringify({}));

                window.location.reload();
            }
        });

        return () => subscription.unsubscribe();
    }, [setBasicTasks, setAdvancedTasks, setCustomizeTasks, setCategories, setAvailableTags]);

    // Check and clear expired guest data on mount
    useEffect(() => {
        if (!user && guestDataUtils.isGuestDataExpired()) {
            guestDataUtils.clearGuestData();
            toast.info('Guest data expired and cleared. Starting fresh!');
        }
    }, []);

        // Handle login migration + cloud data load - runs exactly once per session
    useEffect(() => {
        // If no user, reset guards (user logged out)
        if (!user) {
            if (!isAuthBootstrapped) return;
            if (localStorage.getItem(guestDataUtils.CLOUD_ONLY_MODE_KEY) === 'true') {
                guestDataUtils.setCloudOnlyModeActive(false);
                guestDataUtils.clearCloudCachedData();
            }
            cloudSyncDone.current = false;
            setCloudBootstrapComplete(false);
            lastCategoriesSynced.current = '';
            lastTagsSynced.current = '';
            lastBigDataSynced.current = '';
            return;
        }

        // Key guard: skip if already initialized for this session
        if (cloudSyncDone.current) return;
        cloudSyncDone.current = true;
        setCloudBootstrapComplete(false);

        const loadCloudData = async () => {
            console.log('Loading tasks from Supabase for user:', user.id);

            const settled = await Promise.allSettled([
                supabaseSync.loadAllTasksFromSupabase(user.id),
                supabaseSync.loadCategoriesFromSupabase(user.id),
                supabaseSync.loadTagsFromSupabase(user.id),
                supabaseSync.loadBigDataWorkspacesFromSupabase(user.id)
            ]);

            const [
                tasksByModeResult,
                categoriesResult,
                tagsResult,
                bigDataResult
            ] = settled;

            const cloudTasksByMode = tasksByModeResult.status === 'fulfilled'
                ? tasksByModeResult.value
                : { basic: [], advanced: [], customize: [] };
            const cloudBasicTasks = cloudTasksByMode.basic;
            const cloudAdvancedTasks = cloudTasksByMode.advanced;
            const cloudCustomizeTasks = cloudTasksByMode.customize;
            const cloudCategories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
            const cloudTags = tagsResult.status === 'fulfilled' ? tagsResult.value : [];
            const cloudBigData = bigDataResult.status === 'fulfilled' ? bigDataResult.value : {};

            const failedParts = settled.filter(result => result.status === 'rejected').length;
            if (failedParts > 0) {
                console.warn(`Cloud load partially failed (${failedParts}/4).`, settled);
                toast.warning('Some cloud data failed to load. Retrying in background.');
            }

            const resolvedCategories = cloudCategories.length > 0 ? cloudCategories : DEFAULT_CATEGORIES;
            const resolvedTags = cloudTags.length > 0 ? cloudTags : DEFAULT_TAGS;
            const resolvedBigData = cloudBigData || {};

            // Supabase is source of truth for logged-in users
            setBasicTasks(cloudBasicTasks);
            setAdvancedTasks(cloudAdvancedTasks);
            setCustomizeTasks(cloudCustomizeTasks);
            setCategories(resolvedCategories);
            setAvailableTags(resolvedTags);
            setBigDataWorkspaces(resolvedBigData);
            localStorage.setItem('big-data-workspaces', JSON.stringify(resolvedBigData));

            lastCategoriesSynced.current = cloudCategories.length > 0 ? JSON.stringify(resolvedCategories) : '';
            lastTagsSynced.current = cloudTags.length > 0 ? JSON.stringify(resolvedTags) : '';
            lastBigDataSynced.current = JSON.stringify(resolvedBigData);
            guestDataUtils.setCloudOnlyModeActive(true);
            setCloudBootstrapComplete(true);
        };

        const initializeCloudSync = async () => {
            try {
                if (guestDataUtils.hasGuestData()) {
                    // User logged in with local guest data -> migrate once
                    guestDataUtils.resetGuestWarningState();

                    toast.dismiss();
                    setIsMigrationOpen(true);
                    setIsMigrationComplete(false);

                    const result = await supabaseSync.migrateLocalDataToSupabase(
                        user.id,
                        basicTasks,
                        advancedTasks,
                        customizeTasks,
                        categories,
                        availableTags,
                        bigDataWorkspaces
                    );

                    if (!result.success) {
                        setIsMigrationOpen(false);
                        setCloudBootstrapComplete(false);
                        cloudSyncDone.current = false;
                        return;
                    }

                    guestDataUtils.clearGuestData();
                    await loadCloudData();

                    setIsMigrationComplete(true);
                    setTimeout(() => {
                        setIsMigrationOpen(false);
                        setIsMigrationComplete(false);
                    }, 2500);
                    return;
                }

                await loadCloudData();
            } catch (error) {
                console.error('Cloud initialization error:', error);
                setCloudBootstrapComplete(false);
                cloudSyncDone.current = false;
            }
        };

        void initializeCloudSync();
    }, [user, isAuthBootstrapped]);




    // 🚀 Real-time Cloud Sync Subscription
    useEffect(() => {
        if (!user || !cloudBootstrapComplete) return;

        const payload = JSON.stringify(categories);
        if (payload === lastCategoriesSynced.current) return;

        const timer = setTimeout(async () => {
            const result = await supabaseSync.saveCategoriesToSupabase(user.id, categories);
            if (result.success) {
                const freshCategories = await supabaseSync.loadCategoriesFromSupabase(user.id);
                if (freshCategories.length > 0) {
                    lastCategoriesSynced.current = JSON.stringify(freshCategories);
                    setCategories(freshCategories);
                } else {
                    lastCategoriesSynced.current = payload;
                }
            } else {
                toast.warning('Categories saved locally but cloud sync failed.');
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [user, cloudBootstrapComplete, categories]);

    useEffect(() => {
        if (!user || !cloudBootstrapComplete) return;

        const payload = JSON.stringify(availableTags);
        if (payload === lastTagsSynced.current) return;

        const timer = setTimeout(async () => {
            const result = await supabaseSync.saveTagsToSupabase(user.id, availableTags);
            if (result.success) {
                const freshTags = await supabaseSync.loadTagsFromSupabase(user.id);
                if (freshTags.length > 0) {
                    lastTagsSynced.current = JSON.stringify(freshTags);
                    setAvailableTags(freshTags);
                } else {
                    lastTagsSynced.current = payload;
                }
            } else {
                toast.warning('Tags saved locally but cloud sync failed.');
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [user, cloudBootstrapComplete, availableTags]);

    useEffect(() => {
        if (!user || !cloudBootstrapComplete) return;

        const payload = JSON.stringify(bigDataWorkspaces || {});
        if (payload === lastBigDataSynced.current) return;

        const timer = setTimeout(async () => {
            const result = await supabaseSync.saveBigDataWorkspacesToSupabase(user.id, bigDataWorkspaces || {});
            if (result.success) {
                lastBigDataSynced.current = payload;
            } else {
                toast.warning('Big Data workspace saved locally but cloud sync failed.');
            }
        }, 900);

        return () => clearTimeout(timer);
    }, [user, cloudBootstrapComplete, bigDataWorkspaces]);

    useEffect(() => {
        if (!user) return;

        // Subscribe to changes in the tasks table for the current user
        const channel = supabase
            .channel('realtime-tasks-sync')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('📡 Real-time update received:', payload.eventType, payload);

                    const mapRowToTask = (row: any): Task => ({
                        category: categories.find(c => c.id === row.category_id)?.name,
                        id: row.id,
                        text: row.title,
                        description: row.description || undefined,
                        tags: row.tags || [],
                        dueDate: row.due_date || undefined,
                        reminder: row.reminder || undefined,
                        completed: row.completed,
                        priority: row.priority as Task['priority'],
                        attachments: (row.attachments as any) || [],
                        subtasks: (row.subtasks as any) || [],
                        notes: row.notes || '',
                        createdAt: new Date(row.created_at).getTime(),
                    });

                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newTask = mapRowToTask(payload.new);
                        const mode = (payload.new as any).mode;

                        const updateFn = (prev: Task[]) => {
                            // Deduplicate by UUID
                            const existingIndex = prev.findIndex(t => t.id === newTask.id);

                            if (existingIndex > -1) {
                                // Just update if changed
                                const newList = [...prev];
                                newList[existingIndex] = newTask;
                                return newList;
                            } else {
                                // Truly new from other device
                                return [newTask, ...prev];
                            }
                        };

                        if (mode === 'basic') setBasicTasks(updateFn);
                        else if (mode === 'advanced') setAdvancedTasks(updateFn);
                        else if (mode === 'customize') setCustomizeTasks(updateFn);
                    }
                    else if (payload.eventType === 'DELETE') {
                        const deletedId = (payload.old as any).id;
                        const removeFn = (prev: Task[]) => prev.filter(t => t.id !== deletedId);

                        setBasicTasks(removeFn);
                        setAdvancedTasks(removeFn);
                        setCustomizeTasks(removeFn);
                    }
                }
            )
            .subscribe((status) => {
                console.log('🔌 Real-time status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, categories]);

    const getGreeting = (date: Date) => {
        const hour = date.getHours();
        if (hour >= 5 && hour < 12) return 'Good Morning';
        if (hour >= 12 && hour < 17) return 'Good Afternoon';
        if (hour >= 17 && hour < 22) return 'Good Evening';
        return 'Midnight Focus';
    };

    const getTimeAnimation = (date: Date) => {
        const hour = date.getHours();
        if (hour >= 5 && hour < 12) return '/Json animation/Morning.json';
        if (hour >= 12 && hour < 17) return '/Json animation/Afternoon.json';
        return '/Json animation/night.json';
    };

    const [animationData, setAnimationData] = useState<any>(null);

    useEffect(() => {
        const loadAnimation = async () => {
            try {
                const response = await fetch(getTimeAnimation(currentTime));
                const data = await response.json();
                setAnimationData(data);
            } catch (error) {
                console.error('Failed to load animation:', error);
            }
        };
        loadAnimation();
    }, [currentTime.getHours()]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setSelectedTaskId(null);
        setIsRefreshing(true);
        const timer = setTimeout(() => setIsRefreshing(false), 600);
        return () => clearTimeout(timer);
    }, [appMode]);

    const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

    // One Day bucket: only unscheduled tasks (no due date).
    const isTodayTask = (t: Task) => !t.dueDate;
    const isTomorrowTask = (t: Task) => t.dueDate && isTomorrow(parseISO(t.dueDate));
    const isUpcomingTask = (t: Task) => t.dueDate && isAfter(parseISO(t.dueDate), addDays(startOfToday(), 1));
    const isTargetDateTask = (t: Task) => t.dueDate && isSameDay(parseISO(t.dueDate), selectedDate);

    const todayTasks = tasks.filter(isTodayTask);
    const tomorrowTasks = tasks.filter(isTomorrowTask);
    const upcomingTasks = tasks.filter(isUpcomingTask);
    const targetDateTasks = tasks.filter(isTargetDateTask);

    const visibleTasks = (() => {
        if (appMode === 'basic') return tasks;

        // Detailed filtering for Advanced/Big Data modes
        switch (activeView) {
            case 'my-day':
                return advancedViewMode === 'one-day' ? todayTasks : targetDateTasks;
            case 'high-priority':
                return tasks.filter(t => (t.priority === 'high' || t.priority === 'urgent'));
            case 'next-7-days':
                return tasks.filter(t => t.dueDate && isAfter(parseISO(t.dueDate), subDays(new Date(), 1)));
            case 'brain-dump':
                return tasks.filter(t => !t.dueDate);
            case 'archives':
                return tasks.filter(t => t.completed);
            case 'all-tasks':
                return tasks;
            default:
                return tasks;
        }
    })();

    const tasksByDate = tasks.reduce((acc: Record<string, Task[]>, task) => {
        if (task.dueDate) {
            const dateStr = format(parseISO(task.dueDate), 'yyyy-MM-dd');
            if (!acc[dateStr]) acc[dateStr] = [];
            acc[dateStr].push(task);
        }
        return acc;
    }, {});

    const activeTasks = visibleTasks.filter(t => !t.completed);
    const completedTasks = visibleTasks.filter(t => t.completed);

    const taskCounts = {
        myDay: activeTasks.length,
        next7Days: tasks.filter(t => !t.completed).length,
        allTasks: tasks.length,
        highPriority: tasks.filter(t => !t.completed && (t.priority === 'high' || t.priority === 'urgent')).length,
        archives: tasks.filter(t => t.completed).length,
        brainDump: tasks.filter(t => !t.completed && !t.dueDate).length
    };

    const addTask = async (text: string) => {
        if (!text.trim()) return;

        // Guest user: Show warning on first task
        if (!user && !guestDataUtils.hasSeenGuestWarning()) {
            guestDataUtils.initializeGuestDataTimestamp();
            guestDataUtils.markGuestWarningAsShown();
            setIsGuestWarningOpen(true);
        }

        // Generate a real UUID on frontend to prevent cross-device duplicates
        const newTask: Task = {
            id: crypto.randomUUID(),
            text,
            completed: false,
            createdAt: Date.now(),
            dueDate: (appMode === 'advanced' && advancedViewMode === 'day-to-day')
                ? selectedDate.toISOString()
                : undefined
        };

        setTasks(prev => [newTask, ...prev]);

        if (user) {
            const mode = appMode === 'basic' ? 'basic' : appMode === 'customize' ? 'customize' : 'advanced';
            const result = await supabaseSync.upsertTaskToSupabase(user.id, newTask, mode, categories);
            if (!result.success) {
                toast.warning('⚠️ Cloud sync failed. Task saved locally.');
            }
        }

        const dateStr = appMode === 'advanced' && advancedViewMode === 'day-to-day'
            ? format(selectedDate, 'MMM do')
            : "your day";
        toast.success(`Task added to ${dateStr}`);
    };

    const toggleTask = async (id: string) => {
        const taskToToggle = tasks.find(t => t.id === id);
        if (!taskToToggle) return;

        const updatedTask = { ...taskToToggle, completed: !taskToToggle.completed };

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));

        if (user) {
            const mode = appMode === 'basic' ? 'basic' : appMode === 'customize' ? 'customize' : 'advanced';
            const result = await supabaseSync.upsertTaskToSupabase(user.id, updatedTask, mode, categories);
            if (!result.success) {
                toast.warning('⚠️ Sync failed. Status saved locally.');
            }
        }
    };

    const deleteTask = async (id: string) => {
        // Optimistic update
        setTasks(prev => prev.filter(t => t.id !== id));
        if (selectedTaskId === id) setSelectedTaskId(null);
        toast.error("Task deleted");

        if (user) {
            const result = await supabaseSync.deleteTaskFromSupabase(user.id, id);
            if (!result.success) {
                toast.warning('⚠️ Task deleted locally but cloud sync failed.');
            }
        }
    };

    const createCustomizeTask = async (task: Task) => {
        if (!user && !guestDataUtils.hasSeenGuestWarning()) {
            guestDataUtils.initializeGuestDataTimestamp();
            guestDataUtils.markGuestWarningAsShown();
            setIsGuestWarningOpen(true);
        }

        setCustomizeTasks(prev => [task, ...prev]);

        if (user) {
            const result = await supabaseSync.upsertTaskToSupabase(user.id, task, 'customize', categories);
            if (!result.success) {
                toast.warning('Cloud sync failed. Task saved locally.');
            }
        }
    };

    const updateCustomizeTask = async (id: string, updates: Partial<Task>) => {
        const existing = customizeTasks.find(t => t.id === id);
        if (!existing) return;

        const updatedTask = { ...existing, ...updates };
        setCustomizeTasks(prev => prev.map(t => t.id === id ? updatedTask : t));

        if (user) {
            const result = await supabaseSync.upsertTaskToSupabase(user.id, updatedTask, 'customize', categories);
            if (!result.success) {
                toast.warning('Changes saved locally but cloud sync failed.');
            }
        }
    };

    const deleteCustomizeTask = async (id: string) => {
        setCustomizeTasks(prev => prev.filter(t => t.id !== id));

        if (user) {
            const result = await supabaseSync.deleteTaskFromSupabase(user.id, id);
            if (!result.success) {
                toast.warning('Task deleted locally but cloud sync failed.');
            }
        }
    };

    const handleAIAction = useCallback(async (id: string, action: AIAction | 'selection-ai' | 'big-data-temp', options?: any): Promise<string | string[]> => {
        const stripTags = (t: string) => t.replace(/\[[\s\S]*?\]/g, '');
        const rawText = options?.text || tasks.find(t => t.id === id)?.text;
        const taskText = action === 'selection-ai' || action === 'big-data-temp' ? stripTags(rawText || "") : rawText;

        if (!taskText && action !== 'big-data-temp') throw new Error('Task not found');

        const localRepair = (text: string, lang: string) => {
            let res = text;
            if (lang === 'Hinglish') {
                res = res.replace(/\bklro\b/gi, 'karo').replace(/\bmjhe\b/gi, 'mujhe').replace(/\bkrna\b/gi, 'karna').replace(/\bh\b/gi, 'hai').replace(/\bkam\b/gi, 'kaam').replace(/\bbtao\b/gi, 'batao');
            } else {
                res = res.replace(/\bwne?\b/gi, 'want to').replace(/\bwna\b/gi, 'want to').replace(/\bproprety\b/gi, 'property').replace(/\bsa soon as\b/gi, 'as soon as').replace(/\bsa possible\b/gi, 'as soon as possible').replace(/\bposisbel\b/gi, 'possible').replace(/\bpossibl\b/gi, 'possible').replace(/\bto to\b/gi, 'to').replace(/\bake\b/gi, 'make').replace(/\bgroeries\b/gi, 'groceries').replace(/\bi want o\b/gi, 'I want to').replace(/\bi wants\b/gi, 'I want').replace(/\btomorow\b/gi, 'tomorrow');
            }
            res = res.replace(/[\[\];+>|]/g, '').replace(/\s\s+/g, ' ').trim();
            return res;
        };

        try {
            const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
            let result: string | string[] = "";

            console.log('🔍 [AI Debug] Starting AI action:', action, 'for task ID:', id);
            console.log('🔑 [AI Debug] API Key present:', !!GEMINI_API_KEY, 'Valid:', GEMINI_API_KEY && !GEMINI_API_KEY.includes("YOUR_"));

            if (GEMINI_API_KEY && !GEMINI_API_KEY.includes("YOUR_")) {
                let systemPrompt = "";
                let userPrompt = "";

                if (action === 'selection-ai') {
                    systemPrompt = `You are an AI Editor. Action Mode: ${options.mode || 'General'}. \nINSTRUCTION: ${options.instruction || 'Improve the text'}.\n\nRULES:\n1. Apply the instruction ONLY to the provided text segment.\n2. Maintain the context of the surrounding document if provided.\n3. Return ONLY the edited text. No conversational filler.`;
                    userPrompt = `CONTEXT: ${options.context || 'N/A'}\n\nEDIT THIS TEXT: "${taskText}"\n\nINSTRUCTION: ${options.instruction}`;
                } else if (action === 'big-data-temp' || action === 'improve') {
                    const mode = options?.mode || 'General';
                    systemPrompt = `You are a rigorous proofreader. Your ONLY job is to take the user text and return it with PERFECT grammar, spelling, and punctuation. DO NOT keep typos like 'thios' or 'etaing'. Fix every error. DANGER: Return ONLY the corrected text. NO conversation. NO explanations. NO "Here is your text". Just the plain corrected string.`;
                    userPrompt = `Fix this text:\n\n${taskText}`;
                } else if (action === 'shorten') {
                    systemPrompt = "Shorten the mission to max 8 words. Return ONLY corrected text.";
                    userPrompt = `Shorten: "${taskText}"`;
                } else if (action === 'breakdown') {
                    systemPrompt = "Break down mission into 3 actionable steps. Return ONLY a JSON array of strings.";
                    userPrompt = `Breakdown: "${taskText}"`;
                }

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        system_instruction: {
                            parts: [{ text: systemPrompt }]
                        },
                        contents: [{
                            role: "user",
                            parts: [{ text: userPrompt }]
                        }],
                        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
                    })
                });

                if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
                const data = await response.json();
                result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
                console.log('🤖 [AI Debug] Raw API response:', result);
            } else {
                // Mock/Fallback
                result = taskText;
                console.log('⚠️ [AI Debug] No API key, using fallback text');
            }

            if (typeof result === 'string') {
                result = result.replace(/```[a-z]*\n?|```/gi, '').replace(/^["']|["']$/g, '').trim();
                console.log('✨ [AI Debug] Cleaned result:', result);
                console.log('📝 [AI Debug] Original text:', taskText.trim());
                console.log('🔄 [AI Debug] Are they same?', result.trim() === taskText.trim());
                if (action === 'improve' && result.trim() === taskText.trim()) {
                    console.log('⏭️ [AI Debug] Returning __NO_CHANGE__');
                    return "__NO_CHANGE__";
                }
            }

            if (action === 'breakdown' && typeof result === 'string') {
                const textToParse = result;
                try {
                    const jsonMatch = textToParse.match(/\[[\s\S]*\]/);
                    if (jsonMatch) result = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    result = [textToParse];
                }
            }

            if (action === 'improve' && id !== 'big-data-temp') {
                console.log('💾 [AI Debug] Calling updateTask with ID:', id, 'New text:', result);
                const taskExists = tasks.find(t => t.id === id);
                console.log('✅ [AI Debug] Task exists?', !!taskExists, 'Task data:', taskExists);
                updateTask(id, { text: result as string, previousText: tasks.find(t => t.id === id)?.text });
            }

            return result;
        } catch (err: any) {
            console.error("AI Error:", err);
            toast.error(`AI Failed: ${err.message}`);
            return taskText;
        }
    }, [tasks, selectedLanguage]);

    const updateTask = async (id: string, updates: Partial<Task>) => {
        const taskToUpdate = tasks.find(t => t.id === id);
        if (!taskToUpdate) return;

        const updatedTask = { ...taskToUpdate, ...updates };

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));

        if (user) {
            const mode = appMode === 'basic' ? 'basic' : appMode === 'customize' ? 'customize' : 'advanced';
            const result = await supabaseSync.upsertTaskToSupabase(user.id, updatedTask, mode, categories);
            if (!result.success) {
                toast.warning('⚠️ Changes saved locally but cloud sync failed.');
            }
        }
    };

    const handleUndoTask = useCallback((id: string) => {
        let revertedTask: Task | null = null;

        setTasks(prev => prev.map(task => {
            if (task.id === id && task.previousText) {
                revertedTask = { ...task, text: task.previousText, previousText: undefined };
                return revertedTask;
            }
            return task;
        }));

        if (user && revertedTask) {
            const mode = appMode === 'basic' ? 'basic' : appMode === 'customize' ? 'customize' : 'advanced';
            void supabaseSync.upsertTaskToSupabase(user.id, revertedTask, mode, categories);
        }

        toast.success('Changes reverted');
    }, [setTasks, user, appMode, categories]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const handleBulkDelete = async () => {
        const idsToDelete = [...tasksToDelete];
        setTasks(prev => prev.filter(t => !idsToDelete.includes(t.id)));
        setTasksToDelete([]);
        setIsResetDialogOpen(false);
        toast.error(`${tasksToDelete.length} missions terminated`);

        if (user && idsToDelete.length > 0) {
            const results = await Promise.all(
                idsToDelete.map(id => supabaseSync.deleteTaskFromSupabase(user.id, id))
            );
            if (results.some(result => !result.success)) {
                toast.warning('Some deleted tasks failed to sync with cloud.');
            }
        }
    };

    const toggleSelectAll = () => {
        if (tasksToDelete.length === tasks.length) {
            setTasksToDelete([]);
        } else {
            setTasksToDelete(tasks.map(t => t.id));
        }
    };

    const syncChangedTasks = async (
        mode: 'basic' | 'advanced' | 'customize',
        changedTasks: Task[],
        categorySnapshot: Category[] = categories
    ) => {
        if (!user || changedTasks.length === 0) return;

        const results = await Promise.all(
            changedTasks.map(task => supabaseSync.upsertTaskToSupabase(user.id, task, mode, categorySnapshot))
        );

        if (results.some(result => !result.success)) {
            toast.warning('Some updated tasks could not be synced to cloud.');
        }
    };

    const handleRenameItem = async (oldName: string, newName: string) => {
        const updateList = (list: Task[]) => {
            const changed: Task[] = [];
            const updated = list.map(task => {
                if (manageType === 'categories') {
                    if (task.category === oldName) {
                        const nextTask = { ...task, category: newName };
                        changed.push(nextTask);
                        return nextTask;
                    }
                } else if (task.tags?.includes(oldName)) {
                    const nextTask = { ...task, tags: task.tags.map(t => t === oldName ? newName : t) };
                    changed.push(nextTask);
                    return nextTask;
                }
                return task;
            });
            return { updated, changed };
        };

        const basicResult = updateList(basicTasks);
        const advancedResult = updateList(advancedTasks);
        const customizeResult = updateList(customizeTasks);

        setBasicTasks(basicResult.updated);
        setAdvancedTasks(advancedResult.updated);
        setCustomizeTasks(customizeResult.updated);

        const categorySnapshot = manageType === 'categories'
            ? categories.map(item => item.name === oldName ? { ...item, name: newName } : item)
            : categories;

        await Promise.all([
            syncChangedTasks('basic', basicResult.changed, categorySnapshot),
            syncChangedTasks('advanced', advancedResult.changed, categorySnapshot),
            syncChangedTasks('customize', customizeResult.changed, categorySnapshot),
        ]);
    };

    const handleDeleteItem = async (name: string) => {
        const updateList = (list: Task[]) => {
            const changed: Task[] = [];
            const updated = list.map(task => {
                if (manageType === 'categories') {
                    if (task.category === name) {
                        const nextTask = { ...task, category: undefined };
                        changed.push(nextTask);
                        return nextTask;
                    }
                } else if (task.tags?.includes(name)) {
                    const nextTask = { ...task, tags: task.tags.filter(t => t !== name) };
                    changed.push(nextTask);
                    return nextTask;
                }
                return task;
            });
            return { updated, changed };
        };

        const basicResult = updateList(basicTasks);
        const advancedResult = updateList(advancedTasks);
        const customizeResult = updateList(customizeTasks);

        setBasicTasks(basicResult.updated);
        setAdvancedTasks(advancedResult.updated);
        setCustomizeTasks(customizeResult.updated);

        await Promise.all([
            syncChangedTasks('basic', basicResult.changed),
            syncChangedTasks('advanced', advancedResult.changed),
            syncChangedTasks('customize', customizeResult.changed),
        ]);
    };

    const completionPercentage = visibleTasks.length > 0 ? Math.round((completedTasks.length / visibleTasks.length) * 100) : 0;

    return (
        <div className="flex h-screen bg-background text-muted-foreground overflow-hidden font-sans selection:bg-primary/30 selection:text-foreground">
            <Sidebar
                activeView={activeView}
                setActiveView={setActiveView}
                taskCounts={taskCounts}
                width={sidebarWidth}
                setWidth={setSidebarWidth}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                appMode={appMode}
                setAppMode={setAppMode}
                onLanguageChange={setSelectedLanguage}
                selectedLanguage={selectedLanguage}
                onAuthClick={() => setIsAuthModalOpen(true)}
                user={user}
                profile={profile}
                categories={categories}
                tags={availableTags}
                onProfileUpdate={() => user && fetchProfile(user.id)}
                tasks={tasks}
                customizeTasks={customizeTasks}
                bigDataWorkspaces={bigDataWorkspaces}
                onTaskClick={handleTaskJump}
                onSheetClick={handleSheetJump}
            />

            <button
                onClick={() => setIsSidebarOpen(true)}
                className={cn(
                    "fixed left-0 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-4 py-6 px-1.5 bg-background/80 backdrop-blur-md border-y border-r border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:bg-muted hover:border-[#D4AF37] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all duration-700 rounded-r-2xl group",
                    isSidebarOpen ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
                )}
            >
                <ChevronsRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-0.5 transition-transform" />
                <div className="flex flex-col items-center gap-1">
                    {['P', 'A', 'N', 'E', 'L'].map((char, i) => (
                        <span key={i} className="text-[9px] font-black text-[#D4AF37] tracking-tighter leading-none">{char}</span>
                    ))}
                </div>
            </button>

            <main
                className={cn("flex-1 flex flex-col min-w-0 transition-all duration-500 bg-background dark:bg-transparent relative overflow-hidden")}
                style={{ marginRight: selectedTaskId ? "450px" : "0" }}
            >
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden hidden dark:block">
                    <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                        <source src="/Videos/Background Star.mp4" type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-black/60" />
                </div>

                <header className={cn("h-14 md:h-16 flex items-center justify-between border-b border-border bg-background/40 backdrop-blur-xl z-30 sticky top-0 transition-all duration-500", isSidebarOpen ? "px-3 md:px-6" : "px-4 md:px-10")}>
                    <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center gap-2 md:gap-3 z-50">
                        <Popover open={isModePopoverOpen} onOpenChange={setIsModePopoverOpen}>
                            <PopoverTrigger asChild>
                                <div className="flex items-center gap-3 px-6 md:px-10 py-2 bg-zinc-900/90 backdrop-blur-xl border border-[#FACC15]/40 rounded-full shadow-[0_0_25px_rgba(250,204,21,0.2)] cursor-pointer group hover:border-[#FACC15] hover:shadow-[0_0_40px_rgba(250,204,21,0.4)] transition-all duration-500 relative overflow-hidden group/mode">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000" />
                                    <LayoutGrid className="w-4 h-4 md:w-5 md:h-5 text-[#FACC15] group-hover:rotate-12 transition-all duration-300" />
                                    <span className="text-[12px] md:text-base font-black text-[#FACC15] tracking-[0.05em] uppercase whitespace-nowrap drop-shadow-[0_0_12px_rgba(250,204,21,0.4)]">
                                        <span className="opacity-40 mr-1.5 font-bold tracking-normal italic normal-case">mode:</span>
                                        {appMode === 'basic' ? 'Basic' : appMode === 'advanced' ? 'Advanced' : appMode === 'customize' ? 'Customize' : 'Big Data'}
                                    </span>
                                    <div className="flex items-center gap-2 ml-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-pulse shadow-[0_0_12px_#FACC15]" />
                                        <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 group-hover:text-[#FACC15] transition-all" />
                                    </div>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2 bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl z-50" align="start">
                                <div className="space-y-1">
                                    {[
                                        { id: 'basic', Icon: Layout, label: 'Basic Mode', desc: 'Clean & Simple' },
                                        { id: 'advanced', Icon: Layers, label: 'Advanced Mode', desc: 'Powerful Detail' },
                                        { id: 'big-data', Icon: Database, label: 'Big Data Mode', desc: 'Maximum Insight' },
                                        { id: 'customize', Icon: Settings, label: 'Customize Task', desc: 'Subtasks & Progress' }
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => {
                                                if (mode.id !== 'basic' && !user) {
                                                    setPendingMode(mode.id as 'advanced' | 'big-data' | 'customize');
                                                    setIsAuthModalOpen(true);
                                                    setIsModePopoverOpen(false);
                                                    toast.info("Login Required for " + mode.label);
                                                    return;
                                                }
                                                setAppMode(mode.id as any);
                                                setIsModePopoverOpen(false);
                                            }}
                                            className={cn("w-full flex items-center justify-between p-3 rounded-xl transition-all", appMode === mode.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted")}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn("p-2 rounded-lg", appMode === mode.id ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                                    <mode.Icon className="w-4 h-4" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-xs font-black uppercase tracking-tight leading-none mb-1">{mode.label}</div>
                                                    <div className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">{mode.desc}</div>
                                                </div>
                                            </div>
                                            {appMode === mode.id && <Check className="w-4 h-4 stroke-[3]" />}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Info Icon - Desktop Hover (Outside mode card) */}
                        <Popover open={isUseCasePopoverOpen} onOpenChange={setIsUseCasePopoverOpen}>
                            <PopoverTrigger asChild>
                                <div className="hidden md:block">
                                    <InfoIcon size={20} />
                                </div>
                            </PopoverTrigger>
                            <PopoverContent
                                className="p-0 border-0 bg-transparent shadow-none w-auto"
                                align="start"
                                side="bottom"
                                sideOffset={8}
                            >
                                <UseCaseCard mode={appMode} />
                            </PopoverContent>
                        </Popover>

                        {/* Info Icon - Mobile Click (Outside mode card) */}
                        <div
                            className="md:hidden"
                            onClick={() => setIsUseCaseModalOpen(true)}
                        >
                            <InfoIcon size={18} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-3">
                            <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} />
                            <ThemeToggle isNavbar />
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleRefresh} className={cn("rounded-full hidden md:flex", isRefreshing && "animate-spin")}><RefreshCw className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="rounded-full relative"><Bell className="w-4 h-4" /><span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full" /></Button>
                    </div>
                </header>

                <div id="main-content-area" className={cn("flex-1 overflow-y-auto pt-8 md:pt-0 pb-28 md:pb-10 custom-scrollbar relative z-10 transition-all", isSidebarOpen ? "px-3 md:px-6" : "px-4 md:px-10", isRefreshing && "opacity-20 blur-sm")}>
                    <div className="relative">
                        <div className="mt-8 md:mt-10 pl-0 md:pl-8 flex flex-col gap-4 md:gap-8">
                            <div className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-6 w-full justify-center md:justify-start">
                                <div className="flex flex-row items-center gap-3 md:gap-6 w-full justify-center md:w-auto md:justify-start">
                                    {animationData && (
                                        <div className="w-12 h-12 md:w-20 md:h-20 flex-shrink-0">
                                            <Lottie animationData={animationData} loop={true} className="w-full h-full" />
                                        </div>
                                    )}
                                    <div className="flex flex-col items-start cursor-default group/hero">
                                        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none font-sans hover:translate-x-1 transition-all duration-500 hover:text-white dark:hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] text-left">
                                            {getGreeting(currentTime)}<span className="text-primary group-hover/hero:animate-pulse">.</span>
                                        </h1>
                                        <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-all duration-500 group/name justify-start">
                                            <div className="w-4 h-[1.5px] bg-primary/60 group-hover/name:w-8 transition-all" />

                                            {isEditingName ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        autoFocus
                                                        className="bg-zinc-800/50 border border-primary/30 rounded-lg px-2 py-0.5 text-sm font-medium text-white outline-none focus:border-primary transition-all w-48"
                                                        value={newName}
                                                        onChange={(e) => setNewName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') updateProfileName();
                                                            if (e.key === 'Escape') setIsEditingName(false);
                                                        }}
                                                    />
                                                    <button onClick={updateProfileName} className="p-1 hover:bg-primary/20 rounded-md transition-colors">
                                                        <Check className="w-3 h-3 text-primary" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="text-sm md:text-xl font-medium tracking-[0.15em] uppercase hover:text-primary transition-colors duration-500"
                                                        onDoubleClick={() => setIsEditingName(true)}
                                                    >
                                                        {profile?.full_name || user?.user_metadata?.full_name || (user ? user.email?.split('@')[0] : 'Guest User')}
                                                    </span>
                                                    <button
                                                        onClick={() => setIsEditingName(true)}
                                                        className="opacity-0 group-hover/name:opacity-100 p-1.5 hover:bg-white/5 rounded-full transition-all duration-300"
                                                    >
                                                        <Pencil className="w-3 h-3 text-zinc-500 hover:text-primary" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={cn(appMode === 'big-data' ? "ml-0 md:ml-4" : "ml-0 md:ml-9", "w-full md:w-auto flex justify-center md:justify-start")}>
                                    <div className="flex flex-col justify-center items-center md:items-start bg-black/40 md:bg-white/[0.04] backdrop-blur-xl px-4 py-4 md:px-5 md:py-1.5 rounded-[2rem] md:rounded-2xl border border-white/5 md:border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] md:shadow-[0_0_25px_rgba(0,0,0,0.4)] min-w-[200px] md:min-w-0 w-[95%] md:w-auto md:border-l-2 md:border-l-primary/60">

                                        {/* Mobile View: Digital Clock Style */}
                                        <div className="flex flex-col items-center md:hidden w-full">
                                            <span className="text-3xl font-black text-[#FACC15] font-mono tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                                                {format(currentTime, 'hh:mm:ss a')}
                                            </span>
                                            <div className="flex items-center gap-2 mt-3 text-sm font-bold text-zinc-500 uppercase tracking-[0.2em]">
                                                <span>{format(currentTime, 'EEEE')}</span>
                                                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                                                <span>{format(currentTime, 'MMM dd yyyy')}</span>
                                            </div>
                                        </div>

                                        {/* Desktop View: Enhanced Visibility */}
                                        <div className="hidden md:flex flex-col gap-0.5">
                                            <span className="text-[9px] font-black text-primary/50 uppercase tracking-[0.3em] text-left">
                                                {format(currentTime, 'EEEE')}
                                            </span>
                                            <span className="text-[20px] font-black text-primary uppercase tracking-tight text-left leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.4)]">
                                                {format(currentTime, 'hh:mm:ss a')}
                                            </span>
                                            <div className="w-full h-[1px] bg-white/10 my-1" />
                                            <span className="text-[11px] font-black text-white/70 uppercase tracking-widest text-left">
                                                {format(currentTime, 'MMM dd, yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {appMode === 'advanced' && (
                                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-left duration-700">
                                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full">

                                        {/* Mobile Toggle Container */}
                                        <div className="flex items-center justify-center gap-3 w-full md:w-auto">
                                            <div className="flex-1 md:hidden bg-zinc-900/80 rounded-full p-1.5 flex border border-white/5">
                                                <button
                                                    onClick={() => setAdvancedViewMode('one-day')}
                                                    className={cn("flex-1 py-3 rounded-full text-[10px] font-black font-mono uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2", advancedViewMode === 'one-day' ? "bg-[#FACC15] text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300")}
                                                >
                                                    <LucideIcons.Target className="w-3.5 h-3.5" /> One Day
                                                </button>
                                                <button
                                                    onClick={() => setAdvancedViewMode('day-to-day')}
                                                    className={cn("flex-1 py-3 rounded-full text-[10px] font-black font-mono uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2", advancedViewMode === 'day-to-day' ? "bg-[#FACC15] text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300")}
                                                >
                                                    <LucideIcons.CalendarRange className="w-3.5 h-3.5" /> Day To Day
                                                </button>
                                            </div>
                                        </div>

                                        {/* Desktop Toggle Container (Original) */}
                                        <div className="hidden md:flex bg-white/[0.03] backdrop-blur-md border border-white/10 p-1.5 rounded-2xl shadow-2xl">
                                            <button
                                                onClick={() => setAdvancedViewMode('one-day')}
                                                className={cn("px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-2", advancedViewMode === 'one-day' ? "bg-primary text-black shadow-[0_0_20px_rgba(var(--primary),0.3)]" : "text-zinc-500 hover:text-zinc-300")}
                                            >
                                                <LucideIcons.Target className="w-4 h-4" /> One Day
                                            </button>
                                            <button
                                                onClick={() => setAdvancedViewMode('day-to-day')}
                                                className={cn("px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-2", advancedViewMode === 'day-to-day' ? "bg-primary text-black shadow-[0_0_20px_rgba(var(--primary),0.3)]" : "text-zinc-500 hover:text-zinc-300")}
                                            >
                                                <LucideIcons.CalendarRange className="w-4 h-4" /> Day to Day
                                            </button>
                                        </div>

                                        <div className="hidden md:flex flex-col">
                                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] leading-none">Operational View</span>
                                            <span className="text-[10px] font-black text-primary uppercase tracking-tight mt-1.5">{advancedViewMode === 'one-day' ? 'Tactical Focus' : 'Strategic Planning'}</span>
                                        </div>
                                    </div>

                                    {advancedViewMode === 'day-to-day' && (
                                        <div className="space-y-4 animate-in slide-in-from-left duration-700">
                                            <div className="flex items-center justify-between max-w-2xl px-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Target Date</span>
                                                    <h4 className="text-xl font-black text-foreground uppercase tracking-tight">
                                                        {format(selectedDate, 'MMMM d, yyyy')}
                                                    </h4>
                                                </div>

                                                <Dialog open={isTaskNoteOpen} onOpenChange={setIsTaskNoteOpen}>
                                                    <DialogTrigger asChild>
                                                        <button className="group flex flex-col items-end gap-1 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl transition-all duration-500">
                                                            <div className="flex items-center gap-2">
                                                                <LucideIcons.StickyNote className="w-3.5 h-3.5 text-primary group-hover:rotate-12 transition-transform" />
                                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Task Note</span>
                                                            </div>
                                                            <div className="text-[9px] font-bold text-primary/60 uppercase group-hover:text-primary transition-colors">
                                                                {targetDateTasks.length} {targetDateTasks.length === 1 ? 'Active Mission' : 'Active Missions'} on {isToday(selectedDate) ? 'Today' : format(selectedDate, 'eee')}
                                                            </div>
                                                        </button>
                                                    </DialogTrigger>
                                                    <DialogContent className="bg-black/95 backdrop-blur-2xl border-2 border-white/10 text-white max-w-2xl rounded-[2.5rem] p-8 overflow-hidden">
                                                        <DialogHeader className="mb-8">
                                                            <DialogTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                                                                <LucideIcons.ClipboardList className="w-8 h-8 text-primary" />
                                                                <span>Strategic Overview</span>
                                                            </DialogTitle>
                                                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.1em] mt-3 px-1 leading-relaxed max-w-lg">
                                                                See all your missions and dates at a glance. Check how many tasks are on each day and click any date to jump there instantly.
                                                            </p>
                                                        </DialogHeader>

                                                        <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                            {Object.entries(tasksByDate)
                                                                .sort(([a], [b]) => a.localeCompare(b))
                                                                .map(([dateStr, dateTasks]) => {
                                                                    const dateObj = parseISO(dateStr);
                                                                    const isActive = isSameDay(dateObj, selectedDate);
                                                                    return (
                                                                        <button
                                                                            key={dateStr}
                                                                            onClick={() => {
                                                                                setSelectedDate(dateObj);
                                                                                setWeekStartDate(startOfWeek(dateObj, { weekStartsOn: 0 }));
                                                                                setIsTaskNoteOpen(false);
                                                                            }}
                                                                            className={cn(
                                                                                "flex items-center justify-between p-5 rounded-3xl border transition-all duration-500 text-left group relative overflow-hidden",
                                                                                "bg-[#FACC15] border-[#D4AF37] shadow-[0_10px_30px_rgba(250,204,21,0.1)] hover:shadow-[0_15px_40px_rgba(250,204,21,0.2)] hover:scale-[1.02]",
                                                                                isActive && "ring-4 ring-white/30 border-white"
                                                                            )}
                                                                        >
                                                                            {isActive && (
                                                                                <div className="absolute top-0 right-0 bg-black text-[#FACC15] text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                                                                                    Current Sector
                                                                                </div>
                                                                            )}
                                                                            <div className="flex flex-col gap-1">
                                                                                <span className="text-[10px] font-black uppercase tracking-widest text-black/60">
                                                                                    {format(dateObj, 'EEEE')}
                                                                                </span>
                                                                                <span className="text-lg font-black tracking-tighter text-black">
                                                                                    {format(dateObj, 'MMM d, yyyy')}
                                                                                </span>
                                                                            </div>
                                                                            <div className={cn(
                                                                                "w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all shadow-inner",
                                                                                isActive ? "bg-black text-primary" : "bg-black/10 text-black/80 group-hover:bg-black/20"
                                                                            )}>
                                                                                {dateTasks.length}
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            {Object.keys(tasksByDate).length === 0 && (
                                                                <div className="col-span-2 py-20 flex flex-col items-center opacity-20">
                                                                    <LucideIcons.FolderOpen className="w-12 h-12 mb-4" />
                                                                    <span className="text-xs font-black uppercase tracking-widest">No Intelligence Data Found</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center px-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Active Sectors: {Object.keys(tasksByDate).length}</span>
                                                            </div>
                                                            <Button variant="ghost" onClick={() => setIsTaskNoteOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest">Return to Tactical</Button>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>

                                            <div className="flex items-center gap-4 max-w-2xl">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setWeekStartDate(prev => subDays(prev, 7))}
                                                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-primary hover:text-black transition-all"
                                                >
                                                    <LucideIcons.ChevronLeft className="w-5 h-5" />
                                                </Button>

                                                <div className="flex-1 flex gap-2">
                                                    {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                                                        const date = addDays(weekStartDate, offset);
                                                        const isSelected = isSameDay(date, selectedDate);
                                                        const isTodayDate = isToday(date);

                                                        return (
                                                            <button
                                                                key={offset}
                                                                onClick={() => setSelectedDate(date)}
                                                                className={cn(
                                                                    "flex-1 flex flex-col items-center py-3 rounded-2xl border transition-all duration-500 group relative overflow-hidden",
                                                                    isSelected
                                                                        ? "bg-primary border-primary shadow-[0_0_30px_rgba(var(--primary),0.4)] scale-105 z-10"
                                                                        : "bg-white/[0.02] border-white/5 hover:border-primary/40 hover:bg-white/[0.05]"
                                                                )}
                                                            >
                                                                <span className={cn(
                                                                    "text-[10px] font-black uppercase tracking-widest mb-1",
                                                                    isSelected ? "text-black" : "text-zinc-500 group-hover:text-zinc-300"
                                                                )}>
                                                                    {format(date, 'eee')}
                                                                </span>
                                                                <span className={cn(
                                                                    "text-lg font-black",
                                                                    isSelected ? "text-black" : "text-foreground"
                                                                )}>
                                                                    {format(date, 'd')}
                                                                </span>
                                                                {isTodayDate && !isSelected && (
                                                                    <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
                                                                )}
                                                                {isSelected && (
                                                                    <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setWeekStartDate(prev => addDays(prev, 7))}
                                                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-primary hover:text-black transition-all"
                                                >
                                                    <LucideIcons.ChevronRight className="w-5 h-5" />
                                                </Button>

                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-primary hover:text-black transition-all"
                                                        >
                                                            <LucideIcons.Calendar className="w-5 h-5" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden z-[100]" align="end">
                                                        <DayPicker
                                                            mode="single"
                                                            selected={selectedDate}
                                                            onSelect={(date) => {
                                                                if (date) {
                                                                    setSelectedDate(date);
                                                                    setWeekStartDate(startOfWeek(date, { weekStartsOn: 0 }));
                                                                }
                                                            }}
                                                            className="p-4 rounded-3xl"
                                                            styles={{
                                                                caption: { color: 'white', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em' },
                                                                head_cell: { color: '#666', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' },
                                                                day: { fontWeight: '700', borderRadius: '12px' },
                                                            }}
                                                            modifiersStyles={{
                                                                selected: { backgroundColor: 'var(--primary)', color: 'black' },
                                                                today: { color: 'var(--primary)', border: '1px solid var(--primary)' }
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={cn(
                            "hidden md:block relative md:absolute right-0 z-20 transition-all duration-700 ease-in-out order-first md:order-last",
                            appMode === 'big-data' ? "top-0 md:-top-8" : appMode === 'customize' ? "top-0 md:top-0 md:right-8" : "top-0 md:top-6",
                            appMode === 'customize' ? "mt-0 mb-4 mx-auto md:mx-0 max-w-[280px]" : "mt-0 md:mt-0 mb-6 md:mb-0 mx-auto md:mx-0 max-w-sm md:max-w-none",
                            (isSidebarOpen || selectedTaskId) ? "md:opacity-0 md:translate-x-10 md:pointer-events-none md:blur-xl md:scale-90" : "opacity-100 translate-x-0 scale-100"
                        )}>
                            <WallPrint compact={appMode === 'customize'} />
                        </div>
                    </div>

                    {appMode !== 'big-data' && appMode !== 'customize' && (
                        <div className="max-w-2xl mt-6 md:mt-16 group relative">
                            <div className={cn(
                                "relative bg-card rounded-full md:rounded-[2rem] border-2 border-white/5 p-2 md:p-1.5 flex items-center gap-3 transition-all duration-500 overflow-hidden",
                                "hover:border-[#D4AF37]/40 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]",
                                "focus-within:border-[#D4AF37] focus-within:shadow-[0_0_40px_rgba(212,175,55,0.2)]"
                            )}>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/5 to-[#D4AF37]/0 translate-x-[-100%] group-hover:translate-x-[100%] duration-[1500ms] ease-in-out transition-transform pointer-events-none" />
                                <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center ml-2">
                                    <Plus className="w-5 h-5 text-[#D4AF37]" />
                                </div>
                                <input
                                    id="task-input-field"
                                    className="flex-1 bg-transparent border-none outline-none text-foreground text-base font-bold py-4 placeholder:text-zinc-600 tracking-tight"
                                    placeholder="TYPE YOUR MISSION..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            addTask(e.currentTarget.value);
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const input = document.getElementById('task-input-field') as HTMLInputElement;
                                        if (input && input.value.trim()) {
                                            addTask(input.value);
                                            input.value = '';
                                        }
                                    }}
                                    className="mr-2 h-9 md:h-10 px-4 md:px-6 rounded-2xl bg-[#D4AF37] text-black text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 hover:scale-[1.05] active:scale-95 shadow-[0_5px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_8px_25px_rgba(212,175,55,0.5)] -ml-3 md:ml-0"
                                >
                                    Enter
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-12 pt-10">
                        {/* MISSION PROGRESS METER / DATA MODE SELECTOR */}
                        {appMode !== 'customize' && <section className="space-y-4 max-w-2xl animate-in fade-in slide-in-from-bottom duration-700 delay-500">
                            {appMode === 'big-data' ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <span className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em]">Operational Phase</span>
                                    </div>
                                    <div className="flex bg-zinc-900 border border-white/5 p-1 px-1.5 rounded-2xl shadow-inner w-full md:w-fit overflow-x-auto no-scrollbar scroll-smooth">
                                        <div className="flex gap-1.5 min-w-max">
                                            {['General', 'Script', 'Code', 'Prompts'].map((m) => (
                                                <button
                                                    key={m}
                                                    onClick={() => setActiveMode(m as any)}
                                                    className={cn(
                                                        "px-5 md:px-6 py-2 rounded-xl text-[9px] md:text-[9.5px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                                                        activeMode === m
                                                            ? "bg-primary text-black shadow-[0_4px_12px_rgba(212,175,55,0.3)]"
                                                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                                    )}
                                                >
                                                    {m}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-end justify-between px-1">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Efficiency</span>
                                            <h3 className="text-sm font-bold text-muted-foreground">{completionPercentage === 100 ? "Mission Accomplished!" : `${completionPercentage}% Secured`}</h3>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-black text-foreground">{completionPercentage}%</span>
                                            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                                                <DialogTrigger asChild><Button variant="ghost" size="icon" className="w-8 h-8 rounded-full border border-red-500/10"><Trash2 className="w-4 h-4 text-red-500/40" /></Button></DialogTrigger>
                                                <DialogContent className="bg-[#050505] border-2 border-white/20 text-white max-w-2xl rounded-[2.5rem] p-8 flex flex-col shadow-[0_0_50px_rgba(255,0,0,0.1)]">
                                                    <DialogHeader className="mb-6">
                                                        <div className="flex items-center justify-between w-full">
                                                            <DialogTitle className="text-2xl font-black uppercase flex items-center gap-4">
                                                                <Trash2 className="w-6 h-6 text-red-500 animate-pulse" />
                                                                <span>Mission Termination</span>
                                                            </DialogTitle>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={toggleSelectAll}
                                                                className={cn(
                                                                    "text-[10px] font-black uppercase tracking-widest transition-all rounded-xl",
                                                                    tasksToDelete.length === tasks.length
                                                                        ? "bg-primary/20 border-primary text-primary"
                                                                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                                                )}
                                                            >
                                                                {tasksToDelete.length === tasks.length ? 'Deselect All' : 'Select All Objectives'}
                                                            </Button>
                                                        </div>
                                                    </DialogHeader>

                                                    <div className="flex-1 overflow-y-auto max-h-[400px] space-y-3 pr-2 custom-scrollbar my-4">
                                                        {tasks.map(task => (
                                                            <div
                                                                key={task.id}
                                                                onClick={() => tasksToDelete.includes(task.id) ? setTasksToDelete(prev => prev.filter(id => id !== task.id)) : setTasksToDelete(prev => [...prev, task.id])}
                                                                className={cn(
                                                                    "flex items-center gap-4 p-4 rounded-3xl border transition-all cursor-pointer group",
                                                                    tasksToDelete.includes(task.id)
                                                                        ? "bg-red-500/10 border-red-500/40"
                                                                        : "bg-white/[0.02] border-white/5 hover:border-white/20"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                                                    tasksToDelete.includes(task.id) ? "bg-red-500 border-red-500" : "border-white/20 group-hover:border-white/40"
                                                                )}>
                                                                    {tasksToDelete.includes(task.id) && <Check className="w-3 h-3 text-white stroke-[4]" />}
                                                                </div>
                                                                <span className={cn(
                                                                    "text-sm font-bold truncate transition-colors",
                                                                    tasksToDelete.includes(task.id) ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                                                                )}>
                                                                    {task.text}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {tasks.length === 0 && (
                                                            <div className="py-10 text-center opacity-30 font-black uppercase tracking-widest text-xs">No Missions to Purge</div>
                                                        )}
                                                    </div>

                                                    <DialogFooter className="mt-6 flex gap-4">
                                                        <Button variant="ghost" onClick={() => setIsResetDialogOpen(false)} className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest">Abort</Button>
                                                        <Button
                                                            onClick={handleBulkDelete}
                                                            disabled={tasksToDelete.length === 0}
                                                            className="flex-[2] h-12 bg-red-600 hover:bg-red-700 rounded-2xl font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(220,38,38,0.2)]"
                                                        >
                                                            Terminate {tasksToDelete.length} Missions
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border">
                                        <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${completionPercentage}%` }} />
                                    </div>
                                </>
                            )}
                        </section>}

                        {(appMode !== 'advanced' || advancedViewMode === 'one-day') && appMode !== 'big-data' && appMode !== 'customize' && (
                            <section className="space-y-6">
                                <div className="flex items-center justify-between px-1">
                                    <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">{appMode === 'basic' ? 'Live Tasks' : 'Today\'s Missions'}</h2>
                                    <span className="text-[10px] font-bold text-zinc-600 uppercase">{activeTasks.length} objectives</span>
                                </div>
                                <div className="space-y-3">
                                    {activeTasks.map((task, index) => (
                                        <TaskItemView key={task.id} task={task} index={index + 1} isSelected={selectedTaskId === task.id} appMode={appMode} categories={categories} availableTags={availableTags} onClick={() => setSelectedTaskId(task.id === selectedTaskId ? null : task.id)} onToggle={() => toggleTask(task.id)} onAIAction={handleAIAction} onUndo={handleUndoTask} onUpdate={updateTask} user={user} userEmail={user?.email} onAuthClick={() => setIsAuthModalOpen(true)} />
                                    ))}
                                    {activeTasks.length === 0 && (
                                        <div className="py-20 flex flex-col items-center justify-center opacity-20"><ListTodo className="w-12 h-12 mb-4" /><span className="text-xs font-black uppercase tracking-widest">No Active Missions</span></div>
                                    )}
                                </div>
                            </section>
                        )}

                        {appMode === 'advanced' && advancedViewMode === 'day-to-day' && (
                            <div className="space-y-16 pt-6">
                                <TaskGroup
                                    title={`Missions for ${format(selectedDate, 'MMM do')}`}
                                    tasks={targetDateTasks.filter(t => !t.completed)}
                                    {...{ appMode, categories, availableTags, selectedTaskId, setSelectedTaskId, toggleTask, handleAIAction, handleUndoTask, updateTask, user, setIsAuthModalOpen }}
                                    color="primary"
                                />
                                {targetDateTasks.length === 0 && (
                                    <div className="py-20 flex flex-col items-center justify-center opacity-20">
                                        <ListTodo className="w-12 h-12 mb-4" />
                                        <span className="text-xs font-black uppercase tracking-widest text-center">No Objectives Scheduled <br /> for this Sector</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {appMode !== 'big-data' && appMode !== 'customize' && completedTasks.length > 0 && (
                            <section className="space-y-4 pt-10 border-t border-white/5">
                                <h2 className="text-[10px] font-black text-zinc-700 uppercase tracking-widest px-1">Completed Objectives</h2>
                                <div className="space-y-2 opacity-50 grayscale hover:opacity-100 transition-all">
                                    {completedTasks.map((task, index) => (
                                        <TaskItemView key={task.id} task={task} index={index + 1} isSelected={selectedTaskId === task.id} appMode={appMode} categories={categories} availableTags={availableTags} onClick={() => setSelectedTaskId(task.id === selectedTaskId ? null : task.id)} onToggle={() => toggleTask(task.id)} onAIAction={handleAIAction} onUndo={handleUndoTask} onUpdate={updateTask} user={user} userEmail={user?.email} onAuthClick={() => setIsAuthModalOpen(true)} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {appMode === 'big-data' && <BigDataConsole handleAIAction={handleAIAction} activeMode={activeMode} setActiveMode={setActiveMode} />}

                        {appMode === 'customize' && (
                            <CustomizeTaskView
                                tasks={customizeTasks}
                                setTasks={setCustomizeTasks}
                                onCreateTask={createCustomizeTask}
                                onUpdateTask={updateCustomizeTask}
                                onDeleteTask={deleteCustomizeTask}
                                categories={categories}
                                availableTags={availableTags}
                                onManageCategories={() => { setManageType('categories'); setIsManageModalOpen(true); }}
                                onManageTags={() => { setManageType('tags'); setIsManageModalOpen(true); }}
                            />
                        )}
                    </div>
                </div>
            </main>

            <TaskDetail
                task={selectedTask}
                onClose={() => setSelectedTaskId(null)}
                onDelete={deleteTask}
                onToggle={toggleTask}
                onUpdate={(updates) => selectedTask && updateTask(selectedTask.id, updates)}
                appMode={appMode}
                categories={categories}
                availableTags={availableTags}
                onManage={(type) => {
                    setManageType(type);
                    setIsManageModalOpen(true);
                }}
            />

            <CategoryManageModal isOpen={isManageModalOpen} onOpenChange={setIsManageModalOpen} type={manageType} categories={categories} setCategories={setCategories} tags={availableTags} setTags={setAvailableTags} onRenameItem={handleRenameItem} onDeleteItem={handleDeleteItem} />
            <AuthModal isOpen={isAuthModalOpen} onClose={() => { setIsAuthModalOpen(false); setPendingMode(null); }} />
            {user && <OnboardingWizard isOpen={isOnboardingOpen} userId={user.id} onComplete={() => { setIsOnboardingOpen(false); fetchProfile(user.id); }} />}

            {/* Use Case Modal for Mobile */}
            <UseCaseModal
                mode={appMode}
                isOpen={isUseCaseModalOpen}
                onClose={() => setIsUseCaseModalOpen(false)}
            />

            {/* Mobile Bottom Navigation Bar */}
            <div className={cn(
                "md:hidden fixed bottom-6 left-4 right-4 h-16 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] z-[100] flex items-center justify-between px-6 shadow-2xl transition-all duration-500",
                selectedTaskId
                    ? "translate-y-32 opacity-0 pointer-events-none"
                    : "translate-y-0 opacity-100"
            )}>
                <button onClick={() => { handleRefresh(); document.getElementById('main-content-area')?.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex flex-col items-center gap-1 group">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#FACC15] transition-colors">
                        <RefreshCw className={cn("w-4 h-4 text-zinc-400 group-hover:text-black transition-colors", isRefreshing && "animate-spin")} />
                    </div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-[#FACC15]">Refresh</span>
                </button>

                <button
                    onClick={() => {
                        const root = window.document.documentElement;
                        const isDark = root.classList.contains('dark');
                        if (isDark) {
                            root.classList.remove('dark');
                            root.classList.add('light');
                            localStorage.setItem('theme', 'light');
                        } else {
                            root.classList.remove('light');
                            root.classList.add('dark');
                            localStorage.setItem('theme', 'dark');
                        }
                    }}
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#FACC15] transition-colors">
                        <LucideIcons.SunMoon className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors" />
                    </div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-[#FACC15]">Theme</span>
                </button>

                <button
                    onClick={async () => {
                        if (appMode === 'big-data') {
                            // Paste from clipboard in Big Data mode
                            try {
                                const text = await navigator.clipboard.readText();
                                if (text.trim()) {
                                    // Dispatch event to BigDataConsole to paste
                                    window.dispatchEvent(new CustomEvent('paste-to-sheet', { detail: { content: text } }));
                                    toast.success('Content pasted to active sheet!');
                                } else {
                                    toast.error('Clipboard is empty');
                                }
                            } catch (error) {
                                toast.error('Failed to read clipboard');
                                console.error('Clipboard error:', error);
                            }
                        } else {
                            // Focus input in other modes
                            const input = document.getElementById('task-input-field');
                            if (input) input.focus();
                        }
                    }}
                    className="relative -top-6 w-14 h-14 bg-[#FACC15] rounded-[1.5rem] flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.4)] border-4 border-black transition-transform active:scale-95"
                >
                    {appMode === 'big-data' ? (
                        <Clipboard className="w-6 h-6 text-black" />
                    ) : (
                        <Plus className="w-6 h-6 text-black" />
                    )}
                </button>

                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex flex-col items-center gap-1 group">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#FACC15] transition-colors">
                                <LucideIcons.Languages className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors" />
                            </div>
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-[#FACC15]">Lang</span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-40 p-0 bg-zinc-900 border-zinc-800 mb-4">
                        <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} mobileMode />
                    </PopoverContent>
                </Popover>

                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="flex flex-col items-center gap-1 group">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#FACC15] transition-colors">
                        <Settings className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors" />
                    </div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-[#FACC15]">Menu</span>
                </button>
            </div>

            {/* Guest Warning Dialog */}
            <GuestWarningDialog
                isOpen={isGuestWarningOpen}
                onClose={() => setIsGuestWarningOpen(false)}
                onLogin={() => setIsAuthModalOpen(true)}
            />

            {/* Migration Dialog */}
            <MigrationDialog
                isOpen={isMigrationOpen}
                isComplete={isMigrationComplete}
            />

            {/* Use Case Modal for Mobile */}
            <UseCaseModal
                isOpen={isUseCaseModalOpen}
                onClose={() => setIsUseCaseModalOpen(false)}
                mode={appMode}
            />

            {/* Auth Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => {
                    setIsAuthModalOpen(false);
                    setPendingMode(null);
                }}
            />
        </div>
    );
};

const TaskGroup = ({ title, tasks, ...props }: any) => {
    if (tasks.length === 0) return null;
    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div className={cn("w-1.5 h-1.5 rounded-full", props.color === 'primary' ? 'bg-primary' : props.color === 'blue-500' ? 'bg-blue-500' : 'bg-zinc-500')} />
                    <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">{title}</h2>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{tasks.length} objectives</span>
            </div>
            <div className="space-y-3">
                {tasks.map((task: any, index: number) => (
                    <TaskItemView key={task.id} task={task} index={index + 1} isSelected={props.selectedTaskId === task.id} onClick={() => props.setSelectedTaskId(task.id === props.selectedTaskId ? null : task.id)} onToggle={() => props.toggleTask(task.id)} onAIAction={props.handleAIAction} onUndo={props.handleUndoTask} onUpdate={props.updateTask} user={props.user} onAuthClick={() => props.setIsAuthModalOpen(true)} appMode={props.appMode} categories={props.categories} availableTags={props.availableTags} />
                ))}
            </div>
        </section>
    );
};

const CategoryIcon = ({ name, className, style }: { name: string, className?: string, style?: React.CSSProperties }) => {
    const IconComponent = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent className={className} style={style} />;
};

const TaskItemView = ({
    task, isSelected, onClick, onToggle, onAIAction, onUndo, index,
    appMode, categories, availableTags, user, userEmail, onAuthClick, onUpdate
}: any) => {
    const [isFixing, setIsFixing] = useState(false);
    const [isReminderOpen, setIsReminderOpen] = useState(false);
    return (
        <>
        <div
            onClick={onClick}
            className={cn(
                "group relative flex items-center justify-between p-5 rounded-[2rem] cursor-pointer transition-all duration-500",
                isSelected ? "bg-muted border-2 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.15)]" : "bg-card/40 border border-border/50 hover:bg-muted"
            )}
        >
            <div className="flex items-center gap-6">
                <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="relative">
                    <div className={cn(
                        "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
                        task.completed ? "bg-primary border-primary" : "border-border hover:border-primary"
                    )}>
                        {task.completed ? <Check className="w-4 h-4 text-primary-foreground stroke-[4]" /> : <div className="w-2 h-2 rounded-full bg-muted" />}
                    </div>
                </button>
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                        {index && <span className="text-[14px] font-black text-primary/60 uppercase tabular-nums">{index.toString().padStart(2, '0')}.</span>}
                        <span className={cn("text-sm md:text-base font-bold tracking-tight line-clamp-2 md:line-clamp-none", task.completed ? "text-muted-foreground/50 line-through" : "text-foreground group-hover:text-primary")}>{task.text}</span>
                    </div>
                    {appMode === 'advanced' && (
                        <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                            {(() => {
                                const cat = categories?.find((c: any) => c.name === (task.category || 'Mission'));
                                return (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border" style={{ backgroundColor: `${cat?.color || '#3b82f6'}10`, borderColor: `${cat?.color || '#3b82f6'}30` }}>
                                        <CategoryIcon name={cat?.icon || 'Target'} className="w-2.5 h-2.5" style={{ color: cat?.color || '#3b82f6' }} />
                                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: cat?.color || '#3b82f6' }}>{task.category || 'Mission'}</span>
                                    </div>
                                );
                            })()}
                            {task.tags && task.tags.length > 0 && task.tags.slice(0, 3).map((tagName: string) => {
                                const tagObj = availableTags?.find((t: any) => t.name === tagName);
                                const tagColor = tagObj?.color || '#6366f1';
                                return (
                                    <div key={tagName} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border" style={{ backgroundColor: `${tagColor}12`, borderColor: `${tagColor}30`, color: tagColor }}>
                                        <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: tagColor }} />
                                        <span className="text-[8px] font-black uppercase tracking-tight">{tagName}</span>
                                    </div>
                                );
                            })}
                            {task.tags && task.tags.length > 3 && (
                                <span className="text-[8px] font-black text-muted-foreground/50 uppercase">+{task.tags.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); if (!user) { onAuthClick?.(); return; } setIsReminderOpen(true); }}
                    className={cn(
                        "relative w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100",
                        task.emailReminderEnabled ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 !opacity-100" : "bg-white/5 text-gray-500 border border-white/10 hover:text-yellow-400"
                    )}
                >
                    <Bell className="w-3.5 h-3.5" />
                    {task.emailReminderEnabled && <span className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full top-1 right-1 animate-pulse" />}
                </button>
                {!task.completed && (
                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-primary"
                        onClick={async (e) => {
                            e.stopPropagation();
                            setIsFixing(true);
                            const result = await onAIAction(task.id, 'improve');
                            setIsFixing(false);
                            if (result === "__NO_CHANGE__") { toast.info("ALREADY OPTIMIZED"); } else { toast.success("Refined Successfully"); }
                        }}
                        disabled={isFixing}
                    >
                        <Sparkles className={cn("w-5 h-5", isFixing && "animate-spin")} />
                    </Button>
                )}
            </div>
        </div>
        <ReminderDialog isOpen={isReminderOpen} onClose={() => setIsReminderOpen(false)} task={task} userEmail={userEmail} onUpdate={onUpdate} />
        </>
    );
};

export default Index;
