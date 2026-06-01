'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import {
  LayoutDashboard, Users, Shield, UserPlus,
  DollarSign, BarChart2, Settings, LogOut, Zap,
} from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/',           label: 'Dashboard',  icon: LayoutDashboard, roles: ['agent','manager','admin'] },
  { href: '/contacts',   label: 'Contacts',   icon: Users,           roles: ['agent','manager','admin'] },
  { href: '/insurance',  label: 'Insurance',  icon: Shield,          roles: ['agent','manager','admin'] },
  { href: '/recruiting', label: 'Recruiting', icon: UserPlus,        roles: ['agent','manager','admin'] },
  { href: '/commission', label: 'Commission', icon: DollarSign,      roles: ['agent','manager','admin'] },
  { href: '/reports',    label: 'Reports',    icon: BarChart2,       roles: ['manager','admin'] },
  { href: '/settings',   label: 'Settings',   icon: Settings,        roles: ['admin'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()

  const handleLogout = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const visible = navItems.filter(item => !user || item.roles.includes(user.role))
  const initial = (user?.full_name || user?.email || 'A')[0].toUpperCase()

  return (
    <aside
      className="w-[240px] shrink-0 flex flex-col min-h-screen"
      style={{
        background: '#0C3B6E',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ─── Logo ─────────────────────────────── */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #C9951A, #E8AE2A)',
              boxShadow: '0 4px 12px rgba(201,149,26,0.4)',
            }}
          >
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-white font-bold text-[15px] leading-tight tracking-tight">Drew CRM</p>
            <p className="text-[11px] mt-0.5 capitalize" style={{ color: 'rgba(147,197,253,0.75)' }}>
              {user?.role || 'Agent'} Portal
            </p>
          </div>
        </div>
      </div>

      {/* ─── Nav ─────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visible.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'text-white'
                  : 'hover:text-white hover:bg-white/8'
              )}
              style={active ? {
                background: 'linear-gradient(135deg, #C9951A, #E8AE2A)',
                boxShadow: '0 3px 10px rgba(201,149,26,0.35)',
                color: '#fff',
              } : {
                color: 'rgba(147,197,253,0.8)',
              }}
            >
              <item.icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* ─── User footer ─────────────────────── */}
      <div className="px-3 pb-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {user && (
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-2"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #C9951A, #E8AE2A)' }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate leading-tight">
                {user.full_name || 'Agent'}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'rgba(147,197,253,0.65)' }}>
                {user.email}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium transition-all duration-150"
          style={{ color: 'rgba(147,197,253,0.65)' }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.background = 'rgba(255,255,255,0.06)'
            el.style.color = '#fff'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.background = 'transparent'
            el.style.color = 'rgba(147,197,253,0.65)'
          }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
