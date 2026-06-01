import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { triggerBot } from '@/lib/sms-bot'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { triggerContext } = body

  const { data: lead } = await supabase
    .from('recruiting_leads')
    .select('*, contact:contacts(*)')
    .eq('id', params.id)
    .single()

  if (!lead?.contact?.phone) {
    return NextResponse.json({ error: 'No phone number on file' }, { status: 400 })
  }

  await triggerBot({ contactPhone: lead.contact.phone, triggerContext: triggerContext || 'Recruiter wants to follow up with this prospect. Send an engaging message.', leadId: params.id, leadType: 'recruiting' })
  return NextResponse.json({ success: true })
}
