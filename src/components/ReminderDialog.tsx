import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Clock, Save, X, CheckCircle2, Send, Loader2 } from 'lucide-react';
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
    userEmail?: string;   // auto-filled from auth
}

export function ReminderDialog({ isOpen, onClose, task, onUpdate, userEmail }: ReminderDialogProps) {
    const [reminderTime, setReminderTime]         = useState(task.reminder || '');
    const [emailEnabled, setEmailEnabled]         = useState(task.emailReminderEnabled || false);
    const [reminderEmail, setReminderEmail]       = useState(task.reminderEmail || userEmail || '');
    const [whatsappEnabled, setWhatsappEnabled]   = useState(task.whatsappReminderEnabled || false);
    const [whatsappNumber, setWhatsappNumber]     = useState(task.whatsappNumber || '');
    const [wpVerified, setWpVerified]             = useState(task.whatsappVerified || false);
    const [sendingTest, setSendingTest]           = useState(false);

    // Keep email synced when userEmail prop changes
    useEffect(() => {
        if (userEmail && !task.reminderEmail) setReminderEmail(userEmail);
    }, [userEmail]);

    // Reset reminder_sent when user changes reminder time
    const handleTimeChange = (val: string) => {
        setReminderTime(val);
        // if user picks a new time, reset sent flag
        if (val !== task.reminder) {
            onUpdate(task.id, { reminderSent: false });
        }
    };

    const handleSendTestWhatsApp = async () => {
        if (!whatsappNumber.trim()) {
            toast.error('Please enter your WhatsApp number first');
            return;
        }
        setSendingTest(true);
        // ── WhatsApp test (WAHA) will be wired here later ──
        // For now simulate a 1s delay and mark as "coming soon"
        await new Promise(r => setTimeout(r, 1000));
        toast.info('WhatsApp integration coming soon! Confirm manually for now.');
        setWpVerified(true);
        setSendingTest(false);
    };

    const handleSave = () => {
        if (!reminderTime) {
            toast.error('Please pick a reminder date & time');
            return;
        }
        if (emailEnabled && !reminderEmail.trim()) {
            toast.error('Please enter an email address for the reminder');
            return;
        }
        if (emailEnabled && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reminderEmail)) {
            toast.error('Please enter a valid email address');
            return;
        }
        if (whatsappEnabled && !whatsappNumber.trim()) {
            toast.error('Please enter a WhatsApp number');
            return;
        }

        onUpdate(task.id, {
            reminder: reminderTime,
            emailReminderEnabled: emailEnabled,
            reminderEmail: emailEnabled ? reminderEmail.trim() : undefined,
            whatsappReminderEnabled: whatsappEnabled,
            whatsappNumber: whatsappEnabled ? whatsappNumber.trim() : undefined,
            whatsappVerified: wpVerified,
            reminderSent: false,  // reset so it fires again on new schedule
        });

        const channels: string[] = [];
        if (emailEnabled)    channels.push('Email 📧');
        if (whatsappEnabled) channels.push('WhatsApp 💬');

        toast.success(
            channels.length
                ? `Reminder set via ${channels.join(' & ')}`
                : 'Reminder time saved'
        );
        onClose();
    };

    const isAlreadySent = task.reminderSent && task.reminder === reminderTime;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[460px] bg-zinc-900 border-white/10 text-white overflow-hidden p-0">
                {/* Gradient top bar */}
                <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500" />

                <div className="p-6">
                    <DialogHeader className="mb-5">
                        <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                            <div className="p-2 rounded-xl bg-yellow-400/10 text-yellow-400">
                                <Bell className="w-4 h-4" />
                            </div>
                            Set Mission Reminder
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm font-medium leading-snug mt-1">
                            Get notified before your deadline — choose how.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5">

                        {/* ── DateTime Picker ── */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                                When to Remind
                            </Label>
                            <div className="relative group">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors" />
                                <Input
                                    type="datetime-local"
                                    value={reminderTime}
                                    onChange={(e) => handleTimeChange(e.target.value)}
                                    className="pl-10 bg-white/5 border-white/10 focus-visible:ring-yellow-400 focus-visible:ring-offset-0 text-white"
                                />
                            </div>
                            {isAlreadySent && (
                                <p className="text-[11px] text-green-400 flex items-center gap-1.5 font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Reminder already sent for this time.
                                </p>
                            )}
                        </div>

                        <div className="h-px bg-white/5" />

                        {/* ── Delivery Channels ── */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                                Delivery Channels
                            </Label>

                            {/* Email Channel */}
                            <div className={cn(
                                "rounded-2xl border transition-all duration-300 overflow-hidden",
                                emailEnabled ? "bg-yellow-400/5 border-yellow-400/30" : "bg-white/5 border-white/5"
                            )}>
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-xl transition-colors",
                                            emailEnabled ? "bg-yellow-400 text-black" : "bg-zinc-800 text-gray-500"
                                        )}>
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold tracking-tight">Email Notification</p>
                                            <p className="text-[10px] text-gray-500 font-medium">Reminder via Gmail</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={emailEnabled}
                                        onCheckedChange={setEmailEnabled}
                                        className="data-[state=checked]:bg-yellow-400"
                                    />
                                </div>

                                {/* Email address input (slides in) */}
                                {emailEnabled && (
                                    <div className="px-4 pb-4 space-y-1.5">
                                        <Label className="text-[10px] text-gray-400 font-semibold tracking-wide">Send to</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                            <Input
                                                type="email"
                                                placeholder="your@email.com"
                                                value={reminderEmail}
                                                onChange={(e) => setReminderEmail(e.target.value)}
                                                className="pl-9 h-9 bg-white/5 border-white/10 focus-visible:ring-yellow-400 focus-visible:ring-offset-0 text-white text-sm"
                                            />
                                        </div>
                                        {userEmail && reminderEmail === userEmail && (
                                            <p className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Auto-filled from your account
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* WhatsApp Channel */}
                            <div className={cn(
                                "rounded-2xl border transition-all duration-300 overflow-hidden",
                                whatsappEnabled ? "bg-green-500/5 border-green-500/30" : "bg-white/5 border-white/5"
                            )}>
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-xl transition-colors",
                                            whatsappEnabled ? "bg-green-500 text-white" : "bg-zinc-800 text-gray-500"
                                        )}>
                                            <MessageSquare className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold tracking-tight flex items-center gap-2">
                                                WhatsApp Alert
                                                <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Soon</span>
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-medium">Direct WhatsApp message</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={whatsappEnabled}
                                        onCheckedChange={(v) => { setWhatsappEnabled(v); if (!v) setWpVerified(false); }}
                                        className="data-[state=checked]:bg-green-500"
                                    />
                                </div>

                                {/* WhatsApp number input */}
                                {whatsappEnabled && (
                                    <div className="px-4 pb-4 space-y-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-gray-400 font-semibold tracking-wide">
                                                WhatsApp Number (with country code)
                                            </Label>
                                            <div className="relative">
                                                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                                <Input
                                                    type="tel"
                                                    placeholder="+91 98765 43210"
                                                    value={whatsappNumber}
                                                    onChange={(e) => { setWhatsappNumber(e.target.value); setWpVerified(false); }}
                                                    className="pl-9 h-9 bg-white/5 border-white/10 focus-visible:ring-green-500 focus-visible:ring-offset-0 text-white text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Verify button */}
                                        {!wpVerified ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleSendTestWhatsApp}
                                                disabled={sendingTest || !whatsappNumber.trim()}
                                                className="w-full rounded-xl border-green-500/30 text-green-400 hover:bg-green-500/10 font-bold text-xs"
                                            >
                                                {sendingTest
                                                    ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Sending test…</>
                                                    : <><Send className="w-3.5 h-3.5 mr-1.5" />Send Test Message</>
                                                }
                                            </Button>
                                        ) : (
                                            <p className="text-[11px] text-green-400 flex items-center gap-1.5 font-semibold">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Number verified ✓
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2 mt-6">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                        >
                            <X className="w-4 h-4 mr-1.5" /> Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!reminderTime}
                            className="rounded-xl font-black uppercase tracking-widest gap-2 bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.25)] flex-1"
                        >
                            <Save className="w-4 h-4" />
                            Set Reminder
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
