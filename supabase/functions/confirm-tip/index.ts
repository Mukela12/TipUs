import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const { payment_intent_id } = await req.json();

    if (!payment_intent_id) {
      return new Response(
        JSON.stringify({ error: "payment_intent_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-12-18.acacia" });

    // Retrieve the PaymentIntent from Stripe to verify status
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({ error: `Payment not yet succeeded (status: ${paymentIntent.status})` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const meta = paymentIntent.metadata;

    // Only process tips from our platform
    if (meta.platform !== "tipus") {
      return new Response(
        JSON.stringify({ error: "Not a TipUs payment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if tip already exists (idempotency — webhook might have recorded it)
    const { data: existing } = await supabase
      .from("tips")
      .select("id")
      .eq("stripe_payment_intent_id", payment_intent_id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, tip_id: existing.id, already_recorded: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert tip record
    const { data: tip, error: tipError } = await supabase
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
      })
      .select("id")
      .single();

    if (tipError) {
      console.error("Failed to insert tip:", tipError.message);
      return new Response(
        JSON.stringify({ error: `Failed to record tip: ${tipError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Tip recorded: ${tip.id} for payment ${paymentIntent.id}`);

    return new Response(
      JSON.stringify({ success: true, tip_id: tip.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Confirm tip error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
