/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  // Proxy all Supabase calls through Next.js so the browser never hits Supabase directly
  // This eliminates all CORS issues — browser calls /sb/... (same origin), server forwards to Supabase internally
  async rewrites() {
    const internalUrl = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    return [
      {
        source: '/sb/:path*',
        destination: `${internalUrl}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
