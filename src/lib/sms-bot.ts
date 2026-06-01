import { createServiceClient } from './supabase-server'

interface TriggerBotOptions {
  contactPhone: string
  leadId: string
  leadType: 'insurance' | 'recruiting'
  triggerContext: string
  userId?: string
  contactId?: string
}

export async function triggerBot(opts: TriggerBotOptions): Promise<boolean> {
  const smsBotUrl = process.env.SMS_BOT_URL
  const botApiKey = process.env.BOT_API_KEY

  if (!smsBotUrl || !botApiKey) {
    console.warn('SMS bot not configured')
    return false
  }

  try {
    const res = await fetch(`${smsBotUrl}/api/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': botApiKey,
      },
      body: JSON.stringify({
        to: opts.contactPhone,
        triggerContext: opts.triggerContext,
      }),
    })

    const success = res.ok

    // Log activity
    const supabase = createServiceClient()
    await supabase.from('activities').insert({
      lead_type: opts.leadType,
      lead_id: opts.leadId,
      contact_id: opts.contactId,
      user_id: opts.userId,
      type: 'bot_trigger',
      body: `Bot triggered: ${opts.triggerContext}`,
    })

    return success
  } catch (err) {
    console.error('SMS bot trigger failed:', err)
    return false
  }
}
