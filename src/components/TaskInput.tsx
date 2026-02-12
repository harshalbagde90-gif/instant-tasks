import { useState } from 'react';
import { Plus, Settings2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { AdvancedTaskModal } from './AdvancedTaskModal';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';

interface TaskInputProps {
  onAdd: (task: string | Partial<Task>) => void;
}

export function TaskInput({ onAdd }: TaskInputProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;

    if (mode === 'advanced') {
      setIsModalOpen(true);
    } else {
      onAdd(text.trim());
      setText('');
    }
  };

  const handleAdvancedAdd = (taskData: Partial<Task>) => {
    onAdd(taskData);
    setText('');
    setIsModalOpen(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Mode Toggle */}
      <div className="flex justify-center mb-10">
        <div className="bg-muted border border-border p-1 rounded-full flex gap-1">
          <button
            type="button"
            onClick={() => setMode('simple')}
            className={cn(
              "px-8 py-2 rounded-full text-sm font-bold transition-all",
              mode === 'simple' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Simple
          </button>
          <button
            type="button"
            onClick={() => setMode('advanced')}
            className={cn(
              "px-8 py-2 rounded-full text-sm font-bold transition-all",
              mode === 'advanced' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Advanced
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative group max-w-xl mx-auto">
        <div className="relative flex-1 rounded-full overflow-hidden bg-muted border border-border focus-within:border-primary/50 transition-all">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={mode === 'simple' ? "What's on your mind? Type and hit Enter..." : "Mission objective... (Advanced mode active)"}
            className="h-16 bg-transparent border-none text-base px-8 focus-visible:ring-0 placeholder:text-muted-foreground/60 w-[calc(100%-60px)]"
          />
          <Button
            type="submit"
            disabled={!text.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 shrink-0 p-0"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </Button>
        </div>

        {mode === 'advanced' && (
          <div className="mt-4 flex justify-center gap-2 opacity-50">
            <Settings2 className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Advanced Mode Engaged</span>
          </div>
        )}
      </form>

      <AdvancedTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAdvancedAdd}
        initialText={text}
      />
    </div>
  );
}
