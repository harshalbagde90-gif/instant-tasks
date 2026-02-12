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
        <Button
          variant="secondary"
          className="h-11 px-6 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 gap-2 font-bold transition-all duration-300 text-gray-400 hover:text-white"
          disabled={tasks.length === 0}
        >
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 11 12 7 8 11" />
            <line x1="12" y1="7" x2="12" y2="17" />
            <path d="M5 15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2" />
          </svg>
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-zinc-900/90 backdrop-blur-xl border-white/10 p-2 rounded-xl w-56">
        <DropdownMenuItem onClick={exportAsTXT} className="rounded-lg py-2.5">
          <FileText className="w-4 h-4 mr-3" />
          Text File (.txt)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsCSV} className="rounded-lg py-2.5">
          <Sheet className="w-4 h-4 mr-3" />
          Excel / CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
