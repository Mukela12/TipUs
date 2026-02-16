# TipUs — Production Readiness Guide

This document covers everything needed to switch TipUs from Stripe test mode to live mode and deploy for real customers with real money.

---

## Table of Contents

1. [Pre-Launch Checklist](#pre-launch-checklist)
2. [Stripe Live Mode Setup](#stripe-live-mode-setup)
3. [Code Changes Required](#code-changes-required)
4. [Environment Variables Switch](#environment-variables-switch)
5. [Webhook Configuration](#webhook-configuration)
6. [CORS Hardening](#cors-hardening)
7. [User Journey Verification](#user-journey-verification)
8. [Known Issues to Address](#known-issues-to-address)
9. [Post-Launch Monitoring](#post-launch-monitoring)

---

## Pre-Launch Checklist

### Stripe Account Requirements

- [ ] Stripe account verified with real business details (ABN, address, bank account)
- [ ] Stripe Connect enabled on the account (Settings > Connect)
- [ ] Platform profile completed (branding, support URL, privacy policy)
- [ ] Live API keys generated (Dashboard > Developers > API keys)
- [ ] Stripe Connect Express account type approved for your platform

### Infrastructure

- [ ] Custom domain configured on Netlify (e.g., `app.tipus.com.au`)
- [ ] SSL certificate active (automatic on Netlify)
- [ ] Supabase project on a paid plan (free tier has limits on Edge Function invocations)
- [ ] Resend domain verified for production email sending

### Legal

- [ ] Terms of Service URL
- [ ] Privacy Policy URL
- [ ] Stripe Connect platform agreement accepted

---

## Stripe Live Mode Setup

### Step 1: Get Live API Keys

Go to [Stripe Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys) and switch to **Live mode** (toggle at the top).

You need:
- **Publishable key**: `pk_live_...` (safe for frontend)
- **Secret key**: `sk_live_...` (server-side only, NEVER in frontend)

### Step 2: Create Live Webhook Endpoint

Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks) in **Live mode**.

Create a new endpoint:
- **URL**: `https://ghxwritgesdhtoupwvwm.supabase.co/functions/v1/stripe-webhook`
- **Events to listen for**:
  - `account.updated`
  - `payment_intent.succeeded`
- **Copy the signing secret**: `whsec_live_...`

### Step 3: Configure Connect Settings

Go to [Stripe Dashboard > Settings > Connect](https://dashboard.stripe.com/settings/connect):

- **Branding**: Upload TipUs logo, set brand color
- **Onboarding**: Set to "Express" account type
- **Payout schedule**: Set default (Stripe handles this per connected account)
- **Platform profile**: Business name, support email, privacy URL, terms URL

---

## Code Changes Required

### CRITICAL: Employee Custom Account Creation (complete-payout)

The `complete-payout` function creates Stripe Custom connected accounts for employees with **hardcoded test data** that MUST be changed for production.

**File**: `supabase/functions/complete-payout/index.ts` (lines 216-261)

Current test-mode code:
```typescript
const account = await stripe.accounts.create({
  type: "custom",
  country: "AU",
  // ...
  individual: {
    // HARDCODED TEST DATA - MUST CHANGE
    phone: "+61400000000",        // Fake phone
    id_number: "000000000",       // Fake tax ID
    dob: { day: 1, month: 1, year: 1990 }, // Fake DOB
    address: {
      line1: "123 Test Street",   // Fake address
      city: "Sydney",
      state: "NSW",
      postal_code: "2000",
      country: "AU",
    },
  },
  tos_acceptance: {
    date: Math.floor(Date.now() / 1000),
    ip: "0.0.0.0", // Fake IP
  },
});
```

**Production options**:

**Option A (Recommended): Switch employees to Express accounts**

Instead of Custom accounts (which require you to collect identity details), use Express accounts. Stripe handles identity verification through their hosted onboarding flow. This means:
- You DON'T need to collect phone, DOB, address, tax ID from employees
- Stripe handles KYC/identity verification
- Employee just enters bank details + verifies identity through Stripe's UI
- You send them a Stripe onboarding link (like you do for venue owners)

This requires adding an employee Stripe onboarding step to the employee setup flow.

**Option B: Collect real employee data**

If staying with Custom accounts, you need to:
1. Add fields to the employee profile page: phone number, date of birth, address, tax file number
2. Add these columns to the `employees` database table
3. Pass real data instead of hardcoded values
4. The employee must actually accept the Stripe ToS (you can't accept on their behalf with a fake IP)

**Recommendation**: Option A is strongly recommended. It removes PCI/KYC burden from your platform.

### Same Issue in auto-payout

**File**: `supabase/functions/auto-payout/index.ts` (lines 352-394)

Contains the same hardcoded test data for Custom account creation. Any changes to `complete-payout` must also be applied here.

### Test Mode Guard

The `complete-payout` function has a test-mode-only code path (lines 120-131) that creates fake charges to fund the platform balance. This code is guarded by `isTestMode` and will NOT run in production — no changes needed, but be aware it exists.

```typescript
if (isTestMode) {
  // This block only runs with sk_test_ keys
  // It creates a charge with tok_bypassPending to fund available balance
  // In production, the real money flow handles this
}
```

---

## Environment Variables Switch

### Supabase Secrets (Server-Side)

Run these commands to switch to live keys:

```bash
# Stripe live secret key
supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY

# Stripe live webhook signing secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_live_YOUR_LIVE_WEBHOOK_SECRET

# Resend (same for test and live, unless you have separate API keys)
supabase secrets set RESEND_API_KEY=re_YOUR_KEY
supabase secrets set EMAIL_FROM=contact@tipus.com.au
supabase secrets set FROM_NAME=TipUs
```

### Netlify Environment Variables (Frontend)

In Netlify Dashboard > Site settings > Environment variables:

```
VITE_SUPABASE_URL=https://ghxwritgesdhtoupwvwm.supabase.co     (same)
VITE_SUPABASE_ANON_KEY=your-anon-key                           (same)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY   (CHANGE)
VITE_APP_URL=https://your-production-domain.com                 (CHANGE)
```

### After Changing Keys

1. Redeploy all Edge Functions:
```bash
supabase functions deploy create-stripe-account --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy create-payment-intent --no-verify-jwt
supabase functions deploy confirm-tip --no-verify-jwt
supabase functions deploy send-invite-email --no-verify-jwt
supabase functions deploy accept-invitation --no-verify-jwt
supabase functions deploy process-payout --no-verify-jwt
supabase functions deploy complete-payout --no-verify-jwt
supabase functions deploy auto-payout --no-verify-jwt
```

2. Trigger a new Netlify deploy (push a commit or manually trigger)

3. Existing test Stripe Connect accounts (venue owners and employees) will NOT work with live keys. All users must re-onboard with real details.

---

## Webhook Configuration

### Test vs Live Webhooks

Stripe test and live modes have **separate** webhook endpoints. You need a live webhook:

| Setting | Value |
|---------|-------|
| Endpoint URL | `https://ghxwritgesdhtoupwvwm.supabase.co/functions/v1/stripe-webhook` |
| Events | `account.updated`, `payment_intent.succeeded` |
| API Version | Match your code: `2024-12-18.acacia` |

The signing secret from the live webhook must be set as `STRIPE_WEBHOOK_SECRET` in Supabase secrets.

### Verification

After configuring, send a test event from Stripe Dashboard > Webhooks > Send test event. Check Supabase Edge Function logs to confirm it's received.

---

## CORS Hardening

All Edge Functions currently have:
```typescript
"Access-Control-Allow-Origin": "*"
```

For production, restrict this to your domain:
```typescript
"Access-Control-Allow-Origin": "https://your-production-domain.com"
```

**Files to update** (all 8 functions that have CORS headers):
- `create-stripe-account/index.ts`
- `create-payment-intent/index.ts`
- `confirm-tip/index.ts`
- `send-invite-email/index.ts`
- `accept-invitation/index.ts`
- `process-payout/index.ts`
- `complete-payout/index.ts`
- `auto-payout/index.ts`

`stripe-webhook` does NOT need CORS (called by Stripe, not the browser).

---

## User Journey Verification

### Journey 1: Venue Owner Onboarding

```
1. Sign up at /login
2. Create venue at /onboarding (name, address, description)
3. Dashboard appears → click "Connect Stripe"
4. Redirected to Stripe Express onboarding
5. Enter real business details (ABN, bank account, identity)
6. Redirected back to /dashboard/stripe-return
7. Stripe webhook fires account.updated → marks onboarding complete
8. Dashboard shows "Connected" status
```

**Production notes**:
- Stripe will require real identity verification (photo ID, etc.)
- Onboarding may take 1-2 business days for verification
- The `check_status` action in `create-stripe-account` polls Stripe directly as a fallback

### Journey 2: Employee Setup

```
1. Venue owner adds employee (name, email, role) from /dashboard/employees
2. Invite email sent via Resend
3. Employee clicks setup link → /invite/:token
4. Creates account (email + password)
5. Enters bank details (BSB, account number, account name)
6. Redirected to /employee dashboard
```

**Production notes**:
- BSB must be a valid 6-digit Australian bank identifier
- Account numbers are typically 6-9 digits
- Bank details are stored in the `employees` table (encrypted at rest by Supabase)
- The BSB/account number are used when creating the Stripe Custom account at payout time

### Journey 3: Customer Tips

```
1. Customer scans QR code → /tip/:shortCode
2. Sees venue name (and employee name if QR is employee-specific)
3. Selects tip amount ($5 / $10 / $20 / $50 / custom)
4. Optionally enters name and message
5. Pays with card / Apple Pay / Google Pay
6. Stripe PaymentIntent created:
   - Amount: tip in AUD cents
   - 5% application_fee_amount → TipUs platform
   - 95% transfer_data.destination → venue's Stripe Connect account
7. Payment succeeds → webhook fires → tip recorded in DB
8. Customer sees "Thank you" confirmation
```

**Production notes**:
- Minimum tip: $1.00 AUD (100 cents)
- Stripe processing fees (~1.75% + $0.30 for AU domestic cards) are absorbed by the platform fee
- Apple Pay / Google Pay require domain verification in Stripe Dashboard
- All amounts are in AUD

### Journey 4: Payout

```
1. Venue owner goes to /dashboard/payouts
2. Selects payout period (start date → end date)
3. System calculates:
   - Total tips in period
   - 5% platform fee (already taken at payment time)
   - Net amount split among employees (prorated by days active)
4. Creates payout record (status: pending)
5. Venue owner reviews and clicks "Execute Payout"
6. System:
   a. Reverses auto-transfers from venue's Stripe account → platform
   b. Verifies platform has sufficient available balance
   c. Creates Stripe Custom accounts for employees (if first payout)
   d. Transfers each employee's share to their Custom account
   e. Stripe automatically pays out from Custom account → employee bank
7. Payout marked as completed
```

**Production notes**:
- Transfer reversals: in production, `pi.transfer` should be populated on PaymentIntents. The code now also checks `latest_charge.transfer` as a fallback.
- Balance: platform needs sufficient available balance for transfers. Stripe processing fees and transfer timing can affect this. Ensure tips have settled (2-3 business days) before creating payouts.
- Employee bank payouts: Stripe pays out to employee banks on a 2-business-day rolling schedule by default.

### Journey 5: Auto-Payouts

```
1. Venue owner enables auto-payouts in /dashboard/payouts
2. Configures frequency (weekly/fortnightly/monthly) and day
3. pg_cron runs daily at 2am UTC
4. Calls auto-payout Edge Function
5. For each venue due today:
   - Calculates payout for the period since last payout
   - Creates payout + distributions
   - Executes Stripe transfers
   - Updates last_auto_payout_at on venue
```

**Production notes**:
- Ensure pg_cron job is configured in Supabase (see README.md for SQL)
- Auto-payout uses service_role_key for authentication
- Failed auto-payouts are marked as "failed" and need manual intervention

---

## Known Issues to Address

### 1. CRITICAL: Hardcoded Employee Identity Data

**Priority**: Must fix before going live

The `complete-payout` and `auto-payout` functions create Stripe Custom connected accounts with fake identity data (phone, DOB, address, tax ID). In live mode, Stripe will reject these or flag the accounts for verification.

**Fix**: Switch to Express accounts for employees (see [Code Changes Required](#code-changes-required)).

### 2. MEDIUM: CORS Wildcard

**Priority**: Should fix before going live

All Edge Functions allow requests from any origin (`*`). Restrict to your production domain.

### 3. MEDIUM: No Rate Limiting

**Priority**: Should fix before going live

Edge Functions have no rate limiting. A malicious user could spam:
- `create-payment-intent` (creating many PaymentIntents)
- `send-invite-email` (sending spam emails)

**Fix**: Add rate limiting via Supabase or an edge proxy (Cloudflare).

### 4. LOW: Duplicate Tip Recording

The `stripe-webhook` inserts a tip on `payment_intent.succeeded`, and the frontend also calls `confirm-tip` as a backup. If both succeed, there could be duplicate tips.

**Fix**: Add a unique constraint on `tips.stripe_payment_intent_id` in the database:
```sql
ALTER TABLE tips ADD CONSTRAINT tips_stripe_pi_unique UNIQUE (stripe_payment_intent_id);
```
Then use `upsert` instead of `insert` in the webhook, or catch the unique violation.

### 5. LOW: Payout Period Overlap

The `process-payout` function queries existing payouts to avoid double-paying, but it only checks `pending` and `completed` payouts. A `failed` payout's tips could be included in a new payout for the same period.

**Current behavior**: This is intentional — failed payouts mean the money wasn't sent, so the tips should be retried. But the venue owner might see confusing duplicate payout records.

### 6. LOW: scan_count Race Condition

Both `create-payment-intent` and `stripe-webhook` increment `scan_count` on QR codes. These are not atomic operations (`SELECT` then `UPDATE`), so concurrent requests could lose counts.

**Fix**: Use a SQL function with `UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = $1`.

---

## Post-Launch Monitoring

### Stripe Dashboard

Monitor these in the Stripe Dashboard:
- **Payments**: Successful vs failed tip payments
- **Connect**: Connected account statuses (venue owners)
- **Transfers**: Platform-to-employee transfers
- **Webhooks**: Delivery success rate and failures
- **Disputes**: Watch for chargebacks on tips

### Supabase Dashboard

Monitor these in Supabase:
- **Edge Function logs**: Errors in payment processing, payout execution
- **Database**: Row counts for tips, payouts, distributions
- **Auth**: User sign-ups, failed logins

### Key Metrics to Track

| Metric | Where | Why |
|--------|-------|-----|
| Tip success rate | Stripe Dashboard > Payments | Detect payment failures |
| Webhook delivery rate | Stripe Dashboard > Webhooks | Ensure tips are recorded |
| Payout success rate | Supabase > payouts table | Detect transfer failures |
| Edge Function errors | Supabase > Functions > Logs | Catch bugs |
| Average tip amount | `SELECT AVG(amount) FROM tips` | Business metric |
| Active venues | `SELECT COUNT(*) FROM venues WHERE is_active` | Growth metric |

---

## Production Go-Live Steps (In Order)

1. Fix hardcoded employee identity data (switch to Express or collect real data)
2. Add unique constraint on `tips.stripe_payment_intent_id`
3. Restrict CORS to production domain
4. Switch Stripe keys to live mode (Supabase secrets + Netlify env vars)
5. Create live webhook endpoint in Stripe Dashboard
6. Redeploy all Edge Functions
7. Trigger Netlify redeploy
8. Configure custom domain + SSL
9. Verify Apple Pay / Google Pay domain registration in Stripe
10. Set up pg_cron job for auto-payouts
11. Test full flow with a real $1 tip
12. Monitor Stripe Dashboard and Supabase logs for the first 24 hours
