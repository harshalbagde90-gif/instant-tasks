import { CheckCircle2, Sparkles } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      <div className="relative mb-8">
        <div className="relative w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-float">
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </div>
        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500 animate-pulse" />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
        Your day is wide open!
      </h3>
      <p className="text-gray-500 text-lg max-w-sm font-medium leading-relaxed">
        Capture your first big idea above. <br />
        <span className="text-primary/80">Every masterpiece begins with a single task.</span>
      </p>
    </div>
  );
}
