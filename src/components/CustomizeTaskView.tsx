import React, { useState, useEffect } from 'react';
import { Task, Category, TagType, Subtask } from '@/types/task';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isPast, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';
import {
    Plus, Trash2, Check, ChevronDown, ChevronUp, Clock, Bell,
    AlertTriangle, Tag, Circle, CheckCircle2, GripVertical,
    Settings2, X, Calendar, Target, Layers, Star, Zap, Share2
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as LucideIcons from 'lucide-react';
import { ShareModal } from '@/components/ShareModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    tasks: Task[];
    setTasks: (val: Task[] | ((prev: Task[]) => Task[])) => void;
    categories: Category[];
    availableTags: TagType[];
    onManageCategories: () => void;
    onManageTags: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
    urgent: { label: 'URGENT', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.4)' },
    high: { label: 'HIGH', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.4)' },
    medium: { label: 'MEDIUM', color: '#eab308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.4)' },
    low: { label: 'LOW', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)' },
};

const QUICK_DEADLINES = [
    { label: '+1 Hour', hours: 1 },
    { label: '+1 Day', hours: 24 },
    { label: '+3 Days', hours: 72 },
    { label: '+1 Week', hours: 168 },
];

function CategoryIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
    const Icon = (LucideIcons as any)[name] || Target;
    return <Icon className={className} style={style} />;
}

function getDeadlineStatus(deadline: string): { status: 'ok' | 'warn' | 'overdue'; label: string; color: string; bgColor: string } {
    const dl = parseISO(deadline);
    if (isPast(dl)) return { status: 'overdue', label: 'OVERDUE', color: '#ef4444', bgColor: 'rgba(239,68,68,0.12)' };
    const hoursLeft = differenceInHours(dl, new Date());
    const totalHours = differenceInHours(dl, new Date()); // simplified
    if (hoursLeft < 24) return { status: 'warn', label: 'DUE SOON', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)' };
    return { status: 'ok', label: 'ON TRACK', color: '#22c55e', bgColor: 'rgba(34,197,94,0.12)' };
}

function CountdownDisplay({ deadline }: { deadline: string }) {
    const [, forceUpdate] = useState(0);
    useEffect(() => {
        const t = setInterval(() => forceUpdate(n => n + 1), 60000);
        return () => clearInterval(t);
    }, []);

    const dl = parseISO(deadline);
    if (isPast(dl)) {
        const mins = Math.abs(differenceInMinutes(dl, new Date()));
        const h = Math.floor(mins / 60), m = mins % 60;
        return <span className="text-red-500 font-black">{h > 0 ? `${h}h ` : ''}{m}m overdue</span>;
    }
    const mins = differenceInMinutes(dl, new Date());
    const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
    return <span>{d > 0 ? `${d}d ` : ''}{h > 0 ? `${h}h ` : ''}{m}m left</span>;
}

// ─── Subtask Row ──────────────────────────────────────────────────────────────

function SubtaskRow({
    subtask, onToggle, onEdit, onDelete,
}: {
    subtask: Subtask;
    onToggle: () => void;
    onEdit: (text: string) => void;
    onDelete: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(subtask.text);

    const commit = () => {
        if (draft.trim()) onEdit(draft.trim());
        setEditing(false);
    };

    return (
        <div className={cn(
            "group flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200",
            subtask.completed ? "opacity-60" : "hover:bg-primary/5"
        )}>
            <GripVertical className="w-3 h-3 text-muted-foreground/30 shrink-0 cursor-grab" />

            <button onClick={onToggle} className="shrink-0">
                {subtask.completed
                    ? <CheckCircle2 className="w-4 h-4 text-primary" />
                    : <Circle className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                }
            </button>

            {editing ? (
                <input
                    autoFocus
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
                    className="flex-1 bg-transparent text-sm outline-none border-b border-primary/40 pb-0.5 text-foreground"
                />
            ) : (
                <span
                    onClick={() => setEditing(true)}
                    className={cn(
                        "flex-1 text-sm cursor-text",
                        subtask.completed ? "line-through text-muted-foreground" : "text-foreground"
                    )}
                >
                    {subtask.text}
                </span>
            )}

            <button
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
                <X className="w-3 h-3 text-red-400 hover:text-red-500" />
            </button>
        </div>
    );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function CustomizeTaskCard({
    task, onUpdate, onDelete, categories, availableTags, onManageCategories, onManageTags,
}: {
    task: Task;
    onUpdate: (updates: Partial<Task>) => void;
    onDelete: () => void;
    categories: Category[];
    availableTags: TagType[];
    onManageCategories: () => void;
    onManageTags: () => void;
}) {
    const [newSubtaskText, setNewSubtaskText] = useState('');
    const [expanded, setExpanded] = useState(true);
    const [deadlineInput, setDeadlineInput] = useState(task.deadline ? task.deadline.slice(0, 16) : '');
    const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const subtasks = task.subtasks || [];
    const completedCount = subtasks.filter(s => s.completed).length;
    const total = subtasks.length;
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const cat = categories.find(c => c.name === (task.category || 'Mission')) || categories[0];
    const priority = task.priority ? PRIORITY_CONFIG[task.priority] : null;
    const deadlineStatus = task.deadline ? getDeadlineStatus(task.deadline) : null;

    // Auto-complete main task when all subtasks are done
    useEffect(() => {
        if (total > 0 && completedCount === total && !task.completed) {
            onUpdate({ completed: true });
            toast.success('🎯 Mission Complete! All subtasks done!');
        } else if (completedCount < total && task.completed) {
            onUpdate({ completed: false });
        }
    }, [completedCount, total]);

    const addSubtask = () => {
        if (!newSubtaskText.trim()) return;
        const sub: Subtask = { id: crypto.randomUUID(), text: newSubtaskText.trim(), completed: false };
        onUpdate({ subtasks: [...subtasks, sub] });
        setNewSubtaskText('');
    };

    const toggleSubtask = (id: string) => {
        onUpdate({ subtasks: subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s) });
    };

    const editSubtask = (id: string, text: string) => {
        onUpdate({ subtasks: subtasks.map(s => s.id === id ? { ...s, text } : s) });
    };

    const deleteSubtask = (id: string) => {
        onUpdate({ subtasks: subtasks.filter(s => s.id !== id) });
    };

    const applyQuickDeadline = (hours: number) => {
        const d = new Date(Date.now() + hours * 3600 * 1000);
        onUpdate({ deadline: d.toISOString() });
        setDeadlineInput(d.toISOString().slice(0, 16));
        setShowDeadlinePicker(false);
    };

    const applyCustomDeadline = () => {
        if (!deadlineInput) return;
        onUpdate({ deadline: new Date(deadlineInput).toISOString() });
        setShowDeadlinePicker(false);
    };

    const clearDeadline = () => {
        onUpdate({ deadline: undefined });
        setDeadlineInput('');
    };

    return (
        <>
            <div className={cn(
                "relative rounded-2xl border transition-all duration-300",
                task.completed
                    ? "border-border/50 opacity-70"
                    : deadlineStatus?.status === 'overdue'
                        ? "border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.08)]"
                        : deadlineStatus?.status === 'warn'
                            ? "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                            : "border-border hover:border-primary/30 hover:shadow-[0_0_25px_rgba(212,175,55,0.08)]"
            )}>
                {/* Left accent */}
                {cat && <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full" style={{ backgroundColor: cat.color }} />}

                <div className="p-4 pl-5">
                    {/* Header Row */}
                    <div className="flex items-start gap-3">
                        {/* Complete toggle */}
                        <button onClick={() => onUpdate({ completed: !task.completed })} className="mt-0.5 shrink-0">
                            {task.completed
                                ? <CheckCircle2 className="w-5 h-5 text-primary" />
                                : <Circle className="w-5 h-5 text-muted-foreground/40 hover:text-primary/60 transition-colors" />
                            }
                        </button>

                        <div className="flex-1 min-w-0">
                            {/* Category + Priority row */}
                            <div className="flex items-center gap-2 mb-1.5">
                                {cat && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${cat.color}15` }}>
                                        <CategoryIcon name={cat?.icon || 'Target'} className="w-3 h-3" style={{ color: cat.color }} />
                                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: cat.color }}>{task.category || 'Mission'}</span>
                                    </div>
                                )}
                                {priority && (
                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border"
                                        style={{ color: priority.color, backgroundColor: priority.bg, borderColor: priority.border }}>
                                        {priority.label}
                                    </span>
                                )}
                                {deadlineStatus && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border"
                                        style={{ backgroundColor: deadlineStatus.bgColor, borderColor: `${deadlineStatus.color}40`, color: deadlineStatus.color }}>
                                        {deadlineStatus.status === 'overdue' && <AlertTriangle className="w-2.5 h-2.5" />}
                                        {deadlineStatus.status === 'warn' && <Clock className="w-2.5 h-2.5" />}
                                        {deadlineStatus.status === 'ok' && <Zap className="w-2.5 h-2.5" />}
                                        <span className="text-[8px] font-black uppercase tracking-widest">{deadlineStatus.label}</span>
                                    </div>
                                )}
                            </div>

                            {/* Main task title */}
                            <p className={cn("text-sm font-bold text-foreground leading-snug", task.completed && "line-through text-muted-foreground")}>
                                {task.text}
                            </p>

                            {/* Tags */}
                            {task.tags && task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {task.tags.map(tagName => {
                                        const tagObj = availableTags.find(t => t.name === tagName);
                                        const tc = tagObj?.color || '#6366f1';
                                        return (
                                            <span key={tagName} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-tight"
                                                style={{ backgroundColor: `${tc}12`, borderColor: `${tc}30`, color: tc }}>
                                                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: tc }} />
                                                {tagName}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                            {/* Share button */}
                            <button
                                onClick={() => setShowShareModal(true)}
                                title="Share Task"
                                className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 transition-colors hover:bg-purple-500/20"
                            >
                                <Share2 className="w-4 h-4 text-purple-400" />
                            </button>
                            <button onClick={() => setExpanded(!expanded)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                                {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </button>
                            <button onClick={onDelete} className="p-1 rounded-lg hover:bg-red-500/10 transition-colors">
                                <Trash2 className="w-4 h-4 text-red-400/60 hover:text-red-500" />
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {total > 0 && (
                        <div className="mt-3 ml-8">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Progress</span>
                                <span className="text-[9px] font-black text-primary">{progressPercent}% · {completedCount}/{total}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${progressPercent}%`,
                                        background: progressPercent === 100
                                            ? '#22c55e'
                                            : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)/0.7))'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Expandable body */}
                    {expanded && (
                        <div className="mt-3 ml-8 space-y-0.5">
                            {/* Subtask list */}
                            {subtasks.map(sub => (
                                <SubtaskRow
                                    key={sub.id}
                                    subtask={sub}
                                    onToggle={() => toggleSubtask(sub.id)}
                                    onEdit={text => editSubtask(sub.id, text)}
                                    onDelete={() => deleteSubtask(sub.id)}
                                />
                            ))}

                            {/* Add subtask input */}
                            <div className="flex items-center gap-2 px-3 py-2">
                                <Plus className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                                <input
                                    placeholder="Add subtask..."
                                    value={newSubtaskText}
                                    onChange={e => setNewSubtaskText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') addSubtask(); }}
                                    className="flex-1 bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/40 outline-none"
                                />
                                {newSubtaskText && (
                                    <button onClick={addSubtask} className="text-[9px] font-black uppercase tracking-widest text-primary">
                                        ADD
                                    </button>
                                )}
                            </div>

                            {/* Bottom meta row: Deadline + Reminder + Category + Tags + Priority */}
                            <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-2 mt-1">

                                {/* Deadline */}
                                <Popover open={showDeadlinePicker} onOpenChange={setShowDeadlinePicker}>
                                    <PopoverTrigger asChild>
                                        <button className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                                            task.deadline
                                                ? "text-primary border-primary/30 bg-primary/5"
                                                : "text-muted-foreground border-border hover:border-primary/30 hover:text-primary"
                                        )}>
                                            <Clock className="w-3 h-3" />
                                            {task.deadline ? <CountdownDisplay deadline={task.deadline} /> : 'Deadline'}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72 p-4" side="top" avoidCollisions>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Set Deadline</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {QUICK_DEADLINES.map(q => (
                                                    <button key={q.label} onClick={() => applyQuickDeadline(q.hours)}
                                                        className="px-3 py-2 rounded-xl border border-border text-[10px] font-bold hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all text-foreground">
                                                        {q.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Custom</p>
                                                <input
                                                    type="datetime-local"
                                                    value={deadlineInput}
                                                    onChange={e => setDeadlineInput(e.target.value)}
                                                    className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground outline-none border border-border focus:border-primary/40"
                                                />
                                                <div className="flex gap-2 pt-1">
                                                    <Button size="sm" onClick={applyCustomDeadline}
                                                        className="flex-1 h-8 text-[10px] font-black uppercase tracking-widest rounded-xl">
                                                        Set
                                                    </Button>
                                                    {task.deadline && (
                                                        <Button size="sm" variant="ghost" onClick={clearDeadline}
                                                            className="h-8 text-[10px] font-black uppercase tracking-widest rounded-xl text-red-400 hover:text-red-500 hover:bg-red-500/10">
                                                            Clear
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                {/* Reminder */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                                            task.reminder
                                                ? "text-violet-500 border-violet-500/30 bg-violet-500/5"
                                                : "text-muted-foreground border-border hover:border-violet-500/30 hover:text-violet-500"
                                        )}>
                                            <Bell className="w-3 h-3" />
                                            {task.reminder ? format(parseISO(task.reminder), 'MMM d, h:mm a') : 'Remind'}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-4" side="top" avoidCollisions>
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Set Reminder</p>
                                            <input
                                                type="datetime-local"
                                                defaultValue={task.reminder ? task.reminder.slice(0, 16) : ''}
                                                onChange={e => onUpdate({ reminder: new Date(e.target.value).toISOString() })}
                                                className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground outline-none border border-border focus:border-primary/40"
                                            />
                                            {task.reminder && (
                                                <Button size="sm" variant="ghost" onClick={() => onUpdate({ reminder: undefined })}
                                                    className="w-full h-8 text-[10px] font-black uppercase tracking-widest rounded-xl text-red-400 hover:text-red-500 hover:bg-red-500/10">
                                                    Clear Reminder
                                                </Button>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                {/* Category */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border text-muted-foreground hover:border-primary/30 hover:text-primary text-[10px] font-black uppercase tracking-widest transition-all">
                                            <Layers className="w-3 h-3" />
                                            {task.category || 'Category'}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-2" side="top" avoidCollisions>
                                        <div className="space-y-1">
                                            {categories.map(c => (
                                                <button key={c.id} onClick={() => onUpdate({ category: c.name })}
                                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted transition-colors text-left">
                                                    <CategoryIcon name={c.icon} className="w-3.5 h-3.5" style={{ color: c.color }} />
                                                    <span className="text-xs font-bold text-foreground">{c.name}</span>
                                                    {task.category === c.name && <Check className="w-3 h-3 text-primary ml-auto" />}
                                                </button>
                                            ))}
                                            <div className="border-t border-border pt-1 mt-1">
                                                <button onClick={onManageCategories}
                                                    className="w-full text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary px-3 py-2 transition-colors">
                                                    Manage Categories
                                                </button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                {/* Tags */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border text-muted-foreground hover:border-primary/30 hover:text-primary text-[10px] font-black uppercase tracking-widest transition-all">
                                            <Tag className="w-3 h-3" />
                                            {task.tags && task.tags.length > 0 ? `${task.tags.length} Tag${task.tags.length > 1 ? 's' : ''}` : 'Tags'}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-2" side="top" avoidCollisions>
                                        <div className="space-y-1">
                                            {availableTags.map(t => {
                                                const selected = (task.tags || []).includes(t.name);
                                                return (
                                                    <button key={t.id}
                                                        onClick={() => {
                                                            const cur = task.tags || [];
                                                            onUpdate({ tags: selected ? cur.filter(x => x !== t.name) : [...cur, t.name] });
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted transition-colors">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                                                        <span className="text-xs font-bold text-foreground flex-1">{t.name}</span>
                                                        {selected && <Check className="w-3 h-3 text-primary" />}
                                                    </button>
                                                );
                                            })}
                                            <div className="border-t border-border pt-1 mt-1">
                                                <button onClick={onManageTags}
                                                    className="w-full text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary px-3 py-2 transition-colors">
                                                    Manage Tags
                                                </button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                {/* Priority */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                                            priority
                                                ? "border-border"
                                                : "text-muted-foreground border-border hover:border-primary/30 hover:text-primary"
                                        )}
                                            style={priority ? { color: priority.color, backgroundColor: priority.bg, borderColor: priority.border } : {}}>
                                            <Star className="w-3 h-3" />
                                            {task.priority || 'Priority'}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-44 p-2" side="top" avoidCollisions>
                                        {(['urgent', 'high', 'medium', 'low'] as const).map(p => {
                                            const pc = PRIORITY_CONFIG[p];
                                            return (
                                                <button key={p}
                                                    onClick={() => onUpdate({ priority: p })}
                                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted transition-colors">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pc.color }} />
                                                    <span className="text-xs font-bold" style={{ color: pc.color }}>{pc.label}</span>
                                                    {task.priority === p && <Check className="w-3 h-3 text-primary ml-auto" />}
                                                </button>
                                            );
                                        })}
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <ShareModal
                    task={task}
                    mode="customize"
                    ownerId={null}
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </>
    );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export const CustomizeTaskView: React.FC<Props> = ({
    tasks, setTasks, categories, availableTags, onManageCategories, onManageTags,
}) => {
    const [newTaskText, setNewTaskText] = useState('');

    const addTask = () => {
        if (!newTaskText.trim()) return;
        const newTask: Task = {
            id: crypto.randomUUID(),
            text: newTaskText.trim(),
            completed: false,
            createdAt: Date.now(),
            subtasks: [],
            tags: [],
            category: 'Mission',
            priority: 'medium',
        };
        setTasks(prev => [newTask, ...prev]);
        setNewTaskText('');
        toast.success('Task Created!', { description: 'Add subtasks and set a deadline below.' });
    };

    const updateTask = (id: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const deleteTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        toast.error('Task Deleted');
    };

    const pending = tasks.filter(t => !t.completed);
    const done = tasks.filter(t => t.completed);

    return (
        <div className="w-full space-y-6 pb-20">
            {/* Input */}
            <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm focus-within:border-primary/40 focus-within:shadow-[0_0_20px_rgba(212,175,55,0.08)] transition-all">
                <Plus className="w-5 h-5 text-muted-foreground/50 shrink-0" />
                <input
                    value={newTaskText}
                    onChange={e => setNewTaskText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
                    placeholder="TYPE YOUR MISSION..."
                    className="flex-1 bg-transparent text-sm font-bold text-foreground placeholder:text-muted-foreground/40 placeholder:uppercase placeholder:tracking-widest outline-none"
                />
                {newTaskText && (
                    <Button onClick={addTask}
                        className="rounded-xl h-9 px-5 text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
                        ENTER
                    </Button>
                )}
            </div>

            {/* Stats bar */}
            {tasks.length > 0 && (
                <div className="flex items-center gap-4 px-1">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        {pending.length} Active
                    </span>
                    <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">·</span>
                    <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">
                        {done.length} Complete
                    </span>
                    {tasks.some(t => t.deadline && getDeadlineStatus(t.deadline).status === 'overdue') && (
                        <>
                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">·</span>
                            <span className="flex items-center gap-1 text-[9px] font-black text-red-500 uppercase tracking-widest">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {tasks.filter(t => t.deadline && getDeadlineStatus(t.deadline).status === 'overdue').length} Overdue
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* Pending tasks */}
            {pending.length > 0 && (
                <div className="space-y-3">
                    {pending.map(task => (
                        <CustomizeTaskCard
                            key={task.id}
                            task={task}
                            onUpdate={updates => updateTask(task.id, updates)}
                            onDelete={() => deleteTask(task.id)}
                            categories={categories}
                            availableTags={availableTags}
                            onManageCategories={onManageCategories}
                            onManageTags={onManageTags}
                        />
                    ))}
                </div>
            )}

            {/* Completed tasks */}
            {done.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-2">
                            Completed · {done.length}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                    </div>
                    {done.map(task => (
                        <CustomizeTaskCard
                            key={task.id}
                            task={task}
                            onUpdate={updates => updateTask(task.id, updates)}
                            onDelete={() => deleteTask(task.id)}
                            categories={categories}
                            availableTags={availableTags}
                            onManageCategories={onManageCategories}
                            onManageTags={onManageTags}
                        />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center mb-4">
                        <Layers className="w-7 h-7 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-1">No missions yet</p>
                    <p className="text-xs text-muted-foreground/50">Create a task above and add subtasks to track progress</p>
                </div>
            )}
        </div>
    );
};
