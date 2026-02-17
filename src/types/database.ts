/** Core database types matching the Supabase schema from TIPUS_SYSTEM_DESIGN.md */

export type UserRole = 'venue_owner' | 'employee' | 'admin'

export type EmployeeStatus = 'invited' | 'active' | 'inactive'
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'partially_completed' | 'failed'
export type SubscriptionTier = 'free' | 'business'

export interface Venue {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  logo_url: string | null
  subscription_tier: SubscriptionTier
  subscription_status: string | null
  is_active: boolean
  auto_payout_enabled: boolean
  payout_frequency: 'weekly' | 'fortnightly' | 'monthly'
  payout_day: number
  last_auto_payout_at: string | null
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  venue_id: string
  user_id: string | null
  name: string
  email: string
  role: string | null
  avatar_url: string | null
  status: EmployeeStatus
  invitation_token: string | null
  invitation_sent_at: string | null
  invitation_accepted_at: string | null
  bank_bsb: string | null
  bank_account_number: string | null
  bank_account_name: string | null
  stripe_bank_account_id: string | null
  is_active: boolean
  activated_at: string | null
  deactivated_at: string | null
  created_at: string
  updated_at: string
}

export interface Tip {
  id: string
  venue_id: string
  employee_id: string | null
  amount: number // in cents
  currency: string
  tipper_name: string | null
  tipper_message: string | null
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  status: string
  created_at: string
}

export interface Payout {
  id: string
  venue_id: string
  period_start: string
  period_end: string
  total_amount: number
  platform_fee: number
  net_amount: number
  status: PayoutStatus
  stripe_transfer_id: string | null
  processed_at: string | null
  created_at: string
}

export type DistributionStatus = 'pending' | 'completed' | 'failed'

export interface PayoutDistribution {
  id: string
  payout_id: string
  employee_id: string
  amount: number
  days_active: number
  total_period_days: number
  is_prorated: boolean
  status: DistributionStatus
  stripe_transfer_id: string | null
  error_message: string | null
  created_at: string
}

export interface QRCode {
  id: string
  venue_id: string
  employee_id: string | null
  label: string | null
  short_code: string
  is_active: boolean
  scan_count: number
  created_at: string
}
