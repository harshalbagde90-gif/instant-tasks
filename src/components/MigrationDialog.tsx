import React from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface MigrationDialogProps {
    isOpen: boolean;
    isComplete: boolean;
}

export const MigrationDialog: React.FC<MigrationDialogProps> = ({
    isOpen,
    isComplete
}) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Full-screen backdrop */}
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9998]" />

            <AlertDialog open={isOpen}>
                <AlertDialogContent className="max-w-md bg-[#0a0a0a]/98 border-2 border-[#FACC15]/60 shadow-[0_0_60px_rgba(250,204,21,0.4)] z-[9999]">
                    <AlertDialogHeader>
                        <div className="flex flex-col items-center gap-8 py-10 px-4">

                            {/* ── Centered circular animation ── */}
                            <div className="flex items-center justify-center w-full">
                                <div className="relative flex items-center justify-center">
                                    {/* Outer spinning ring */}
                                    {!isComplete && (
                                        <div className="absolute w-36 h-36 rounded-full border-4 border-transparent border-t-[#FACC15] border-r-[#FACC15]/40 animate-spin" />
                                    )}

                                    {/* Inner glow circle */}
                                    <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-700 ${isComplete
                                            ? 'bg-green-500/20 border-2 border-green-400/70 shadow-[0_0_40px_rgba(34,197,94,0.6)]'
                                            : 'bg-[#FACC15]/10 border-2 border-[#FACC15]/50 shadow-[0_0_40px_rgba(250,204,21,0.4)]'
                                        }`}>
                                        {isComplete ? (
                                            <CheckCircle2 className="w-14 h-14 text-green-400 animate-pulse" />
                                        ) : (
                                            <Loader2 className="w-14 h-14 text-[#FACC15] animate-spin" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Title & Description ── */}
                            <div className="text-center space-y-3 w-full">
                                <AlertDialogTitle className="text-2xl font-black text-white drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]">
                                    {isComplete ? '✅ Migration Complete!' : '🔄 Migrating Your Data...'}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-zinc-300 text-base leading-relaxed">
                                    {isComplete ? (
                                        <span className="text-green-300 font-semibold">
                                            🎉 Your data is safely in the cloud and permanently saved!
                                        </span>
                                    ) : (
                                        <span>
                                            Securely transferring your local data to the cloud. This will only take a moment...
                                        </span>
                                    )}
                                </AlertDialogDescription>
                            </div>

                            {/* ── Progress bar (loading) ── */}
                            {!isComplete && (
                                <div className="w-full space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                                        <span>☁️ Uploading to Cloud...</span>
                                        <span className="text-[#FACC15] animate-pulse">Please wait</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-[#FACC15] via-[#FFD700] to-[#D4AF37] animate-pulse w-full shadow-[0_0_10px_rgba(250,204,21,0.6)]" />
                                    </div>
                                </div>
                            )}

                            {/* ── Success confirmation ── */}
                            {isComplete && (
                                <div className="flex items-center gap-2 text-sm text-green-200 bg-green-500/10 px-6 py-3 rounded-xl border border-green-500/30">
                                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                    <span className="font-medium">Tasks, categories, and tags synced successfully</span>
                                </div>
                            )}

                        </div>
                    </AlertDialogHeader>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
