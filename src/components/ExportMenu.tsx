import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Sheet } from 'lucide-react';

interface ExportMenuProps {
  tasks: Task[];
}

export function ExportMenu({ tasks }: ExportMenuProps) {
  const exportAsTXT = () => {
    const content = tasks
      .map(task => `${task.completed ? '[x]' : '[ ]'} ${task.text}`)
      .join('\n');
    
    downloadFile(content, 'tasks.txt', 'text/plain');
  };

  const exportAsCSV = () => {
    const header = 'Status,Task,Created At\n';
    const content = tasks
      .map(task => {
        const status = task.completed ? 'Completed' : 'Pending';
        const date = new Date(task.createdAt).toISOString();
        const escapedText = `"${task.text.replace(/"/g, '""')}"`;
        return `${status},${escapedText},${date}`;
      })
      .join('\n');
    
    downloadFile(header + content, 'tasks.csv', 'text/csv');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={tasks.length === 0}>
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportAsTXT}>
          <FileText className="w-4 h-4 mr-2" />
          Download as TXT
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsCSV}>
          <Sheet className="w-4 h-4 mr-2" />
          Download as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
