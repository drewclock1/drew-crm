import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const userId = req.cookies.get('crm-user-id')?.value
  if (!userId) return NextResponse.json(null)

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  return NextResponse.json(data)
}
