import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogIn, Clock, X, ShieldCheck, Zap } from 'lucide-react';

interface GuestWarningDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: () => void;
}

export const GuestWarningDialog: React.FC<GuestWarningDialogProps> = ({
    isOpen,
    onClose,
    onLogin
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            // Only allow closing via buttons or the X icon
            // Don't call onClose() here to prevent accidental closing from focus loss
        }}>
            <DialogContent
                className="max-w-lg bg-[#0a0a0a]/98 border-2 border-[#FACC15]/40 shadow-[0_0_60px_rgba(250,204,21,0.4)] p-0 overflow-hidden rounded-[2rem] z-[10001] outline-none"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                {/* Header with Background Pattern */}
                <div className="relative h-32 bg-gradient-to-br from-[#FACC15]/20 to-transparent flex items-center justify-center border-b border-[#FACC15]/20">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#FACC15 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                    <div className="w-20 h-20 rounded-full bg-black/60 border-2 border-[#FACC15]/50 flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                        <AlertTriangle className="w-10 h-10 text-[#FACC15] animate-pulse" />
                    </div>
                    {/* Explicit Close Button (X) */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-zinc-400 hover:text-white hover:bg-black/60 transition-all border border-white/5 outline-none z-50"
                        aria-label="Close warning"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <DialogTitle className="text-3xl font-black text-white uppercase tracking-tight">
                            Mission Protocol: <span className="text-[#FACC15]">Guest Mode</span>
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-base">
                            Operational data is currently being stored in volatile local memory.
                        </DialogDescription>
                    </div>

                    <div className="grid gap-4">
                        {/* Critical Warning */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                            <Clock className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                            <div className="space-y-1">
                                <p className="text-base font-black text-red-400 uppercase tracking-wide">
                                    Expiration Impending: 24 Hours
                                </p>
                                <p className="text-sm text-red-300/80 leading-relaxed">
                                    All missions, categories, and tags will be <span className="font-bold underline">permanently erased</span> after 24 hours unless synchronized with the cloud.
                                </p>
                            </div>
                        </div>

                        {/* Login Benefit */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FACC15]/5 border-2 border-[#FACC15]/20">
                            <ShieldCheck className="w-6 h-6 text-[#FACC15] flex-shrink-0 mt-1" />
                            <div className="space-y-1">
                                <p className="text-base font-black text-[#FACC15] uppercase tracking-wide">
                                    Secure Cloud Synchronization
                                </p>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    Establish a secure identity to preserve your operational data indefinitely and sync across all devices.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                            <Zap className="w-4 h-4 text-[#FACC15]" /> Sync Everywhere
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                            <Zap className="w-4 h-4 text-[#FACC15]" /> Secure Identity
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                            <Zap className="w-4 h-4 text-[#FACC15]" /> Never Lose Data
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                            <Zap className="w-4 h-4 text-[#FACC15]" /> AI Refinements
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold h-14"
                        >
                            Continue as Guest
                        </Button>
                        <Button
                            onClick={() => {
                                onClose();
                                onLogin();
                            }}
                            className="flex-1 rounded-2xl bg-[#FACC15] text-black hover:bg-[#FACC15]/90 font-black h-14 shadow-[0_10px_30px_rgba(250,204,21,0.3)] group"
                        >
                            <LogIn className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                            INITIALIZE LOGIN
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
