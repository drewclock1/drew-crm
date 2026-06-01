// ============================================================
// Drew CRM - TypeScript Types
// ============================================================

export type UserRole = 'agent' | 'manager' | 'admin'
export type ContactMode = 'bot' | 'human' | 'opted_out'
export type LeadType = 'insurance' | 'recruiting'
export type ActivityType = 'note' | 'call' | 'stage_change' | 'bot_trigger' | 'handoff'
export type PolicyType = 'auto' | 'life' | 'home' | 'bundle' | 'health'
export type Temp = 'hot' | 'warm' | 'cold'

export type InsuranceStage = 'new_lead' | 'contacted' | 'quote_sent' | 'follow_up' | 'closed_won' | 'closed_lost'
export type RecruitingStage = 'prospect' | 'reached_out' | 'interview' | 'offer_sent' | 'onboarded' | 'lost'

export const INSURANCE_STAGES: InsuranceStage[] = [
  'new_lead', 'contacted', 'quote_sent', 'follow_up', 'closed_won', 'closed_lost'
]

export const RECRUITING_STAGES: RecruitingStage[] = [
  'prospect', 'reached_out', 'interview', 'offer_sent', 'onboarded', 'lost'
]

export const INSURANCE_STAGE_LABELS: Record<InsuranceStage, string> = {
  new_lead: 'New Lead',
  contacted: 'Contacted',
  quote_sent: 'Quote Sent',
  follow_up: 'Follow Up',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
}

export const RECRUITING_STAGE_LABELS: Record<RecruitingStage, string> = {
  prospect: 'Prospect',
  reached_out: 'Reached Out',
  interview: 'Interview',
  offer_sent: 'Offer Sent',
  onboarded: 'Onboarded',
  lost: 'Lost',
}

export const DEFAULT_COMMISSION_RATES: Record<PolicyType, number> = {
  auto: 0.10,
  life: 0.85,
  home: 0.12,
  bundle: 0.15,
  health: 0.08,
}

export interface User {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  created_at: string
}

export interface Contact {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  email: string | null
  state: string | null
  source: string | null
  mode: ContactMode
  created_at: string
}

export interface InsuranceLead {
  id: string
  contact_id: string
  agent_id: string | null
  stage: InsuranceStage
  policy_type: PolicyType | null
  annual_premium: number | null
  carrier: string | null
  policy_number: string | null
  close_date: string | null
  commission_rate: number | null
  commission_amt: number | null
  temp: Temp | null
  next_followup: string | null
  lost_reason: string | null
  created_at: string
  updated_at: string
  // joined
  contact?: Contact
  agent?: User
}

export interface RecruitingLead {
  id: string
  contact_id: string
  recruiter_id: string | null
  stage: RecruitingStage
  current_position: string | null
  licensed: boolean
  est_first_year: number | null
  start_date: string | null
  recruiter_bonus: number | null
  interview_date: string | null
  offer_amount: number | null
  lost_reason: string | null
  created_at: string
  updated_at: string
  // joined
  contact?: Contact
  recruiter?: User
}

export interface Activity {
  id: string
  lead_type: LeadType
  lead_id: string
  contact_id: string | null
  user_id: string | null
  type: ActivityType
  body: string | null
  created_at: string
  // joined
  user?: User
  contact?: Contact
}

export interface Commission {
  id: string
  insurance_lead_id: string | null
  agent_id: string
  month: string
  premium: number | null
  rate: number | null
  base_commission: number | null
  bonus: number | null
  persistency_bonus: number | null
  total: number | null
  policy_type: string | null
  created_at: string
  // joined
  agent?: User
  insurance_lead?: InsuranceLead
}

export interface Goal {
  id: string
  user_id: string
  month: string
  commission_target: number
  policies_target: number
  contacts_target: number
  recruits_target: number
  created_at: string
  user?: User
}

export interface SheetsSyncLog {
  id: string
  sheet_id: string | null
  synced_at: string
  rows_pulled: number
  rows_pushed: number
  status: 'success' | 'error' | 'partial'
  error: string | null
}

export interface CommissionCalcResult {
  premium: number
  rate: number
  baseCommission: number
  bonus: number
  persistencyBonus: number
  total: number
  effectiveRate: number
  bonusTier: string
}
