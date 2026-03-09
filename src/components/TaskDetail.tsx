import React, { useEffect, useState } from 'react';
import {
    X,
    Trash2,
    CheckCircle2,
    Bell,
    Calendar as CalendarIcon,
    Tag,
    FileText,
    Paperclip,
    MoreVertical,
    Plus,
    Circle,
    ListTodo,
    Sparkles,
    Check,
    RotateCcw,
    Settings,
    Loader2,
    Share2
} from 'lucide-react';
import { Task } from '@/types/task';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format, addDays, startOfToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ShareModal } from '@/components/ShareModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Category, TagType } from '@/types/task';
import * as LucideIcons from 'lucide-react';

const CategoryIcon = ({ name, className, style }: { name: string, className?: string, style?: React.CSSProperties }) => {
    const IconComponent = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent className={className} style={style} />;
};
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface TaskDetailProps {
    task: Task | null;
    onClose: () => void;
    onDelete: (id: string) => void;
    onToggle: (id: string) => void;
    onUpdate: (updates: Partial<Task>) => void;
    appMode?: 'basic' | 'advanced' | 'big-data';
    categories: Category[];
    availableTags: TagType[];
    onManage: (type: 'categories' | 'tags') => void;
}

export function TaskDetail({
    task, onClose, onDelete, onToggle, onUpdate, appMode = 'advanced',
    categories, availableTags, onManage
}: TaskDetailProps) {
    const [subtaskInput, setSubtaskInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
    const [editingSubtaskText, setEditingSubtaskText] = useState('');
    const [showEnhanceDialog, setShowEnhanceDialog] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [notesDraft, setNotesDraft] = useState(task?.notes || '');
    const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

    useEffect(() => {
        setNotesDraft(task?.notes || '');
    }, [task?.id, task?.notes]);

    useEffect(() => {
        if (!task) return;
        const nextValue = notesDraft;
        const currentValue = task.notes || '';
        if (nextValue === currentValue) return;

        const timer = setTimeout(() => {
            onUpdate({ notes: nextValue });
        }, 250);

        return () => clearTimeout(timer);
    }, [notesDraft, task?.notes, onUpdate]);

    useEffect(() => {
        const parsed = task?.reminder ? new Date(task.reminder) : new Date();
        setCalendarMonth(Number.isNaN(parsed.getTime()) ? new Date() : parsed);
    }, [task?.id, task?.reminder]);

    if (!task) return null;

    const parseReminderDate = (value?: string) => {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    };

    const to12hParts = (date: Date) => {
        const h24 = date.getHours();
        const ampm: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
        const hour = h24 % 12 === 0 ? 12 : h24 % 12;
        return {
            hour: String(hour).padStart(2, '0'),
            minute: String(date.getMinutes()).padStart(2, '0'),
            ampm,
        };
    };

    const buildReminderIso = (dateValue: string, hour: string, minute: string, ampm: 'AM' | 'PM') => {
        const local = new Date(`${dateValue}T12:00:00`);
        if (Number.isNaN(local.getTime())) return undefined;
        let h = Number.parseInt(hour, 10);
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        local.setHours(h, Number.parseInt(minute, 10), 0, 0);
        return local.toISOString();
    };

    const parsedReminder = parseReminderDate(task.reminder);
    const reminderDate = parsedReminder ?? new Date();
    const reminderParts = to12hParts(reminderDate);
    const reminderDateInput = format(reminderDate, 'yyyy-MM-dd');
    const reminderLabel = parsedReminder
        ? format(parsedReminder, 'MMM d, hh:mm a')
        : (task.reminder || 'Add Reminder');

    const handleAddSubtask = () => {
        if (!subtaskInput.trim()) return;
        const newSubtask = {
            id: Date.now().toString(),
            text: subtaskInput,
            completed: false
        };
        const currentSubtasks = task.subtasks || [];
        onUpdate({ subtasks: [...currentSubtasks, newSubtask] });
        setSubtaskInput('');
    };

    const toggleSubtask = (id: string) => {
        const updatedSubtasks = task.subtasks?.map(st =>
            st.id === id ? { ...st, completed: !st.completed } : st
        );
        onUpdate({ subtasks: updatedSubtasks });
    };

    const deleteSubtask = (id: string) => {
        const updatedSubtasks = task.subtasks?.filter(st => st.id !== id);
        onUpdate({ subtasks: updatedSubtasks });
    };

    const startEditingSubtask = (id: string, text: string) => {
        setEditingSubtaskId(id);
        setEditingSubtaskText(text);
    };

    const updateSubtask = (id: string) => {
        if (!editingSubtaskText.trim()) {
            setEditingSubtaskId(null);
            return;
        }
        const updatedSubtasks = task.subtasks?.map(st =>
            st.id === id ? { ...st, text: editingSubtaskText } : st
        );
        onUpdate({ subtasks: updatedSubtasks });
        setEditingSubtaskId(null);
        setEditingSubtaskText('');
    };

    const handleEnhanceSubtasks = async () => {
        if (!task.subtasks || task.subtasks.length === 0) {
            toast.error('No subtasks to enhance');
            return;
        }

        setIsEnhancing(true);
        setShowEnhanceDialog(false);

        try {
            const sourceSubtasks = task.subtasks.map(st => st.text.trim());
            const subtasksText = sourceSubtasks.map((text, idx) => `${idx + 1}. ${text}`).join('\n');

            const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
            let enhancedText = '';

            if (GEMINI_API_KEY && !GEMINI_API_KEY.includes("YOUR_")) {
                const prompt = `Rewrite ONLY these existing subtasks for better clarity.

STRICT RULES:
1) Keep the same number of subtasks: ${sourceSubtasks.length}
2) Keep same intent and order. Do not change domain/topic.
3) Do not add or remove any subtask.
4) Return ONLY a valid JSON array of strings, no markdown, no explanation.

Task title context: "${task.text}"
Current subtasks:
${subtasksText}`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: {
                            parts: [{
                                text: "You are a strict rewriting engine. You only rewrite provided lines. Never invent new tasks. Output must be only JSON array of strings."
                            }]
                        },
                        contents: [
                            {
                                role: "user",
                                parts: [{ text: prompt }],
                            },
                        ],
                        generationConfig: {
                            temperature: 0,
                            topK: 1,
                            topP: 1,
                            maxOutputTokens: 1024,
                        },
                    })
                });

                if (!response.ok) throw new Error('AI enhancement failed');

                const data = await response.json();
                enhancedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            } else {
                // Safe fallback so CTA still works even when AI key is unavailable.
                enhancedText = JSON.stringify(
                    sourceSubtasks.map(text => `${text.charAt(0).toUpperCase()}${text.slice(1)}`)
                );
            }

            let parsedLines: string[] = [];
            try {
                const jsonMatch = enhancedText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(parsed)) {
                        parsedLines = parsed.map(item => String(item).trim()).filter(Boolean);
                    }
                }
            } catch {
                parsedLines = [];
            }

            if (parsedLines.length === 0) {
                parsedLines = enhancedText
                    .split('\n')
                    .map(line => line.replace(/^\d+[\).\-\s]+/, '').trim())
                    .filter(Boolean);
            }

            if (parsedLines.length !== sourceSubtasks.length) {
                toast.error('AI returned invalid format. Subtasks unchanged.');
                return;
            }

            const enhancedSubtasks = task.subtasks.map((st, idx) => {
                const enhancedLine = parsedLines[idx] || st.text;
                return { ...st, text: enhancedLine };
            });

            onUpdate({ subtasks: enhancedSubtasks });
            toast.success('Subtasks enhanced successfully!');
        } catch (error) {
            console.error('Enhancement error:', error);
            toast.error('Failed to enhance subtasks');
        } finally {
            setIsEnhancing(false);
        }
    };

    const cancelEditingSubtask = () => {
        setEditingSubtaskId(null);
        setEditingSubtaskText('');
    };

    const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;
    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Protocols: 5MB Limit
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            toast.error("Protocol Violation: File exceeds 5MB limit");
            return;
        }

        // Protocols: Safe Types Only
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Unsupported Intelligence Format: Use JPG, PNG, PDF, or TXT");
            return;
        }

        setIsUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${task.id}/${Date.now()}.${fileExt}`;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Auth Required");

            const { data, error } = await supabase.storage
                .from('task-attachments')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('task-attachments')
                .getPublicUrl(data.path);

            const newAttachment = {
                id: Date.now().toString(),
                name: file.name,
                url: publicUrl
            };

            onUpdate({ attachments: [...(task.attachments || []), newAttachment] });
            toast.success("Data upload secure and successfully");
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(`Upload Failed: ${error.message || 'Storage Access Denied'}`);
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    return (
        <>
            <div className="w-full md:w-[450px] bg-card border-l border-border flex flex-col h-screen fixed right-0 top-0 z-40 animate-in slide-in-from-right duration-500 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {appMode === 'advanced' && (
                            <>
                                <span>My lists</span>
                                <span>&gt;</span>
                            </>
                        )}
                        <span className="text-orange-500">{appMode === 'basic' ? 'Task' : (task.category || 'Mission')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {appMode === 'advanced' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggle(task.id)}
                                className={cn(
                                    "h-8 px-3 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all",
                                    task.completed ? "bg-primary/20 text-primary hover:bg-primary/30" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {task.completed ? "Completed" : "Mark as complete"}
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => onToggle(task.id)} className="h-8 w-8 rounded-full text-zinc-600 hover:text-primary">
                            <CheckCircle2 className={cn("w-5 h-5", task.completed && "text-primary fill-primary/20")} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Title Section */}
                    <div className="space-y-4">
                        <textarea
                            value={task.text}
                            onChange={(e) => onUpdate({ text: e.target.value })}
                            className="w-full bg-muted/20 hover:bg-muted/40 border-2 border-[#D4AF37]/30 focus:border-[#D4AF37] hover:border-[#D4AF37]/50 rounded-2xl p-4 text-2xl font-bold text-foreground focus:ring-0 resize-none leading-tight min-h-[80px] transition-all placeholder:text-muted-foreground/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)] focus:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                            placeholder="What is this task about?"
                        />

                        {appMode === 'advanced' && (
                            <div className="flex flex-wrap gap-2">
                                {/* Reminder Popover */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary" className={cn(
                                            "h-9 rounded-xl bg-muted border border-border hover:border-primary/20 gap-3 px-4 transition-all",
                                            task.reminder && "bg-primary/10 border-primary/30"
                                        )}>
                                            <Bell className={cn("w-4 h-4", task.reminder ? "text-primary" : "text-muted-foreground")} />
                                            <span className="text-xs font-semibold text-muted-foreground">{reminderLabel}</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="fixed top-[40%] sm:top-[36%] w-[92vw] max-w-[420px] p-0 bg-card/98 backdrop-blur-2xl border-2 border-border rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.1)] dark:shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden focus:outline-none data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:duration-100 data-[state=closed]:duration-75">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-yellow-500/70 to-transparent" />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-yellow-500/70 to-transparent" />
                                        <div className="p-4 flex items-center border-b border-border bg-foreground/5 px-5">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Mission Reminder</span>
                                        </div>

                                        <div className="p-4 pb-3 space-y-3.5">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-primary uppercase tracking-[0.25em] pl-1 opacity-80">Target Date</label>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="h-10 w-full justify-between bg-muted/50 border-border/60 rounded-xl text-sm font-bold text-foreground hover:bg-muted/60"
                                                            >
                                                                <span>{format(reminderDate, 'dd-MM-yyyy')}</span>
                                                                <CalendarIcon className="w-4 h-4 text-primary" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            align="start"
                                                            side="left"
                                                            sideOffset={8}
                                                            className="w-auto p-2 bg-card border-border rounded-xl"
                                                        >
                                                            <div className="mb-2 grid grid-cols-2 gap-2">
                                                                <select
                                                                    value={calendarMonth.getMonth()}
                                                                    onChange={(e) => {
                                                                        const next = new Date(calendarMonth);
                                                                        next.setMonth(Number(e.target.value));
                                                                        setCalendarMonth(next);
                                                                    }}
                                                                    className="h-8 bg-black/80 border border-yellow-500/30 rounded-md px-2 text-[11px] font-bold text-yellow-400 focus:outline-none focus:border-yellow-400"
                                                                >
                                                                    {MONTH_NAMES.map((name, idx) => (
                                                                        <option key={name} value={idx} className="bg-black text-yellow-400">{name}</option>
                                                                    ))}
                                                                </select>
                                                                <select
                                                                    value={calendarMonth.getFullYear()}
                                                                    onChange={(e) => {
                                                                        const next = new Date(calendarMonth);
                                                                        next.setFullYear(Number(e.target.value));
                                                                        setCalendarMonth(next);
                                                                    }}
                                                                    className="h-8 bg-black/80 border border-yellow-500/30 rounded-md px-2 text-[11px] font-bold text-yellow-400 focus:outline-none focus:border-yellow-400"
                                                                >
                                                                    {Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                                                                        <option key={year} value={year} className="bg-black text-yellow-400">{year}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <Calendar
                                                                mode="single"
                                                                selected={reminderDate}
                                                                month={calendarMonth}
                                                                onMonthChange={setCalendarMonth}
                                                                onSelect={(date) => {
                                                                    if (!date) return;
                                                                    setCalendarMonth(date);
                                                                    const nextIso = buildReminderIso(
                                                                        format(date, 'yyyy-MM-dd'),
                                                                        reminderParts.hour,
                                                                        reminderParts.minute,
                                                                        reminderParts.ampm
                                                                    );
                                                                    if (nextIso) onUpdate({ reminder: nextIso, reminderSent: false });
                                                                }}
                                                                disabled={{ before: startOfToday() }}
                                                                initialFocus
                                                                classNames={{
                                                                    cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                                                                    day: "h-9 w-9 p-0 font-semibold rounded-full text-amber-100 hover:bg-yellow-500/20 hover:text-yellow-300",
                                                                    day_selected: "bg-yellow-500 text-black rounded-full hover:bg-yellow-500 focus:bg-yellow-500",
                                                                    day_today: "text-yellow-400 font-bold",
                                                                }}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-primary uppercase tracking-[0.25em] pl-1 opacity-80">Precise Time</label>
                                                    <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
                                                        <select
                                                            value={reminderParts.hour}
                                                            onChange={(e) => {
                                                                const nextIso = buildReminderIso(
                                                                    reminderDateInput,
                                                                    e.target.value,
                                                                    reminderParts.minute,
                                                                    reminderParts.ampm
                                                                );
                                                                if (nextIso) onUpdate({ reminder: nextIso, reminderSent: false });
                                                            }}
                                                            className="h-10 bg-black/80 border border-yellow-500/30 rounded-xl px-2 text-center text-sm font-black text-yellow-400 focus:outline-none focus:border-yellow-400"
                                                        >
                                                            {Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, '0')).map((h) => (
                                                                <option key={h} value={h} className="bg-black text-yellow-400">{h}</option>
                                                            ))}
                                                        </select>

                                                        <select
                                                            value={reminderParts.minute}
                                                            onChange={(e) => {
                                                                const nextIso = buildReminderIso(
                                                                    reminderDateInput,
                                                                    reminderParts.hour,
                                                                    e.target.value,
                                                                    reminderParts.ampm
                                                                );
                                                                if (nextIso) onUpdate({ reminder: nextIso, reminderSent: false });
                                                            }}
                                                            className="h-10 bg-black/80 border border-yellow-500/30 rounded-xl px-2 text-center text-sm font-black text-yellow-400 focus:outline-none focus:border-yellow-400"
                                                        >
                                                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                                                                <option key={m} value={m} className="bg-black text-yellow-400">{m}</option>
                                                            ))}
                                                        </select>

                                                        <div className="flex flex-col gap-1">
                                                            {(['AM', 'PM'] as const).map((slot) => (
                                                                <button
                                                                    key={slot}
                                                                    onClick={() => {
                                                                        const nextIso = buildReminderIso(
                                                                            reminderDateInput,
                                                                            reminderParts.hour,
                                                                            reminderParts.minute,
                                                                            slot
                                                                        );
                                                                        if (nextIso) onUpdate({ reminder: nextIso, reminderSent: false });
                                                                    }}
                                                                    className={cn(
                                                                        "h-[19px] min-w-[44px] px-2 rounded-md text-[10px] font-black border transition-all",
                                                                        reminderParts.ampm === slot
                                                                            ? "bg-primary text-primary-foreground border-primary"
                                                                            : "bg-muted/50 text-muted-foreground border-border/60 hover:border-primary/40"
                                                                    )}
                                                                >
                                                                    {slot}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                {[
                                                    { label: 'Today', date: startOfToday(), time: '06:00 PM' },
                                                    { label: 'Tomorrow', date: addDays(startOfToday(), 1), time: '09:00 AM' },
                                                    { label: 'Next Week', date: addDays(startOfToday(), 7), time: '09:00 AM' },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.label}
                                                        onClick={() => {
                                                            const [hhmm, meridian] = opt.time.split(' ');
                                                            const [hh, mm] = hhmm.split(':');
                                                            const quickDate = format(opt.date, 'yyyy-MM-dd');
                                                            const nextIso = buildReminderIso(
                                                                quickDate,
                                                                hh,
                                                                mm,
                                                                meridian as 'AM' | 'PM'
                                                            );
                                                            if (nextIso) onUpdate({ reminder: nextIso, reminderSent: false });
                                                        }}
                                                        className="flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10"
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 border-t border-border bg-muted/80">
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="h-14 rounded-none hover:bg-muted text-foreground sm:text-muted-foreground hover:text-foreground text-[11px] font-black uppercase tracking-[0.2em] border-r border-border transition-all active:scale-95"
                                                >
                                                    Back / Abort
                                                </Button>
                                            </DialogTrigger>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="h-14 rounded-none hover:bg-primary/10 text-primary text-[11px] font-black uppercase tracking-[0.2em] shadow-[inset_0_0_30px_rgba(var(--primary),0.08)] transition-all active:scale-95"
                                                >
                                                    Set Reminder
                                                </Button>
                                            </DialogTrigger>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="secondary" className="h-9 rounded-xl bg-muted border border-border hover:border-primary/20 gap-2 px-4">
                                            {(() => {
                                                const cat = categories.find(c => c.name === (task.category || 'Mission'));
                                                return <CategoryIcon name={cat?.icon || 'Target'} className="w-4 h-4" style={{ color: cat?.color || '#f59e0b' }} />;
                                            })()}
                                            <span className="text-xs font-semibold text-muted-foreground">{task.category || 'Mission'}</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-[200px] p-1.5 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex flex-col"
                                        align="start"
                                        side="top"
                                        sideOffset={8}
                                        avoidCollisions={true}
                                        collisionPadding={10}
                                    >
                                        <div className="space-y-0.5 overflow-y-auto max-h-[250px] custom-scrollbar pr-1">
                                            <div className="px-2.5 py-1.5">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Categories</span>
                                            </div>
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => onUpdate({ category: cat.name })}
                                                    className={cn(
                                                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] font-bold transition-all",
                                                        task.category === cat.name ? "bg-muted text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    )}
                                                >
                                                    <CategoryIcon name={cat.icon} className="w-3 h-3" style={{ color: cat.color }} />
                                                    <span className="flex-1 text-left truncate">{cat.name}</span>
                                                    {task.category === cat.name && <Check className="w-3 h-3" />}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-1.5 pt-1.5 border-t border-border/50">
                                            <button
                                                onClick={() => onManage('categories')}
                                                className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all"
                                            >
                                                <Settings className="w-3 h-3" />
                                                Manage
                                            </button>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="secondary" className={cn(
                                            "h-9 rounded-xl bg-muted border border-border hover:border-primary/20 gap-2 px-4 font-bold flex items-center",
                                            task.tags && task.tags.length > 0 && "bg-blue-500/10 border-blue-500/20"
                                        )}>
                                            <Tag className={cn("w-4 h-4", task.tags && task.tags.length > 0 ? "text-blue-400" : "text-muted-foreground")} />
                                            <span className="text-xs text-muted-foreground">
                                                {task.tags && task.tags.length > 0 ? `${task.tags.length} Tags` : 'Tags'}
                                            </span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-[240px] p-2 bg-card/80 backdrop-blur-xl border border-border/50 rounded-[1.5rem] shadow-2xl flex flex-col"
                                        align="end"
                                        side="top"
                                        sideOffset={8}
                                        avoidCollisions={true}
                                        collisionPadding={10}
                                    >
                                        <div className="flex items-center justify-between pb-1.5 border-b border-border/50 mb-2 px-1 pt-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Operational Tags</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto flex flex-wrap gap-1.5 pr-1 custom-scrollbar max-h-[220px]">
                                            {availableTags.map((tag) => {
                                                const isSelected = task.tags?.includes(tag.name);
                                                return (
                                                    <button
                                                        key={tag.id}
                                                        onClick={() => {
                                                            const currentTags = task.tags || [];
                                                            const updatedTags = isSelected
                                                                ? currentTags.filter((t) => t !== tag.name)
                                                                : [...currentTags, tag.name];
                                                            onUpdate({ tags: updatedTags });
                                                        }}
                                                        className={cn(
                                                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300",
                                                            isSelected ? "border-transparent shadow-sm" : "border-border/40 hover:border-primary/20 bg-muted/30"
                                                        )}
                                                        style={isSelected ? {
                                                            backgroundColor: `${tag.color}20`,
                                                            borderColor: `${tag.color}40`,
                                                            color: tag.color
                                                        } : {}}
                                                    >
                                                        <div
                                                            className="w-1 h-1 rounded-full"
                                                            style={{ backgroundColor: tag.color }}
                                                        />
                                                        <span className="text-[9px] font-black uppercase tracking-tight">{tag.name}</span>
                                                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-2 pt-1.5 border-t border-border/50">
                                            <button
                                                onClick={() => onManage('tags')}
                                                className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all"
                                            >
                                                <Settings className="w-3 h-3" />
                                                Manage
                                            </button>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                {/* Share Button */}
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowShareModal(true)}
                                    className="h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 gap-2 px-4 transition-all"
                                >
                                    <Share2 className="w-4 h-4 text-purple-400" />
                                    <span className="text-xs font-semibold text-purple-400">Share</span>
                                </Button>

                            </div>
                        )}

                        {/* Selected Tags Display â€” always visible chips */}
                        {appMode === 'advanced' && task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1 px-0.5">
                                {task.tags.map((tagName) => {
                                    const tagObj = availableTags.find(t => t.name === tagName);
                                    const tagColor = tagObj?.color || '#6366f1';
                                    return (
                                        <button
                                            key={tagName}
                                            onClick={() => {
                                                const updatedTags = (task.tags || []).filter(t => t !== tagName);
                                                onUpdate({ tags: updatedTags });
                                            }}
                                            title={`Remove "${tagName}"`}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-200 hover:opacity-70 group"
                                            style={{
                                                backgroundColor: `${tagColor}15`,
                                                borderColor: `${tagColor}40`,
                                                color: tagColor,
                                            }}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tagColor }} />
                                            <span className="text-[9px] font-black uppercase tracking-wide">{tagName}</span>
                                            <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity stroke-[3]" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                    </div>

                    {/* Notes Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Notes</span>
                        </div>
                        <textarea
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            className="w-full bg-muted/50 rounded-2xl p-4 border border-border text-sm text-foreground focus:border-primary/30 transition-all min-h-[120px] resize-none"
                            placeholder="Insert your notes here..."
                        />
                    </div>

                    {/* Subtasks Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                <ListTodo className="w-3.5 h-3.5" />
                                <span>Subtasks {completedSubtasks}/{totalSubtasks}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowEnhanceDialog(true)}
                                disabled={!task.subtasks || task.subtasks.length === 0 || isEnhancing}
                                className="h-7 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-primary/5 hover:text-primary disabled:opacity-50 transition-all"
                            >
                                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
                            </Button>
                        </div>

                        {/* AI Enhancement Warning Dialog */}
                        <AlertDialog open={showEnhanceDialog} onOpenChange={setShowEnhanceDialog}>
                            <AlertDialogContent className="max-w-md">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                        AI Subtask Enhancement
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm leading-relaxed pt-2">
                                        Please ensure all your subtasks are added before enhancement.
                                        AI will improve the clarity and detail of each subtask.
                                        <br /><br />
                                        <span className="font-semibold text-foreground">Continue?</span>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Not Yet</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleEnhanceSubtasks} className="bg-primary hover:bg-primary/90">
                                        Yes, Enhance
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Scrollable Subtasks Container */}
                        <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                            <div className="space-y-3">
                                {task.subtasks?.map(st => (
                                    <div key={st.id} className="flex items-center gap-3 group px-1">
                                        <button
                                            onClick={() => toggleSubtask(st.id)}
                                            className={cn(
                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                                st.completed ? "bg-primary border-primary" : "border-border hover:border-primary/50"
                                            )}
                                        >
                                            {st.completed && <CheckCircle2 className="w-3 h-3 text-primary-foreground stroke-[4]" />}
                                        </button>
                                        {editingSubtaskId === st.id ? (
                                            <input
                                                type="text"
                                                value={editingSubtaskText}
                                                onChange={(e) => setEditingSubtaskText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') updateSubtask(st.id);
                                                    if (e.key === 'Escape') cancelEditingSubtask();
                                                }}
                                                onBlur={() => updateSubtask(st.id)}
                                                autoFocus
                                                className="text-sm flex-1 bg-muted px-2.5 py-1.5 rounded-lg border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        ) : (
                                            <span
                                                onDoubleClick={() => startEditingSubtask(st.id, st.text)}
                                                onClick={(e) => {
                                                    // Mobile: Single tap to edit
                                                    if (e.detail === 2 || window.innerWidth < 768) {
                                                        e.preventDefault();
                                                        startEditingSubtask(st.id, st.text);
                                                    }
                                                }}
                                                className={cn(
                                                    "text-sm flex-1 transition-all cursor-text hover:bg-muted/50 px-2 py-1 rounded-md",
                                                    st.completed ? "text-muted-foreground line-through" : "text-foreground/80"
                                                )}
                                            >
                                                {st.text}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => deleteSubtask(st.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 transition-all shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                <div className="flex items-center gap-3 group mt-2 bg-muted p-3 rounded-2xl border border-dashed border-border focus-within:border-primary/30 transition-all">
                                    <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <input
                                        value={subtaskInput}
                                        onChange={(e) => setSubtaskInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                        className="bg-transparent border-none text-sm text-foreground focus:ring-0 placeholder:text-muted-foreground/30 w-full"
                                        placeholder="Add a new subtask..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attachments Section */}
                    {appMode === 'advanced' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>Attachments ({task.attachments?.length || 0})</span>
                            </div>

                            {task.attachments && task.attachments.length > 0 && (
                                <div className="space-y-2">
                                    {task.attachments.map(file => (
                                        <div key={file.id} className="flex items-center justify-between p-3 rounded-xl bg-muted border border-border group hover:bg-muted/80 transition-all">
                                            <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 truncate hover:text-primary transition-colors flex-1"
                                            >
                                                <Paperclip className="w-3.5 h-3.5 text-muted-foreground/40" />
                                                <span className="text-xs text-foreground truncate font-medium">{file.name}</span>
                                            </a>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const updated = task.attachments?.filter(f => f.id !== file.id);
                                                    onUpdate({ attachments: updated });
                                                }}
                                                className="p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="relative">
                                <input
                                    type="file"
                                    id="task-file-upload"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                    accept=".jpg,.jpeg,.png,.pdf,.txt"
                                />
                                <div
                                    onClick={() => document.getElementById('task-file-upload')?.click()}
                                    className={cn(
                                        "border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary/20 transition-all cursor-pointer group bg-muted",
                                        isUploading && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all">
                                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest group-hover:text-primary/60 transition-colors">
                                            {isUploading ? 'Securing Intelligence...' : 'Upload Secure File'}
                                        </span>
                                        <span className="text-[8px] font-bold text-muted-foreground/20 uppercase tracking-[0.2em]">MAX SIZE: 5MB (JPG, PNG, PDF, TXT)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <ShareModal
                    task={task}
                    mode="advanced"
                    ownerId={null}
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </>
    );
}

