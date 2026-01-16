import { useEffect, useCallback } from 'react';
import { Task, AIAction, Template } from '@/types/task';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Header } from '@/components/Header';
import { TaskInput } from '@/components/TaskInput';
import { TaskList } from '@/components/TaskList';
import { TemplatesSheet } from '@/components/TemplatesSheet';
import { ExportMenu } from '@/components/ExportMenu';
import { ShareDialog } from '@/components/ShareDialog';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { toast } from 'sonner';

const Index = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('taskflow-tasks', []);

  // Handle shared tasks from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    
    if (shareData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(shareData)));
        const sharedTasks: Task[] = decoded.map((t: { text: string; completed: boolean }, i: number) => ({
          id: `shared-${Date.now()}-${i}`,
          text: t.text,
          completed: t.completed,
          createdAt: Date.now(),
        }));
        setTasks(sharedTasks);
        toast.success('Shared tasks loaded!');
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        console.error('Failed to load shared tasks:', e);
      }
    }
  }, []);

  const addTask = useCallback((text: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks(prev => [newTask, ...prev]);
  }, [setTasks]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  }, [setTasks]);

  const updateTask = useCallback((id: string, text: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, text } : task
    ));
  }, [setTasks]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, [setTasks]);

  const handleAIAction = useCallback(async (id: string, action: AIAction): Promise<string | string[]> => {
    const task = tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/task-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ task: task.text, action }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          toast.error('Please wait a moment before trying again.');
        } else if (response.status === 402) {
          toast.error('AI usage limit reached. Try again later.');
        } else {
          toast.error(error.error || 'AI action failed');
        }
        throw new Error(error.error || 'AI action failed');
      }

      const data = await response.json();
      
      if (action !== 'breakdown') {
        toast.success('Task updated with AI!');
      } else {
        toast.success('Task broken down into subtasks!');
      }
      
      return data.result;
    } catch (error) {
      console.error('AI action error:', error);
      throw error;
    }
  }, [tasks]);

  const addSubtasks = useCallback((parentId: string, subtasks: string[]) => {
    const parentIndex = tasks.findIndex(t => t.id === parentId);
    if (parentIndex === -1) return;

    const newTasks: Task[] = subtasks.map((text, i) => ({
      id: `task-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      completed: false,
      createdAt: Date.now(),
    }));

    setTasks(prev => {
      const updated = [...prev];
      // Insert subtasks after the parent task
      updated.splice(parentIndex + 1, 0, ...newTasks);
      return updated;
    });
  }, [tasks, setTasks]);

  const handleSelectTemplate = useCallback((template: Template) => {
    const templateTasks: Task[] = template.tasks.map((text, i) => ({
      id: `template-${Date.now()}-${i}`,
      text,
      completed: false,
      createdAt: Date.now(),
    }));
    setTasks(prev => [...templateTasks, ...prev]);
    toast.success(`${template.name} template loaded!`);
  }, [setTasks]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <Header />
        
        <div className="space-y-6">
          <TaskInput onAddTask={addTask} />
          
          <div className="flex flex-wrap gap-2 justify-center">
            <TemplatesSheet onSelectTemplate={handleSelectTemplate} />
            <ExportMenu tasks={tasks} />
            <ShareDialog tasks={tasks} />
          </div>

          <TaskList
            tasks={tasks}
            onToggle={toggleTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onAIAction={handleAIAction}
            onAddSubtasks={addSubtasks}
          />
        </div>
      </div>

      <UpgradeBanner />
    </div>
  );
};

export default Index;
