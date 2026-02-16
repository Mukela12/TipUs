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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-12-18.acacia" });

    const now = new Date();
    const currentDayOfWeek = now.getUTCDay(); // 0=Sun..6=Sat
    const currentDayOfMonth = now.getUTCDate(); // 1-31

    // 1. Query all venues with auto payouts enabled
    const { data: venues, error: venueError } = await supabase
      .from("venues")
      .select("id, name, stripe_account_id, auto_payout_enabled, payout_frequency, payout_day, last_auto_payout_at")
      .eq("auto_payout_enabled", true);

    if (venueError) {
      return jsonResponse({ error: `Failed to fetch venues: ${venueError.message}` }, 500);
    }

    if (!venues || venues.length === 0) {
      return jsonResponse({ message: "No venues with auto payouts enabled", processed: 0 });
    }

    // 2. Filter to venues whose schedule is due today
    const dueVenues = venues.filter((v) => {
      const freq = v.payout_frequency as string;
      const payoutDay = v.payout_day as number;
      const lastRun = v.last_auto_payout_at ? new Date(v.last_auto_payout_at) : null;

      if (freq === "weekly") {
        return currentDayOfWeek === payoutDay;
      }

      if (freq === "fortnightly") {
        if (currentDayOfWeek !== payoutDay) return false;
        if (!lastRun) return true; // first run
        const daysSinceLast = Math.floor(
          (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceLast >= 14;
      }

      if (freq === "monthly") {
        return currentDayOfMonth === payoutDay;
      }

      return false;
    });

    if (dueVenues.length === 0) {
      return jsonResponse({ message: "No venues due for payout today", processed: 0 });
    }

    // 3. Process each due venue
    const results: { venue_id: string; venue_name: string; status: string; error?: string; payout_id?: string }[] = [];

    for (const venue of dueVenues) {
      try {
        if (!venue.stripe_account_id) {
          results.push({ venue_id: venue.id, venue_name: venue.name, status: "skipped", error: "No Stripe Connect account" });
          continue;
        }

        // Calculate period
        const lastRun = venue.last_auto_payout_at ? new Date(venue.last_auto_payout_at) : null;
        let periodStart: Date;

        if (lastRun) {
          // Day after last payout ran
          periodStart = new Date(lastRun);
          periodStart.setUTCDate(periodStart.getUTCDate() + 1);
        } else {
          // First run: go back based on frequency
          periodStart = new Date(now);
          const freq = venue.payout_frequency as string;
          if (freq === "weekly") periodStart.setUTCDate(periodStart.getUTCDate() - 7);
          else if (freq === "fortnightly") periodStart.setUTCDate(periodStart.getUTCDate() - 14);
          else periodStart.setUTCDate(periodStart.getUTCDate() - 30);
        }

        // Period end = yesterday
        const periodEnd = new Date(now);
        periodEnd.setUTCDate(periodEnd.getUTCDate() - 1);

        if (periodStart > periodEnd) {
          results.push({ venue_id: venue.id, venue_name: venue.name, status: "skipped", error: "Period start is after period end" });
          continue;
        }

        const periodStartStr = periodStart.toISOString().split("T")[0];
        const periodEndStr = periodEnd.toISOString().split("T")[0];

        // ============================================================
        // INLINE: process-payout logic (calculate splits)
        // ============================================================

        // Get active employees
        const { data: employees, error: empError } = await supabase
          .from("employees")
          .select("id, name, activated_at, deactivated_at, is_active, status")
          .eq("venue_id", venue.id);

        if (empError) {
          results.push({ venue_id: venue.id, venue_name: venue.name, status: "failed", error: `Employees: ${empError.message}` });
          continue;
        }

        const periodStartDate = new Date(periodStartStr);
        const periodEndDate = new Date(periodEndStr);

        const activeEmployees = (employees ?? []).filter((emp) => {
          const empStart = emp.activated_at ? new Date(emp.activated_at) : null;
          if (!empStart) return false;
          const empEnd = emp.deactivated_at ? new Date(emp.deactivated_at) : null;
          return empStart <= periodEndDate && (!empEnd || empEnd >= periodStartDate);
        });

        if (activeEmployees.length === 0) {
          results.push({ venue_id: venue.id, venue_name: venue.name, status: "skipped", error: "No active employees" });
          continue;
        }

        // Query succeeded tips for the period
        const { data: tips, error: tipError } = await supabase
          .from("tips")
          .select("id, amount")
          .eq("venue_id", venue.id)
          .eq("status", "succeeded")
          .gte("created_at", periodStartStr)
          .lte("created_at", `${periodEndStr}T23:59:59.999Z`);

        if (tipError) {
          results.push({ venue_id: venue.id, venue_name: venue.name, status: "failed", error: `Tips: ${tipError.message}` });
          continue;
        }

        if (!tips || tips.length === 0) {
          results.push({ venue_id: venue.id, venue_name: venue.name, status: "skipped", error: "No tips in period" });
          continue;
        }

        // Calculate totals
        const total_amount = tips.reduce((sum, t) => sum + t.amount, 0);
        const platform_fee = Math.round(total_amount * 0.05);
        const net_amount = total_amount - platform_fee;

        // Calculate days active per employee
        const totalPeriodDays = Math.max(
          1,
          Math.ceil((periodEndDate.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        );

        const employeeDays = activeEmployees.map((emp) => {
          const empStart = new Date(emp.activated_at!);
          const empEnd = emp.deactivated_at ? new Date(emp.deactivated_at) : null;
          const effectiveStart = empStart > periodStartDate ? empStart : periodStartDate;
          const effectiveEnd = empEnd && empEnd < periodEndDate ? empEnd : periodEndDate;
          const daysActive = Math.max(
            1,
            Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
          );
          return {
            employee_id: emp.id,
            employee_name: emp.name,
            days_active: daysActive,
            is_prorated: daysActive < totalPeriodDays,
          };
        });

        const sumOfAllDaysActive = employeeDays.reduce((sum, e) => sum + e.days_active, 0);

        const distributions = employeeDays.map((emp) => ({
          employee_id: emp.employee_id,
          employee_name: emp.employee_name,
          amount: Math.round(net_amount * (emp.days_active / sumOfAllDaysActive)),
          days_active: emp.days_active,
          total_period_days: totalPeriodDays,
          is_prorated: emp.is_prorated,
        }));

        // Adjust rounding remainder
        const distributedTotal = distributions.reduce((sum, d) => sum + d.amount, 0);
        const remainder = net_amount - distributedTotal;
        if (distributions.length > 0 && remainder !== 0) {
          distributions[0].amount += remainder;
        }

        // Insert payout row
        const { data: payout, error: payoutError } = await supabase
          .from("payouts")
          .insert({
            venue_id: venue.id,
            period_start: periodStartStr,
            period_end: periodEndStr,
            total_amount,
            platform_fee,
            net_amount,
            status: "pending",
          })
          .select()
          .single();

        if (payoutError) {
          results.push({ venue_id: venue.id, venue_name: venue.name, status: "failed", error: `Payout insert: ${payoutError.message}` });
          continue;
        }

        // Insert distribution rows
        const distInserts = distributions.map((d) => ({
          payout_id: payout.id,
          employee_id: d.employee_id,
          amount: d.amount,
          days_active: d.days_active,
          total_period_days: d.total_period_days,
          is_prorated: d.is_prorated,
        }));

        const { error: distError } = await supabase
          .from("payout_distributions")
          .insert(distInserts);

        if (distError) {
          await supabase.from("payouts").delete().eq("id", payout.id);
          results.push({ venue_id: venue.id, venue_name: venue.name, status: "failed", error: `Distributions: ${distError.message}` });
          continue;
        }

        // ============================================================
        // INLINE: complete-payout logic (execute Stripe transfers)
        // ============================================================

        // Fetch distributions with employee bank details
        const { data: distWithEmp, error: distFetchError } = await supabase
          .from("payout_distributions")
          .select("id, employee_id, amount, employees(id, name, email, bank_bsb, bank_account_number, bank_account_name, stripe_bank_account_id)")
          .eq("payout_id", payout.id);

        if (distFetchError || !distWithEmp || distWithEmp.length === 0) {
          await supabase.from("payouts").update({ status: "failed" }).eq("id", payout.id);
          results.push({ venue_id: venue.id, venue_name: venue.name, status: "failed", error: "Failed to fetch distributions with employees" });
          continue;
        }

        // Verify all employees have bank details
        const missingBank: string[] = [];
        for (const dist of distWithEmp) {
          const emp = (dist as Record<string, unknown>).employees as {
            id: string; name: string; email: string;
            bank_bsb: string | null; bank_account_number: string | null;
            bank_account_name: string | null; stripe_bank_account_id: string | null;
          } | null;
          if (!emp || !emp.bank_bsb || !emp.bank_account_number || !emp.bank_account_name) {
            missingBank.push(emp?.name ?? dist.employee_id);
          }
        }

        if (missingBank.length > 0) {
          await supabase.from("payouts").update({ status: "failed" }).eq("id", payout.id);
          results.push({ venue_id: venue.id, venue_name: venue.name, status: "failed", error: `Missing bank details: ${missingBank.join(", ")}` });
          continue;
        }

        // Reverse auto-transfers from tips
        const { data: periodTips } = await supabase
          .from("tips")
          .select("id, amount, stripe_payment_intent_id")
          .eq("venue_id", venue.id)
          .eq("status", "succeeded")
          .gte("created_at", periodStartStr)
          .lte("created_at", `${periodEndStr}T23:59:59.999Z`);

        for (const tip of periodTips ?? []) {
          if (!tip.stripe_payment_intent_id) continue;
          try {
            const pi = await stripe.paymentIntents.retrieve(tip.stripe_payment_intent_id);
            if (pi.transfer) {
              const transferId = typeof pi.transfer === "string" ? pi.transfer : pi.transfer.id;
              const transfer = await stripe.transfers.retrieve(transferId);
              const unreversedAmount = transfer.amount - (transfer.amount_reversed ?? 0);
              if (unreversedAmount > 0) {
                await stripe.transfers.createReversal(transferId, { amount: unreversedAmount });
              }
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(`Failed to reverse transfer for tip ${tip.id}: ${msg}`);
          }
        }

        // Ensure platform has sufficient balance
        const totalNeeded = distWithEmp.reduce((sum, d) => sum + d.amount, 0);
        const platformBalance = await stripe.balance.retrieve();
        const availableAud = platformBalance.available.find((b) => b.currency === "aud")?.amount ?? 0;

        if (availableAud < totalNeeded) {
          if (stripeSecretKey.startsWith("sk_test_")) {
            const fundAmount = totalNeeded - availableAud + 500;
            try {
              await stripe.charges.create({
                amount: fundAmount,
                currency: "aud",
                source: "tok_visa",
                description: "Test mode: auto-funded for auto-payout",
              });
              await new Promise((r) => setTimeout(r, 1000));
            } catch {
              await stripe.charges.create({
                amount: fundAmount,
                currency: "aud",
                source: "tok_bypassPending",
                description: "Test mode: auto-funded for auto-payout (fallback)",
              });
              await new Promise((r) => setTimeout(r, 1000));
            }
          } else {
            await supabase.from("payouts").update({ status: "failed" }).eq("id", payout.id);
            results.push({ venue_id: venue.id, venue_name: venue.name, status: "failed", error: "Insufficient platform balance" });
            continue;
          }
        }

        // Execute transfers to each employee
        let allSucceeded = true;
        for (const dist of distWithEmp) {
          const emp = (dist as Record<string, unknown>).employees as {
            id: string; name: string; email: string;
            bank_bsb: string | null; bank_account_number: string | null;
            bank_account_name: string | null; stripe_bank_account_id: string | null;
          };

          try {
            let employeeStripeAccountId = emp.stripe_bank_account_id;

            if (!employeeStripeAccountId) {
              const nameParts = emp.name.trim().split(/\s+/);
              const firstName = nameParts[0] || emp.name;
              const lastName = nameParts.slice(1).join(" ") || emp.name;

              const account = await stripe.accounts.create({
                type: "custom",
                country: "AU",
                email: emp.email,
                capabilities: { transfers: { requested: true } },
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

            await stripe.transfers.create({
              amount: dist.amount,
              currency: "aud",
              destination: employeeStripeAccountId,
              description: `TipUs auto-payout for ${emp.name}`,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            console.error(`Auto-payout transfer failed for ${emp.name}:`, message);
            allSucceeded = false;
          }
        }

        // Update payout status
        const newStatus = allSucceeded ? "completed" : "failed";
        await supabase
          .from("payouts")
          .update({ status: newStatus, processed_at: new Date().toISOString() })
          .eq("id", payout.id);

        // Update last_auto_payout_at on the venue
        await supabase
          .from("venues")
          .update({ last_auto_payout_at: new Date().toISOString() })
          .eq("id", venue.id);

        results.push({
          venue_id: venue.id,
          venue_name: venue.name,
          status: allSucceeded ? "completed" : "partial_failure",
          payout_id: payout.id,
        });

        console.log(`Auto-payout ${allSucceeded ? "completed" : "partial failure"} for venue ${venue.name} (${venue.id}), payout ${payout.id}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`Auto-payout error for venue ${venue.name}:`, message);
        results.push({ venue_id: venue.id, venue_name: venue.name, status: "failed", error: message });
      }
    }

    const succeeded = results.filter((r) => r.status === "completed").length;
    const failed = results.filter((r) => r.status === "failed" || r.status === "partial_failure").length;
    const skipped = results.filter((r) => r.status === "skipped").length;

    console.log(`Auto-payout run complete: ${succeeded} succeeded, ${failed} failed, ${skipped} skipped`);

    return jsonResponse({
      success: true,
      summary: { total: dueVenues.length, succeeded, failed, skipped },
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Auto-payout error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
