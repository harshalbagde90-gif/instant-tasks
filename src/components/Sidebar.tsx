import React, { useState, useRef, useEffect } from 'react';
import {
    Sun,
    Calendar,
    Hash,
    ChevronDown,
    ChevronsLeft,
    LayoutGrid,
    Zap,
    Database,
    Briefcase,
    User,
    LogOut,
    LogIn,
    Sparkles,
    ShieldAlert,
    Archive,
    CloudLightning,
    Target,
    Activity,
    Lock,
    Settings,
    Camera,
    Loader2,
    ChevronRight,
    Search,
    BarChart3,
    FileText,
    ArrowLeft,
    Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { User as UserType } from '@supabase/supabase-js';
import { isToday, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from 'sonner';

interface SidebarProps {
    activeView: string;
    setActiveView: (view: string) => void;
    taskCounts: {
        myDay: number;
        next7Days: number;
        allTasks: number;
        highPriority: number;
        archives: number;
        brainDump: number;
    };
    width: number;
    setWidth: (width: number) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    appMode: 'basic' | 'advanced' | 'big-data' | 'customize';
    setAppMode: (mode: 'basic' | 'advanced' | 'big-data' | 'customize') => void;
    onLanguageChange: (lang: string) => void;
    selectedLanguage: string;
    onAuthClick?: () => void;
    user: UserType | null;
    profile: any | null;
    categories: any[];
    tags: any[];
    onProfileUpdate?: () => void;
    // New Props for Task Monitor
    tasks?: any[];
    customizeTasks?: any[];
    bigDataWorkspaces?: Record<string, any[]>;
    onTaskClick?: (taskId: string) => void;
    onSheetClick?: (mode: string, sheetId: string) => void;
}

export function Sidebar({
    activeView,
    setActiveView,
    taskCounts,
    width,
    setWidth,
    isOpen,
    setIsOpen,
    appMode,
    setAppMode,
    onLanguageChange,
    selectedLanguage,
    onAuthClick,
    user,
    profile,
    categories,
    tags,
    onProfileUpdate,
    tasks = [],
    bigDataWorkspaces = {},
    onTaskClick,
    onSheetClick,
    customizeTasks = [],
}: SidebarProps) {
    const isResizing = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // Dropdown States
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
    const [isOneDayOpen, setIsOneDayOpen] = useState(true);
    const [isDayToDayOpen, setIsDayToDayOpen] = useState(false);
    const [isBigDataOpen, setIsBigDataOpen] = useState(false);
    const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

    const startResizing = (e: React.MouseEvent) => {
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'col-resize';
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = e.clientX;
        if (newWidth > 260 && newWidth < 450) {
            setWidth(newWidth);
        }
    };

    const stopResizing = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'default';
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `profile-pic.${fileExt}`;
            const folderPath = user?.id;
            const filePath = `${folderPath}/${fileName}`;

            if (file.size > 2 * 1024 * 1024) {
                toast.error("File size exceeds 2MB limit.");
                return;
            }

            try {
                const { data: existingFiles } = await supabase.storage
                    .from('avatars')
                    .list(folderPath || '');

                if (existingFiles && existingFiles.length > 0) {
                    const filesToDelete = existingFiles.map(f => `${folderPath}/${f.name}`);
                    await supabase.storage
                        .from('avatars')
                        .remove(filesToDelete);
                }
            } catch (cleanupError) {
                console.warn("Cleanup failed, proceeding with upload:", cleanupError);
            }

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user?.id,
                    avatar_url: `${publicUrl}?t=${Date.now()}`,
                    updated_at: new Date().toISOString()
                });

            if (updateError) throw updateError;

            toast.success("Profile Picture Updated!");
            onProfileUpdate?.();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    // Calculate Grouped Tasks for Sidebar Display
    const oneDayTasks = tasks.filter(t => !t.dueDate);
    const dayToDayTasks = tasks.filter(t => !!t.dueDate);

    // Calculate Counts: Only count sheets that have content
    const advancedTasksCount = tasks.length;
    const oneDayCount = oneDayTasks.length;
    const dayToDayCount = dayToDayTasks.length;

    let bigDataSheetsCount = 0;
    Object.values(bigDataWorkspaces).forEach(sheets => {
        bigDataSheetsCount += sheets.filter(s => s.content && s.content.trim() !== '').length;
    });

    return (
        <>
            {/* Immersive Backdrop for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-[90] md:hidden transition-opacity duration-500 animate-in fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "fixed md:relative h-screen bg-black md:bg-black/95 backdrop-blur-3xl border-r transition-all duration-500 ease-in-out z-[100] md:z-40 flex flex-col overflow-hidden",
                    appMode === 'big-data' ? "border-primary/20 shadow-[10px_0_50px_rgba(212,175,55,0.05)]" : "border-white/5",
                    !isOpen ? "-translate-x-full md:translate-x-0 md:w-0 border-none opacity-0 pointer-events-none" : "translate-x-0 w-full md:w-auto opacity-100"
                )}
                style={{ width: isOpen && typeof window !== 'undefined' && window.innerWidth >= 768 ? `${width}px` : undefined }}
            >
                <div className={cn("h-full flex flex-col no-scrollbar", !isOpen && "md:hidden")} style={{ width: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : `${width}px`, minWidth: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : `${width}px` }}>
                    {/* Mobile Back Button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="md:hidden absolute top-6 right-4 flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 border border-white/10 text-white z-[110] transition-all active:scale-95 shadow-lg"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back</span>
                    </button>



                    {/* 1. Header: Tactical Mode Switcher */}
                    <div className="p-4 pt-6 relative group">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className={cn(
                                    "w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-500 relative overflow-hidden group/btn",
                                    appMode === 'big-data' ? "bg-primary/5 border-primary/30" : "bg-white/[0.03] border-white/10"
                                )}>
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className={cn(
                                            "w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-500",
                                            appMode === 'big-data' ? "bg-primary/20 border-primary animate-pulse-gold" :
                                                appMode === 'advanced' ? "bg-primary/20 border-primary animate-pulse-tech" :
                                                    "bg-white/10 border-white/20 animate-pulse-silver"
                                        )}>
                                            {appMode === 'basic' && <LayoutGrid className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />}
                                            {appMode === 'advanced' && <Zap className="w-4 h-4 text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />}
                                            {appMode === 'big-data' && <Database className="w-4 h-4 text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />}
                                        </div>
                                        <div className="flex flex-col items-start translate-y-[-1px]">
                                            <span className="text-[9px] font-black text-primary/60 uppercase tracking-[0.2em] mb-0.5">Operative Mode</span>
                                            <span className="text-[11px] font-black text-white uppercase tracking-[0.1em] flex items-center gap-2">
                                                {appMode === 'big-data' ? 'BIG DATA' : appMode === 'advanced' ? 'ADVANCED' : 'BASIC'}
                                                <div className="w-1 h-1 rounded-full bg-primary" />
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronDown className="w-3.5 h-3.5 text-zinc-600 group-hover/btn:text-primary transition-all group-hover/btn:rotate-180" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="p-1.5 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                style={{ width: `${width - 32}px` }}
                                align="start"
                                sideOffset={8}
                            >
                                <div className="space-y-0.5">
                                    {['basic', 'advanced', 'big-data'].map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => {
                                                if (mode !== 'basic' && !user) {
                                                    onAuthClick?.();
                                                } else {
                                                    setAppMode(mode as any);
                                                }
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2.5 rounded-lg transition-all group/opt",
                                                appMode === mode ? "bg-primary/10 text-primary" : "hover:bg-white/5 text-zinc-500 hover:text-white"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-1.5 rounded-md border transition-all",
                                                appMode === mode ? "border-primary/30 bg-primary/20" : "border-white/5 bg-zinc-900"
                                            )}>
                                                {mode === 'basic' && <LayoutGrid className="w-3.5 h-3.5" />}
                                                {mode === 'advanced' && <Zap className="w-3.5 h-3.5" />}
                                                {mode === 'big-data' && <Database className="w-3.5 h-3.5" />}
                                            </div>
                                            <div className="flex flex-col items-start translate-y-[1px]">
                                                <span className="text-[10px] font-black uppercase tracking-widest">{mode}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* 2. TASK MONITOR: Intelligent Navigation Dropdowns */}
                    <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto custom-scrollbar pb-32 md:pb-8">

                        <div className="space-y-4">
                            <div className="px-3 flex items-center justify-between group/title">
                                <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] block">Task Monitor</span>
                                <Activity className="w-3.5 h-3.5 text-primary animate-neon" />
                            </div>

                            <div className="space-y-2">
                                {/* ADVANCED MODE DROPDOWN */}
                                <div className="space-y-1">
                                    <button
                                        onClick={() => {
                                            if (!user) {
                                                onAuthClick?.();
                                                toast.info('Login Required for Advanced Mode');
                                                return;
                                            }
                                            setIsAdvancedOpen(!isAdvancedOpen);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 group",
                                            isAdvancedOpen ? "bg-primary/5 text-white border border-primary/20" : "text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300 border border-transparent"
                                        )}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <Zap className={cn("w-4 h-4 transition-all", isAdvancedOpen ? "text-primary scale-110" : "group-hover:text-zinc-300")} />
                                            <span className="text-[11px] font-black tracking-widest uppercase">Advanced Mode</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border transition-all duration-500 shadow-[0_0_15px_rgba(212,175,55,0.2)]",
                                                isAdvancedOpen ? "bg-primary text-black border-primary scale-110" : "bg-black border-white/10 text-zinc-500"
                                            )}>
                                                {advancedTasksCount}
                                            </div>
                                            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-300", isAdvancedOpen && "rotate-90 text-primary")} />
                                        </div>
                                    </button>

                                    {isAdvancedOpen && (
                                        <div className="space-y-4 mt-2 ml-4 pl-4 border-l border-white/5 animate-in slide-in-from-top-2 duration-300">

                                            {/* ONE DAY SUB-SECTION */}
                                            <div className="space-y-1">
                                                <button
                                                    onClick={() => setIsOneDayOpen(!isOneDayOpen)}
                                                    className="w-full flex items-center justify-between py-1 px-1 text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] hover:text-primary/70 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span>One Day</span>
                                                        <span className="text-[8px] opacity-40">[{oneDayCount}]</span>
                                                    </div>
                                                    <ChevronRight className={cn("w-2.5 h-2.5 transition-transform", isOneDayOpen && "rotate-90")} />
                                                </button>

                                                {isOneDayOpen && (
                                                    <div className="space-y-0.5 mt-1">
                                                        {oneDayTasks.length > 0 ? oneDayTasks.slice(0, 15).map(task => (
                                                            <button
                                                                key={task.id}
                                                                onClick={() => onTaskClick?.(task.id)}
                                                                className="w-full flex items-center gap-3 py-1.5 px-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.03] transition-all group/item text-left overflow-hidden"
                                                            >
                                                                <div className={cn(
                                                                    "w-1 h-1 rounded-full transition-all flex-shrink-0",
                                                                    task.completed ? "bg-zinc-700" : "bg-primary shadow-[0_0_5px_rgba(212,175,55,0.5)] group-hover/item:scale-125"
                                                                )} />
                                                                <span className={cn(
                                                                    "text-[9.5px] font-bold truncate uppercase tracking-tight flex-1",
                                                                    task.completed && "line-through opacity-30"
                                                                )} title={task.text}>
                                                                    {task.text}
                                                                </span>
                                                            </button>
                                                        )) : (
                                                            <div className="py-1 px-2 text-[8px] font-black text-zinc-800 uppercase italic">No Local Missions</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* DAY TO DAY SUB-SECTION */}
                                            <div className="space-y-1">
                                                <button
                                                    onClick={() => setIsDayToDayOpen(!isDayToDayOpen)}
                                                    className="w-full flex items-center justify-between py-1 px-1 text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] hover:text-primary/70 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span>Day to Day</span>
                                                        <span className="text-[8px] opacity-40">[{dayToDayCount}]</span>
                                                    </div>
                                                    <ChevronRight className={cn("w-2.5 h-2.5 transition-transform", isDayToDayOpen && "rotate-90")} />
                                                </button>

                                                {isDayToDayOpen && (
                                                    <div className="space-y-0.5 mt-1">
                                                        {dayToDayTasks.length > 0 ? dayToDayTasks.slice(0, 15).map(task => (
                                                            <button
                                                                key={task.id}
                                                                onClick={() => onTaskClick?.(task.id)}
                                                                className="w-full flex items-center gap-3 py-1.5 px-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.03] transition-all group/item text-left overflow-hidden"
                                                            >
                                                                <div className={cn(
                                                                    "w-1 h-1 rounded-full transition-all flex-shrink-0",
                                                                    task.completed ? "bg-zinc-700" : "bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)] group-hover/item:scale-125"
                                                                )} />
                                                                <span className={cn(
                                                                    "text-[9.5px] font-bold truncate uppercase tracking-tight flex-1",
                                                                    task.completed && "line-through opacity-30"
                                                                )} title={task.text}>
                                                                    {task.text}
                                                                </span>
                                                            </button>
                                                        )) : (
                                                            <div className="py-1 px-2 text-[8px] font-black text-zinc-800 uppercase italic">No Scheduled Objectives</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* BIG DATA DROPDOWN */}
                                <div className="space-y-1">
                                    <button
                                        onClick={() => {
                                            if (!user) {
                                                onAuthClick?.();
                                                toast.info('Login Required for Big Data Mode');
                                                return;
                                            }
                                            setIsBigDataOpen(!isBigDataOpen);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 group",
                                            isBigDataOpen ? "bg-primary/5 text-white border border-primary/20" : "text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300 border border-transparent"
                                        )}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <Database className={cn("w-4 h-4 transition-all", isBigDataOpen ? "text-primary scale-110" : "group-hover:text-zinc-300")} />
                                            <span className="text-[11px] font-black tracking-widest uppercase">Big Data Mode</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border transition-all duration-500 shadow-[0_0_15px_rgba(212,175,55,0.2)]",
                                                isBigDataOpen ? "bg-primary text-black border-primary scale-110" : "bg-black border-white/10 text-zinc-500"
                                            )}>
                                                {bigDataSheetsCount}
                                            </div>
                                            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-300", isBigDataOpen && "rotate-90 text-primary")} />
                                        </div>
                                    </button>

                                    {isBigDataOpen && (
                                        <div className="space-y-3 mt-2 ml-4 pl-4 border-l border-white/5 animate-in slide-in-from-top-2 duration-300">
                                            {Object.entries(bigDataWorkspaces).map(([mode, sheets]) => {
                                                const activeSheets = sheets.filter(s => s.content && s.content.trim() !== '');
                                                if (activeSheets.length === 0) return null;

                                                return (
                                                    <div key={mode} className="space-y-1">
                                                        <div className="text-[8px] font-black text-primary/40 uppercase tracking-[0.2em] mb-1 px-1">{mode}</div>
                                                        {activeSheets.map(sheet => (
                                                            <button
                                                                key={sheet.id}
                                                                onClick={() => onSheetClick?.(mode, sheet.id)}
                                                                className="w-full flex items-center gap-3 py-1.5 px-3 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.03] transition-all group/item text-left overflow-hidden"
                                                            >
                                                                <FileText className="w-3 h-3 text-zinc-700 group-hover/item:text-primary transition-colors flex-shrink-0" />
                                                                <span className="text-[9.5px] font-bold truncate uppercase tracking-tight flex-1" title={sheet.name}>
                                                                    {sheet.name}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                            {bigDataSheetsCount === 0 && (
                                                <div className="py-2 text-[9px] font-black text-zinc-700 uppercase italic">No Active Sheets</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* CUSTOMIZE TASK DROPDOWN */}
                                <div className="space-y-1">
                                    <button
                                        onClick={() => {
                                            if (!user) {
                                                onAuthClick?.();
                                                toast.info('Login Required for Customize Mode');
                                                return;
                                            }
                                            setIsCustomizeOpen(!isCustomizeOpen);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 group",
                                            isCustomizeOpen ? "bg-primary/5 text-white border border-primary/20" : "text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300 border border-transparent"
                                        )}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <Layers className={cn("w-4 h-4 transition-all", isCustomizeOpen ? "text-primary scale-110" : "group-hover:text-zinc-300")} />
                                            <span className="text-[11px] font-black tracking-widest uppercase">Customize Task</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border transition-all duration-500 shadow-[0_0_15px_rgba(212,175,55,0.2)]",
                                                isCustomizeOpen ? "bg-primary text-black border-primary scale-110" : "bg-black border-white/10 text-zinc-500"
                                            )}>
                                                {customizeTasks.length}
                                            </div>
                                            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-300", isCustomizeOpen && "rotate-90 text-primary")} />
                                        </div>
                                    </button>

                                    {isCustomizeOpen && (
                                        <div className="space-y-0.5 mt-2 ml-4 pl-4 border-l border-white/5 animate-in slide-in-from-top-2 duration-300">
                                            {customizeTasks.length > 0 ? customizeTasks.slice(0, 12).map((task: any) => (
                                                <button
                                                    key={task.id}
                                                    onClick={() => onTaskClick?.(task.id)}
                                                    className="w-full flex items-center gap-3 py-1.5 px-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.03] transition-all group/item text-left overflow-hidden"
                                                >
                                                    <div className={cn(
                                                        "w-1 h-1 rounded-full transition-all flex-shrink-0",
                                                        task.completed ? "bg-zinc-700" : "bg-primary shadow-[0_0_5px_rgba(212,175,55,0.5)] group-hover/item:scale-125"
                                                    )} />
                                                    <span className={cn(
                                                        "text-[9.5px] font-bold truncate uppercase tracking-tight flex-1",
                                                        task.completed && "line-through opacity-30"
                                                    )} title={task.text}>
                                                        {task.text}
                                                    </span>
                                                    {(task.subtasks?.length || 0) > 0 && (
                                                        <span className="text-[8px] text-primary/40 font-black flex-shrink-0">
                                                            {task.subtasks.filter((s: any) => s.completed).length}/{task.subtasks.length}
                                                        </span>
                                                    )}
                                                </button>
                                            )) : (
                                                <div className="py-1 px-2 text-[8px] font-black text-zinc-800 uppercase italic">No Custom Missions</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* 4. Footer: Tactical ID Card */}
                    <div className="p-4 mt-auto mb-28 md:mb-0">
                        <div className={cn(
                            "p-5 rounded-[2.5rem] bg-white/[0.03] border-2 space-y-5 relative overflow-hidden group/id transition-all duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.4)]",
                            user ? "border-primary/20" : "border-zinc-800"
                        )}>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-12 h-12 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center shadow-2xl group/avatar overflow-hidden relative cursor-pointer hover:border-primary/50 transition-all"
                                    >
                                        {uploading ? (
                                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                        ) : profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110" />
                                        ) : (
                                            <span className="text-sm font-black text-white relative z-10 text-center uppercase">
                                                {profile?.full_name ? profile.full_name.substring(0, 2) : (user ? user.email?.substring(0, 2) : '?')}
                                            </span>
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                                            <Camera className="w-4 h-4 text-primary" />
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                            accept="image/jpeg,image/png,image/webp"
                                        />

                                        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-primary/40" />
                                        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-primary/40" />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-[13px] font-black text-white tracking-tight leading-none truncate pr-1 block" title={profile?.full_name || user?.user_metadata?.full_name || (user ? user.email?.split('@')[0] : 'Scanning...')}>
                                            {profile?.full_name || user?.user_metadata?.full_name || (user ? user.email?.split('@')[0] : 'Scanning...')}
                                        </span>
                                        <div className="flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-md bg-primary border border-primary/20 w-fit">
                                            <div className="w-1 h-1 rounded-full bg-black animate-pulse" />
                                            <span className="text-[7.5px] font-black text-black uppercase tracking-widest leading-none">
                                                {user ? 'Elite Operative' : 'Identify'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 relative z-10 w-full">
                                {user ? (
                                    <>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="h-10 flex-1 rounded-xl bg-primary/10 border-2 border-primary/40 text-[9px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary hover:text-black transition-all duration-500 group/retract flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                                        >
                                            <ChevronsLeft className="w-3.5 h-3.5 group-hover/retract:-translate-x-1 transition-transform" />
                                            CLOSE PANEL
                                        </button>

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 hover:border-primary/40 text-zinc-500 hover:text-primary transition-all p-0"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="p-4 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl z-50 w-64 overflow-hidden"
                                                side="top"
                                                align="end"
                                                sideOffset={12}
                                            >
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-xs">
                                                            {profile?.full_name?.substring(0, 2) || user.email?.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[11px] font-black text-white truncate uppercase tracking-tight">
                                                                {profile?.full_name || user.user_metadata?.full_name || "Operative"}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-zinc-500 truncate">
                                                                {user.email}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-all text-left">
                                                            <User className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Protocol Settings</span>
                                                        </button>
                                                        <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-all text-left">
                                                            <Sparkles className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Neural UI Config</span>
                                                        </button>
                                                    </div>

                                                    <div className="pt-2">
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => supabase.auth.signOut()}
                                                            className="w-full h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest gap-2"
                                                        >
                                                            <LogOut className="w-3.5 h-3.5" />
                                                            Terminate Session
                                                        </Button>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </>
                                ) : (
                                    <Button
                                        onClick={() => onAuthClick?.()}
                                        className="w-full h-11 bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group/login"
                                    >
                                        <Lock className="w-3.5 h-3.5" />
                                        Sign up / Login
                                    </Button>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* 5. Resizer Node */}
                    <div
                        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-all z-50 group/resizer"
                        onMouseDown={startResizing}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-20 bg-white/5 group-hover/resizer:bg-primary/40 transition-all rounded-full" />
                    </div>
                </div>
            </aside>
        </>
    );
}
