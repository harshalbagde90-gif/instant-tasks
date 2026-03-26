import React, { useState } from 'react';
import { Check, X, Zap, Crown, Sparkles, ArrowRight, Star, Shield, Clock, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { initiateRazorpayPayment, activateTrial, type PlanKey } from '@/lib/razorpay';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        emoji: '🆓',
        tagline: 'Perfect for getting started',
        priceINR: 0,
        priceINR_annual: 0,
        priceUSD: 0,
        priceUSD_annual: 0,
        color: 'from-zinc-500 to-zinc-400',
        borderColor: 'border-white/10',
        glowClass: 'animate-pulse-silver',
        badge: null,
        cta: 'Get Started Free',
        ctaStyle: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
        features: [
            { text: '50 tasks (Basic Mode only)', included: true },
            { text: 'Due dates & priorities', included: true },
            { text: '5 default categories & tags', included: true },
            { text: '10 AI actions / month', included: true },
            { text: 'Local storage (24 hr expiry)', included: true },
            { text: 'Cloud sync', included: false },
            { text: 'Advanced / Customize Mode', included: false },
            { text: 'Big Data Console', included: false },
            { text: 'Email & Browser reminders', included: false },
            { text: 'WhatsApp Quick Share', included: false },
            { text: 'Task Sharing & WallPrint', included: false },
            { text: 'Attachments & Export', included: false },
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        emoji: '🚀',
        tagline: 'For individuals who mean business',
        priceINR: 149,
        priceINR_annual: 999,
        priceUSD: 3.99,
        priceUSD_annual: 29,
        color: 'from-amber-500 to-yellow-400',
        borderColor: 'border-amber-400/60',
        glowClass: 'animate-pulse-gold',
        badge: 'MOST POPULAR',
        cta: 'Start 7-Day Free Trial',
        ctaStyle: 'premium-button',
        features: [
            { text: 'Unlimited tasks', included: true },
            { text: 'Due dates & all priorities (incl. Urgent)', included: true },
            { text: 'Custom categories & tags (up to 20)', included: true },
            { text: '100 AI actions / month', included: true },
            { text: 'Real-time cloud sync (cross-device)', included: true },
            { text: 'Advanced Mode + Customize Mode', included: true },
            { text: 'Big Data Console (3 workspaces)', included: true },
            { text: 'Email + Browser Push reminders', included: true },
            { text: 'WhatsApp Quick Share', included: true },
            { text: 'Task Sharing & WallPrint', included: true },
            { text: 'Attachments (10 MB) & Export', included: true },
            { text: '30-day activity history', included: true },
        ],
    },
    {
        id: 'power',
        name: 'Power',
        emoji: '👑',
        tagline: 'For power users & heavy lifters',
        priceINR: 299,
        priceINR_annual: 1999,
        priceUSD: 7.99,
        priceUSD_annual: 59,
        color: 'from-teal-400 to-cyan-400',
        borderColor: 'border-teal-400/60',
        glowClass: 'animate-pulse-tech',
        badge: 'BEST VALUE',
        cta: 'Start 7-Day Free Trial',
        ctaStyle: 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black font-bold transition-all duration-300 hover:shadow-[0_0_25px_rgba(20,184,166,0.5)]',
        features: [
            { text: 'Everything in Pro', included: true },
            { text: 'Unlimited AI actions', included: true },
            { text: 'Unlimited categories & tags', included: true },
            { text: 'Unlimited Big Data workspaces', included: true },
            { text: 'Email + Browser Push reminders', included: true },
            { text: 'WhatsApp Quick Share', included: true },
            { text: 'Attachments (50 MB) & Export', included: true },
            { text: 'Unlimited activity history', included: true },
            { text: 'Early access to new features', included: true },
            { text: 'Priority email support', included: true },
            { text: 'Beta features access', included: true },
            { text: 'All future updates', included: true },
        ],
    },
];

const FAQS = [
    {
        q: 'Can I switch plans anytime?',
        a: 'Yes! Upgrade or downgrade anytime. Charges are prorated — you only pay for what you use.',
    },
    {
        q: 'What happens to my data if I downgrade?',
        a: 'Your data is always safe. You just won\'t be able to add tasks beyond the free limit until you upgrade again.',
    },
    {
        q: 'Do you offer refunds?',
        a: '7-day money-back guarantee. No questions asked. Just email us and we\'ll process it.',
    },
    {
        q: 'Do I need a credit card for the trial?',
        a: 'No! Start your 7-day Pro trial with just your email. No card required.',
    },
    {
        q: 'Are international payments supported?',
        a: 'Yes — we accept all major credit/debit cards, UPI, Net Banking, and PayPal globally.',
    },
    {
        q: 'Is GST included in the price?',
        a: 'For Indian users, GST (18%) is added at checkout. International users\' taxes are handled automatically.',
    },
];

export default function Pricing() {
    const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
    const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const navigate = useNavigate();

    const getPlanKey = (planId: string): PlanKey => {
        return `${planId}_${billing}` as PlanKey;
    };

    const handleUpgrade = async (planId: string) => {
        if (planId === 'free') return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/');
            return;
        }

        const planKey = getPlanKey(planId);
        setLoadingPlan(planId);
        await initiateRazorpayPayment(planKey, (upgradedPlan) => {
            setLoadingPlan(null);
            // Optionally redirect or refresh plan state
        });
        setLoadingPlan(null);
    };

    const handleTrial = async (planId: string) => {
        if (planId === 'free') return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/');
            return;
        }

        setLoadingPlan(planId + '_trial');
        await activateTrial((plan) => {
            setLoadingPlan(null);
        });
        setLoadingPlan(null);
    };

    const getPrice = (plan: typeof PLANS[0]) => {
        if (currency === 'INR') {
            return billing === 'annual' ? plan.priceINR_annual : plan.priceINR;
        }
        return billing === 'annual' ? plan.priceUSD_annual : plan.priceUSD;
    };

    const formatPrice = (plan: typeof PLANS[0]) => {
        const price = getPrice(plan);
        if (price === 0) return 'Free';
        const symbol = currency === 'INR' ? '₹' : '$';
        return `${symbol}${price}`;
    };

    const getPeriodLabel = (plan: typeof PLANS[0]) => {
        if (getPrice(plan) === 0) return 'forever';
        return billing === 'annual' ? '/ year' : '/ month';
    };

    return (
        <div className="dark min-h-screen bg-black text-white font-sans overflow-x-hidden">

            {/* Background glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px] glow-pulse" />
                <div className="absolute bottom-[-20%] right-[5%] w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[100px] glow-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 md:py-24">

                {/* ── Header ── */}
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
                        <Sparkles size={12} />
                        Pricing
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                        Simple Pricing.{' '}
                        <span className="text-gradient">Serious Productivity.</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        Start free. Upgrade when you're ready. No hidden fees, ever.
                    </p>

                    {/* Trial Badge */}
                    <div className="inline-flex items-center gap-2 mt-6 bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold px-5 py-2 rounded-full">
                        <Shield size={14} />
                        7-day free trial on Pro & Power — No card required
                    </div>
                </div>

                {/* ── Billing Toggle ── */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">

                    {/* Monthly / Annual toggle */}
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
                        <button
                            onClick={() => setBilling('monthly')}
                            className={cn(
                                'px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300',
                                billing === 'monthly'
                                    ? 'bg-primary text-primary-foreground shadow-lg'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBilling('annual')}
                            className={cn(
                                'px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2',
                                billing === 'annual'
                                    ? 'bg-primary text-primary-foreground shadow-lg'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            Annual
                            <span className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                SAVE 44%
                            </span>
                        </button>
                    </div>

                    {/* Currency toggle */}
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
                        <button
                            onClick={() => setCurrency('INR')}
                            className={cn(
                                'px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300',
                                currency === 'INR'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            🇮🇳 ₹ INR
                        </button>
                        <button
                            onClick={() => setCurrency('USD')}
                            className={cn(
                                'px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300',
                                currency === 'USD'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            🌍 $ USD
                        </button>
                    </div>
                </div>

                {/* ── Pricing Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    {PLANS.map((plan, idx) => {
                        const isPro = plan.id === 'pro';
                        const isPower = plan.id === 'power';
                        return (
                            <div
                                key={plan.id}
                                className={cn(
                                    'relative rounded-3xl border p-7 flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl',
                                    'bg-white/[0.04] backdrop-blur-sm',
                                    plan.borderColor,
                                    isPro && plan.glowClass,
                                    isPower && plan.glowClass,
                                )}
                                style={{ animationDelay: `${idx * 0.2}s` }}
                            >
                                {/* Popular / Best Value badge */}
                                {plan.badge && (
                                    <div className={cn(
                                        'absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap',
                                        isPro && 'bg-amber-400 text-black',
                                        isPower && 'bg-teal-400 text-black',
                                    )}>
                                        {plan.badge}
                                    </div>
                                )}

                                {/* Plan Header */}
                                <div className="mb-6">
                                    <div className="text-3xl mb-2">{plan.emoji}</div>
                                    <h2 className="text-2xl font-black mb-1">{plan.name}</h2>
                                    <p className="text-muted-foreground text-sm">{plan.tagline}</p>
                                </div>

                                {/* Price */}
                                <div className="mb-7">
                                    <div className="flex items-end gap-2">
                                        <span className={cn(
                                            'text-5xl font-black',
                                            isPro && 'text-amber-400',
                                            isPower && 'text-teal-400',
                                            !isPro && !isPower && 'text-foreground',
                                        )}>
                                            {formatPrice(plan)}
                                        </span>
                                        {getPrice(plan) > 0 && (
                                            <span className="text-muted-foreground text-sm pb-2">
                                                {getPeriodLabel(plan)}
                                            </span>
                                        )}
                                        {getPrice(plan) === 0 && (
                                            <span className="text-muted-foreground text-sm pb-2">forever</span>
                                        )}
                                    </div>

                                    {/* Annual saving callout */}
                                    {billing === 'monthly' && plan.priceINR > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {currency === 'INR'
                                                ? `Save ₹${plan.priceINR * 12 - plan.priceINR_annual} with annual`
                                                : `Save $${(plan.priceUSD * 12 - plan.priceUSD_annual).toFixed(0)} with annual`}
                                        </p>
                                    )}
                                </div>

                                {/* CTA Button */}
                                <div className="flex flex-col gap-2 mb-8">
                                    {/* Trial button (Pro/Power only) */}
                                    {plan.id !== 'free' && (
                                        <button
                                            onClick={() => handleTrial(plan.id)}
                                            disabled={!!loadingPlan}
                                            className={cn(
                                                'w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2',
                                                plan.ctaStyle,
                                                loadingPlan === plan.id + '_trial' && 'opacity-70 cursor-wait'
                                            )}
                                            id={`plan-cta-${plan.id}`}
                                        >
                                            {loadingPlan === plan.id + '_trial' ? 'Activating...' : plan.cta}
                                            {loadingPlan !== plan.id + '_trial' && <ArrowRight size={14} />}
                                        </button>
                                    )}
                                    {/* Free plan button */}
                                    {plan.id === 'free' && (
                                        <button
                                            onClick={() => navigate('/')}
                                            className={cn(
                                                'w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2',
                                                plan.ctaStyle,
                                            )}
                                            id={`plan-cta-${plan.id}`}
                                        >
                                            {plan.cta}
                                        </button>
                                    )}
                                    {/* Buy now button (Pro/Power only) */}
                                    {plan.id !== 'free' && (
                                        <button
                                            onClick={() => handleUpgrade(plan.id)}
                                            disabled={!!loadingPlan}
                                            className={cn(
                                                'w-full py-2.5 rounded-2xl text-xs font-semibold border transition-all duration-300 active:scale-95',
                                                isPro && 'border-amber-400/40 text-amber-400 hover:bg-amber-400/10',
                                                isPower && 'border-teal-400/40 text-teal-400 hover:bg-teal-400/10',
                                                loadingPlan === plan.id && 'opacity-70 cursor-wait'
                                            )}
                                            id={`plan-buy-${plan.id}`}
                                        >
                                            {loadingPlan === plan.id ? 'Processing...' : `Buy Now — ${currency === 'INR' ? '₹' : '$'}${getPrice(plan)} ${getPeriodLabel(plan)}`}
                                        </button>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-border mb-6" />

                                {/* Feature list */}
                                <ul className="space-y-3 flex-1">
                                    {plan.features.map((f, fi) => (
                                        <li key={fi} className="flex items-start gap-3 text-sm">
                                            {f.included ? (
                                                <span className={cn(
                                                    'mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center',
                                                    isPro && 'bg-amber-400/20 text-amber-400',
                                                    isPower && 'bg-teal-400/20 text-teal-400',
                                                    !isPro && !isPower && 'bg-white/10 text-white/60',
                                                )}>
                                                    <Check size={10} strokeWidth={3} />
                                                </span>
                                            ) : (
                                                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-white/5 text-white/20 flex items-center justify-center">
                                                    <X size={10} strokeWidth={3} />
                                                </span>
                                            )}
                                            <span className={f.included ? 'text-foreground' : 'text-muted-foreground/50 line-through'}>
                                                {f.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                {/* ── Trust Badges ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
                    {[
                        { icon: <Shield size={20} />, label: '7-Day Refund', sub: 'No questions asked' },
                        { icon: <Clock size={20} />, label: '7-Day Trial', sub: 'No card required' },
                        { icon: <Zap size={20} />, label: 'Cancel Anytime', sub: 'No lock-in' },
                        { icon: <Star size={20} />, label: 'Data Safe', sub: 'Always yours' },
                    ].map((b, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center gap-2 hover:border-yellow-400/30 transition-colors duration-300">
                            <span className="text-primary">{b.icon}</span>
                            <span className="font-bold text-sm">{b.label}</span>
                            <span className="text-muted-foreground text-xs">{b.sub}</span>
                        </div>
                    ))}
                </div>

                {/* ── Comparison Table (desktop) ── */}
                <div className="mb-20 hidden md:block">
                    <h2 className="text-2xl font-black text-center mb-8">Full Feature Comparison</h2>
                    <div className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left px-6 py-4 text-muted-foreground font-semibold w-1/2">Feature</th>
                                    <th className="px-4 py-4 text-center font-bold">Free</th>
                                    <th className="px-4 py-4 text-center font-bold text-amber-400">Pro</th>
                                    <th className="px-4 py-4 text-center font-bold text-teal-400">Power</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['Tasks', '50', 'Unlimited', 'Unlimited'],
                                    ['AI Actions / month', '10', '100', 'Unlimited'],
                                    ['Cloud Sync', false, true, true],
                                    ['Advanced Mode', false, true, true],
                                    ['Big Data Console', false, '3 workspaces', 'Unlimited'],
                                    ['Email Reminders', false, true, true],
                                    ['Browser Push Reminders', false, true, true],
                                    ['WhatsApp Quick Share', false, true, true],
                                    ['Task Sharing', false, true, true],
                                    ['WallPrint', false, true, true],
                                    ['Attachments', false, '10 MB', '50 MB'],
                                    ['Export (PDF/CSV)', false, true, true],
                                    ['Activity History', false, '30 days', 'Unlimited'],
                                    ['Priority Support', false, false, true],
                                    ['Early Access', false, false, true],
                                ].map(([feat, free, pro, power], ri) => (
                                    <tr key={ri} className={cn('border-b border-border/50 hover:bg-white/[0.02] transition-colors', ri % 2 === 0 && 'bg-white/[0.01]')}>
                                        <td className="px-6 py-3.5 text-foreground/80">{feat}</td>
                                        {[free, pro, power].map((val, ci) => (
                                            <td key={ci} className="px-4 py-3.5 text-center">
                                                {val === true ? (
                                                    <span className={cn('inline-flex items-center justify-center w-5 h-5 rounded-full', ci === 1 ? 'bg-amber-400/20 text-amber-400' : ci === 2 ? 'bg-teal-400/20 text-teal-400' : 'bg-white/10 text-white/60')}>
                                                        <Check size={11} strokeWidth={3} />
                                                    </span>
                                                ) : val === false ? (
                                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/5 text-white/20">
                                                        <X size={11} strokeWidth={3} />
                                                    </span>
                                                ) : (
                                                    <span className={cn('font-semibold', ci === 1 ? 'text-amber-400' : ci === 2 ? 'text-teal-400' : '')}>{val}</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── FAQ ── */}
                <div className="mb-20 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-black text-center mb-8">Frequently Asked Questions</h2>
                    <div className="space-y-3">
                        {FAQS.map((faq, i) => (
                            <div
                                key={i}
                                className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-yellow-400/30 transition-colors duration-300"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full text-left px-5 py-4 font-semibold flex items-center justify-between gap-4"
                                    id={`faq-${i}`}
                                >
                                    <span>{faq.q}</span>
                                    <span className={cn(
                                        'flex-shrink-0 w-6 h-6 rounded-full border border-border flex items-center justify-center transition-all duration-300',
                                        openFaq === i && 'bg-primary border-primary text-primary-foreground rotate-45'
                                    )}>
                                        <ArrowRight size={12} />
                                    </span>
                                </button>
                                {openFaq === i && (
                                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Bottom CTA Banner ── */}
                <div className="relative rounded-3xl overflow-hidden border border-primary/30 p-10 text-center animate-shimmer">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-teal-500/10 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="text-4xl mb-3">⚡</div>
                        <h2 className="text-3xl font-black mb-3">
                            Ready to get{' '}
                            <span className="text-gradient">seriously productive?</span>
                        </h2>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            Join thousands of users who manage their missions with Tangy Task.
                            Start free, no card needed.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                id="bottom-cta-free"
                                className="px-8 py-3.5 rounded-2xl border border-white/20 text-white font-bold hover:bg-white/10 transition-all duration-300"
                            >
                                Start for Free
                            </button>
                            <button
                                id="bottom-cta-pro"
                                className="premium-button px-8 py-3.5 rounded-2xl flex items-center gap-2 font-bold"
                            >
                                <Crown size={16} />
                                Try Pro — 7 Days Free
                            </button>
                        </div>
                        <p className="text-muted-foreground/60 text-xs mt-4">
                            No credit card • Cancel anytime • 7-day money back guarantee
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
