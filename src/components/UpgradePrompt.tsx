import React from 'react';
import { Crown, Zap, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { activateTrial } from '@/lib/razorpay';
import { supabase } from '@/integrations/supabase/client';

interface UpgradePromptProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    /** Called when user activates trial or upgrades — refresh profile */
    onUpgrade?: () => void;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
    isOpen,
    onClose,
    title = '⚡ Upgrade to Unlock',
    description = 'This feature is available on Pro and Power plans.',
    onUpgrade,
}) => {
    const navigate = useNavigate();
    const [trialLoading, setTrialLoading] = React.useState(false);
    const [trialUsed, setTrialUsed] = React.useState(false);

    const handleTrial = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/'); onClose(); return; }

        setTrialLoading(true);
        await activateTrial((plan) => {
            setTrialLoading(false);
            onUpgrade?.();
            onClose();
        });
        setTrialLoading(false);
    };

    const handleSeePlans = () => {
        navigate('/pricing');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-sm rounded-3xl border border-amber-400/30 bg-[#0f0f0f] p-7 shadow-2xl shadow-amber-500/10 animate-in fade-in zoom-in-95 duration-200">

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
                >
                    <X size={14} />
                </button>

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-400/30 flex items-center justify-center mb-5">
                    <Crown size={26} className="text-amber-400" />
                </div>

                {/* Content */}
                <h2 className="text-xl font-black text-white mb-2">{title}</h2>
                <p className="text-sm text-white/50 mb-7 leading-relaxed">{description}</p>

                {/* What you get */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-6 space-y-2">
                    <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-3">Pro plan includes</p>
                    {[
                        'Unlimited tasks',
                        'Advanced + Customize Mode',
                        'Big Data Console (3 workspaces)',
                        '100 AI actions / month',
                        'Email + Browser Push reminders',
                        'Cloud sync across devices',
                    ].map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-white/70">
                            <Zap size={12} className="text-amber-400 flex-shrink-0" />
                            {f}
                        </div>
                    ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleTrial}
                        disabled={trialLoading}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-sm flex items-center justify-center gap-2 hover:from-amber-400 hover:to-yellow-300 transition-all active:scale-95 disabled:opacity-70"
                        id="upgrade-prompt-trial"
                    >
                        {trialLoading ? 'Activating...' : '🚀 Start 7-Day Free Trial'}
                    </button>
                    <button
                        onClick={handleSeePlans}
                        className="w-full py-3 rounded-2xl border border-white/15 text-white/70 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/5 hover:text-white transition-all"
                        id="upgrade-prompt-plans"
                    >
                        See all plans <ArrowRight size={13} />
                    </button>
                </div>

                <p className="text-center text-white/30 text-xs mt-4">No credit card • Cancel anytime</p>
            </div>
        </div>
    );
};

export default UpgradePrompt;
