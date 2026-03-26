import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Razorpay script loader
const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if ((window as any).Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

// Plan key map
export type PlanKey = 'pro_monthly' | 'pro_annual' | 'power_monthly' | 'power_annual';

const PLAN_LABELS: Record<PlanKey, string> = {
    pro_monthly: 'Pro — Monthly',
    pro_annual: 'Pro — Annual',
    power_monthly: 'Power — Monthly',
    power_annual: 'Power — Annual',
};

export async function initiateRazorpayPayment(
    planKey: PlanKey,
    onSuccess: (plan: string) => void
) {
    // 1. Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error('Please sign in to upgrade your plan');
        return;
    }

    // 2. Load Razorpay SDK
    const loaded = await loadRazorpayScript();
    if (!loaded) {
        toast.error('Failed to load payment system. Please try again.');
        return;
    }

    toast.loading('Preparing payment...');

    try {
        // 3. Create order via Supabase Edge Function
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bright-action`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ action: 'create_order', plan: planKey }),
            }
        );

        const orderData = await res.json();
        if (!res.ok || !orderData.order_id) throw new Error(orderData.error || 'Order creation failed');

        toast.dismiss();

        // 4. Open Razorpay Checkout
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'Tangy Task',
            description: PLAN_LABELS[planKey],
            image: '/tangy-task-icon.svg',
            order_id: orderData.order_id,
            prefill: {
                email: user.email,
                name: user.user_metadata?.full_name || '',
            },
            theme: { color: '#FACC15' }, // Tangy Task gold
            modal: {
                ondismiss: () => toast.info('Payment cancelled'),
            },
            handler: async (response: any) => {
                // 5. Verify payment on backend
                toast.loading('Verifying payment...');
                const verifyRes = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bright-action`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session?.access_token}`,
                        },
                        body: JSON.stringify({
                            action: 'verify_payment',
                            plan: planKey,
                            payment_id: response.razorpay_payment_id,
                            order_id: response.razorpay_order_id,
                            signature: response.razorpay_signature,
                        }),
                    }
                );

                const verifyData = await verifyRes.json();
                toast.dismiss();

                if (verifyData.success) {
                    toast.success(`🎉 Welcome to ${PLAN_LABELS[planKey]}!`);
                    onSuccess(verifyData.plan);
                } else {
                    toast.error('Payment verification failed. Contact support.');
                }
            },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();

    } catch (error: any) {
        toast.dismiss();
        toast.error(error.message || 'Payment failed. Please try again.');
        console.error('Razorpay error:', error);
    }
}

// Activate 7-day free trial
export async function activateTrial(onSuccess: (plan: string) => void) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error('Please sign in to start your trial');
        return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    toast.loading('Activating your 7-day trial...');

    try {
        const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bright-action`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ action: 'activate_trial' }),
            }
        );

        const data = await res.json();
        toast.dismiss();

        if (data.success) {
            const trialEnd = new Date(data.trial_ends_at).toLocaleDateString('en-IN');
            toast.success(`✅ Pro Trial activated! Enjoy till ${trialEnd}`);
            onSuccess('pro');
        } else {
            toast.info('Trial already used or not available.');
        }
    } catch (err: any) {
        toast.dismiss();
        toast.error('Failed to activate trial. Try again.');
    }
}
