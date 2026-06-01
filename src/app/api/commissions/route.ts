import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const agentId = searchParams.get('agent_id')

  let query = supabase
    .from('commissions')
    .select('*, agent:users(*), insurance_lead:insurance_leads(*, contact:contacts(*))')
    .order('created_at', { ascending: false })

  if (month) query = query.gte('month', month).lte('month', month)
  if (agentId) query = query.eq('agent_id', agentId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('commissions')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
