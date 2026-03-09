import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Task, Subtask } from '@/types/task';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    CheckCircle2, Circle, Clock, AlertCircle, Loader2,
    Share2, ChevronRight, Target, Tag, Zap, Calendar
} from 'lucide-react';
import { format, isPast, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';

/* ──────────────────────────────────── helpers ─────── */
const getPriorityColor = (p?: string) => {
    if (p === 'urgent') return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (p === 'high') return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    if (p === 'medium') return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    return 'text-green-400 bg-green-400/10 border-green-400/20';
};

const getDeadlineStatus = (deadline?: string) => {
    if (!deadline) return null;
    try {
        const d = parseISO(deadline);
        const now = new Date();
        const hoursLeft = differenceInHours(d, now);
        const minLeft = differenceInMinutes(d, now);
        if (minLeft < 0) return { label: 'Overdue', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', icon: '🔴' };
        if (hoursLeft < 6) return { label: `${minLeft}m left`, color: 'text-red-300', bg: 'bg-red-400/10 border-red-400/20', icon: '🔴' };
        if (hoursLeft < 24) return { label: `${hoursLeft}h left`, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', icon: '🟡' };
        const days = Math.floor(hoursLeft / 24);
        return { label: `${days}d left`, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20', icon: '🟢' };
    } catch { return null; }
};

/* ──────────────────────────────────── main comp ─────── */
const SharedTaskView: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [task, setTask] = useState<Task | null>(null);
    const [checkedSubtasks, setCheckedSubtasks] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [saving, setSaving] = useState(false);
    const [shareId, setShareId] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        const fetchTask = async () => {
            const { data, error } = await (supabase as any)
                .from('shared_tasks')
                .select('*')
                .eq('share_token', token)
                .single();

            if (error || !data) {
                setNotFound(true);
            } else {
                setTask(data.task_data as unknown as Task);
                setCheckedSubtasks(data.checked_subtasks || []);
                setShareId(data.id);
            }
            setLoading(false);
        };
        fetchTask();
    }, [token]);

    const toggleSubtask = useCallback(async (subtaskId: string) => {
        if (!shareId) return;
        const isChecked = checkedSubtasks.includes(subtaskId);
        const updated = isChecked
            ? checkedSubtasks.filter(id => id !== subtaskId)
            : [...checkedSubtasks, subtaskId];

        setCheckedSubtasks(updated);
        setSaving(true);

        try {
            const { error } = await (supabase as any)
                .from('shared_tasks')
                .update({ checked_subtasks: updated })
                .eq('id', shareId);

            if (error) throw error;
        } catch {
            // Revert on error
            setCheckedSubtasks(prev => isChecked ? [...prev, subtaskId] : prev.filter(id => id !== subtaskId));
            toast.error('Could not save progress. Please try again.');
        } finally {
            setSaving(false);
        }
    }, [checkedSubtasks, shareId]);

    const completedCount = checkedSubtasks.length;
    const totalCount = task?.subtasks?.length || 0;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const deadlineStatus = getDeadlineStatus(task?.deadline);

    /* ── LOADING ── */
    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
                </div>
                <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Loading task...</p>
            </div>
        </div>
    );

    /* ── NOT FOUND ── */
    if (notFound || !task) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                </div>
                <h1 className="text-xl font-black text-white uppercase tracking-tight mb-2">Task Not Found</h1>
                <p className="text-sm text-zinc-500 font-medium">
                    This link has expired or the task was removed.
                </p>
            </div>
        </div>
    );

    /* ── MAIN VIEW ── */
    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">

            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

            {/* Header Bar */}
            <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 px-4 py-3">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-purple-400" />
                        <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Shared Task</span>
                    </div>
                    {saving && (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold">
                            <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                        </div>
                    )}
                    <button
                        onClick={() => window.open('/', '_blank')}
                        className="text-[9px] font-black text-purple-400 uppercase tracking-widest border border-purple-400/30 px-3 py-1.5 rounded-full hover:bg-purple-400/10 transition-all"
                    >
                        Try InstantTasks →
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

                {/* Task Title Card */}
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                            progress === 100
                                ? "bg-green-500/20 border border-green-500/30"
                                : "bg-purple-500/20 border border-purple-500/30"
                        )}>
                            {progress === 100
                                ? <CheckCircle2 className="w-6 h-6 text-green-400" />
                                : <Target className="w-6 h-6 text-purple-400" />
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-black text-white leading-tight">{task.text}</h1>
                            {task.description && (
                                <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">{task.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Meta badges */}
                    <div className="flex flex-wrap gap-2">
                        {task.priority && (
                            <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border", getPriorityColor(task.priority))}>
                                <Zap className="w-2.5 h-2.5 inline mr-1" />
                                {task.priority}
                            </span>
                        )}
                        {task.category && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-blue-400/10 border-blue-400/20 text-blue-300">
                                <Tag className="w-2.5 h-2.5 inline mr-1" />
                                {task.category}
                            </span>
                        )}
                        {deadlineStatus && (
                            <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border", deadlineStatus.bg, deadlineStatus.color)}>
                                <Clock className="w-2.5 h-2.5 inline mr-1" />
                                {deadlineStatus.icon} {deadlineStatus.label}
                            </span>
                        )}
                    </div>

                    {/* Deadline full */}
                    {task.deadline && (
                        <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold">
                            <Calendar className="w-3.5 h-3.5" />
                            Deadline: {format(parseISO(task.deadline), 'dd MMM yyyy, hh:mm a')}
                        </div>
                    )}
                    {task.notes && task.notes.trim().length > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Notes</p>
                            <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{task.notes}</p>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {totalCount > 0 && (
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Progress</span>
                            <span className={cn(
                                "text-sm font-black",
                                progress === 100 ? "text-green-400" : "text-purple-400"
                            )}>{progress}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-700 ease-out",
                                    progress === 100
                                        ? "bg-gradient-to-r from-green-500 to-emerald-400"
                                        : "bg-gradient-to-r from-purple-600 to-violet-400"
                                )}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-zinc-600 font-bold">{completedCount} of {totalCount} subtasks done</p>
                    </div>
                )}

                {/* Subtasks */}
                {task.subtasks && task.subtasks.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1 mb-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                Subtasks - tap to mark complete
                            </h2>
                        </div>

                        {task.subtasks.map((subtask: Subtask) => {
                            const isChecked = checkedSubtasks.includes(subtask.id);
                            return (
                                <button
                                    key={subtask.id}
                                    onClick={() => toggleSubtask(subtask.id)}
                                    className={cn(
                                        "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-300 group",
                                        isChecked
                                            ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10"
                                            : "bg-white/[0.02] border-white/5 hover:border-purple-400/30 hover:bg-purple-400/5"
                                    )}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300",
                                        isChecked
                                            ? "bg-green-500 border-green-500 scale-110"
                                            : "border-zinc-600 group-hover:border-purple-400"
                                    )}>
                                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white fill-white" />}
                                    </div>
                                    <span className={cn(
                                        "text-sm font-bold flex-1 transition-all duration-300",
                                        isChecked ? "line-through text-zinc-600" : "text-zinc-200 group-hover:text-white"
                                    )}>
                                        {subtask.text}
                                    </span>
                                    {isChecked && (
                                        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Done</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Completion Banner */}
                {progress === 100 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 text-center space-y-1 animate-in fade-in duration-500">
                        <p className="text-2xl">🎉</p>
                        <p className="text-sm font-black text-green-400 uppercase tracking-widest">All Done!</p>
                        <p className="text-[10px] text-zinc-500 font-bold">All subtasks are complete.</p>
                    </div>
                )}

                {/* Footer powered by */}
                <div className="text-center pt-6 pb-4">
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-purple-400 transition-colors"
                    >
                        <Share2 className="w-3 h-3" />
                        Made with InstantTasks
                        <ChevronRight className="w-3 h-3" />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default SharedTaskView;

