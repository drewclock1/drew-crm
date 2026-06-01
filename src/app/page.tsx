'use client'

import { useState, useEffect } from 'react'
import { Shield, UserPlus, TrendingUp, Users, DollarSign, BarChart2, RefreshCw, ArrowUpRight } from 'lucide-react'
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

const STAT_CARDS = (s: Stats, pipeline: 'insurance' | 'recruiting') => [
  {
    label: 'Pipeline Value',
    value: currency(pipeline === 'insurance' ? s.insurancePipelineValue : s.recruitingPipelineValue),
    icon: TrendingUp,
    accent: 'stat-card-blue',
    iconBg: 'bg-brand-blue-bg',
    iconColor: 'text-brand-blue',
    change: '+12%',
    positive: true,
  },
  {
    label: 'Leads This Week',
    value: String(s.leadsThisWeek ?? '0'),
    icon: Users,
    accent: 'stat-card-navy',
    iconBg: 'bg-blue-50',
    iconColor: 'text-brand-navy',
    change: '+5',
    positive: true,
  },
  {
    label: 'Commission MTD',
    value: currency(s.commissionMTD ?? 0),
    icon: DollarSign,
    accent: 'stat-card-gold',
    iconBg: 'bg-brand-gold-bg',
    iconColor: 'text-brand-gold',
    change: '+8%',
    positive: true,
  },
  {
    label: 'Close Rate',
    value: `${s.closeRate ?? 0}%`,
    icon: BarChart2,
    accent: 'stat-card-green',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    change: '+2%',
    positive: true,
  },
]

export default function Dashboard() {
  const { user } = useUser()
  const [pipeline, setPipeline] = useState<'insurance' | 'recruiting'>('insurance')
  const [stats, setStats] = useState<Stats | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/stats').then(r => r.json()).then(setStats)
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    await fetch(`/api/cron/sheets-sync`, { headers: { 'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || '' } })
    const d = await fetch('/api/dashboard/stats').then(r => r.json())
    setStats(d)
    setSyncing(false)
  }

  const blank: Stats = { insurancePipelineValue: 0, recruitingPipelineValue: 0, leadsThisWeek: 0, commissionMTD: 0, closeRate: 0, lastSync: null }
  const s = stats || blank

  return (
    <div className="p-6 max-w-full animate-fade-in">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
            {s.lastSync && (
              <span className="ml-2 text-xs text-slate-400">
                · Last sync {format(new Date(s.lastSync.synced_at), 'h:mm a')} · {s.lastSync.rows_pulled} rows
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

      {/* ── Pipeline toggle ── */}
      <div className="inline-flex bg-white border border-slate-200 rounded-xl p-1 mb-6 shadow-sm">
        {(['insurance', 'recruiting'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPipeline(p)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize',
              pipeline === p
                ? p === 'insurance'
                  ? 'bg-brand-blue text-white shadow-blue'
                  : 'bg-brand-navy text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {p === 'insurance' ? <Shield className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {p}
          </button>
        ))}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {STAT_CARDS(s, pipeline).map(card => (
          <div key={card.label} className={clsx('stat-card', card.accent)}>
            <div className="flex items-start justify-between mb-3">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', card.iconBg)}>
                <card.icon className={clsx('w-5 h-5', card.iconColor)} />
              </div>
              <span className={clsx(
                'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                card.positive ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'
              )}>
                <ArrowUpRight className="w-3 h-3" />
                {card.change}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{card.label}</p>
            <p className="text-2xl font-extrabold text-brand-navy tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="flex gap-5">
        {/* Kanban */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {pipeline === 'insurance' ? '🏥 Insurance Pipeline' : '👤 Recruiting Pipeline'}
            </h2>
          </div>
          <KanbanBoard pipelineType={pipeline} />
        </div>

        {/* Right sidebar */}
        <div className="w-[280px] shrink-0 space-y-4">
          <CommissionCalculator agentId={user?.id} />
          {user && <GoalMeters userId={user.id} userRole={user.role} />}
        </div>
      </div>

      {/* ── Activity Feed ── */}
      <div className="mt-6">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">⚡ Live Activity</h2>
        <ActivityFeed />
      </div>
    </div>
  )
}
