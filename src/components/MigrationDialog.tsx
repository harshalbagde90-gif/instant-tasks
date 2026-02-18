import React from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Cloud, CheckCircle2, Loader2 } from 'lucide-react';

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
            {/* Darker backdrop for better visibility */}
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9998]" />

            <AlertDialog open={isOpen}>
                <AlertDialogContent className="max-w-lg bg-[#0a0a0a]/98 border-2 border-[#FACC15]/60 shadow-[0_0_60px_rgba(250,204,21,0.5)] z-[9999]">
                    <AlertDialogHeader>
                        <div className="flex flex-col items-center gap-6 py-8">
                            <div className="relative">
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${isComplete
                                    ? 'bg-green-500/20 border-2 border-green-500/60 shadow-[0_0_35px_rgba(34,197,94,0.5)]'
                                    : 'bg-[#FACC15]/20 border-2 border-[#FACC15]/60 shadow-[0_0_35px_rgba(250,204,21,0.5)]'
                                    }`}>
                                    {isComplete ? (
                                        <CheckCircle2 className="w-14 h-14 text-green-400 animate-pulse" />
                                    ) : (
                                        <Cloud className="w-14 h-14 text-[#FACC15] animate-pulse" />
                                    )}
                                </div>
                                {!isComplete && (
                                    <div className="absolute -bottom-3 -right-3 bg-black rounded-full p-2 border-2 border-[#FACC15]/60">
                                        <Loader2 className="w-10 h-10 text-[#FACC15] animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="text-center space-y-3">
                                <AlertDialogTitle className="text-3xl font-black text-white drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]">
                                    {isComplete ? '✅ Migration Complete!' : '🔄 Migrating Your Data...'}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-zinc-200 max-w-md text-base leading-relaxed px-4">
                                    {isComplete ? (
                                        <span className="text-green-300 font-bold text-lg">
                                            🎉 Your data has been safely migrated to the cloud and is now permanently saved!
                                        </span>
                                    ) : (
                                        <span className="font-medium">
                                            We are securely transferring your local data to the cloud. This will only take a moment...
                                        </span>
                                    )}
                                </AlertDialogDescription>
                            </div>

                            {!isComplete && (
                                <div className="w-full max-w-sm space-y-3">
                                    <div className="flex items-center justify-between text-sm font-bold text-zinc-300">
                                        <span>☁️ Uploading to Cloud...</span>
                                        <span className="text-[#FACC15] animate-pulse">Please wait</span>
                                    </div>
                                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden shadow-inner border border-white/20">
                                        <div className="h-full bg-gradient-to-r from-[#FACC15] via-[#FFD700] to-[#D4AF37] animate-pulse shadow-[0_0_12px_rgba(250,204,21,0.7)]" style={{ width: '100%' }} />
                                    </div>
                                </div>
                            )}

                            {isComplete && (
                                <div className="flex flex-col items-center gap-2 text-sm text-green-200 bg-green-500/15 px-6 py-4 rounded-xl border-2 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                    <div className="flex items-center gap-2 font-bold">
                                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                                        <span>Tasks, categories, and tags synced successfully</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </AlertDialogHeader>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
