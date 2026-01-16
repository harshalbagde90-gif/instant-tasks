import { useState } from 'react';
import { Check, MoreHorizontal, Pencil, Trash2, Sparkles, Scissors, Briefcase, ListTree, Loader2 } from 'lucide-react';
import { Task, AIAction } from '@/types/task';
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
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onAIAction: (id: string, action: AIAction) => Promise<string | string[]>;
  onAddSubtasks: (parentId: string, subtasks: string[]) => void;
}

export function TaskItem({ task, onToggle, onUpdate, onDelete, onAIAction, onAddSubtasks }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<AIAction | null>(null);

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
        onUpdate(task.id, result);
      }
    } catch (error) {
      console.error('AI action failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  return (
    <div className={cn(
      "group flex items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-sm transition-all duration-200 hover:shadow-md",
      task.completed && "opacity-60"
    )}>
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="h-5 w-5 rounded-full border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      
      {isEditing ? (
        <Input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleEdit}
          onKeyDown={handleKeyDown}
          className="flex-1 h-8 text-base"
          autoFocus
        />
      ) : (
        <span 
          className={cn(
            "flex-1 text-base cursor-pointer transition-colors",
            task.completed && "line-through text-muted-foreground"
          )}
          onClick={() => !task.completed && setIsEditing(true)}
        >
          {task.text}
        </span>
      )}

      {isLoading && (
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={isLoading}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setIsEditing(true)} disabled={task.completed}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => handleAIAction('improve')} 
            disabled={task.completed || loadingAction === 'improve'}
          >
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            {loadingAction === 'improve' ? 'Improving...' : 'Improve'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleAIAction('shorten')} 
            disabled={task.completed || loadingAction === 'shorten'}
          >
            <Scissors className="w-4 h-4 mr-2 text-primary" />
            {loadingAction === 'shorten' ? 'Shortening...' : 'Shorten'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleAIAction('professional')} 
            disabled={task.completed || loadingAction === 'professional'}
          >
            <Briefcase className="w-4 h-4 mr-2 text-primary" />
            {loadingAction === 'professional' ? 'Formatting...' : 'Make Professional'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleAIAction('breakdown')} 
            disabled={task.completed || loadingAction === 'breakdown'}
          >
            <ListTree className="w-4 h-4 mr-2 text-primary" />
            {loadingAction === 'breakdown' ? 'Breaking down...' : 'Break Down'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
