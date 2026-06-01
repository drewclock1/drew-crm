'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Users,
  Shield,
  UserPlus,
  DollarSign,
  BarChart2,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['agent', 'manager', 'admin'] },
  { href: '/contacts', label: 'Contacts', icon: Users, roles: ['agent', 'manager', 'admin'] },
  { href: '/insurance', label: 'Insurance', icon: Shield, roles: ['agent', 'manager', 'admin'] },
  { href: '/recruiting', label: 'Recruiting', icon: UserPlus, roles: ['agent', 'manager', 'admin'] },
  { href: '/commission', label: 'Commission', icon: DollarSign, roles: ['agent', 'manager', 'admin'] },
  { href: '/reports', label: 'Reports', icon: BarChart2, roles: ['manager', 'admin'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['manager', 'admin'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visibleItems = navItems.filter(item =>
    !user || item.roles.includes(user.role)
  )

  return (
    <aside className="w-64 bg-brand-navy min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-blue-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-blue flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-none">Drew CRM</div>
            <div className="text-blue-300 text-xs mt-0.5">Insurance & Recruiting</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group',
                active
                  ? 'bg-brand-blue text-white'
                  : 'text-blue-200 hover:bg-blue-900 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="font-medium">{label}</span>
              {active && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-blue-900">
        {user && (
          <div className="mb-3 px-3">
            <div className="text-white font-medium text-sm truncate">{user.full_name || user.email}</div>
            <div className="text-blue-300 text-xs capitalize">{user.role}</div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-blue-200 hover:bg-blue-900 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
