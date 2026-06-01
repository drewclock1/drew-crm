import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { triggerSmsBot } from '@/lib/sms-bot'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { triggerContext } = body

  const { data: lead } = await supabase
    .from('insurance_leads')
    .select('*, contact:contacts(*)')
    .eq('id', params.id)
    .single()

  if (!lead?.contact?.phone) {
    return NextResponse.json({ error: 'No phone number on file' }, { status: 400 })
  }

  await triggerSmsBot(lead.contact.phone, triggerContext || 'Agent wants to follow up. Send a warm outreach.', params.id, 'insurance')
  return NextResponse.json({ success: true })
}
