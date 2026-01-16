import { Task, AIAction } from '@/types/task';
import { TaskItem } from './TaskItem';
import { EmptyState } from './EmptyState';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onAIAction: (id: string, action: AIAction) => Promise<string | string[]>;
  onAddSubtasks: (parentId: string, subtasks: string[]) => void;
}

export function TaskList({ tasks, onToggle, onUpdate, onDelete, onAIAction, onAddSubtasks }: TaskListProps) {
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {activeTasks.length > 0 && (
        <div className="space-y-3">
          {activeTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAIAction={onAIAction}
              onAddSubtasks={onAddSubtasks}
            />
          ))}
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            Completed ({completedTasks.length})
          </h3>
          {completedTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAIAction={onAIAction}
              onAddSubtasks={onAddSubtasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}
