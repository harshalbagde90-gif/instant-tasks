import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UpgradeBanner() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t border-border py-3 px-4">
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Love TaskFlow? Upgrade for cloud sync and unlimited AI!</span>
        </div>
        <Button size="sm" className="whitespace-nowrap">
          Upgrade
        </Button>
      </div>
    </div>
  );
}
