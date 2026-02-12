import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Clock, ListChecks, Type, Palette, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types/task';

interface AdvancedTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (task: Partial<Task>) => void;
    initialText?: string;
}

export function AdvancedTaskModal({ isOpen, onClose, onAdd, initialText = '' }: AdvancedTaskModalProps) {
    const [text, setText] = useState(initialText);
    const [description, setDescription] = useState('');
    const [date, setDate] = useState<Date>();
    const [priority, setPriority] = useState<Task['priority']>('medium');
    const [estimatedTime, setEstimatedTime] = useState('');

    const handleAdd = () => {
        if (!text.trim()) return;

        onAdd({
            text: text.trim(),
            description: description.trim(),
            dueDate: date ? date.toISOString() : undefined,
            priority,
            estimatedTime: estimatedTime.trim(),
            completed: false,
            createdAt: Date.now(),
            subtasks: [],
        });

        // Reset fields
        setText('');
        setDescription('');
        setDate(undefined);
        setPriority('medium');
        setEstimatedTime('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground custom-scrollbar max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-primary">Advanced Mission Detail</DialogTitle>
                    <p className="text-xs text-muted-foreground tracking-widest uppercase">Fill in the mission parameters</p>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="task" className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter text-primary">
                            <Type className="w-3 h-3" /> Mission Name
                        </Label>
                        <Input
                            id="task"
                            placeholder="What needs to be done?"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="bg-muted border-border focus:border-primary/50 text-lg font-bold text-foreground"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description" className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter text-primary">
                            <ListChecks className="w-3 h-3" /> Mission Briefing (Details)
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Add extra context, bullet points, or instructions..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-muted border-border focus:border-primary/50 min-h-[100px] custom-scrollbar text-foreground"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter text-primary">
                                <CalendarIcon className="w-3 h-3" /> Deadline
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "justify-start text-left font-normal bg-muted border-border hover:bg-muted/80",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                        className="bg-card text-foreground"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="time" className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter text-primary">
                                <Clock className="w-3 h-3" /> Est. Duration
                            </Label>
                            <Input
                                id="time"
                                placeholder="e.g. 2h, 30m"
                                value={estimatedTime}
                                onChange={(e) => setEstimatedTime(e.target.value)}
                                className="bg-muted border-border focus:border-primary/50 text-foreground"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter text-primary">
                            <AlertCircle className="w-3 h-3" /> Priority Level
                        </Label>
                        <div className="flex gap-2">
                            {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all",
                                        priority === p
                                            ? `priority-${p} scale-105 shadow-lg`
                                            : "border-border bg-muted text-muted-foreground grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">Cancel</Button>
                    <Button
                        onClick={handleAdd}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
                        disabled={!text.trim()}
                    >
                        Deploy Mission
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
