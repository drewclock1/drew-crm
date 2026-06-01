'use client'

import { useState, useEffect } from 'react'
import {
  Shield, UserPlus, TrendingUp, Users,
  DollarSign, BarChart2, RefreshCw, ArrowUpRight,
} from 'lucide-react'
import { clsx } from 'clsx'
import KanbanBoard from '@/components/KanbanBoard'
import CommissionCalculator from '@/components/CommissionCalculator'
import GoalMeters from '@/components/GoalMeters'
import ActivityFeed from '@/components/ActivityFeed'
import { useUser } from '@/hooks/useUser'
import { format } from 'date-fns'

interface Stats {
  insurancePipelineValue: number
  recruitingPipelineValue: number
  leadsThisWeek: number
  commissionMTD: number
  closeRate: number
  lastSync: { synced_at: string; rows_pulled: number } | null
}

function currency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const STAT_CARDS = (s: Stats, pipeline: 'insurance' | 'recruiting') => [
  {
    label: 'Pipeline Value',
    value: currency(pipeline === 'insurance' ? s.insurancePipelineValue : s.recruitingPipelineValue),
    icon: TrendingUp,
    accent: 'stat-card-blue',
    iconBg: '#EBF4FF',
    iconColor: '#2B7FD4',
    change: '+12%',
    positive: true,
  },
  {
    label: 'Leads This Week',
    value: String(s.leadsThisWeek ?? 0),
    icon: Users,
    accent: 'stat-card-navy',
    iconBg: '#e0e8f5',
    iconColor: '#0C3B6E',
    change: '+5',
    positive: true,
  },
  {
    label: 'Commission MTD',
    value: currency(s.commissionMTD ?? 0),
    icon: DollarSign,
    accent: 'stat-card-gold',
    iconBg: '#FBF5E6',
    iconColor: '#C9951A',
    change: '+8%',
    positive: true,
  },
  {
    label: 'Close Rate',
    value: `${s.closeRate ?? 0}%`,
    icon: BarChart2,
    accent: 'stat-card-green',
    iconBg: '#f0fdf4',
    iconColor: '#16a34a',
    change: '+2%',
    positive: true,
  },
]

export default function Dashboard() {
  const { user } = useUser()
  const [pipeline, setPipeline] = useState<'insurance' | 'recruiting'>('insurance')
  const [stats, setStats] = useState<Stats | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch('/api/dashboard/stats').then(r => r.json()).then(setStats)
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    await fetch('/api/cron/sheets-sync', {
      headers: { 'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || '' },
    })
    const d = await fetch('/api/dashboard/stats').then(r => r.json())
    setStats(d)
    setSyncing(false)
  }

  const blank: Stats = {
    insurancePipelineValue: 0,
    recruitingPipelineValue: 0,
    leadsThisWeek: 0,
    commissionMTD: 0,
    closeRate: 0,
    lastSync: null,
  }
  const s = stats || blank
  const cards = STAT_CARDS(s, pipeline)

  return (
    <div className="p-6 max-w-full animate-fade-in">

      {/* ── Header bar ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Drew'} 🔥
          </h1>
          <p className="page-sub">
            {mounted ? format(new Date(), 'EEEE, MMMM d, yyyy') : ''}
            {s.lastSync && (
              <span className="ml-2 opacity-60">
                · Last sync{' '}
                {mounted ? format(new Date(s.lastSync.synced_at), 'h:mm a') : ''}
                {' · '}{s.lastSync.rows_pulled} rows
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSync} disabled={syncing} className="btn-secondary">
            <RefreshCw className={clsx('w-4 h-4', syncing && 'animate-spin')} />
            {syncing ? 'Syncing…' : 'Sync Sheets'}
          </button>
        </div>
      </div>

      {/* ── Pipeline toggle pills ── */}
      <div
        className="inline-flex p-1 mb-6 rounded-xl"
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        {(['insurance', 'recruiting'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPipeline(p)}
            className={clsx(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 capitalize',
              pipeline === p ? 'text-white' : 'text-slate-500 hover:text-slate-700'
            )}
            style={pipeline === p ? {
              background: p === 'insurance'
                ? 'linear-gradient(135deg, #2B7FD4, #1A5BA8)'
                : 'linear-gradient(135deg, #0C3B6E, #1A5BA8)',
              boxShadow: p === 'insurance'
                ? '0 4px 12px rgba(43,127,212,0.3)'
                : '0 4px 12px rgba(12,59,110,0.3)',
            } : {}}
          >
            {p === 'insurance'
              ? <Shield className="w-4 h-4" strokeWidth={2} />
              : <UserPlus className="w-4 h-4" strokeWidth={2} />
            }
            {p === 'insurance' ? 'Insurance' : 'Recruiting'}
          </button>
        ))}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-6 stagger">
        {cards.map((card, i) => (
          <div key={card.label} className={clsx('stat-card animate-slide-up')} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: card.iconBg }}
              >
                <card.icon className="w-5 h-5" style={{ color: card.iconColor }} strokeWidth={2} />
              </div>
              <span
                className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 rounded-full"
                style={{
                  background: card.positive ? '#f0fdf4' : '#fff1f2',
                  color: card.positive ? '#166534' : '#9f1239',
                }}
              >
                <ArrowUpRight className="w-3 h-3" />
                {card.change}
              </span>
            </div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>
              {card.label}
            </p>
            <p className="text-2xl font-extrabold tracking-tight" style={{ color: '#0C3B6E' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Main content grid ── */}
      <div className="flex gap-5">
        {/* Kanban */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
              {pipeline === 'insurance' ? '🏥 Insurance Pipeline' : '👤 Recruiting Pipeline'}
            </h2>
          </div>
          <KanbanBoard pipelineType={pipeline} />
        </div>

        {/* Right sidebar widgets */}
        <div className="w-[280px] shrink-0 space-y-4">
          <CommissionCalculator agentId={user?.id} />
          {user && <GoalMeters userId={user.id} userRole={user.role} />}
        </div>
      </div>

      {/* ── Activity feed ── */}
      <div className="mt-6">
        <h2 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>
          ⚡ Live Activity
        </h2>
        <ActivityFeed />
      </div>
    </div>
  )
}
