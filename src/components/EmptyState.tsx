import { CheckCircle2 } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Your day is wide open!
      </h3>
      <p className="text-muted-foreground max-w-sm">
        Add your first task above and start making progress. Every great journey begins with a single step.
      </p>
    </div>
  );
}
