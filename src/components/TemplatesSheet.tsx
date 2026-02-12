import { Template } from '@/types/task';
import { templates } from '@/data/templates';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { LayoutTemplate } from 'lucide-react';

interface TemplatesSheetProps {
  onSelectTemplate: (template: Template) => void;
}

export function TemplatesSheet({ onSelectTemplate }: TemplatesSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="secondary"
          className="h-11 px-6 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 gap-2 font-bold transition-all duration-300 text-gray-400 hover:text-white"
        >
          <LayoutTemplate className="w-4 h-4 text-gray-400" />
          Templates
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[75vh] sm:h-[60vh] rounded-t-[2.5rem] bg-zinc-950/90 backdrop-blur-2xl border-white/10 px-8">
        <SheetHeader className="pb-8 pt-4">
          <SheetTitle className="text-3xl font-extrabold tracking-tight">Daily Blueprints</SheetTitle>
          <SheetDescription className="text-lg text-gray-400">
            Kickstart your productivity with curated task lists. One click to load.
          </SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto max-h-[calc(75vh-160px)] pb-12 pr-4 custom-scrollbar">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="flex flex-col items-start p-6 rounded-[2rem] glass-card border-white/5 hover:border-primary/50 hover:bg-white/5 transition-all duration-300 text-left group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-all" />
              <span className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{template.icon}</span>
              <h4 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors mb-2">
                {template.name}
              </h4>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                {template.tasks.length} Powerful Tasks
              </p>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
