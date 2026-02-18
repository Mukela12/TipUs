import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();

    if (authError || !caller || caller.user_metadata?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Only admins can process payouts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { venue_id, period_start, period_end } = await req.json();

    if (!venue_id || !period_start || !period_end) {
      return new Response(
        JSON.stringify({ error: "venue_id, period_start, and period_end are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Validate venue exists
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select("id, name")
      .eq("id", venue_id)
      .single();

    if (venueError || !venue) {
      return new Response(
        JSON.stringify({ error: "Venue not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get active employees for the venue
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, name, activated_at, deactivated_at, is_active, status")
      .eq("venue_id", venue_id);

    if (empError) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch employees: ${empError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter to employees that were active during any part of the period
    const periodStartDate = new Date(period_start);
    const periodEndDate = new Date(period_end);

    const activeEmployees = (employees ?? []).filter((emp) => {
      const empStart = emp.activated_at ? new Date(emp.activated_at) : null;
      if (!empStart) return false; // never activated
      const empEnd = emp.deactivated_at ? new Date(emp.deactivated_at) : null;
      // Employee was active during the period if they started before period ended
      // and either haven't been deactivated or were deactivated after period started
      return empStart <= periodEndDate && (!empEnd || empEnd >= periodStartDate);
    });

    if (activeEmployees.length === 0) {
      return new Response(
        JSON.stringify({ error: "No active employees found for this period" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Query succeeded tips for the period that haven't been paid out
    // Get existing payout periods to exclude already-paid tips
    const { data: existingPayouts } = await supabase
      .from("payouts")
      .select("period_start, period_end")
      .eq("venue_id", venue_id)
      .in("status", ["pending", "completed"]);

    // Query tips in date range
    const { data: tips, error: tipError } = await supabase
      .from("tips")
      .select("id, amount")
      .eq("venue_id", venue_id)
      .eq("status", "succeeded")
      .gte("created_at", period_start)
      .lte("created_at", `${period_end}T23:59:59.999Z`);

    if (tipError) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch tips: ${tipError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tips || tips.length === 0) {
      return new Response(
        JSON.stringify({ error: "No succeeded tips found for this period" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Calculate totals
    const total_amount = tips.reduce((sum, t) => sum + t.amount, 0);
    const platform_fee = Math.round(total_amount * 0.05);
    const net_amount = total_amount - platform_fee;

    // 5. Calculate days active per employee
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

    // 6. Calculate each employee's share
    const distributions = employeeDays.map((emp) => {
      const share = Math.round(net_amount * (emp.days_active / sumOfAllDaysActive));
      return {
        employee_id: emp.employee_id,
        employee_name: emp.employee_name,
        amount: share,
        days_active: emp.days_active,
        total_period_days: totalPeriodDays,
        is_prorated: emp.is_prorated,
      };
    });

    // Adjust rounding: add/subtract remainder to first employee
    const distributedTotal = distributions.reduce((sum, d) => sum + d.amount, 0);
    const remainder = net_amount - distributedTotal;
    if (distributions.length > 0 && remainder !== 0) {
      distributions[0].amount += remainder;
    }

    // 7. Insert payout row
    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .insert({
        venue_id,
        period_start,
        period_end,
        total_amount,
        platform_fee,
        net_amount,
        status: "pending",
      })
      .select()
      .single();

    if (payoutError) {
      return new Response(
        JSON.stringify({ error: `Failed to create payout: ${payoutError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Insert distribution rows
    const distInserts = distributions.map((d) => ({
      payout_id: payout.id,
      employee_id: d.employee_id,
      amount: d.amount,
      days_active: d.days_active,
      total_period_days: d.total_period_days,
      is_prorated: d.is_prorated,
    }));

    const { data: distData, error: distError } = await supabase
      .from("payout_distributions")
      .insert(distInserts)
      .select();

    if (distError) {
      console.error("Failed to insert distributions:", distError.message);
      // Clean up the payout row
      await supabase.from("payouts").delete().eq("id", payout.id);
      return new Response(
        JSON.stringify({ error: `Failed to create distributions: ${distError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 9. Return payout with distributions
    const result = {
      ...payout,
      distributions: distributions.map((d, i) => ({
        ...distData[i],
        employee_name: d.employee_name,
      })),
    };

    console.log(`Payout created: ${payout.id} for venue ${venue_id}, net_amount: ${net_amount}`);

    return new Response(
      JSON.stringify({ success: true, payout: result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Process payout error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
