'use client'

import { useState, useEffect } from 'react'
import { Shield, UserPlus, TrendingUp, Users, DollarSign, BarChart2, RefreshCw } from 'lucide-react'
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
  lastSync: { synced_at: string; rows_pulled: number; rows_pushed: number } | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default function Dashboard() {
  const { user } = useUser()
  const [pipeline, setPipeline] = useState<'insurance' | 'recruiting'>('insurance')
  const [stats, setStats] = useState<Stats | null>(null)
  const [syncing, setSyncing] = useState(false)

  const loadStats = async () => {
    const res = await fetch('/api/dashboard/stats')
    const data = await res.json()
    setStats(data)
  }

  useEffect(() => { loadStats() }, [])

  const handleSync = async () => {
    setSyncing(true)
    const secret = process.env.NEXT_PUBLIC_CRON_SECRET || ''
    await fetch(`/api/cron/sheets-sync?secret=${encodeURIComponent(secret)}`)
    await loadStats()
    setSyncing(false)
  }

  const pipelineValue = pipeline === 'insurance'
    ? (stats?.insurancePipelineValue || 0)
    : (stats?.recruitingPipelineValue || 0)

  const statCards = [
    {
      label: 'Pipeline Value',
      value: fmt(pipelineValue),
      icon: TrendingUp,
      color: 'text-brand-blue',
      bg: 'bg-brand-surface-blue',
    },
    {
      label: 'Leads This Week',
      value: stats?.leadsThisWeek?.toString() || '—',
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Commission MTD',
      value: fmt(stats?.commissionMTD || 0),
      icon: DollarSign,
      color: 'text-brand-gold',
      bg: 'bg-brand-surface-gold',
    },
    {
      label: 'Close Rate',
      value: `${stats?.closeRate || 0}%`,
      icon: BarChart2,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ]

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
            {stats?.lastSync && (
              <span className="ml-3 text-xs text-gray-400">
                Last sync: {format(new Date(stats.lastSync.synced_at), 'h:mm a')} · {stats.lastSync.rows_pulled} rows in
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-200 hover:border-brand-blue hover:text-brand-blue transition-colors disabled:opacity-50"
        >
          <RefreshCw className={clsx('w-4 h-4', syncing && 'animate-spin')} />
          {syncing ? 'Syncing...' : 'Sync Sheets'}
        </button>
      </div>

      {/* Pipeline toggle */}
      <div className="inline-flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setPipeline('insurance')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            pipeline === 'insurance'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-gray-600 hover:text-brand-navy'
          )}
        >
          <Shield className="w-4 h-4" />
          Insurance
        </button>
        <button
          onClick={() => setPipeline('recruiting')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            pipeline === 'recruiting'
              ? 'bg-brand-navy text-white shadow-sm'
              : 'text-gray-600 hover:text-brand-navy'
          )}
        >
          <UserPlus className="w-4 h-4" />
          Recruiting
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map(card => (
          <div key={card.label} className={clsx('rounded-xl p-4 border border-gray-200', card.bg)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</span>
              <card.icon className={clsx('w-5 h-5', card.color)} />
            </div>
            <p className={clsx('text-2xl font-bold', card.color)}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Main content: Kanban + sidebar */}
      <div className="flex gap-6">
        {/* Kanban */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            {pipeline === 'insurance' ? 'Insurance Pipeline' : 'Recruiting Pipeline'}
          </h2>
          <KanbanBoard pipelineType={pipeline} />
        </div>

        {/* Right sidebar */}
        <div className="w-72 shrink-0 space-y-4">
          <CommissionCalculator agentId={user?.id} />
          {user && (
            <GoalMeters userId={user.id} userRole={user.role} />
          )}
        </div>
      </div>

      {/* Activity feed */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Live Activity Feed</h2>
        <ActivityFeed />
      </div>
    </div>
  )
}
