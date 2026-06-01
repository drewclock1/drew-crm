import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { triggerSmsBot } from '@/lib/sms-bot'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const stage = searchParams.get('stage')
  const agentId = searchParams.get('agent_id')

  let query = supabase
    .from('insurance_leads')
    .select('*, contact:contacts(*), agent:users(*)')
    .order('updated_at', { ascending: false })

  if (stage) query = query.eq('stage', stage)
  if (agentId) query = query.eq('agent_id', agentId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('insurance_leads')
    .insert(body)
    .select('*, contact:contacts(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
