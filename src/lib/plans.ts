export type PlanTier = 'free' | 'pro' | 'power';

export interface PlanConfig {
    taskLimit: number;
    aiLimit: number | null;
    canUseAdvancedMode: boolean;
    canUseCustomizeMode: boolean;
    canUseBigData: boolean;
}

export const PLAN_CONFIG: Record<PlanTier, PlanConfig> = {
    free: {
        taskLimit: 50,
        aiLimit: 10,
        canUseAdvancedMode: false,
        canUseCustomizeMode: false,
        canUseBigData: false,
    },
    pro: {
        taskLimit: Number.POSITIVE_INFINITY,
        aiLimit: 100,
        canUseAdvancedMode: true,
        canUseCustomizeMode: true,
        canUseBigData: true,
    },
    power: {
        taskLimit: Number.POSITIVE_INFINITY,
        aiLimit: null,
        canUseAdvancedMode: true,
        canUseCustomizeMode: true,
        canUseBigData: true,
    },
};

export function getEffectivePlan(profile: any): PlanTier {
    const rawPlan = (profile?.plan ?? 'free') as PlanTier;
    const now = new Date();
    const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
    const planExpiresAt = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;

    if (rawPlan === 'pro' || rawPlan === 'power') {
        const hasActiveTrial = trialEndsAt ? trialEndsAt > now : false;
        const hasPaidPlan = planExpiresAt ? planExpiresAt > now : false;
        if (!hasActiveTrial && !hasPaidPlan) {
            return 'free';
        }
    }

    return rawPlan;
}

export function getPlanConfig(plan: PlanTier): PlanConfig {
    return PLAN_CONFIG[plan];
}

export function getAiUsageState(profile: any) {
    const now = new Date();
    const resetAt = profile?.ai_actions_reset_at ? new Date(profile.ai_actions_reset_at) : null;
    const shouldReset = !resetAt || Number.isNaN(resetAt.getTime()) || now.getTime() - resetAt.getTime() >= 30 * 24 * 60 * 60 * 1000;

    return {
        shouldReset,
        count: shouldReset ? 0 : Number(profile?.ai_actions_used ?? 0),
        resetAt: shouldReset ? now.toISOString() : resetAt.toISOString(),
    };
}

export function isModeAllowed(plan: PlanTier, mode: 'basic' | 'advanced' | 'big-data' | 'customize') {
    const config = getPlanConfig(plan);
    if (mode === 'basic') return true;
    if (mode === 'advanced') return config.canUseAdvancedMode;
    if (mode === 'customize') return config.canUseCustomizeMode;
    return config.canUseBigData;
}
