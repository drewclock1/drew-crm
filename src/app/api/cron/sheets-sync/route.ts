import { NextRequest, NextResponse } from 'next/server'
import { pullFromSheets } from '@/lib/sheets'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await pullFromSheets()
  return NextResponse.json({ ok: true, ...result })
}
