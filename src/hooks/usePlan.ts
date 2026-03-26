import { useMemo } from 'react';

export type PlanTier = 'free' | 'pro' | 'power';

export interface PlanLimits {
    plan: PlanTier;
    isFree: boolean;
    isPro: boolean;
    isPower: boolean;
    isTrialActive: boolean;
    trialDaysLeft: number;
    taskLimit: number;       // 50 / Infinity / Infinity
    aiLimit: number;         // 10 / 100 / Infinity
    workspaceLimit: number;  // 0 / 3 / Infinity
    canUseMode: (mode: string) => boolean;
    canUseAI: (used: number) => boolean;
    canAddTask: (currentCount: number) => boolean;
    canAddWorkspace: (currentCount: number) => boolean;
}

export function usePlan(profile: any): PlanLimits {
    return useMemo(() => {
        const rawPlan: PlanTier = profile?.plan || 'free';

        // Check trial expiry
        const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
        const now = new Date();
        const isTrialActive = trialEndsAt ? trialEndsAt > now : false;
        const trialDaysLeft = isTrialActive && trialEndsAt
            ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        // Effective plan — if trial expired, revert to free
        const planExpiresAt = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;
        let plan: PlanTier = rawPlan;
        if (rawPlan === 'pro' || rawPlan === 'power') {
            const hasActiveTrial = isTrialActive;
            const hasPaidPlan = planExpiresAt ? planExpiresAt > now : false;
            if (!hasActiveTrial && !hasPaidPlan) {
                plan = 'free';
            }
        }

        const isFree = plan === 'free';
        const isPro = plan === 'pro';
        const isPower = plan === 'power';

        // Limits
        const taskLimit = isFree ? 50 : Infinity;
        const aiLimit = isFree ? 10 : isPro ? 100 : Infinity;
        const workspaceLimit = isFree ? 0 : isPro ? 3 : Infinity;

        // Modes allowed
        const freeModes = ['basic'];
        const canUseMode = (mode: string) => {
            if (!isFree) return true;
            return freeModes.includes(mode);
        };

        const canUseAI = (used: number) => used < aiLimit;

        const canAddTask = (currentCount: number) => currentCount < taskLimit;

        const canAddWorkspace = (currentCount: number) => currentCount < workspaceLimit;

        return {
            plan,
            isFree,
            isPro,
            isPower,
            isTrialActive,
            trialDaysLeft,
            taskLimit,
            aiLimit,
            workspaceLimit,
            canUseMode,
            canUseAI,
            canAddTask,
            canAddWorkspace,
        };
    }, [profile]);
}
