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
import { Share2, Copy, Check, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ShareDialogProps {
  tasks: Task[];
}

export function ShareDialog({ tasks }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

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
        <Button
          variant="secondary"
          className="h-11 px-6 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 gap-2 font-bold transition-all duration-300 text-gray-400 hover:text-white"
          disabled={tasks.length === 0}
        >
          <Share2 className="w-4 h-4 text-gray-400" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-3xl font-extrabold tracking-tight">Collaboration Hub</DialogTitle>
          <DialogDescription className="text-lg text-gray-400 mt-2">
            Share your progress with the world. Anyone with this link can view your mission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-3">
            <div className="relative flex-1 glow-border rounded-xl">
              <Input
                value={shareLink}
                readOnly
                className="h-14 bg-white/5 border-white/10 rounded-xl px-6 text-sm font-medium focus-visible:ring-primary"
              />
            </div>
            <Button
              onClick={handleCopy}
              className="h-14 w-14 premium-button rounded-xl shrink-0"
            >
              {copied ? (
                <Check className="w-6 h-6 stroke-[3px]" />
              ) : (
                <Copy className="w-6 h-6 stroke-[3px]" />
              )}
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4">
            <Info className="w-6 h-6 text-primary shrink-0" />
            <p className="text-sm text-gray-400 font-medium">
              This link encodes your current tasks. If you add more tasks, you'll need to generate a new link.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
