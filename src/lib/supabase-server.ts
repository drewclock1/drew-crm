import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server-side clients use the internal URL directly (no proxy needed, no CORS)
const SUPABASE_URL = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try { cookieStore.set({ name, value, ...options }) } catch {}
      },
      remove(name: string, options: Record<string, unknown>) {
        try { cookieStore.set({ name, value: '', ...options }) } catch {}
      },
    },
  })
}

export function createServiceClient() {
  return createServerClient(SUPABASE_URL, SERVICE_KEY, {
    cookies: {
      get() { return undefined },
      set() {},
      remove() {},
    },
  })
}
