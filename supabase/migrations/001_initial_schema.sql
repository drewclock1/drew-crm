-- ============================================================
-- Drew CRM - Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('agent', 'manager', 'admin')),
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  state TEXT,
  source TEXT,
  mode TEXT NOT NULL DEFAULT 'bot' CHECK (mode IN ('bot', 'human', 'opted_out')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insurance leads
CREATE TABLE IF NOT EXISTS public.insurance_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.users(id),
  stage TEXT NOT NULL DEFAULT 'new_lead' CHECK (stage IN ('new_lead', 'contacted', 'quote_sent', 'follow_up', 'closed_won', 'closed_lost')),
  policy_type TEXT CHECK (policy_type IN ('auto', 'life', 'home', 'bundle', 'health')),
  annual_premium NUMERIC(12, 2),
  carrier TEXT,
  policy_number TEXT,
  close_date DATE,
  commission_rate NUMERIC(5, 4),
  commission_amt NUMERIC(12, 2),
  temp TEXT DEFAULT 'warm' CHECK (temp IN ('hot', 'warm', 'cold')),
  next_followup TIMESTAMPTZ,
  lost_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recruiting leads
CREATE TABLE IF NOT EXISTS public.recruiting_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  recruiter_id UUID REFERENCES public.users(id),
  stage TEXT NOT NULL DEFAULT 'prospect' CHECK (stage IN ('prospect', 'reached_out', 'interview', 'offer_sent', 'onboarded', 'lost')),
  current_position TEXT,
  licensed BOOLEAN DEFAULT FALSE,
  est_first_year NUMERIC(12, 2),
  start_date DATE,
  recruiter_bonus NUMERIC(12, 2),
  interview_date TIMESTAMPTZ,
  offer_amount NUMERIC(12, 2),
  lost_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activities
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_type TEXT NOT NULL CHECK (lead_type IN ('insurance', 'recruiting')),
  lead_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id),
  user_id UUID REFERENCES public.users(id),
  type TEXT NOT NULL CHECK (type IN ('note', 'call', 'stage_change', 'bot_trigger', 'handoff')),
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Commissions
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insurance_lead_id UUID REFERENCES public.insurance_leads(id) ON DELETE SET NULL,
  agent_id UUID NOT NULL REFERENCES public.users(id),
  month DATE NOT NULL,
  premium NUMERIC(12, 2),
  rate NUMERIC(5, 4),
  base_commission NUMERIC(12, 2),
  bonus NUMERIC(12, 2) DEFAULT 0,
  persistency_bonus NUMERIC(12, 2) DEFAULT 0,
  total NUMERIC(12, 2),
  policy_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Goals
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  commission_target NUMERIC(12, 2) DEFAULT 0,
  policies_target INTEGER DEFAULT 0,
  contacts_target INTEGER DEFAULT 0,
  recruits_target INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Google Sheets sync log
CREATE TABLE IF NOT EXISTS public.sheets_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rows_pulled INTEGER DEFAULT 0,
  rows_pushed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'partial')),
  error TEXT
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_insurance_leads_agent_id ON public.insurance_leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_insurance_leads_contact_id ON public.insurance_leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_insurance_leads_stage ON public.insurance_leads(stage);
CREATE INDEX IF NOT EXISTS idx_recruiting_leads_recruiter_id ON public.recruiting_leads(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_recruiting_leads_contact_id ON public.recruiting_leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact_id ON public.activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_commissions_agent_id ON public.commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_month ON public.commissions(month);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER insurance_leads_updated_at
  BEFORE UPDATE ON public.insurance_leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER recruiting_leads_updated_at
  BEFORE UPDATE ON public.recruiting_leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiting_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheets_sync_log ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Users RLS
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid() OR public.get_user_role() IN ('manager', 'admin'));

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "users_insert_admin" ON public.users
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

-- Contacts RLS (all authenticated users can read/write contacts)
CREATE POLICY "contacts_select_authenticated" ON public.contacts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "contacts_insert_authenticated" ON public.contacts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "contacts_update_authenticated" ON public.contacts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Insurance leads RLS
CREATE POLICY "insurance_leads_select" ON public.insurance_leads
  FOR SELECT USING (
    agent_id = auth.uid() OR public.get_user_role() IN ('manager', 'admin')
  );

CREATE POLICY "insurance_leads_insert" ON public.insurance_leads
  FOR INSERT WITH CHECK (
    agent_id = auth.uid() OR public.get_user_role() IN ('manager', 'admin')
  );

CREATE POLICY "insurance_leads_update" ON public.insurance_leads
  FOR UPDATE USING (
    agent_id = auth.uid() OR public.get_user_role() IN ('manager', 'admin')
  );

CREATE POLICY "insurance_leads_delete" ON public.insurance_leads
  FOR DELETE USING (public.get_user_role() IN ('manager', 'admin'));

-- Recruiting leads RLS
CREATE POLICY "recruiting_leads_select" ON public.recruiting_leads
  FOR SELECT USING (
    recruiter_id = auth.uid() OR public.get_user_role() IN ('manager', 'admin')
  );

CREATE POLICY "recruiting_leads_insert" ON public.recruiting_leads
  FOR INSERT WITH CHECK (
    recruiter_id = auth.uid() OR public.get_user_role() IN ('manager', 'admin')
  );

CREATE POLICY "recruiting_leads_update" ON public.recruiting_leads
  FOR UPDATE USING (
    recruiter_id = auth.uid() OR public.get_user_role() IN ('manager', 'admin')
  );

CREATE POLICY "recruiting_leads_delete" ON public.recruiting_leads
  FOR DELETE USING (public.get_user_role() IN ('manager', 'admin'));

-- Activities RLS
CREATE POLICY "activities_select" ON public.activities
  FOR SELECT USING (
    user_id = auth.uid() OR public.get_user_role() IN ('manager', 'admin')
  );

CREATE POLICY "activities_insert" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Commissions RLS
CREATE POLICY "commissions_select" ON public.commissions
  FOR SELECT USING (
    agent_id = auth.uid() OR public.get_user_role() IN ('manager', 'admin')
  );

CREATE POLICY "commissions_insert" ON public.commissions
  FOR INSERT WITH CHECK (
    agent_id = auth.uid() OR public.get_user_role() IN ('manager', 'admin')
  );

CREATE POLICY "commissions_update" ON public.commissions
  FOR UPDATE USING (
    agent_id = auth.uid() OR public.get_user_role() IN ('manager', 'admin')
  );

-- Goals RLS
CREATE POLICY "goals_select" ON public.goals
  FOR SELECT USING (
    user_id = auth.uid() OR public.get_user_role() IN ('manager', 'admin')
  );

CREATE POLICY "goals_insert" ON public.goals
  FOR INSERT WITH CHECK (public.get_user_role() IN ('manager', 'admin'));

CREATE POLICY "goals_update" ON public.goals
  FOR UPDATE USING (public.get_user_role() IN ('manager', 'admin'));

-- Sheets sync log RLS (admin/manager only)
CREATE POLICY "sheets_sync_log_select" ON public.sheets_sync_log
  FOR SELECT USING (public.get_user_role() IN ('manager', 'admin'));

CREATE POLICY "sheets_sync_log_insert" ON public.sheets_sync_log
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.insurance_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recruiting_leads;
