import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay keys not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const { action, plan, payment_id, order_id, signature } = await req.json();

    // ── ACTION 1: Create Razorpay Order ────────────────────────────
    if (action === "create_order") {
      // Price map in paise (INR × 100)
      const PRICES: Record<string, number> = {
        pro_monthly: 14900,    // ₹149
        pro_annual: 99900,     // ₹999
        power_monthly: 29900,  // ₹299
        power_annual: 199900,  // ₹1,999
      };

      const amount = PRICES[plan];
      if (!amount) throw new Error("Invalid plan");

      const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
      const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${credentials}`,
        },
        body: JSON.stringify({
          amount,
          currency: "INR",
          receipt: `tt_${user.id.slice(0, 8)}_${Date.now()}`,
          notes: {
            user_id: user.id,
            plan,
            app: "tangy-task",
          },
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.text();
        throw new Error(`Razorpay order failed: ${err}`);
      }

      const order = await orderRes.json();
      return new Response(
        JSON.stringify({ order_id: order.id, amount: order.amount, currency: order.currency }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION 2: Verify Payment & Update Plan ──────────────────────
    if (action === "verify_payment") {
      // Verify signature using HMAC SHA256
      const body = `${order_id}|${payment_id}`;
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(RAZORPAY_KEY_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signatureBytes = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(body)
      );
      const expectedSignature = Array.from(new Uint8Array(signatureBytes))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (expectedSignature !== signature) {
        throw new Error("Payment signature verification failed");
      }

      // Determine plan tier & expiry
      const planName = plan.startsWith("pro") ? "pro" : "power";
      const isAnnual = plan.includes("annual");
      const now = new Date();
      const expiresAt = new Date(now);
      if (isAnnual) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // Update Supabase profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          plan: planName,
          plan_started_at: now.toISOString(),
          plan_expires_at: expiresAt.toISOString(),
          trial_ends_at: null,
          razorpay_subscription_id: payment_id,
          ai_actions_used: 0,
          ai_actions_reset_at: now.toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, plan: planName, expires_at: expiresAt.toISOString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION 3: Activate Free Trial ──────────────────────────────
    if (action === "activate_trial") {
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + 7); // 7-day trial

      const { error: trialError } = await supabase
        .from("profiles")
        .update({
          plan: "pro",
          trial_ends_at: trialEnds.toISOString(),
          plan_started_at: new Date().toISOString(),
          ai_actions_used: 0,
          ai_actions_reset_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .is("trial_ends_at", null); // Only if trial not already used

      if (trialError) throw trialError;

      return new Response(
        JSON.stringify({ success: true, trial_ends_at: trialEnds.toISOString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION 4: Get current plan ─────────────────────────────────
    if (action === "get_plan") {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("plan, trial_ends_at, plan_expires_at, ai_actions_used")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // Auto-downgrade if plan expired
      const now = new Date();
      let effectivePlan = profile.plan;

      if (profile.trial_ends_at && new Date(profile.trial_ends_at) < now) {
        effectivePlan = "free";
        await supabase.from("profiles").update({ plan: "free", trial_ends_at: null }).eq("id", user.id);
      } else if (profile.plan_expires_at && new Date(profile.plan_expires_at) < now) {
        effectivePlan = "free";
        await supabase.from("profiles").update({ plan: "free" }).eq("id", user.id);
      }

      return new Response(
        JSON.stringify({ plan: effectivePlan, ...profile }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Razorpay function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
