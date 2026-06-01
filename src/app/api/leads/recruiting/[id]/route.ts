import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { triggerBot } from '@/lib/sms-bot'
import { RecruitingStage, RECRUITING_STAGE_LABELS } from '@/types'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('recruiting_leads')
    .select('*, contact:contacts(*), recruiter:users(*)')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const body = await req.json()

  const prevRes = await supabase
    .from('recruiting_leads')
    .select('stage, contact:contacts(phone, first_name, last_name)')
    .eq('id', params.id)
    .single()

  const { data, error } = await supabase
    .from('recruiting_leads')
    .update(body)
    .eq('id', params.id)
    .select('*, contact:contacts(*), recruiter:users(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Stage change
  if (body.stage && body.stage !== prevRes.data?.stage) {
    const contact = prevRes.data?.contact as { phone?: string; first_name?: string; last_name?: string } | null
    const newLabel = RECRUITING_STAGE_LABELS[body.stage as RecruitingStage]
    const oldLabel = RECRUITING_STAGE_LABELS[prevRes.data?.stage as RecruitingStage]

    await supabase.from('activities').insert({
      lead_type: 'recruiting',
      lead_id: params.id,
      contact_id: data.contact_id,
      type: 'stage_change',
      body: `Stage changed from "${oldLabel}" to "${newLabel}"`,
    })

    if (contact?.phone) {
      const triggerContext = `Recruiting prospect ${contact.first_name} ${contact.last_name} moved from ${oldLabel} to ${newLabel}. Respond to advance the recruiting process and keep them engaged.`
      await triggerBot({ contactPhone: contact.phone, triggerContext, leadId: params.id, leadType: 'recruiting', contactId: data.contact_id })
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('recruiting_leads').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
