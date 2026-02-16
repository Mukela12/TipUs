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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM") || "noreply@example.com";
    const fromName = Deno.env.get("FROM_NAME") || "TipUs";
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { employee_name, employee_email, venue_name, role, setup_url } = await req.json();
    if (!employee_email || !employee_name || !venue_name) {
      return new Response(
        JSON.stringify({ error: "employee_name, employee_email, and venue_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const setupButton = setup_url
      ? `<p style="margin:0 0 16px;text-align:center;">
            <a href="${setup_url}" style="display:inline-block;background-color:#d4856a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:12px;">Set Up Your Profile</a>
          </p>
          <p style="margin:0 0 32px;color:#999;font-size:12px;text-align:center;word-break:break-all;">
            Or copy this link: <a href="${setup_url}" style="color:#d4856a;">${setup_url}</a>
          </p>`
      : "";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8f6f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f6f4;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#d4856a 0%,#c4735a 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">TipUs</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:20px;font-weight:600;">You've been invited!</h2>
              <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
                Hi ${employee_name},
              </p>
              <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
                You've been added to <strong style="color:#1a1a1a;">${venue_name}</strong>${role ? ` as a <strong style="color:#1a1a1a;">${role}</strong>` : ""} on TipUs — a digital tipping platform that makes it easy for customers to tip you directly.
              </p>
              <p style="margin:0 0 28px;color:#666;font-size:15px;line-height:1.6;">
                To start receiving tips, set up your profile and enter your payout details. It only takes a minute.
              </p>
              ${setupButton}
              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #eee;margin:0 0 24px;">
              <p style="margin:0;color:#999;font-size:13px;line-height:1.5;">
                If you have any questions, reach out to your manager at ${venue_name}. This email was sent by TipUs on their behalf.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafaf9;padding:20px 40px;text-align:center;border-top:1px solid #f0f0f0;">
              <p style="margin:0;color:#aaa;font-size:12px;">
                &copy; ${new Date().getFullYear()} TipUs &middot; Digital tipping for hospitality
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send via Resend API
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${emailFrom}>`,
        to: [employee_email],
        subject: `You've been added to ${venue_name} on TipUs`,
        html,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", JSON.stringify(resendData));
      return new Response(
        JSON.stringify({ error: resendData.message || "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Send invite error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
