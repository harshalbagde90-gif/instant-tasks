import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Sparkles, ListTree, Loader2, Calendar, Clock, RotateCcw, Bell } from 'lucide-react';
import { Task, AIAction } from '@/types/task';
import { User } from '@supabase/supabase-js';
import { ReminderDialog } from './ReminderDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskItemProps {
  task: Task;
  index: number;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string, previousText?: string) => void;
  onDelete: (id: string) => void;
  onAIAction: (id: string, action: AIAction) => Promise<string | string[]>;
  onAddSubtasks: (parentId: string, subtasks: string[]) => void;
  onUndo: (id: string) => void;
  user?: User | null;
  onAuthClick?: () => void;
}

export function TaskItem({ task, index, onToggle, onUpdate, onDelete, onAIAction, onAddSubtasks, onUndo, user, onAuthClick }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<AIAction | null>(null);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);

  const handleEdit = () => {
    if (editText.trim() && editText !== task.text) {
      onUpdate(task.id, editText.trim());
    } else {
      setEditText(task.text);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditText(task.text);
      setIsEditing(false);
    }
  };

  const handleAIAction = async (action: AIAction) => {
    setIsLoading(true);
    setLoadingAction(action);
    try {
      const result = await onAIAction(task.id, action);
      if (action === 'breakdown' && Array.isArray(result)) {
        onAddSubtasks(task.id, result);
      } else if (typeof result === 'string') {
        onUpdate(task.id, result, task.text); // Save current text as previousText
      }
    } catch (error) {
      console.error('AI action failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const priorityClass = task.priority ? `priority-${task.priority}` : '';

  return (
    <div className={cn(
      "group relative flex flex-col gap-3 p-6 rounded-[1.5rem] bg-zinc-900/80 border-2 border-white/[0.1] transition-all duration-500 hover:bg-zinc-950 hover:border-primary/50 hover:shadow-[0_0_40px_rgba(var(--primary),0.15)] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.02] before:to-transparent before:pointer-events-none",
      task.completed && "opacity-60",
      isLoading && "animate-shimmer"
    )}>
      <div className="flex items-start gap-4">
        {/* Serial Number */}
        <div className="flex items-center justify-center pt-1.5 shrink-0">
          <span className="text-xs font-black text-gray-600 tracking-tighter w-4 text-left">
            {index.toString().padStart(2, '0')}
          </span>
        </div>

        <div
          onClick={() => onToggle(task.id)}
          className={cn(
            "w-7 h-7 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 mt-1 relative overflow-hidden",
            task.completed
              ? "bg-primary border-primary shadow-[0_0_15px_hsla(var(--primary),0.5)]"
              : "border-zinc-700 hover:border-primary"
          )}
        >
          {task.completed && (
            <>
              <svg className="w-4 h-4 text-black z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleEdit}
              onKeyDown={handleKeyDown}
              className="h-10 text-lg bg-white/5 border-white/10 rounded-lg focus-visible:ring-primary focus-visible:ring-offset-0"
              autoFocus
            />
          ) : (
            <div className="space-y-0.5">
              <span
                className={cn(
                  "block text-lg font-bold tracking-tight transition-all duration-300 cursor-pointer",
                  task.completed ? "line-through text-gray-400" : "text-white"
                )}
                onClick={() => !task.completed && setIsEditing(true)}
              >
                {task.text}
              </span>

              {task.description && (
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  {task.description}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3">
            {task.priority && (
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                task.priority === 'urgent' ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]" :
                  task.priority === 'high' ? "bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]" :
                    task.priority === 'medium' ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_hsla(var(--primary),0.2)]" :
                      "bg-zinc-800 text-gray-400 border border-white/5"
              )}>
                {task.priority === 'urgent' && <span className="animate-pulse text-xs">🔥</span>}
                {task.priority === 'high' && <span className="text-xs">⚡</span>}
                {task.priority}
              </div>
            )}

            {task.dueDate && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(task.dueDate), "MMM d")}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
          )}

          {task.previousText && !isLoading && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onUndo(task.id)}
                    className="h-10 w-10 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 rounded-xl transition-all duration-300"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-900 border-white/10 text-white font-bold">
                  <p>Undo AI changes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (!user) {
                      onAuthClick?.();
                    } else {
                      setIsReminderDialogOpen(true);
                    }
                  }}
                  className={cn(
                    "h-10 w-10 border rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 relative",
                    task.emailReminderEnabled || task.whatsappReminderEnabled
                      ? "text-primary bg-primary/10 border-primary/30"
                      : "text-gray-400 bg-white/5 border-white/5 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Bell className="w-5 h-5" />
                  {(task.emailReminderEnabled || task.whatsappReminderEnabled) && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_hsla(var(--primary),0.8)]" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-900 border-white/10 text-white font-bold">
                <p>Set Mission Reminder</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleAIAction('improve')}
                  disabled={task.completed || isLoading}
                  className="h-10 w-10 text-primary bg-primary/5 hover:bg-primary/20 border border-primary/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <Sparkles className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-900 border-white/10 text-white font-bold">
                <p>Improve your task with AI</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <ReminderDialog
            isOpen={isReminderDialogOpen}
            onClose={() => setIsReminderDialogOpen(false)}
            task={task}
            onUpdate={(id, updates) => onUpdate(id, updates as any)} // Cast needed because updates might be full fields
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                disabled={isLoading}
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-900/90 backdrop-blur-xl border-white/10 p-2 rounded-xl">
              <DropdownMenuItem onClick={() => setIsEditing(true)} disabled={task.completed} className="rounded-lg py-2.5">
                <Pencil className="w-4 h-4 mr-3" />
                Edit Title
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem
                onClick={() => handleAIAction('improve')}
                disabled={task.completed || loadingAction === 'improve'}
                className="rounded-lg py-2.5 text-primary focus:text-primary focus:bg-primary/10"
              >
                <Sparkles className="w-4 h-4 mr-3" />
                {loadingAction === 'improve' ? 'Improving...' : 'AI Improve'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleAIAction('breakdown')}
                disabled={task.completed || loadingAction === 'breakdown'}
                className="rounded-lg py-2.5 text-primary focus:text-primary focus:bg-primary/10"
              >
                <ListTree className="w-4 h-4 mr-3" />
                {loadingAction === 'breakdown' ? 'Breaking down...' : 'AI Breakdown'}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="rounded-lg py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
