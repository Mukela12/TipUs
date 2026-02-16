import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.7.0";

serve(async (req) => {
  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeSecretKey || !webhookSecret) {
      throw new Error("Missing Stripe environment variables");
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-12-18.acacia" });

    // Verify webhook signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle account.updated — Stripe Connect onboarding completion
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;

      // In test mode, charges_enabled/payouts_enabled may not be set.
      // Use details_submitted as the primary signal that onboarding is done.
      const isComplete =
        account.details_submitted ||
        (account.charges_enabled && account.payouts_enabled);

      console.log(`account.updated for ${account.id}: details_submitted=${account.details_submitted}, charges_enabled=${account.charges_enabled}, payouts_enabled=${account.payouts_enabled}, isComplete=${isComplete}`);

      if (isComplete) {
        const { error } = await supabase
          .from("venues")
          .update({ stripe_onboarding_complete: true })
          .eq("stripe_account_id", account.id);

        if (error) {
          console.error("Failed to update venue:", error.message);
        } else {
          console.log(`Venue with Stripe account ${account.id} onboarding complete`);
        }
      }
    }

    // Handle payment_intent.succeeded — record tip in database
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const meta = paymentIntent.metadata;

      // Only process tips from our platform
      if (meta.platform === "tipus") {
        console.log(`payment_intent.succeeded: ${paymentIntent.id}, amount=${paymentIntent.amount}, venue=${meta.venue_id}`);

        const { error: tipError } = await supabase
          .from("tips")
          .insert({
            venue_id: meta.venue_id,
            employee_id: meta.employee_id || null,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            tipper_name: meta.tipper_name || null,
            tipper_message: meta.tipper_message || null,
            stripe_payment_intent_id: paymentIntent.id,
            status: "succeeded",
          });

        if (tipError) {
          console.error("Failed to insert tip:", tipError.message);
        } else {
          console.log(`Tip recorded for payment ${paymentIntent.id}`);
        }

        // Increment scan_count on the QR code (tracks completed tips)
        if (meta.qr_code_id) {
          const { data: qr, error: qrFetchErr } = await supabase
            .from("qr_codes")
            .select("scan_count")
            .eq("id", meta.qr_code_id)
            .single();

          if (!qrFetchErr && qr) {
            await supabase
              .from("qr_codes")
              .update({ scan_count: (qr.scan_count || 0) + 1 })
              .eq("id", meta.qr_code_id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
});
