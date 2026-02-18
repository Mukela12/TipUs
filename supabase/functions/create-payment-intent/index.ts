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

    const { qr_code_id, amount, tipper_name, tipper_message } = await req.json();

    if (!qr_code_id || !amount || amount < 100) {
      return new Response(
        JSON.stringify({ error: "qr_code_id and amount (min 100 cents) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up QR code → venue
    const { data: qrCode, error: qrError } = await supabase
      .from("qr_codes")
      .select("id, venue_id, employee_id, scan_count, venues ( name )")
      .eq("id", qr_code_id)
      .eq("is_active", true)
      .single();

    if (qrError || !qrCode) {
      return new Response(
        JSON.stringify({ error: "QR code not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const venue = qrCode.venues as unknown as { name: string };

    if (!venue?.name) {
      return new Response(
        JSON.stringify({ error: "Venue not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-12-18.acacia" });

    // Create PaymentIntent — money stays on TipUs platform (no transfer_data)
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "aud",
      metadata: {
        qr_code_id,
        venue_id: qrCode.venue_id,
        employee_id: qrCode.employee_id || "",
        tipper_name: tipper_name || "",
        tipper_message: tipper_message || "",
        platform: "tipus",
      },
    });

    // Atomically increment scan count on the QR code (non-critical)
    try {
      await supabase.rpc("increment_scan_count", { qr_id: qrCode.id });
    } catch {
      // Skip on failure
    }

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Create payment intent error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
