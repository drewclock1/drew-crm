/**
 * Supabase Proxy — /sb/:path*
 *
 * Forwards all browser Supabase requests to the internal Supabase Kong URL.
 * This eliminates CORS entirely — browser calls same-origin /sb/*, server
 * proxies internally to Supabase Kong.
 */
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_INTERNAL = process.env.SUPABASE_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL || ''

async function proxy(req: NextRequest, params: { path: string[] }): Promise<NextResponse> {
  const path = params.path.join('/')
  const search = req.nextUrl.search
  const targetUrl = `${SUPABASE_INTERNAL}/${path}${search}`

  // Forward headers — strip Host so the internal proxy routes correctly
  const headers = new Headers()
  for (const [k, v] of req.headers.entries()) {
    if (!['host', 'connection', 'transfer-encoding'].includes(k.toLowerCase())) {
      headers.set(k, v)
    }
  }

  let body: BodyInit | null = null
  if (!['GET', 'HEAD'].includes(req.method)) {
    body = await req.arrayBuffer()
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      // Don't follow redirects — return them as-is to client
      redirect: 'manual',
    })

    const resHeaders = new Headers()
    for (const [k, v] of upstream.headers.entries()) {
      if (!['connection', 'transfer-encoding'].includes(k.toLowerCase())) {
        resHeaders.set(k, v)
      }
    }
    // Ensure CORS headers are set for browser requests
    resHeaders.set('Access-Control-Allow-Origin', '*')
    resHeaders.set('Access-Control-Allow-Headers', '*')
    resHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')

    const resBody = await upstream.arrayBuffer()
    return new NextResponse(resBody, {
      status: upstream.status,
      headers: resHeaders,
    })
  } catch (err) {
    console.error('[sb-proxy] upstream error:', err)
    return NextResponse.json({ error: 'Supabase proxy error', detail: String(err) }, { status: 502 })
  }
}

// Handle CORS preflight
export async function OPTIONS(req: NextRequest, { params }: { params: { path: string[] } }) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export const GET    = (req: NextRequest, { params }: { params: { path: string[] } }) => proxy(req, params)
export const POST   = (req: NextRequest, { params }: { params: { path: string[] } }) => proxy(req, params)
export const PUT    = (req: NextRequest, { params }: { params: { path: string[] } }) => proxy(req, params)
export const PATCH  = (req: NextRequest, { params }: { params: { path: string[] } }) => proxy(req, params)
export const DELETE = (req: NextRequest, { params }: { params: { path: string[] } }) => proxy(req, params)
