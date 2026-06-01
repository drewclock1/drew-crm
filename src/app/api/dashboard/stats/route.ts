import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { startOfMonth, startOfWeek, format } from 'date-fns'

export async function GET() {
  const supabase = createServiceClient()
  const now = new Date()
  const weekStart = startOfWeek(now).toISOString()
  const monthStart = startOfMonth(now).toISOString()
  const monthStr = format(startOfMonth(now), 'yyyy-MM-dd')

  const [
    { data: allInsurance },
    { data: allRecruiting },
    { data: weekInsurance },
    { data: weekRecruiting },
    { data: commissions },
    { data: closedInsurance },
    { data: syncLog },
  ] = await Promise.all([
    supabase.from('insurance_leads').select('annual_premium, stage'),
    supabase.from('recruiting_leads').select('est_first_year, stage'),
    supabase.from('insurance_leads').select('id').gte('created_at', weekStart),
    supabase.from('recruiting_leads').select('id').gte('created_at', weekStart),
    supabase.from('commissions').select('total').gte('created_at', monthStart),
    supabase.from('insurance_leads').select('stage').in('stage', ['closed_won', 'closed_lost']),
    supabase.from('sheets_sync_log').select('*').order('synced_at', { ascending: false }).limit(1),
  ])

  const insurancePipelineValue = (allInsurance || [])
    .filter(l => !['closed_won', 'closed_lost'].includes(l.stage))
    .reduce((sum, l) => sum + (l.annual_premium || 0), 0)

  const recruitingPipelineValue = (allRecruiting || [])
    .filter(l => !['onboarded', 'lost'].includes(l.stage))
    .reduce((sum, l) => sum + (l.est_first_year || 0), 0)

  const leadsThisWeek = (weekInsurance?.length || 0) + (weekRecruiting?.length || 0)
  const commissionMTD = (commissions || []).reduce((sum, c) => sum + (c.total || 0), 0)

  const totalClosed = (closedInsurance || []).length
  const won = (closedInsurance || []).filter(l => l.stage === 'closed_won').length
  const closeRate = totalClosed > 0 ? Math.round((won / totalClosed) * 100) : 0

  return NextResponse.json({
    insurancePipelineValue,
    recruitingPipelineValue,
    leadsThisWeek,
    commissionMTD,
    closeRate,
    lastSync: syncLog?.[0] || null,
  })
}
