import { NextResponse } from 'next/server'

export async function POST() {
  const url = process.env.SMS_BOT_URL
  const apiKey = process.env.BOT_API_KEY

  if (!url) return NextResponse.json({ error: 'SMS_BOT_URL not configured' }, { status: 400 })

  try {
    const res = await fetch(`${url}/api/health`, {
      headers: { 'x-api-key': apiKey || '' },
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) return NextResponse.json({ success: true })
    return NextResponse.json({ error: `Bot returned ${res.status}` }, { status: 502 })
  } catch {
    return NextResponse.json({ error: 'Could not reach bot' }, { status: 502 })
  }
}
