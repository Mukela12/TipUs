# TipUs — Digital Tipping Platform for Australian Hospitality

TipUs is a digital tipping platform that allows customers to tip hospitality venue staff via QR codes. Venue owners manage employees, QR codes, and payouts through a dashboard. Employees have their own dashboard to view tips and payout history. All money flows through Stripe.

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Money Flow](#money-flow)
3. [Payment Methods](#payment-methods)
4. [Architecture](#architecture)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#project-structure)
7. [Database Schema](#database-schema)
8. [Edge Functions (Backend)](#edge-functions-backend)
9. [Frontend Stores](#frontend-stores)
10. [Authentication & Roles](#authentication--roles)
11. [Getting Started](#getting-started)
12. [Environment Variables](#environment-variables)
13. [Deployment](#deployment)

---

## How It Works

### For Venue Owners

1. **Sign up** and create a venue (name, address, description)
2. **Connect Stripe** — onboard via Stripe Connect Express to accept payments
3. **Add employees** — invite staff by email; they receive a setup link
4. **Create QR codes** — generate venue-wide or employee-specific QR codes
5. **Place QR codes** — print and place at tables, bars, or counters
6. **View dashboard** — see tips coming in, manage employees, configure payouts
7. **Run payouts** — manually or on a recurring schedule (weekly/fortnightly/monthly)

### For Employees

1. **Receive invite email** — click the setup link from their venue owner
2. **Create account** — sign up with email and password
3. **Enter bank details** — provide BSB, account number, and account name
4. **View dashboard** — see all venue tips, personal payout history, and update bank details

### For Customers

1. **Scan QR code** — at a table, bar, or counter
2. **Choose amount** — preset ($5, $10, $20, $50) or custom
3. **Add optional message** — name and message for the staff
4. **Pay** — via credit/debit card, Apple Pay, or Google Pay
5. **Done** — tip is recorded and the employee's share is calculated at payout time

---

## Money Flow

This is the core of the system. Understanding how money moves is critical for both frontend and backend developers.

### Step 1: Customer Pays a Tip

```
Customer → Stripe PaymentIntent → Platform (TipUs) account
                                      │
                                      ├─ 5% platform fee → stays on platform
                                      └─ 95% auto-transferred → venue's Stripe Connect account
```

When a customer pays, the `create-payment-intent` Edge Function creates a Stripe PaymentIntent with:
- `amount`: the tip in cents (e.g., 1000 = $10.00 AUD)
- `application_fee_amount`: 5% of the tip (stays with TipUs as revenue)
- `transfer_data.destination`: the venue owner's Stripe Connect account ID

Stripe automatically splits the payment: 5% goes to TipUs, 95% goes to the venue's connected account.

### Step 2: Tip is Recorded in the Database

When the payment succeeds, Stripe fires a `payment_intent.succeeded` webhook to the `stripe-webhook` Edge Function, which:
1. Verifies the webhook signature
2. Inserts a row into the `tips` table with `status: 'succeeded'`
3. Increments the `scan_count` on the QR code

As a backup, the frontend also calls `confirm-tip` immediately after payment succeeds (non-critical, webhook is the source of truth).

### Step 3: Payout Calculation

When the venue owner triggers a payout (manually or via auto-schedule), the `process-payout` Edge Function:
1. Queries all `succeeded` tips in the payout period
2. Calculates `total_amount` (sum of all tips in the period)
3. Deducts `platform_fee` (5% of total)
4. Calculates `net_amount` (total - fee)
5. Splits `net_amount` among active employees, **prorated by days active**:
   - Employee who worked the full period gets a full share
   - Employee who joined mid-period gets a prorated share based on days active
   - Formula: `employee_share = net_amount * (employee_days_active / sum_of_all_days_active)`
6. Creates a `payouts` row (status: `pending`) and `payout_distributions` rows

### Step 4: Payout Execution

When the venue owner confirms the payout, the `complete-payout` Edge Function:
1. **Reverses the auto-transfers** — pulls money back from the venue's Stripe Connect account to the platform
2. **Checks platform balance** — ensures enough funds are available
3. For each employee:
   - Creates a Stripe Custom connected account (if first payout) with the employee's bank details
   - Transfers the employee's share from the platform to their connected account
   - Stripe automatically pays out from the connected account to the employee's bank
4. Updates payout status to `completed`

```
Venue's Stripe Account ──(reverse transfer)──→ Platform (TipUs)
                                                    │
                                          ┌─────────┼─────────┐
                                          ▼         ▼         ▼
                                    Employee A  Employee B  Employee C
                                    (Custom     (Custom     (Custom
                                     account)    account)    account)
                                          │         │         │
                                          ▼         ▼         ▼
                                    Bank Acct   Bank Acct   Bank Acct
                                    (BSB/Acct)  (BSB/Acct)  (BSB/Acct)
```

### Step 5: Recurring Automatic Payouts

Venue owners can configure automatic payouts:
- **Frequency**: weekly, fortnightly, or monthly
- **Day**: which day of the week (for weekly/fortnightly) or day of the month
- A `pg_cron` job runs daily at 2am UTC and calls the `auto-payout` Edge Function
- `auto-payout` checks all venues with auto-payouts enabled, determines which are due, and runs the full process + complete pipeline automatically

### Money Flow Summary

```
$10.00 tip from customer
  ├─ $0.50 (5%) → TipUs platform fee
  ├─ $0.30-0.60 (approx) → Stripe processing fees (paid by platform)
  └─ $9.50 (95%) → auto-transferred to venue's Stripe Connect account
                        │
                    At payout time:
                        │
                    $9.50 reversed back to platform
                        │
                    $9.50 split among employees (prorated by days active)
                        │
                    Transferred to each employee's Stripe Custom account
                        │
                    Automatically paid out to employee's bank (BSB/account)
```

---

## Payment Methods

The public tipping page uses **Stripe Payment Element**, which automatically presents the best payment methods based on the customer's device and location.

Supported methods for Australian customers:
- **Credit/Debit Cards** — Visa, Mastercard, American Express
- **Apple Pay** — on Safari/iOS devices with Apple Pay configured
- **Google Pay** — on Chrome/Android devices with Google Pay configured
- **Link** — Stripe's one-click checkout (if the customer has a Link account)

The Payment Element automatically handles:
- Card validation and formatting
- 3D Secure authentication when required
- Wallet detection (shows Apple Pay/Google Pay only when available)

All amounts are in **Australian Dollars (AUD)**. Minimum tip: $1.00.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19 SPA)                  │
│                                                              │
│  Vite 7 · TypeScript 5.9 · Tailwind CSS 4 · Framer Motion  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Auth    │  │  Venue   │  │ Employee │  │  UI        │  │
│  │  Store   │  │  Store   │  │  Store   │  │  Store     │  │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├────────────┤  │
│  │  Tip     │  │  QR Code │  │  Payout  │  │ Emp.Dash   │  │
│  │  Store   │  │  Store   │  │  Store   │  │  Store     │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│                         │                                    │
│         Supabase JS SDK │ + direct fetch() for Edge Fns     │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                  │   │
│  │  7 tables · RLS policies · SECURITY DEFINER functions │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Auth (Supabase Auth)                                 │   │
│  │  Email/password · JWT · User metadata (role, ids)     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Edge Functions (Deno)     9 functions                │   │
│  │  Stripe payments · Webhooks · Payouts · Email · Auth  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────┐  ┌────────────────────────────┐   │
│  │  pg_cron             │  │  pg_net                     │   │
│  │  Daily at 2am UTC    │──│  HTTP POST to auto-payout   │   │
│  └──────────────────────┘  └────────────────────────────┘   │
└──────────────┬──────────────────────────────┬────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────┐        ┌──────────────────────┐
│  Stripe              │        │  Resend              │
│                      │        │                      │
│  Connect Express     │        │  Transactional email │
│  (venue accounts)    │        │  (invitations)       │
│                      │        │                      │
│  Custom accounts     │        │  From:               │
│  (employee payouts)  │        │  contact@fluxium.dev │
│                      │        │                      │
│  Payment Intents     │        └──────────────────────┘
│  Webhooks            │
│  Transfers           │
│  Payouts             │
└──────────────────────┘
```

### Request Flow

1. **Frontend** reads/writes data via the Supabase JS SDK (which calls PostgREST behind the scenes, enforced by RLS policies)
2. **Edge Functions** are called via `fetch()` with `apikey` headers for operations that need server-side secrets (Stripe, Resend)
3. **Stripe Webhooks** hit the `stripe-webhook` Edge Function directly (verified by signing secret)
4. **pg_cron** triggers `auto-payout` daily via `pg_net` HTTP POST

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19 |
| Language | TypeScript | 5.9 |
| Build Tool | Vite | 7 |
| Styling | Tailwind CSS | 4 |
| Animation | Framer Motion | 12 |
| State Management | Zustand | 5 |
| Routing | React Router | 7 |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) | — |
| Payments | Stripe (Connect Express + Custom) | — |
| Email | Resend | — |
| Icons | Lucide React | — |
| QR Codes | qrcode.react | 4 |
| Charts | Recharts | 3 (installed, not yet wired) |
| Forms | React Hook Form + Zod | — |
| UI Primitives | Radix UI | — |

---

## Project Structure

```
tipus/
├── index.html                    # Entry HTML (favicon: savings.ico)
├── package.json                  # Dependencies and scripts
├── vite.config.ts                # Vite config with React + Tailwind plugins
├── tsconfig.json                 # TypeScript config (path alias: @/ → src/)
├── eslint.config.js              # ESLint config
├── public/
│   ├── savings.ico               # Favicon
│   └── savings.png               # Logo used across the app
├── src/
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Route definitions
│   ├── index.css                 # Tailwind imports + design system tokens
│   ├── types/
│   │   ├── database.ts           # DB schema types (Venue, Employee, Tip, etc.)
│   │   └── index.ts              # Re-exports + AuthUser type
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client instance
│   │   ├── stripe.ts             # Lazy-loaded Stripe.js instance
│   │   ├── utils.ts              # formatCurrency, formatDate, cn(), etc.
│   │   └── animations.ts         # Framer Motion variants (fadeInUp, etc.)
│   ├── stores/
│   │   ├── authStore.ts          # Auth state, login/signup/logout, session
│   │   ├── venueStore.ts         # Venue CRUD, Stripe onboarding, payout schedule
│   │   ├── employeeStore.ts      # Employee CRUD, invitations
│   │   ├── tipStore.ts           # Tips listing, stats, filters
│   │   ├── payoutStore.ts        # Payout creation, execution, listing
│   │   ├── qrCodeStore.ts        # QR code CRUD
│   │   ├── uiStore.ts            # Sidebar open/close, toast notifications
│   │   └── employeeDashboardStore.ts  # Employee-specific data (their tips, payouts)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx          # Venue owner layout wrapper
│   │   │   ├── ProtectedRoute.tsx           # Auth guard + role-based routing
│   │   │   ├── Sidebar.tsx                  # Venue owner desktop sidebar
│   │   │   ├── MobileHeader.tsx             # Venue owner mobile header
│   │   │   ├── MobileBottomNav.tsx          # Venue owner mobile bottom nav
│   │   │   ├── EmployeeLayout.tsx           # Employee layout wrapper
│   │   │   ├── EmployeeSidebar.tsx          # Employee desktop sidebar
│   │   │   ├── EmployeeMobileHeader.tsx     # Employee mobile header
│   │   │   └── EmployeeMobileBottomNav.tsx  # Employee mobile bottom nav
│   │   └── ui/
│   │       └── ToastContainer.tsx           # Toast notifications
│   └── pages/
│       ├── HomePage.tsx                     # Public landing page
│       ├── LoginPage.tsx                    # Login/signup (role-based redirect)
│       ├── NotFoundPage.tsx                 # 404 page
│       ├── onboarding/
│       │   └── OnboardingPage.tsx           # Venue creation wizard
│       ├── tip/
│       │   └── TipPage.tsx                  # Public tip page (QR scan → pay)
│       ├── invite/
│       │   └── EmployeeSetupPage.tsx        # Employee invitation acceptance
│       ├── dashboard/                       # Venue owner pages
│       │   ├── DashboardPage.tsx            # Stats + recent activity
│       │   ├── EmployeesPage.tsx            # Employee management
│       │   ├── TipsPage.tsx                 # Tip history + filters
│       │   ├── PayoutsPage.tsx              # Payout management + schedule
│       │   ├── QRCodesPage.tsx              # QR code management
│       │   ├── SettingsPage.tsx             # Venue settings
│       │   └── StripeReturnPage.tsx         # Stripe onboarding return
│       └── employee/                        # Employee pages
│           ├── EmployeeDashboardPage.tsx     # Employee stats + recent tips
│           ├── EmployeeTipsPage.tsx          # All venue tips
│           ├── EmployeePayoutsPage.tsx       # Payout distribution history
│           └── EmployeeProfilePage.tsx       # Profile + bank details editor
├── supabase/
│   ├── config.toml                          # Supabase project config
│   ├── functions/
│   │   ├── create-stripe-account/index.ts   # Stripe Connect onboarding
│   │   ├── stripe-webhook/index.ts          # Webhook: account.updated + payment_intent.succeeded
│   │   ├── create-payment-intent/index.ts   # Create PaymentIntent with 5% fee
│   │   ├── confirm-tip/index.ts             # Confirm tip (backup to webhook)
│   │   ├── send-invite-email/index.ts       # Send employee invite via Resend
│   │   ├── accept-invitation/index.ts       # Accept invite, link user, save bank
│   │   ├── process-payout/index.ts          # Calculate payout splits
│   │   ├── complete-payout/index.ts         # Execute Stripe transfers to employees
│   │   └── auto-payout/index.ts             # Cron: auto-process due venues
│   └── migrations/                          # SQL migration files
│       ├── 20260212000000_initial_schema.sql
│       ├── 20260212000001_rls_policies.sql
│       └── ... (additional migration files)
└── PROGRESS.md                              # Development progress tracker
```

---

## Database Schema

### 7 Tables

#### `venues`
The central entity. Each venue has one owner and connects to Stripe.
```
id, owner_id, name, slug, description, address, logo_url,
stripe_account_id, stripe_onboarding_complete,
subscription_tier (free|business), subscription_status,
is_active, auto_payout_enabled, payout_frequency (weekly|fortnightly|monthly),
payout_day, last_auto_payout_at, created_at, updated_at
```

#### `employees`
Staff members belonging to a venue. Invited by email, linked to auth user on acceptance.
```
id, venue_id, user_id, name, email, role, avatar_url,
status (invited|active|inactive), invitation_token,
invitation_sent_at, invitation_accepted_at,
bank_bsb, bank_account_number, bank_account_name,
stripe_bank_account_id (Stripe Custom account ID),
is_active, activated_at, deactivated_at, created_at, updated_at
```

#### `tips`
Each successful payment creates one tip row (via webhook).
```
id, venue_id, employee_id (nullable — tips can be venue-wide),
amount (cents), currency (aud),
tipper_name, tipper_message,
stripe_payment_intent_id, stripe_checkout_session_id,
status (succeeded), created_at
```

#### `qr_codes`
Generated by venue owners. Can target the venue (general) or a specific employee.
```
id, venue_id, employee_id (nullable), label, short_code (unique),
is_active, scan_count, created_at
```

#### `payouts`
One payout per venue per period. Created by `process-payout`, executed by `complete-payout`.
```
id, venue_id, period_start, period_end,
total_amount, platform_fee, net_amount,
status (pending|processing|completed|failed),
stripe_transfer_id, processed_at, created_at
```

#### `payout_distributions`
One row per employee per payout. Shows each employee's share.
```
id, payout_id, employee_id, amount,
days_active, total_period_days, is_prorated, created_at
```

#### `employee_invitations` (schema only)
Created during initial schema migration but not actively used — invitation tokens are stored directly on the `employees` table.

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:
- **Venue owners** can read/write their own venue's data (employees, tips, payouts, QR codes)
- **Employees** can read their own employee record, all tips from their venue, their payout distributions, and their venue's name
- **Employees** can update only their own bank details
- **Public** can read active venues and QR codes (needed for the tip page)
- **SECURITY DEFINER functions** (`get_my_employee_ids()`, `get_my_payout_ids()`, `get_my_venue_ids()`) bypass RLS to avoid infinite recursion in cross-table policies

---

## Edge Functions (Backend)

All Edge Functions are Deno-based, deployed with `--no-verify-jwt`, and handle auth internally. Secrets are accessed via `Deno.env.get()` — never exposed to the frontend.

| Function | Trigger | What It Does |
|----------|---------|-------------|
| `create-stripe-account` | Venue owner clicks "Connect Stripe" | Creates Stripe Connect Express account, returns onboarding URL |
| `stripe-webhook` | Stripe sends webhook events | Handles `account.updated` (marks onboarding complete) and `payment_intent.succeeded` (records tip in DB) |
| `create-payment-intent` | Customer submits tip amount | Creates Stripe PaymentIntent with 5% fee and auto-transfer to venue |
| `confirm-tip` | Frontend after payment succeeds | Confirms tip status (backup — webhook is source of truth) |
| `send-invite-email` | Venue owner adds employee | Sends invite email via Resend with setup link |
| `accept-invitation` | Employee clicks setup link | Validates token, links auth user to employee record, saves bank details |
| `process-payout` | Venue owner creates payout | Calculates tip totals, splits among employees (prorated), creates payout + distribution records |
| `complete-payout` | Venue owner confirms payout | Reverses auto-transfers, creates Stripe Custom accounts for employees, transfers funds |
| `auto-payout` | pg_cron daily at 2am UTC | Finds venues due for payout, runs process + complete pipeline automatically |

---

## Frontend Stores

State management uses Zustand. Each store follows the same pattern:

```typescript
// Pattern: create<State>((set, get) => ({ ... }))
// Async actions return { error: string | null }
// Loading states: loading (boolean), initialized (boolean)
```

| Store | Responsibility |
|-------|---------------|
| `authStore` | Login, signup, logout, session management, user role/metadata |
| `venueStore` | Venue CRUD, Stripe onboarding status, payout schedule config |
| `employeeStore` | Employee CRUD, send invitations, activation/deactivation |
| `tipStore` | Fetch tips with filters, compute stats (total, average, count) |
| `payoutStore` | Create payouts, execute payouts, fetch payout history |
| `qrCodeStore` | Create/update/delete QR codes, toggle active state |
| `uiStore` | Sidebar state, toast notifications |
| `employeeDashboardStore` | Employee-specific: profile, venue tips, payout distributions, bank detail updates |

---

## Authentication & Roles

TipUs uses **Supabase Auth** with email/password authentication. User roles are stored in `user_metadata`:

```json
// Venue owner
{ "role": "venue_owner", "venue_id": "uuid", "full_name": "John" }

// Employee
{ "role": "employee", "employee_id": "uuid", "venue_id": "uuid", "full_name": "Steve" }
```

### Role-Based Routing

```
Login → ProtectedRoute checks user.role
  ├─ venue_owner → /dashboard/* (DashboardLayout)
  └─ employee   → /employee/*  (EmployeeLayout)
```

`ProtectedRoute` enforces this: if an employee tries to access `/dashboard`, they're redirected to `/employee`, and vice versa.

### Route Map

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Login/signup form |
| `/tip/:shortCode` | Public | Customer tip page (QR scan) |
| `/invite/:token` | Public | Employee invitation acceptance |
| `/onboarding` | Authenticated | Venue creation wizard |
| `/dashboard` | Venue Owner | Dashboard home (stats) |
| `/dashboard/employees` | Venue Owner | Employee management |
| `/dashboard/tips` | Venue Owner | Tip history |
| `/dashboard/payouts` | Venue Owner | Payout management |
| `/dashboard/qr-codes` | Venue Owner | QR code management |
| `/dashboard/settings` | Venue Owner | Venue settings |
| `/dashboard/stripe-return` | Venue Owner | Stripe onboarding callback |
| `/employee` | Employee | Employee dashboard (stats) |
| `/employee/tips` | Employee | Venue tip history |
| `/employee/payouts` | Employee | Payout distribution history |
| `/employee/profile` | Employee | Profile + bank details |

---

## Getting Started

### Prerequisites

- **Node.js** 20.19+ or 22.12+ (required by Vite 7)
- **Supabase CLI** (`npm install -g supabase`)
- **Stripe account** with Connect enabled

### Install

```bash
git clone <repo-url>
cd tipus
npm install
```

### Configure Environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
VITE_APP_URL=http://localhost:5173
```

### Set Supabase Secrets

These are server-side only — never exposed to the frontend:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your-key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your-secret
supabase secrets set RESEND_API_KEY=re_your-key
supabase secrets set EMAIL_FROM=contact@yourdomain.com
supabase secrets set FROM_NAME=YourAppName
```

### Run Development Server

```bash
npm run dev
```

### Deploy Edge Functions

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

### Run Migrations

```bash
supabase db push
```

---

## Environment Variables

### Frontend (exposed via `VITE_` prefix — these are public/safe)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (public, safe — RLS enforces access) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (public, safe — only for client-side Stripe.js) |
| `VITE_APP_URL` | App URL for redirects |

### Backend (Supabase secrets — server-side only, never in frontend)

| Secret | Purpose |
|--------|---------|
| `STRIPE_SECRET_KEY` | Stripe API secret (creates charges, transfers, accounts) |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhook signatures from Stripe |
| `RESEND_API_KEY` | Sends transactional emails (invitations) |
| `EMAIL_FROM` | Sender email address |
| `FROM_NAME` | Sender display name |
| `SUPABASE_URL` | Auto-injected by Supabase runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase runtime (bypasses RLS) |

---

## Deployment

### Production Build

```bash
npm run build
```

This outputs to `dist/`. The build is ~210KB gzipped.

### Hosting

The frontend is a static SPA — deploy to any static hosting:
- **Vercel**: `vercel deploy`
- **Netlify**: connect repo, build command `npm run build`, publish dir `dist`
- **Supabase Hosting**: or any CDN

Ensure the hosting provider:
1. Sets environment variables (`VITE_*`)
2. Configures SPA fallback (all routes → `index.html`)

### Stripe Webhook

Configure in the [Stripe Dashboard](https://dashboard.stripe.com/webhooks):
- **Endpoint URL**: `https://your-project.supabase.co/functions/v1/stripe-webhook`
- **Events**: `account.updated`, `payment_intent.succeeded`
- **Update** the `STRIPE_WEBHOOK_SECRET` in Supabase secrets to match the signing secret

### Auto-Payouts (pg_cron)

Set up in Supabase SQL editor:

```sql
SELECT cron.schedule(
  'auto-payout-daily',
  '0 2 * * *',  -- 2am UTC daily
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/auto-payout',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```
