import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Task } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
    X, Copy, Check, Loader2, Share2, Lock, Globe,
    MessageCircle, Link2, Sparkles
} from 'lucide-react';

interface ShareModalProps {
    task: Task;
    mode: string;
    ownerId?: string | null;
    onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ task, mode, ownerId, onClose }) => {
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateLink = async () => {
        setIsLoading(true);
        try {
            // Check if this task already has a share link
            const taskData = {
                id: task.id,
                text: task.text,
                description: task.description,
                notes: task.notes,
                deadline: task.deadline,
                priority: task.priority,
                category: task.category,
                tags: task.tags,
                subtasks: task.subtasks || [],
                completed: task.completed,
                createdAt: task.createdAt,
            };

            const { data, error } = await (supabase as any)
                .from('shared_tasks')
                .insert([{
                    owner_id: ownerId || null,
                    task_data: JSON.parse(JSON.stringify(taskData)),
                    mode: mode,
                    checked_subtasks: [],
                }])
                .select('share_token')
                .single();

            if (error) throw error;

            const url = `${window.location.origin}/share/${data.share_token}`;
            setShareUrl(url);
        } catch (err) {
            console.error('Share error:', err);
            toast.error('Link generate nahi hua. Dobara try karo.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyLink = async () => {
        if (!shareUrl) return;
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Link copy ho gaya! 🔗');
        setTimeout(() => setCopied(false), 2500);
    };

    const shareWhatsApp = () => {
        if (!shareUrl) return;
        const msg = encodeURIComponent(
            `*${task.text}*\n\nYeh task maine tumhare saath share kiya hai!\nLink kholo aur subtasks check karo 👇\n\n${shareUrl}`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(139,92,246,0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                {/* Purple glow top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                            <Share2 className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-white">Share Task</h2>
                            <p className="text-[10px] text-zinc-500 font-bold">Link ki madad se share karo</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                    >
                        <X className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>

                {/* Task Preview */}
                <div className="mx-6 mt-5 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/15">
                    <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-black text-white leading-tight">{task.text}</p>
                            {task.subtasks && task.subtasks.length > 0 && (
                                <p className="text-[10px] text-zinc-500 font-bold mt-1">
                                    {task.subtasks.length} subtasks included
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="px-6 py-5 space-y-4">

                    {!shareUrl ? (
                        /* Generate Link Button */
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                <Globe className="w-3.5 h-3.5 text-purple-400" />
                                <span>Anyone with the link can view + check subtasks</span>
                            </div>

                            <button
                                onClick={generateLink}
                                disabled={isLoading}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all duration-300 flex items-center justify-center gap-2",
                                    "bg-gradient-to-r from-purple-600 to-violet-600 text-white",
                                    "hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:scale-[1.02] active:scale-[0.98]",
                                    isLoading && "opacity-70 pointer-events-none"
                                )}
                            >
                                {isLoading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                                ) : (
                                    <><Sparkles className="w-4 h-4" /> Generate Share Link</>
                                )}
                            </button>
                        </div>
                    ) : (
                        /* Share Options after link generated */
                        <div className="space-y-3">
                            {/* Link Box */}
                            <div className="flex items-center gap-2 p-3 bg-white/[0.03] border border-white/10 rounded-2xl">
                                <Link2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                <span className="text-[11px] font-bold text-zinc-300 flex-1 truncate">{shareUrl}</span>
                                <button
                                    onClick={copyLink}
                                    className={cn(
                                        "flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5",
                                        copied
                                            ? "bg-green-500 text-white"
                                            : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/40"
                                    )}
                                >
                                    {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                                </button>
                            </div>

                            {/* WhatsApp Button */}
                            <button
                                onClick={shareWhatsApp}
                                className="w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all duration-300 flex items-center justify-center gap-2.5 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 hover:shadow-[0_0_20px_rgba(37,211,102,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <MessageCircle className="w-4 h-4 fill-[#25D366]" />
                                Share on WhatsApp
                            </button>

                            {/* Copy Large Button */}
                            <button
                                onClick={copyLink}
                                className="w-full py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all duration-300 flex items-center justify-center gap-2 bg-white/[0.03] border border-white/10 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                Copy Link
                            </button>
                        </div>
                    )}

                    {/* Info Note */}
                    <div className="flex items-center gap-2 pt-1">
                        <Lock className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                        <span className="text-[9px] text-zinc-600 font-bold leading-relaxed">
                            Receiver sirf subtasks check kar sakta hai. Task edit nahi kar sakta.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
