import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const { payout_id } = await req.json();

    if (!payout_id) {
      return jsonResponse({ error: "payout_id is required" }, 400);
    }

    const isTestMode = stripeSecretKey.startsWith("sk_test_");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-12-18.acacia" });

    // 1. Fetch payout and verify status
    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .select("id, venue_id, total_amount, platform_fee, net_amount, status, period_start, period_end")
      .eq("id", payout_id)
      .single();

    if (payoutError || !payout) {
      return jsonResponse({ error: "Payout not found" }, 404);
    }

    if (payout.status !== "pending") {
      return jsonResponse(
        { error: `Cannot execute payout with status '${payout.status}'` },
        400
      );
    }

    // 2. Fetch venue to get stripe_account_id
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select("id, stripe_account_id")
      .eq("id", payout.venue_id)
      .single();

    if (venueError || !venue) {
      return jsonResponse({ error: "Venue not found" }, 404);
    }

    if (!venue.stripe_account_id) {
      return jsonResponse(
        { error: "Venue has no Stripe Connect account. Please complete Stripe onboarding first." },
        400
      );
    }

    // 3. Fetch distributions with employee bank details
    const { data: distributions, error: distError } = await supabase
      .from("payout_distributions")
      .select("id, employee_id, amount, employees(id, name, email, bank_bsb, bank_account_number, bank_account_name, stripe_bank_account_id)")
      .eq("payout_id", payout_id);

    if (distError || !distributions || distributions.length === 0) {
      return jsonResponse(
        { error: "No distributions found for this payout" },
        400
      );
    }

    // 4. Verify all employees have bank details
    const missingBank: string[] = [];
    for (const dist of distributions) {
      const emp = (dist as Record<string, unknown>).employees as {
        id: string;
        name: string;
        email: string;
        bank_bsb: string | null;
        bank_account_number: string | null;
        bank_account_name: string | null;
        stripe_bank_account_id: string | null;
      } | null;

      if (!emp || !emp.bank_bsb || !emp.bank_account_number || !emp.bank_account_name) {
        missingBank.push(emp?.name ?? dist.employee_id);
      }
    }

    if (missingBank.length > 0) {
      return jsonResponse(
        {
          error: `Missing bank details for: ${missingBank.join(", ")}. All employees must have BSB, account number, and account name.`,
        },
        400
      );
    }

    const totalNeeded = distributions.reduce((sum, d) => sum + d.amount, 0);

    // 5. Handle balance: reverse auto-transfers OR fund in test mode
    if (isTestMode) {
      // TEST MODE: Skip transfer reversal entirely — fund available balance
      // using tok_bypassPending which bypasses the pending period
      const fundAmount = totalNeeded + 500;
      console.log(`Test mode: funding platform with $${(fundAmount / 100).toFixed(2)} using tok_bypassPending`);
      await stripe.charges.create({
        amount: fundAmount,
        currency: "aud",
        source: "tok_bypassPending",
        description: "Test mode: fund available balance for payout",
      });
      console.log(`Test mode: funded successfully`);
    } else {
      // PRODUCTION: Reverse auto-transfers to bring money back to platform
      const { data: tips } = await supabase
        .from("tips")
        .select("id, amount, stripe_payment_intent_id")
        .eq("venue_id", payout.venue_id)
        .eq("status", "succeeded")
        .gte("created_at", payout.period_start)
        .lte("created_at", `${payout.period_end}T23:59:59.999Z`);

      let totalReversed = 0;
      for (const tip of tips ?? []) {
        if (!tip.stripe_payment_intent_id) continue;
        try {
          const pi = await stripe.paymentIntents.retrieve(tip.stripe_payment_intent_id, {
            expand: ["latest_charge"],
          });

          // Try pi.transfer first, then fall back to latest_charge.transfer
          let transferId: string | null = null;
          if (pi.transfer) {
            transferId = typeof pi.transfer === "string" ? pi.transfer : pi.transfer.id;
          } else if (pi.latest_charge && typeof pi.latest_charge !== "string") {
            const charge = pi.latest_charge as Stripe.Charge;
            if (charge.transfer) {
              transferId = typeof charge.transfer === "string" ? charge.transfer : charge.transfer.id;
            }
          }

          if (transferId) {
            const transfer = await stripe.transfers.retrieve(transferId);
            const unreversedAmount = transfer.amount - (transfer.amount_reversed ?? 0);
            if (unreversedAmount > 0) {
              await stripe.transfers.createReversal(transferId, { amount: unreversedAmount });
              totalReversed += unreversedAmount;
              console.log(`Reversed transfer ${transferId}: $${(unreversedAmount / 100).toFixed(2)}`);
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`Failed to reverse transfer for tip ${tip.id}: ${msg}`);
        }
      }

      console.log(`Total reversed: $${(totalReversed / 100).toFixed(2)}, net needed: $${(payout.net_amount / 100).toFixed(2)}`);

      // Check platform balance
      const platformBalance = await stripe.balance.retrieve();
      const availableAud = platformBalance.available.find((b) => b.currency === "aud")?.amount ?? 0;

      if (availableAud < totalNeeded) {
        return jsonResponse(
          {
            error: `Insufficient platform balance. Available: $${(availableAud / 100).toFixed(2)}, needed: $${(totalNeeded / 100).toFixed(2)}. Ensure tip payments have settled.`,
          },
          400
        );
      }
    }

    // 6. Process each distribution — transfer to employee connected accounts
    const results: { employee_id: string; employee_name: string; status: string; error?: string }[] = [];
    let allSucceeded = true;

    for (const dist of distributions) {
      const emp = (dist as Record<string, unknown>).employees as {
        id: string;
        name: string;
        email: string;
        bank_bsb: string | null;
        bank_account_number: string | null;
        bank_account_name: string | null;
        stripe_bank_account_id: string | null;
      };

      try {
        let employeeStripeAccountId = emp.stripe_bank_account_id;

        // Create a Custom connected account for the employee if they don't have one
        if (!employeeStripeAccountId) {
          const nameParts = emp.name.trim().split(/\s+/);
          const firstName = nameParts[0] || emp.name;
          const lastName = nameParts.slice(1).join(" ") || emp.name;

          const account = await stripe.accounts.create({
            type: "custom",
            country: "AU",
            email: emp.email,
            capabilities: {
              transfers: { requested: true },
            },
            business_type: "individual",
            business_profile: {
              product_description: "Employee receiving tip payouts via TipUs",
            },
            individual: {
              first_name: firstName,
              last_name: lastName,
              email: emp.email,
              phone: "+61400000000",
              id_number: "000000000",
              dob: { day: 1, month: 1, year: 1990 },
              address: {
                line1: "123 Test Street",
                city: "Sydney",
                state: "NSW",
                postal_code: "2000",
                country: "AU",
              },
            },
            tos_acceptance: {
              date: Math.floor(Date.now() / 1000),
              ip: "0.0.0.0",
            },
            external_account: {
              object: "bank_account",
              country: "AU",
              currency: "aud",
              routing_number: emp.bank_bsb!,
              account_number: emp.bank_account_number!,
              account_holder_name: emp.bank_account_name!,
              account_holder_type: "individual",
            },
          });

          employeeStripeAccountId = account.id;

          await supabase
            .from("employees")
            .update({ stripe_bank_account_id: employeeStripeAccountId })
            .eq("id", emp.id);

          console.log(`Created Custom account ${employeeStripeAccountId} for ${emp.name}`);
        }

        // Transfer from platform to the employee's connected account
        const transfer = await stripe.transfers.create({
          amount: dist.amount,
          currency: "aud",
          destination: employeeStripeAccountId,
          description: `TipUs payout for ${emp.name}`,
        });

        console.log(`Transfer ${transfer.id} created for ${emp.name}: $${(dist.amount / 100).toFixed(2)}`);

        results.push({
          employee_id: emp.id,
          employee_name: emp.name,
          status: "success",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`Payout failed for ${emp.name}:`, message);
        allSucceeded = false;
        results.push({
          employee_id: emp.id,
          employee_name: emp.name,
          status: "failed",
          error: message,
        });
      }
    }

    // 7. Update payout status based on results
    const newStatus = allSucceeded ? "completed" : "failed";
    const { data: updated, error: updateError } = await supabase
      .from("payouts")
      .update({
        status: newStatus,
        processed_at: new Date().toISOString(),
      })
      .eq("id", payout_id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update payout status:", updateError.message);
    }

    if (!allSucceeded) {
      const failedNames = results
        .filter((r) => r.status === "failed")
        .map((r) => `${r.employee_name}: ${r.error}`)
        .join("; ");

      return jsonResponse(
        {
          error: `Some payouts failed: ${failedNames}`,
          results,
          payout: updated,
        },
        500
      );
    }

    console.log(`All payouts completed for payout ${payout_id}`);

    return jsonResponse({
      success: true,
      payout: updated,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Complete payout error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
