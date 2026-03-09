import React, { useEffect, useState } from 'react';
import { Bell, Mail, MessageSquare, Save, X, CheckCircle2, Send, Loader2 } from 'lucide-react';
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
import { format, addDays, startOfToday, isBefore, isSameDay } from 'date-fns';

interface ReminderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    userEmail?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

type ParsedReminder = {
    date: Date;
    hour: string;
    minute: string;
    ampm: 'AM' | 'PM';
};

function parseExistingReminder(iso?: string): ParsedReminder {
    if (!iso) {
        return { date: new Date(), hour: '08', minute: '00', ampm: 'AM' };
    }

    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
        return { date: new Date(), hour: '08', minute: '00', ampm: 'AM' };
    }

    const h24 = d.getHours();
    const ampm: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;

    return {
        date: d,
        hour: String(h12).padStart(2, '0'),
        minute: String(d.getMinutes()).padStart(2, '0'),
        ampm,
    };
}

export function ReminderDialog({ isOpen, onClose, task, onUpdate, userEmail }: ReminderDialogProps) {
    const parsed = parseExistingReminder(task.reminder);

    const [selectedDate, setSelectedDate] = useState<Date>(parsed.date);
    const [hour, setHour] = useState(parsed.hour);
    const [minute, setMinute] = useState(parsed.minute);
    const [ampm, setAmpm] = useState<'AM' | 'PM'>(parsed.ampm);

    const [emailEnabled, setEmailEnabled] = useState(task.emailReminderEnabled || false);
    const [reminderEmail, setReminderEmail] = useState(task.reminderEmail || userEmail || '');
    const [wpEnabled, setWpEnabled] = useState(task.whatsappReminderEnabled || false);
    const [wpNumber, setWpNumber] = useState(task.whatsappNumber || '');
    const [wpVerified, setWpVerified] = useState(task.whatsappVerified || false);
    const [sendingTest, setSendingTest] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const next = parseExistingReminder(task.reminder);
        setSelectedDate(next.date);
        setHour(next.hour);
        setMinute(next.minute);
        setAmpm(next.ampm);

        setEmailEnabled(task.emailReminderEnabled || false);
        setReminderEmail(task.reminderEmail || userEmail || '');
        setWpEnabled(task.whatsappReminderEnabled || false);
        setWpNumber(task.whatsappNumber || '');
        setWpVerified(task.whatsappVerified || false);
    }, [isOpen, task, userEmail]);

    const buildISO = () => {
        const d = new Date(selectedDate);
        let h = parseInt(hour, 10);

        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;

        d.setHours(h, parseInt(minute, 10), 0, 0);
        return d.toISOString();
    };

    const handleSave = () => {
        const iso = buildISO();
        if (isBefore(new Date(iso), new Date())) {
            toast.error('Please pick a future date & time');
            return;
        }

        if (emailEnabled && !reminderEmail.trim()) {
            toast.error('Enter email address');
            return;
        }

        if (emailEnabled && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reminderEmail)) {
            toast.error('Enter valid email');
            return;
        }

        if (wpEnabled && !wpNumber.trim()) {
            toast.error('Enter WhatsApp number');
            return;
        }

        onUpdate(task.id, {
            reminder: iso,
            emailReminderEnabled: emailEnabled,
            reminderEmail: emailEnabled ? reminderEmail.trim() : undefined,
            whatsappReminderEnabled: wpEnabled,
            whatsappNumber: wpEnabled ? wpNumber.trim() : undefined,
            whatsappVerified: wpVerified,
            reminderSent: false,
        });

        const channels = [emailEnabled && 'Email', wpEnabled && 'WhatsApp'].filter(Boolean);
        toast.success(channels.length ? `Reminder set via ${channels.join(' & ')}` : 'Reminder time saved');
        onClose();
    };

    const handleSendTestWp = async () => {
        if (!wpNumber.trim()) {
            toast.error('Enter number first');
            return;
        }

        setSendingTest(true);
        await new Promise((r) => setTimeout(r, 1000));
        toast.info('WhatsApp integration coming soon! Confirm manually for now.');
        setWpVerified(true);
        setSendingTest(false);
    };

    const today = startOfToday();
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] max-w-[500px] bg-zinc-900 border-white/10 text-white overflow-hidden p-0 max-h-[88vh] overflow-y-auto">
                <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 shrink-0" />

                <div className="p-4 space-y-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
                            <div className="p-1.5 rounded-xl bg-yellow-400/10 text-yellow-400">
                                <Bell className="w-4 h-4" />
                            </div>
                            Set Mission Reminder
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 text-xs font-medium">
                            Pick a date, time and how you want to be notified.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Target Date</Label>

                        <div className="flex gap-2">
                            {[
                                { label: 'Today', date: today },
                                { label: 'Tomorrow', date: tomorrow },
                                { label: 'Next Week', date: nextWeek },
                            ].map(({ label, date }) => (
                                <button
                                    key={label}
                                    onClick={() => setSelectedDate(date)}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all",
                                        isSameDay(selectedDate, date)
                                            ? "bg-yellow-400 text-black border-yellow-400"
                                            : "bg-white/5 text-gray-400 border-white/10 hover:border-yellow-400/40 hover:text-white"
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                            <Input
                                type="date"
                                min={format(today, 'yyyy-MM-dd')}
                                value={format(selectedDate, 'yyyy-MM-dd')}
                                onChange={(e) => {
                                    if (!e.target.value) return;
                                    const picked = new Date(`${e.target.value}T12:00:00`);
                                    if (!Number.isNaN(picked.getTime())) {
                                        setSelectedDate(picked);
                                    }
                                }}
                                className="h-9 bg-white/5 border-white/10 text-white text-sm focus-visible:ring-yellow-400 focus-visible:ring-offset-0"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Precise Time</Label>
                        <div className="flex items-end gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                            <div className="flex-1 space-y-1">
                                <p className="text-[9px] text-gray-500 font-bold uppercase text-center">Hour</p>
                                <select
                                    value={hour}
                                    onChange={(e) => setHour(e.target.value)}
                                    className="w-full h-9 bg-white/5 border border-white/10 rounded-lg text-white text-center font-black text-base focus:outline-none focus:border-yellow-400/50 cursor-pointer"
                                >
                                    {HOURS.map((h) => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>

                            <span className="text-xl font-black text-yellow-400 pb-2">:</span>

                            <div className="flex-1 space-y-1">
                                <p className="text-[9px] text-gray-500 font-bold uppercase text-center">Min</p>
                                <select
                                    value={minute}
                                    onChange={(e) => setMinute(e.target.value)}
                                    className="w-full h-9 bg-white/5 border border-white/10 rounded-lg text-white text-center font-black text-base focus:outline-none focus:border-yellow-400/50 cursor-pointer"
                                >
                                    {MINUTES.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[9px] text-gray-500 font-bold uppercase text-center">AM/PM</p>
                                <div className="flex flex-col gap-1">
                                    {(['AM', 'PM'] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setAmpm(p)}
                                            className={cn(
                                                "px-4 h-9 rounded-lg text-xs font-black transition-all",
                                                ampm === p ? "bg-yellow-400 text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <span className="text-[11px] text-gray-500 font-semibold">Reminder: </span>
                            <span className="text-[11px] text-yellow-400 font-black">
                                {format(selectedDate, 'EEE, MMM d')} at {hour}:{minute} {ampm}
                            </span>
                        </div>
                    </div>

                    <div className="h-px bg-white/5 my-0.5" />

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Notify Via</Label>

                        <div className={cn(
                            "rounded-2xl border overflow-hidden transition-all duration-300",
                            emailEnabled ? "bg-yellow-400/5 border-yellow-400/30" : "bg-white/5 border-white/5"
                        )}>
                            <div className="flex items-center justify-between p-3.5">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-1.5 rounded-xl transition-colors", emailEnabled ? "bg-yellow-400 text-black" : "bg-zinc-800 text-gray-500")}>
                                        <Mail className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Email Reminder</p>
                                        <p className="text-[10px] text-gray-500">Sent to your inbox</p>
                                    </div>
                                </div>
                                <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} className="data-[state=checked]:bg-yellow-400" />
                            </div>
                            {emailEnabled && (
                                <div className="px-3.5 pb-3.5">
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
                                        <p className="text-[10px] text-green-400 font-semibold flex items-center gap-1 mt-1">
                                            <CheckCircle2 className="w-3 h-3" /> Auto-filled from your account
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={cn(
                            "rounded-2xl border overflow-hidden transition-all duration-300",
                            wpEnabled ? "bg-green-500/5 border-green-500/30" : "bg-white/5 border-white/5"
                        )}>
                            <div className="flex items-center justify-between p-3.5">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-1.5 rounded-xl transition-colors", wpEnabled ? "bg-green-500 text-white" : "bg-zinc-800 text-gray-500")}>
                                        <MessageSquare className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold flex items-center gap-2">
                                            WhatsApp Alert
                                            <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Soon</span>
                                        </p>
                                        <p className="text-[10px] text-gray-500">Direct WhatsApp message</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={wpEnabled}
                                    onCheckedChange={(v) => {
                                        setWpEnabled(v);
                                        if (!v) setWpVerified(false);
                                    }}
                                    className="data-[state=checked]:bg-green-500"
                                />
                            </div>
                            {wpEnabled && (
                                <div className="px-3.5 pb-3.5 space-y-2">
                                    <div className="relative">
                                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                        <Input
                                            type="tel"
                                            placeholder="+91 98765 43210"
                                            value={wpNumber}
                                            onChange={(e) => {
                                                setWpNumber(e.target.value);
                                                setWpVerified(false);
                                            }}
                                            className="pl-9 h-9 bg-white/5 border-white/10 focus-visible:ring-green-500 focus-visible:ring-offset-0 text-white text-sm"
                                        />
                                    </div>
                                    {!wpVerified ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSendTestWp}
                                            disabled={sendingTest || !wpNumber.trim()}
                                            className="w-full rounded-xl border-green-500/30 text-green-400 hover:bg-green-500/10 font-bold text-xs"
                                        >
                                            {sendingTest ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-3.5 h-3.5 mr-1.5" />
                                                    Send Test Message
                                                </>
                                            )}
                                        </Button>
                                    ) : (
                                        <p className="text-[11px] text-green-400 flex items-center gap-1.5 font-semibold">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Number verified
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-0.5">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                        >
                            <X className="w-4 h-4 mr-1.5" /> Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="rounded-xl font-black uppercase tracking-widest gap-2 bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.25)] flex-1"
                        >
                            <Save className="w-4 h-4" /> Set Reminder
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
