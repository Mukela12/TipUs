# TipUs — Project Progress & Continuation Guide

> Last updated: 16 Feb 2026, Stripe Webhook Configured + README
> Project: `/Users/mukelakatungu/tipus`
> Supabase project: `ghxwritgesdhtoupwvwm` (Tipus, Sydney region)

---

## Current State: ~97% Complete — Production-Ready

Both venue-owner and employee dashboards are fully functional. Logo integrated, role-based routing working, RLS policies in place, dead code removed, security audit passed. Stripe webhook endpoint configured and listening for `account.updated` + `payment_intent.succeeded`. Production build succeeds at ~210KB gzipped. **Remaining**: analytics charts (recharts installed but not wired), bulk employee invite, payout email notifications.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                       │
│  Vite 7 · TypeScript 5.9 · Tailwind CSS 4 · Framer Motion 12   │
│  Zustand 5 stores · React Router 7 · Lucide icons              │
├──────────┬──────────┬──────────┬──────────┬─────────────────────┤
│  Auth    │  Venue   │ Employee │   QR     │  Tip   │  Payout    │
│  Store   │  Store   │  Store   │  Store   │  Store │  Store     │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬────────────────┘
     │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend)                            │
│  PostgreSQL · Auth · Edge Functions (Deno) · RLS Policies       │
├──────────┬──────────┬──────────┬──────────┬─────────────────────┤
│ venues   │employees │ tips     │ qr_codes │ payouts +           │
│          │          │          │          │ distributions       │
└──────────┴──────────┴──────────┴──────────┴─────────────────────┘
     │                                  │
     ▼                                  ▼
┌──────────────┐              ┌──────────────────┐
│ Stripe       │              │ Resend           │
│ Connect      │              │ (Email)          │
│ Express      │              │ contact@         │
│              │              │ fluxium.dev      │
└──────────────┘              └──────────────────┘
```

---

## User Journeys — What Works vs What Doesn't

### Journey 1: Venue Owner Setup ✅ COMPLETE
```
Sign Up → Create Venue → Connect Stripe → Add Employees → Create QR Codes
   ✅         ✅              ✅              ✅                ✅
```

### Journey 2: Employee Onboarding ✅ COMPLETE
```
Receive Email → Click Setup Link → Create Account → Enter Bank Details → Active
     ✅              ✅                  ✅                ✅             ✅
```

### Journey 5: Employee Dashboard ✅ COMPLETE (Phase 7)
```
Login → Role Check → Employee Dashboard → My Tips / Payouts / Profile
  ✅       ✅              ✅                ✅       ✅        ✅
```
**Status**: Full employee dashboard with role-based routing. `ProtectedRoute` checks `user.role` and redirects accordingly. `EmployeeLayout` with sidebar + mobile nav. Four pages: dashboard (stats + recent tips), my tips (full history with filters), payouts (distribution history), profile (view info + edit bank details). `employeeDashboardStore` handles all employee-specific data fetching. RLS policies grant employees read access to their own data.

### Journey 3: Customer Tips ✅ COMPLETE
```
Scan QR → See Tip Page → Select Amount → Pay with Stripe → Tip Recorded
  ✅         ✅              ✅              ✅              ✅
```
**Status**: TipPage rewritten with Stripe Payment Element. `create-payment-intent` Edge Function creates PaymentIntents with 5% platform fee and auto-transfer. `stripe-webhook` handles `payment_intent.succeeded` to insert tip records. Webhook endpoint configured in Stripe Dashboard (destination: `whimsical-triumph`, listening for `account.updated` + `payment_intent.succeeded`).

### Journey 4: Payouts ✅ BUILT (automatic Stripe payouts + recurring schedule)
```
Accumulate Tips → Calculate Splits → Review → Execute Payout → Money Sent
      ✅              ✅             ✅            ✅              ✅
Configure Schedule → Cron Runs Daily → Auto Process + Execute → Funds Sent
       ✅                  ✅                   ✅                  ✅
```
**Status**: `process-payout` Edge Function calculates per-employee splits prorated by days active. `complete-payout` now executes real Stripe payouts — adds employee bank accounts as external accounts on the venue's Stripe Connect account, then creates Stripe Payouts to each employee's bank. PayoutsPage has "Execute Payout" button with confirmation modal. Balance check prevents overdrafts.
**Recurring**: `auto-payout` Edge Function triggered daily at 2am UTC via pg_cron + pg_net. Venue owners configure frequency (weekly/fortnightly/monthly) and day via PayoutsPage schedule card. Cron finds due venues and runs the full process+complete pipeline automatically.

---

## Feature Status Matrix

| Feature | Frontend | Backend | E2E Status |
|---------|----------|---------|------------|
| Auth (signup/login/logout) | ✅ | ✅ | ✅ Working |
| Venue creation + onboarding | ✅ | ✅ | ✅ Working |
| Stripe Connect (venue) | ✅ | ✅ | ✅ Working |
| Employee CRUD | ✅ | ✅ | ✅ Working |
| Employee invite emails | ✅ | ✅ | ✅ Working |
| Employee setup (bank details) | ✅ | ✅ | ✅ Working |
| QR code management | ✅ | ✅ | ✅ Working |
| Dashboard stats | ✅ | ✅ | ✅ Working |
| Tips list + filters | ✅ | ✅ | ✅ Working (data via webhook) |
| Public tip page (QR scan) | ✅ | ✅ | ✅ Working |
| Stripe payment processing | ✅ | ✅ | ✅ Working |
| Tip recording in DB | N/A | ✅ | ✅ Working (via webhook) |
| QR scan counting | N/A | ✅ | ✅ Working (via webhook) |
| Payout calculation | ✅ | ✅ | ✅ Working (prorated by days active) |
| Payout execution (Stripe) | ✅ | ✅ | ✅ Working (auto bank transfers) |
| Recurring scheduled payouts | ✅ | ✅ | ✅ Working (pg_cron + auto-payout) |
| Employee dashboard | ✅ | ✅ | ✅ Working (Phase 7) |
| Logo + branding | ✅ | N/A | ✅ Integrated (Phase 8) |
| Production build | ✅ | N/A | ✅ ~210KB gzipped |
| Analytics/charts | ❌ | N/A | 🔴 Not built |

---

## Known Bugs

### ✅ RESOLVED: TipPage.tsx — QR Lookup Broken
**Fixed**: TipPage completely rewritten. Correct column names, Stripe Payment Element integration, proper payment flow.

### ✅ RESOLVED: Scan Count Never Incremented
**Fixed**: `create-payment-intent` increments `scan_count` when payment is initiated. `stripe-webhook` also increments on successful payment.

### 🟡 MEDIUM: tipStore Stats Assume Succeeded Status
`computeStats()` in tipStore.ts filters on `status === 'succeeded'` — this is now correct since the webhook inserts tips with `status: 'succeeded'`.

### ✅ RESOLVED: Stripe Webhook Config
Webhook endpoint configured in Stripe Dashboard (destination: `whimsical-triumph`). Listening for `account.updated` + `payment_intent.succeeded`. Signing secret updated in Supabase secrets.

---

## Database Schema (7 Tables)

### venues
```
id, owner_id, name, slug, description, address, logo_url,
stripe_account_id, stripe_onboarding_complete, subscription_tier,
subscription_status, is_active, auto_payout_enabled, payout_frequency,
payout_day, last_auto_payout_at, created_at, updated_at
```

### employees
```
id, venue_id, user_id, name, email, role, avatar_url,
status (invited|active|inactive), invitation_token, invitation_sent_at,
invitation_accepted_at, bank_bsb, bank_account_number, bank_account_name,
stripe_bank_account_id, is_active, activated_at, deactivated_at, created_at, updated_at
```

### tips
```
id, venue_id, employee_id, amount (cents), currency,
tipper_name, tipper_message, stripe_payment_intent_id,
stripe_checkout_session_id, status, created_at
```

### qr_codes
```
id, venue_id, employee_id, label, short_code,
is_active, scan_count, created_at
```

### payouts
```
id, venue_id, period_start, period_end, total_amount,
platform_fee, net_amount, status, stripe_transfer_id,
processed_at, created_at
```

### payout_distributions
```
id, payout_id, employee_id, amount, days_active,
total_period_days, is_prorated, created_at
```

### employee_invitations (schema only, tokens stored on employees table instead)
```
id, venue_id, employee_id, token, status, expires_at, created_at
```

---

## File Inventory

### Pages (17 files)
| File | Route | Status |
|------|-------|--------|
| `src/pages/HomePage.tsx` | `/` | ✅ |
| `src/pages/LoginPage.tsx` | `/login` | ✅ (role-based redirect) |
| `src/pages/NotFoundPage.tsx` | `*` | ✅ |
| `src/pages/onboarding/OnboardingPage.tsx` | `/onboarding` | ✅ |
| `src/pages/tip/TipPage.tsx` | `/tip/:shortCode` | ✅ Rebuilt |
| `src/pages/invite/EmployeeSetupPage.tsx` | `/invite/:token` | ✅ |
| `src/pages/dashboard/DashboardPage.tsx` | `/dashboard` | ✅ |
| `src/pages/dashboard/EmployeesPage.tsx` | `/dashboard/employees` | ✅ |
| `src/pages/dashboard/TipsPage.tsx` | `/dashboard/tips` | ✅ |
| `src/pages/dashboard/PayoutsPage.tsx` | `/dashboard/payouts` | ✅ |
| `src/pages/dashboard/QRCodesPage.tsx` | `/dashboard/qr-codes` | ✅ |
| `src/pages/dashboard/SettingsPage.tsx` | `/dashboard/settings` | ✅ |
| `src/pages/dashboard/StripeReturnPage.tsx` | `/dashboard/stripe-return` | ✅ |
| `src/pages/employee/EmployeeDashboardPage.tsx` | `/employee` | ✅ Phase 7 |
| `src/pages/employee/EmployeeTipsPage.tsx` | `/employee/tips` | ✅ Phase 7 |
| `src/pages/employee/EmployeePayoutsPage.tsx` | `/employee/payouts` | ✅ Phase 7 |
| `src/pages/employee/EmployeeProfilePage.tsx` | `/employee/profile` | ✅ Phase 7 |

### Stores (8 files in `src/stores/`)
| Store | Status |
|-------|--------|
| `authStore.ts` | ✅ Fully functional (employee_id extraction) |
| `venueStore.ts` | ✅ Fully functional |
| `employeeStore.ts` | ✅ Fully functional |
| `employeeDashboardStore.ts` | ✅ Employee tips, payouts, bank details |
| `tipStore.ts` | ✅ Fully functional (data via webhook) |
| `payoutStore.ts` | ✅ Fully functional |
| `qrCodeStore.ts` | ✅ Fully functional |
| `uiStore.ts` | ✅ Fully functional |

### Edge Functions (9 files, ALL deployed with `--no-verify-jwt`)
| Function | Purpose | Status |
|----------|---------|--------|
| `create-stripe-account` | Create Stripe Connect account + check status | ✅ |
| `stripe-webhook` | Handle `account.updated` + `payment_intent.succeeded` | ✅ |
| `create-payment-intent` | Create PaymentIntent with platform fee + auto-transfer | ✅ |
| `confirm-tip` | Confirm tip payment and update status | ✅ |
| `send-invite-email` | Send employee invite via Resend | ✅ |
| `accept-invitation` | Validate token + link user + save bank details | ✅ |
| `process-payout` | Calculate payout splits + create payout record | ✅ |
| `complete-payout` | Execute Stripe payouts to employee bank accounts | ✅ |
| `auto-payout` | Cron-triggered recurring auto payout for all due venues | ✅ |

### Layout Components (9 files in `src/components/layout/`)
| File | Purpose |
|------|---------|
| `DashboardLayout.tsx` | Venue owner sidebar + mobile nav wrapper |
| `ProtectedRoute.tsx` | Auth guard + role-based routing |
| `Sidebar.tsx` | Venue owner desktop sidebar |
| `MobileHeader.tsx` | Venue owner mobile sticky header |
| `MobileBottomNav.tsx` | Venue owner mobile bottom tab nav |
| `EmployeeLayout.tsx` | Employee sidebar + mobile nav wrapper |
| `EmployeeSidebar.tsx` | Employee desktop sidebar |
| `EmployeeMobileHeader.tsx` | Employee mobile sticky header |
| `EmployeeMobileBottomNav.tsx` | Employee mobile bottom tab nav |

### UI Components (1 file in `src/components/ui/`)
| File | Purpose |
|------|---------|
| `ToastContainer.tsx` | Toast notifications |

### Libraries (4 files in `src/lib/`)
| File | Exports |
|------|---------|
| `supabase.ts` | `supabase` client |
| `stripe.ts` | `getStripe()` |
| `utils.ts` | `cn()`, `formatCurrency()`, `formatDate()`, `formatRelativeTime()`, `generateSlug()` |
| `animations.ts` | `fadeInUp`, `staggerContainer`, `tapScale`, etc. |

---

## Secrets & Environment

### Supabase Secrets (ALL SET)
| Secret | Status |
|--------|--------|
| `STRIPE_SECRET_KEY` | ✅ Set |
| `STRIPE_WEBHOOK_SECRET` | ✅ Set |
| `RESEND_API_KEY` | ✅ Set |
| `EMAIL_FROM` | ✅ Set (`contact@fluxium.dev`) |
| `FROM_NAME` | ✅ Set (`AllWondrous`) |

### Local `.env`
| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://ghxwritgesdhtoupwvwm.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Set (JWT) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Set (pk_test_...) |
| `VITE_APP_URL` | `http://localhost:5173` |

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `primary-500` | `#d4856a` (coral) | Buttons, links, active states |
| `surface-*` | Slate scale | Text, borders, backgrounds |
| `success/warning/error/info` | Semantic colors | Status badges, toasts |
| `glass-effect` | White 82% + blur 16px | Cards, panels |
| `glass-premium` | White 65% + blur 24px | Featured cards |
| Font stack | Inter + JetBrains Mono | Body + code |
| Shadows | `soft`, `medium`, `elevated`, `glass` | Depth hierarchy |

---

## What Needs to Be Built (Priority Order)

### Phase 5: Payment Flow ✅ COMPLETE
1. ✅ Fixed TipPage.tsx bugs — completely rewritten with correct column names
2. ✅ Created `create-payment-intent` Edge Function (5% platform fee, auto-transfer)
3. ✅ Wired TipPage to Stripe Payment Element (`@stripe/react-stripe-js`)
4. ✅ Added `payment_intent.succeeded` handler to stripe-webhook
5. ✅ Webhook inserts tip record in DB on successful payment
6. ✅ `scan_count` incremented on payment initiation + success
7. ✅ Stripe webhook endpoint configured (listening for `account.updated` + `payment_intent.succeeded`)

### Phase 6: Payout System ✅ COMPLETE (with automatic Stripe payouts + recurring schedule)
1. ✅ Created `process-payout` Edge Function (equal split, prorated by days active)
2. ✅ Created `complete-payout` Edge Function — now executes real Stripe payouts
3. ✅ Created `payoutStore.ts` Zustand store (fetch, create, complete)
4. ✅ Created `PayoutsPage.tsx` with create form, payout list, expandable distributions
5. ✅ Added Payouts nav item to Sidebar, MobileHeader, MobileBottomNav
6. ✅ Added `/dashboard/payouts` route to App.tsx
7. ✅ Automatic bank transfers via Stripe Payouts API on connected accounts
8. ✅ Employee bank accounts added as external accounts on venue's Stripe Connect
9. ✅ Balance check before executing payouts
10. ✅ Confirmation modal before sending real money
11. ✅ `stripe_bank_account_id` cached on employee records for repeat payouts
12. ✅ Recurring schedule: `auto_payout_enabled`, `payout_frequency`, `payout_day`, `last_auto_payout_at` on venues
13. ✅ `auto-payout` Edge Function — cron-triggered, processes all due venues automatically
14. ✅ pg_cron job runs daily at 2am UTC via pg_net HTTP POST
15. ✅ Schedule config UI on PayoutsPage (toggle, frequency, day picker, next payout date)
16. ✅ `updatePayoutSchedule` method in venueStore

### Phase 7: Employee Dashboard ✅ COMPLETE
1. ✅ Added `employee_id` to `AuthUser` type
2. ✅ Extract `employee_id` from user_metadata in `mapSessionToUser`
3. ✅ Role-based routing in `ProtectedRoute` (employee → `/employee`, venue_owner → `/dashboard`)
4. ✅ Created `employeeDashboardStore.ts` (profile, tips, payouts, bank details)
5. ✅ Created `EmployeeLayout` with `EmployeeSidebar`, `EmployeeMobileHeader`, `EmployeeMobileBottomNav`
6. ✅ Created `EmployeeDashboardPage` (greeting, stats, recent tips)
7. ✅ Created `EmployeeTipsPage` (full tip history with filters)
8. ✅ Created `EmployeePayoutsPage` (payout distribution history)
9. ✅ Created `EmployeeProfilePage` (read-only info + editable bank details)
10. ✅ Added employee routes to `App.tsx`
11. ✅ Created RLS migration for employee data access (`20260216200000_employee_rls.sql`)

### Phase 8: Polish + Production Readiness ✅ COMPLETE
1. ✅ Logo integrated — `savings.ico`/`savings.png` as favicon + all 6 header/sidebar components
2. ✅ LoginPage role-based redirect (employee → `/employee`, venue_owner → `/dashboard`)
3. ✅ EmployeeSetupPage "Go to Dashboard" button on completion step
4. ✅ Security audit — no secret keys in frontend, all `VITE_*` prefixed, `.env` gitignored
5. ✅ Removed `ConnectionTestPage.tsx` + route
6. ✅ Removed unused `vite.svg`
7. ✅ Removed unused test functions (`testSupabaseConnection`, `testStripeConnection`)
8. ✅ Removed unused types (`ApiResponse`, `StatCard`, `NavItem`, `EmployeeInvitation`, `InvitationStatus`, `VenueStatus`)
9. ✅ TypeScript check passes (`npx tsc --noEmit`)
10. ✅ Production build succeeds (~210KB gzipped)

### Phase 9: Remaining Items (Future)
1. ❌ Analytics charts (recharts installed but not wired)
2. ❌ Bulk employee invite
3. ❌ Email notifications for payouts

---

## Technical Notes

- **Edge Function auth**: ALL deployed with `--no-verify-jwt`. Auth verified internally.
- **`supabase.functions.invoke()` bug**: Don't use. Use direct `fetch()` with explicit `Authorization` + `apikey` headers.
- **Browser extension interference**: MetaMask's SES lockdown can strip `apikey` headers. Pass as URL parameter (`?apikey=KEY`) as fallback.
- **Node version**: Vite 7 needs Node 20.19+ or 22.12+. Use `/Users/mukelakatungu/.nvm/versions/node/v22.22.0/bin/node` explicitly.
- **Stripe test mode**: `details_submitted` is the reliable onboarding signal for test accounts.
- **Amounts**: All tip amounts stored in **cents** in the DB, displayed with `formatCurrency()`.
- **Payment flow**: TipPage → `create-payment-intent` (creates PaymentIntent with 5% fee + transfer) → Stripe Payment Element → `stripe-webhook` (records tip in DB).
- **Stripe Payment Element**: Uses `@stripe/react-stripe-js` with coral theme (`#d4856a`). Supports cards, wallets, etc.
- **Migration files**: Renamed to timestamp format (`20260212000000_*.sql`). Previous migrations marked as applied via `supabase migration repair`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.9, Vite 7 |
| Styling | Tailwind CSS 4, Framer Motion 12 |
| State | Zustand 5 |
| Backend | Supabase (Postgres, Auth, Edge Functions) |
| Payments | Stripe (Connect Express) |
| Email | Resend (`contact@fluxium.dev`) |
| Icons | Lucide React |
| QR Codes | qrcode.react 4 |
| Charts | Recharts 3 (installed, not used yet) |
