import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Clock, Save, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Task } from '@/types/task';

interface ReminderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    onUpdate: (id: string, updates: Partial<Task>) => void;
}

export function ReminderDialog({ isOpen, onClose, task, onUpdate }: ReminderDialogProps) {
    const [reminderTime, setReminderTime] = useState(task.reminder || '');
    const [emailEnabled, setEmailEnabled] = useState(task.emailReminderEnabled || false);
    const [whatsappEnabled, setWhatsappEnabled] = useState(task.whatsappReminderEnabled || false);

    const handleSave = () => {
        if (emailEnabled && !reminderTime) {
            toast.error("Please set a reminder time");
            return;
        }

        onUpdate(task.id, {
            reminder: reminderTime,
            emailReminderEnabled: emailEnabled,
            whatsappReminderEnabled: whatsappEnabled
        });

        toast.success("Reminder preferences updated");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-white/10 text-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                        <Bell className="w-5 h-5 text-primary" />
                        Set Mission Reminder
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 font-medium">
                        Don't miss out on your objectives. Set up automated alerts.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4 relative z-10">
                    {/* Time Picker */}
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Reminder Schedule</Label>
                        <div className="relative group">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                            <Input
                                type="datetime-local"
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                                className="pl-10 bg-white/5 border-white/10 focus-visible:ring-primary focus-visible:ring-offset-0 text-white"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* Delivery Channels */}
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Delivery Channels</Label>

                        {/* Email Channel */}
                        <div className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                            emailEnabled ? "bg-primary/5 border-primary/30" : "bg-white/5 border-white/5"
                        )}>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-xl transition-colors",
                                    emailEnabled ? "bg-primary text-black" : "bg-zinc-800 text-gray-500"
                                )}>
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold tracking-tight">Email Notification</p>
                                    <p className="text-[10px] text-gray-500 font-medium tracking-tight">Receive alerts via your registered email</p>
                                </div>
                            </div>
                            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                        </div>

                        {/* WhatsApp Channel (Coming Soon / Disabled) */}
                        <div className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border bg-white/5 border-white/5 opacity-50 grayscale transition-all duration-300",
                        )}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-zinc-800 text-gray-500">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold tracking-tight">WhatsApp Alert <span className="text-[8px] bg-primary/20 text-primary px-1 rounded ml-1 tracking-widest uppercase">Soon</span></p>
                                    <p className="text-[10px] text-gray-500 font-medium tracking-tight">Direct notification to your mobile device</p>
                                </div>
                            </div>
                            <Switch checked={whatsappEnabled} disabled onCheckedChange={setWhatsappEnabled} />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-2">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="rounded-xl font-black uppercase tracking-widest gap-2 bg-primary hover:bg-primary/90 text-black shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                        <Save className="w-4 h-4" />
                        Establish Alert
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
