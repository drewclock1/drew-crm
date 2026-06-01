import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  // Use the internal URL + anon key — server-side, no CORS issues
  const supabase = createClient(
    process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, user: { id: data.user.id, email: data.user.email } })

  // Set session cookies — browser reads these, middleware checks them
  const maxAge = 60 * 60 * 24 * 7 // 7 days
  res.cookies.set('crm-access-token', data.session.access_token, { httpOnly: true, path: '/', maxAge, sameSite: 'lax' })
  res.cookies.set('crm-refresh-token', data.session.refresh_token, { httpOnly: true, path: '/', maxAge, sameSite: 'lax' })
  res.cookies.set('crm-user-id', data.user.id, { httpOnly: false, path: '/', maxAge, sameSite: 'lax' })
  res.cookies.set('crm-user-email', data.user.email, { httpOnly: false, path: '/', maxAge, sameSite: 'lax' })

  return res
}
