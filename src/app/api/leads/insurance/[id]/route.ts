import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { triggerBot } from '@/lib/sms-bot'
import { pushToSheets } from '@/lib/sheets'
import { InsuranceStage, INSURANCE_STAGE_LABELS } from '@/types'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('insurance_leads')
    .select('*, contact:contacts(*), agent:users(*)')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const body = await req.json()
  const prevStageRes = await supabase
    .from('insurance_leads')
    .select('stage, contact:contacts(phone, first_name, last_name)')
    .eq('id', params.id)
    .single()

  const { data, error } = await supabase
    .from('insurance_leads')
    .update(body)
    .eq('id', params.id)
    .select('*, contact:contacts(*), agent:users(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Stage change → log activity + fire SMS bot
  if (body.stage && body.stage !== prevStageRes.data?.stage) {
    const contact = prevStageRes.data?.contact as { phone?: string; first_name?: string; last_name?: string } | null
    const newStageLabel = INSURANCE_STAGE_LABELS[body.stage as InsuranceStage]
    const oldStageLabel = INSURANCE_STAGE_LABELS[prevStageRes.data?.stage as InsuranceStage]

    // Log activity
    await supabase.from('activities').insert({
      lead_type: 'insurance',
      lead_id: params.id,
      contact_id: data.contact_id,
      type: 'stage_change',
      body: `Stage changed from "${oldStageLabel}" to "${newStageLabel}"`,
    })

    // Fire SMS bot
    if (contact?.phone) {
      const triggerContext = `Insurance lead ${contact.first_name} ${contact.last_name} moved from ${oldStageLabel} to ${newStageLabel}. Respond appropriately to follow up and advance the sale.`
      await triggerBot({ contactPhone: contact.phone, triggerContext, leadId: params.id, leadType: 'insurance', contactId: data.contact_id })
    }

    // Push to Google Sheets
    await pushToSheets(params.id, body.stage, data.commission_amt)
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('insurance_leads').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
