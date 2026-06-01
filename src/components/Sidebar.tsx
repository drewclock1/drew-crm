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

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-brand-navy min-h-screen">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-gold flex items-center justify-center shrink-0 shadow-gold">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-[15px] leading-tight">Drew CRM</p>
            <p className="text-blue-300 text-xs mt-0.5 capitalize">{user?.role || 'Agent'}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visible.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-brand-gold text-white shadow-gold'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + signout */}
      <div className="px-3 pb-4 pt-3 border-t border-white/10 space-y-1">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 mb-2">
            <div className="w-7 h-7 rounded-full bg-brand-gold flex items-center justify-center text-xs font-bold text-white shrink-0">
              {(user.full_name || user.email)?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.full_name || 'Agent'}</p>
              <p className="text-blue-300 text-[11px] truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-blue-300 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
