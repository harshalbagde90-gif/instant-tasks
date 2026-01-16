import { useState } from 'react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareDialogProps {
  tasks: Task[];
}

export function ShareDialog({ tasks }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  
  // Create a shareable link by encoding tasks in base64
  const generateShareLink = () => {
    const shareData = tasks.map(t => ({ text: t.text, completed: t.completed }));
    const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)));
    return `${window.location.origin}?share=${encoded}`;
  };

  const shareLink = tasks.length > 0 ? generateShareLink() : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={tasks.length === 0}>
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Your Tasks</DialogTitle>
          <DialogDescription>
            Anyone with this link can view your tasks (read-only). The link contains your current task list.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 mt-4">
          <Input 
            value={shareLink} 
            readOnly 
            className="flex-1 text-sm"
          />
          <Button onClick={handleCopy} variant="secondary" className="shrink-0">
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          💡 Tip: Upgrade to get permanent shareable links that sync in real-time.
        </p>
      </DialogContent>
    </Dialog>
  );
}
