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
        <Button variant="outline" className="gap-2">
          <LayoutTemplate className="w-4 h-4" />
          Templates
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Task Templates</SheetTitle>
          <SheetDescription>
            Choose a template to quickly add pre-made tasks. You can edit them after loading.
          </SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[calc(60vh-120px)] pr-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="flex flex-col items-start p-4 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all duration-200 text-left group"
            >
              <span className="text-3xl mb-2">{template.icon}</span>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {template.name}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {template.tasks.length} tasks
              </p>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
