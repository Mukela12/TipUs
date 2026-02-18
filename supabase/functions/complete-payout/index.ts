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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();

    if (authError || !caller || caller.user_metadata?.role !== "admin") {
      return jsonResponse({ error: "Only admins can execute payouts" }, 403);
    }

    const { payout_id } = await req.json();

    if (!payout_id) {
      return jsonResponse({ error: "payout_id is required" }, 400);
    }

    const isTestMode = stripeSecretKey.startsWith("sk_test_");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-12-18.acacia" });

    // 1. Fetch payout — allow pending, partially_completed, or failed
    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .select("id, venue_id, total_amount, platform_fee, net_amount, status, period_start, period_end")
      .eq("id", payout_id)
      .single();

    if (payoutError || !payout) {
      return jsonResponse({ error: "Payout not found" }, 404);
    }

    const retryableStatuses = ["pending", "partially_completed", "failed"];
    if (!retryableStatuses.includes(payout.status)) {
      return jsonResponse(
        { error: `Cannot execute payout with status '${payout.status}'` },
        400
      );
    }

    // 2. Fetch distributions with employee bank details
    const { data: distributions, error: distError } = await supabase
      .from("payout_distributions")
      .select("id, employee_id, amount, status, stripe_transfer_id, error_message, employees(id, name, email, bank_bsb, bank_account_number, bank_account_name, stripe_bank_account_id)")
      .eq("payout_id", payout_id);

    if (distError || !distributions || distributions.length === 0) {
      return jsonResponse(
        { error: "No distributions found for this payout" },
        400
      );
    }

    // 3. Separate completed vs remaining distributions
    const completedDists = distributions.filter((d) => d.status === "completed");
    const remainingDists = distributions.filter((d) => d.status !== "completed");

    if (remainingDists.length === 0) {
      // All already completed — mark payout as completed
      await supabase
        .from("payouts")
        .update({ status: "completed", processed_at: new Date().toISOString() })
        .eq("id", payout_id);

      return jsonResponse({
        success: true,
        message: "All distributions already completed",
        results: completedDists.map((d) => ({
          employee_id: d.employee_id,
          status: "already_completed",
        })),
      });
    }

    // 4. Verify remaining employees have bank details
    const missingBank: string[] = [];
    for (const dist of remainingDists) {
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

    // 5. Only need balance for remaining (non-completed) distributions
    const totalNeeded = remainingDists.reduce((sum, d) => sum + d.amount, 0);

    if (isTestMode) {
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
      const platformBalance = await stripe.balance.retrieve();
      const availableAud = platformBalance.available.find(
        (b) => b.currency === "aud"
      )?.amount ?? 0;
      if (availableAud < totalNeeded) {
        return jsonResponse({
          error: `Insufficient platform balance. Available: $${(availableAud / 100).toFixed(2)}, needed: $${(totalNeeded / 100).toFixed(2)}. Ensure tip payments have settled.`,
        }, 400);
      }
    }

    // 6. Mark payout as processing
    await supabase
      .from("payouts")
      .update({ status: "processing" })
      .eq("id", payout_id);

    // 7. Process each REMAINING distribution individually
    const results: { employee_id: string; employee_name: string; status: string; error?: string }[] = [];
    let succeededCount = 0;
    let failedCount = 0;

    for (const dist of remainingDists) {
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

        // Mark this distribution as completed
        await supabase
          .from("payout_distributions")
          .update({
            status: "completed",
            stripe_transfer_id: transfer.id,
            error_message: null,
          })
          .eq("id", dist.id);

        succeededCount++;
        results.push({
          employee_id: emp.id,
          employee_name: emp.name,
          status: "completed",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`Payout failed for ${emp.name}:`, message);

        // Mark this distribution as failed
        await supabase
          .from("payout_distributions")
          .update({
            status: "failed",
            error_message: message,
          })
          .eq("id", dist.id);

        failedCount++;
        results.push({
          employee_id: emp.id,
          employee_name: emp.name,
          status: "failed",
          error: message,
        });
      }
    }

    // 8. Determine final payout status
    const totalCompleted = completedDists.length + succeededCount;
    const totalDists = distributions.length;
    let newStatus: string;

    if (failedCount === 0) {
      newStatus = "completed";
    } else if (totalCompleted > 0) {
      newStatus = "partially_completed";
    } else {
      newStatus = "failed";
    }

    await supabase
      .from("payouts")
      .update({
        status: newStatus,
        processed_at: new Date().toISOString(),
      })
      .eq("id", payout_id);

    if (failedCount > 0) {
      const failedNames = results
        .filter((r) => r.status === "failed")
        .map((r) => `${r.employee_name}: ${r.error}`)
        .join("; ");

      return jsonResponse(
        {
          error: `Some payouts failed: ${failedNames}`,
          status: newStatus,
          summary: {
            total: totalDists,
            completed: totalCompleted,
            failed: failedCount,
            previously_completed: completedDists.length,
          },
          results,
        },
        207 // Multi-Status: partial success
      );
    }

    console.log(`All payouts completed for payout ${payout_id} (${totalCompleted}/${totalDists})`);

    return jsonResponse({
      success: true,
      status: newStatus,
      summary: {
        total: totalDists,
        completed: totalCompleted,
        failed: 0,
        previously_completed: completedDists.length,
      },
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Complete payout error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
