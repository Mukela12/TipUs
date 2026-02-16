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

    const { token, action, user_id, bank_bsb, bank_account_number, bank_account_name } =
      await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Action: lookup — just validate the token and return employee/venue info
    if (action === "lookup") {
      const { data: employee, error } = await supabase
        .from("employees")
        .select("id, name, email, role, venue_id, status, invitation_accepted_at, venues ( name )")
        .eq("invitation_token", token)
        .single();

      if (error || !employee) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired invitation link." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (employee.invitation_accepted_at) {
        return new Response(
          JSON.stringify({ error: "This invitation has already been accepted." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const venue = employee.venues as unknown as { name: string } | null;

      return new Response(
        JSON.stringify({
          employee_id: employee.id,
          employee_name: employee.name,
          employee_email: employee.email,
          employee_role: employee.role,
          venue_name: venue?.name || "Unknown Venue",
          venue_id: employee.venue_id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: accept — link auth user + save bank details + activate
    if (action === "accept") {
      if (!user_id || !bank_bsb || !bank_account_number || !bank_account_name) {
        return new Response(
          JSON.stringify({ error: "user_id, bank_bsb, bank_account_number, and bank_account_name are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the auth user exists
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id);
      console.log("Accept invitation - user_id:", user_id, "authUser:", authUser?.user?.id, "authError:", authError?.message);

      if (authError || !authUser?.user) {
        return new Response(
          JSON.stringify({ error: `Auth user not found for ID ${user_id}. Please sign out, re-open the invitation link, and create your account first.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the token exists and hasn't been used
      const { data: employee, error: lookupError } = await supabase
        .from("employees")
        .select("id, invitation_accepted_at")
        .eq("invitation_token", token)
        .single();

      if (lookupError || !employee) {
        return new Response(
          JSON.stringify({ error: "Invalid invitation token." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (employee.invitation_accepted_at) {
        return new Response(
          JSON.stringify({ error: "This invitation has already been accepted." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const now = new Date().toISOString();

      // Update employee: link user, save bank details, activate
      const { error: updateError } = await supabase
        .from("employees")
        .update({
          user_id,
          bank_bsb,
          bank_account_number,
          bank_account_name,
          status: "active",
          is_active: true,
          activated_at: now,
          invitation_accepted_at: now,
          updated_at: now,
        })
        .eq("id", employee.id);

      if (updateError) {
        console.error("Failed to update employee:", updateError.message, updateError.details, updateError.hint);
        return new Response(
          JSON.stringify({ error: `Failed to update profile: ${updateError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update the auth user's metadata with role + employee info
      const { error: userUpdateError } = await supabase.auth.admin.updateUserById(user_id, {
        user_metadata: {
          role: "employee",
          employee_id: employee.id,
        },
      });

      if (userUpdateError) {
        console.error("Failed to update user metadata:", userUpdateError.message);
        // Non-fatal — the employee record is already updated
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'lookup' or 'accept'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Accept invitation error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
