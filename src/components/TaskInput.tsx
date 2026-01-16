import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TaskInputProps {
  onAddTask: (text: string) => void;
}

export function TaskInput({ onAddTask }: TaskInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddTask(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What do you want to get done today?"
        className="flex-1 h-12 text-base bg-card border-border shadow-sm focus-visible:ring-primary"
      />
      <Button 
        type="submit" 
        size="icon"
        className="h-12 w-12 rounded-lg shadow-sm"
        disabled={!text.trim()}
      >
        <Plus className="w-5 h-5" />
      </Button>
    </form>
  );
}
