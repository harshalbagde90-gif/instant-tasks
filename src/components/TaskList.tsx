import { Task, AIAction } from '@/types/task';
import { TaskItem } from './TaskItem';
import { EmptyState } from './EmptyState';
import { Languages, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string, previousText?: string) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onAIAction: (id: string, action: AIAction) => Promise<string | string[]>;
  onAddSubtasks: (parentId: string, subtasks: string[]) => void;
  onUndo: (id: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  userEmail?: string;
  user?: import('@supabase/supabase-js').User | null;
  onAuthClick?: () => void;
}

const SUPPORTED_LANGUAGES = [
  { name: 'English', native: 'English' },
  { name: 'Hinglish', native: 'Hinglish' },
  { name: 'French', native: 'Français' },
  { name: 'Russian', native: 'Русский' },
];

export function TaskList({ tasks, onToggle, onUpdate, onUpdateTask, onDelete, onAIAction, onAddSubtasks, onUndo, selectedLanguage, onLanguageChange, userEmail, user, onAuthClick }: TaskListProps) {
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {activeTasks.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 px-2">

            <div className="relative flex items-center justify-between py-2 min-h-[44px]">
              {/* Left Speed Feature: Task Language */}
              <div className="relative z-10">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-9 px-3 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 rounded-full transition-all duration-300 group"
                    >
                      <Languages className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                      <span className="text-xs font-bold uppercase tracking-wider">Task Language</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900/95 border-white/10 backdrop-blur-xl sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-center mb-4">
                        Select Task Language <br />
                        <span className="text-sm font-normal text-gray-400">For better AI experience</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 p-2">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <Button
                          key={lang.name}
                          variant="ghost"
                          onClick={() => onLanguageChange(lang.name)}
                          className={cn(
                            "h-14 flex flex-col items-center justify-center gap-1 border-2 transition-all duration-300",
                            selectedLanguage === lang.name
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-white/5 hover:border-white/20 hover:bg-white/5 text-gray-400 hover:text-white"
                          )}
                        >
                          <span className="font-bold">{lang.name}</span>
                          <span className="text-[10px] opacity-60">{lang.native}</span>
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Center: TO-DO Heading - Absolutely centered */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] pointer-events-auto">
                  TO-DO — <span className="text-primary">{activeTasks.length.toString().padStart(2, '0')}</span>
                </h3>
              </div>

              {/* Right: Percentage Status */}
              <div className="relative z-10">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap">
                  {Math.round((completedTasks.length / (tasks.length || 1)) * 100)}% Complete
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,191,0,0.4)]"
                style={{ width: `${(completedTasks.length / tasks.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="grid gap-4">
            {activeTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                index={tasks.indexOf(task) + 1}
                onToggle={onToggle}
                onUpdate={onUpdate}
                onUpdateTask={onUpdateTask}
                onDelete={onDelete}
                onAIAction={onAIAction}
                onAddSubtasks={onAddSubtasks}
                onUndo={onUndo}
                user={user}
                userEmail={userEmail}
                onAuthClick={onAuthClick}
              />
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-black px-6 py-1 rounded-full border border-white/10 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                Mission Accomplished — {completedTasks.length}
              </span>
            </div>
          </div>
          <div className="grid gap-4">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                index={tasks.indexOf(task) + 1}
                onToggle={onToggle}
                onUpdate={onUpdate}
                onUpdateTask={onUpdateTask}
                onDelete={onDelete}
                onAIAction={onAIAction}
                onAddSubtasks={onAddSubtasks}
                onUndo={onUndo}
                user={user}
                userEmail={userEmail}
                onAuthClick={onAuthClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
