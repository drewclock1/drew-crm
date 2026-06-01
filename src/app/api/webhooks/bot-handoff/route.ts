import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== process.env.BOT_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { phone, lead_id, lead_type, reason } = body

  const supabase = createServiceClient()

  // Find contact by phone
  if (phone) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('phone', phone)
      .single()

    if (contact) {
      // Update contact mode to human
      await supabase
        .from('contacts')
        .update({ mode: 'human' })
        .eq('id', contact.id)

      // Log activity
      if (lead_id && lead_type) {
        await supabase.from('activities').insert({
          lead_type,
          lead_id,
          contact_id: contact.id,
          type: 'handoff',
          body: `SMS bot handed off to human${reason ? `: ${reason}` : ''}`,
        })
      }
    }
  }

  return NextResponse.json({ success: true })
}
