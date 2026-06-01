import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const stage = searchParams.get('stage')
  const recruiterId = searchParams.get('recruiter_id')

  let query = supabase
    .from('recruiting_leads')
    .select('*, contact:contacts(*), recruiter:users(*)')
    .order('updated_at', { ascending: false })

  if (stage) query = query.eq('stage', stage)
  if (recruiterId) query = query.eq('recruiter_id', recruiterId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('recruiting_leads')
    .insert(body)
    .select('*, contact:contacts(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
