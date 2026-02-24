import React, { useState } from 'react';
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
    ChevronDown,
    Clock,
    Settings,
    Loader2,
    Share2
} from 'lucide-react';
import { Task } from '@/types/task';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format, addDays, nextMonday, startOfToday } from 'date-fns';
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

    if (!task) return null;

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
            // Combine all subtasks for single API call
            const subtasksText = task.subtasks.map((st, idx) => `${idx + 1}. ${st.text}`).join('\n');

            const prompt = `Please enhance and improve the following subtasks. Make them more clear, detailed, and actionable while keeping them concise:\n\n${subtasksText}\n\nReturn ONLY the enhanced subtasks, one per line, numbered.`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) throw new Error('AI enhancement failed');

            const data = await response.json();
            const enhancedText = data.choices[0].message.content.trim();

            // Parse enhanced subtasks
            const enhancedLines = enhancedText.split('\n').filter(line => line.trim());
            const enhancedSubtasks = task.subtasks.map((st, idx) => {
                const enhancedLine = enhancedLines[idx]?.replace(/^\d+\.\s*/, '').trim() || st.text;
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
                                            <span className="text-xs font-semibold text-muted-foreground">{task.reminder || 'Add Reminder'}</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-[420px] p-0 bg-card/98 backdrop-blur-2xl border-2 border-border rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.1)] dark:shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden scale-95 sm:scale-100 focus:outline-none">
                                        {/* ... reminder dialog content ... */}
                                        {/* (Keeping code same as before but wrapped in condition) */}
                                        <div className="p-5 flex items-center justify-between border-b border-border bg-foreground/5 px-8">
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Mission Reminder</span>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-foreground/10 transition-colors">
                                                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                                                </Button>
                                            </DialogTrigger>
                                        </div>

                                        <div className="p-8 pb-4 space-y-8">
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="space-y-2.5">
                                                    <label className="text-[9px] font-black text-primary uppercase tracking-[0.3em] pl-1 opacity-80">Target Date</label>
                                                    <div className="bg-muted border-2 border-border rounded-2xl px-5 py-4 text-[11px] font-black text-foreground shadow-inner flex items-center gap-3 border-b-primary/20">
                                                        <CalendarIcon className="w-4 h-4 text-primary" />
                                                        {task.reminder ? task.reminder.split(',')[0] : format(new Date(), 'MMM dd, yyyy')}
                                                    </div>
                                                </div>
                                                <div className="space-y-2.5">
                                                    <label className="text-[9px] font-black text-primary uppercase tracking-[0.3em] pl-1 opacity-80">Precise Time</label>
                                                    <div className="relative group/time">
                                                        <select
                                                            className="w-full bg-muted/50 border-2 border-border/50 rounded-2xl px-5 py-4 text-[11px] font-black text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-inner appearance-none cursor-pointer group-hover/time:border-primary/30"
                                                            value={task.reminder?.includes(',') ? task.reminder.split(',')[1].trim() : '09:00 AM'}
                                                            onChange={(e) => {
                                                                const dateStr = task.reminder?.split(',')[0] || format(new Date(), 'MMM dd, yyyy');
                                                                onUpdate({ reminder: `${dateStr}, ${e.target.value}` });
                                                            }}
                                                        >
                                                            {Array.from({ length: 24 }).map((_, i) => {
                                                                const hour = i % 12 || 12;
                                                                const amPm = i < 12 ? 'AM' : 'PM';
                                                                const timeStr = `${hour.toString().padStart(2, '0')}:00 ${amPm}`;
                                                                return <option key={timeStr} value={timeStr} className="bg-card text-foreground font-bold">{timeStr}</option>;
                                                            })}
                                                        </select>
                                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                                            <Clock className="w-3.5 h-3.5 text-primary/40 group-hover/time:text-primary transition-colors" />
                                                            <ChevronDown className="w-4 h-4 text-muted-foreground/40 group-hover/time:text-primary/60 transition-colors" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-8 min-h-[220px]">
                                                <div className="flex-1 flex flex-col items-center">
                                                    <Calendar
                                                        mode="single"
                                                        selected={task.reminder && task.reminder.includes(',') ? new Date(task.reminder.split(',')[0]) : new Date()}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                const time = task.reminder?.includes(',') ? task.reminder.split(',')[1] : ' 09:00 AM';
                                                                onUpdate({ reminder: `${format(date, 'MMM dd, yyyy')},${time}` });
                                                            }
                                                        }}
                                                        className="p-0 border-none bg-transparent"
                                                        classNames={{
                                                            months: "flex flex-col space-y-4",
                                                            month: "space-y-6",
                                                            caption: "flex justify-center pt-1 relative items-center mb-4",
                                                            caption_label: "text-[11px] font-black uppercase tracking-[0.4em] text-primary/80",
                                                            nav: "space-x-1 flex items-center",
                                                            nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-primary/10 rounded-full transition-all duration-300",
                                                            nav_button_previous: "absolute left-1",
                                                            nav_button_next: "absolute right-1",
                                                            table: "w-full border-collapse space-y-1",
                                                            head_row: "flex",
                                                            head_cell: "text-muted-foreground/40 rounded-md w-9 font-black text-[9px] uppercase tracking-widest",
                                                            row: "flex w-full mt-2 gap-1",
                                                            cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                                                            day: cn(
                                                                "h-9 w-9 p-0 font-black transition-all duration-300 rounded-xl hover:bg-primary/20 hover:text-primary hover:scale-110 active:scale-95 text-[10px]",
                                                                "aria-selected:opacity-100"
                                                            ),
                                                            day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground rounded-xl font-black shadow-[0_0_25px_rgba(var(--primary),0.5)] border-none scale-110",
                                                            day_today: "bg-muted text-primary border border-primary/20",
                                                            day_outside: "text-muted-foreground/20 opacity-50",
                                                            day_disabled: "text-muted-foreground/20 opacity-50",
                                                            day_hidden: "invisible",
                                                        }}
                                                    />
                                                </div>

                                                <div className="w-24 flex flex-col gap-1.5 pt-8">
                                                    {[
                                                        { label: 'Today', date: startOfToday(), time: '06:00 PM' },
                                                        { label: 'Tomorrow', date: addDays(startOfToday(), 1), time: '09:00 AM' },
                                                        { label: 'Next Week', date: nextMonday(startOfToday()), time: '09:00 AM' },
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.label}
                                                            onClick={() => onUpdate({
                                                                reminder: `${format(opt.date, 'MMM dd, yyyy')}, ${opt.time}`
                                                            })}
                                                            className="text-left py-2.5 px-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10"
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 border-t border-border bg-muted/80">
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="h-16 rounded-none hover:bg-muted text-foreground sm:text-muted-foreground hover:text-foreground text-[11px] font-black uppercase tracking-[0.3em] border-r border-border transition-all active:scale-95"
                                                >
                                                    Back / Abort
                                                </Button>
                                            </DialogTrigger>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="h-16 rounded-none hover:bg-primary/10 text-primary text-[11px] font-black uppercase tracking-[0.3em] shadow-[inset_0_0_30px_rgba(var(--primary),0.08)] transition-all active:scale-95"
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

                        {/* Selected Tags Display — always visible chips */}
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
                            value={task.notes || ''}
                            onChange={(e) => onUpdate({ notes: e.target.value })}
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
