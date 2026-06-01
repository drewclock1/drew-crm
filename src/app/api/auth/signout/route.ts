import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('crm-access-token')
  res.cookies.delete('crm-refresh-token')
  res.cookies.delete('crm-user-id')
  res.cookies.delete('crm-user-email')
  return res
}
