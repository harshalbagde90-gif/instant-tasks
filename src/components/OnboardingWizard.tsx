import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Calendar, Briefcase, MessageSquare, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingWizardProps {
    isOpen: boolean;
    onComplete: () => void;
    userId: string;
}

export function OnboardingWizard({ isOpen, onComplete, userId }: OnboardingWizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [dob, setDob] = useState('');
    const [profession, setProfession] = useState('');
    const [whatsapp, setWhatsapp] = useState('');

    const handleSave = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    dob,
                    profession,
                    whatsapp_number: whatsapp,
                    onboarding_completed: true
                })
                .eq('id', userId);

            if (error) throw error;

            toast.success("Mission Credentials Updated!");
            onComplete();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        {
            title: "Identity Confirmation",
            desc: "When did your mission on Earth begin? (DOB)",
            icon: <Calendar className="w-6 h-6 text-primary" />,
            field: (
                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Temporal Origin</Label>
                    <Input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="bg-white/5 border-white/10 h-12 rounded-2xl focus:ring-primary"
                    />
                </div>
            )
        },
        {
            title: "Strategic Role",
            desc: "What is your primary operative function?",
            icon: <Briefcase className="w-6 h-6 text-primary" />,
            field: (
                <div className="grid grid-cols-2 gap-3">
                    {['Developer', 'Entrepreneur', 'Student', 'Designer', 'Manager', 'Other'].map((role) => (
                        <Button
                            key={role}
                            variant="outline"
                            onClick={() => setProfession(role)}
                            className={`h-14 rounded-2xl border-white/5 transition-all font-bold ${profession === role ? 'bg-primary text-black border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                        >
                            {role}
                        </Button>
                    ))}
                </div>
            )
        },
        {
            title: "Comm interface",
            desc: "Where should we send critical mission alerts?",
            icon: <MessageSquare className="w-6 h-6 text-primary" />,
            field: (
                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">WhatsApp Frequency</Label>
                    <Input
                        type="tel"
                        placeholder="+91 00000 00000"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="bg-white/5 border-white/10 h-12 rounded-2xl focus:ring-primary"
                    />
                </div>
            )
        }
    ];

    const currentStep = steps[step - 1];

    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-[450px] bg-zinc-950 border-white/5 text-white overflow-hidden p-0 rounded-[2.5rem] shadow-2xl">
                {/* Visual Flair */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />

                <div className="relative p-8 z-10">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex gap-1.5">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'w-2 bg-white/10'}`}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/50">Step {step} of 3</span>
                    </div>

                    <div className="mb-8">
                        <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/30">
                            {currentStep.icon}
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">{currentStep.title}</h2>
                        <p className="text-zinc-500 font-medium text-sm leading-relaxed">{currentStep.desc}</p>
                    </div>

                    <div className="min-h-[180px] mb-8">
                        {currentStep.field}
                    </div>

                    <div className="flex gap-4">
                        {step > 1 && (
                            <Button
                                variant="ghost"
                                onClick={() => setStep(step - 1)}
                                className="h-14 flex-1 rounded-2xl border border-white/5 text-zinc-500 hover:text-white transition-all font-black uppercase tracking-widest text-xs"
                            >
                                Back
                            </Button>
                        )}
                        <Button
                            onClick={step < 3 ? () => setStep(step + 1) : handleSave}
                            disabled={loading}
                            className="h-14 flex-[2] bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_25px_rgba(var(--primary),0.3)] transition-all active:scale-95 group"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <div className="flex items-center gap-2">
                                    {step < 3 ? (
                                        <>
                                            Next Intel
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    ) : (
                                        <>
                                            Complete Sync
                                            <Sparkles className="w-4 h-4" />
                                        </>
                                    )}
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
