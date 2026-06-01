'use client'

import { useEffect, useState } from 'react'
import { Goal, User } from '@/types'
import { format, startOfMonth, getDaysInMonth } from 'date-fns'
import { Target } from 'lucide-react'

interface GoalWithProgress extends Goal {
  currentCommission?: number
  currentPolicies?: number
  currentContacts?: number
  currentRecruits?: number
}

interface Props {
  userId: string
  userRole: string
  month?: string
}

type Actuals = Record<string, {
  commission: number
  policies: number
  contacts: number
  recruits: number
}>

function fmtVal(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default function GoalMeters({ userId, userRole, month }: Props) {
  const currentMonth = month || format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const [goals, setGoals] = useState<GoalWithProgress[]>([])
  const [actuals, setActuals] = useState<Actuals>({})
  const [loading, setLoading] = useState(true)

  const today = new Date().getDate()
  const daysInMonth = getDaysInMonth(new Date())

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams({ month: currentMonth })
      if (userRole === 'agent') params.set('user_id', userId)

      const [goalsRes, commRes, insRes, recRes] = await Promise.all([
        fetch(`/api/goals?${params}`),
        fetch(`/api/commissions?month=${currentMonth}`),
        fetch(`/api/leads/insurance`),
        fetch(`/api/leads/recruiting`),
      ])

      const goalsData: GoalWithProgress[] = await goalsRes.json()
      const commData = await commRes.json()
      const insData = await insRes.json()
      const recData = await recRes.json()

      const map: Actuals = {}
      for (const g of goalsData) {
        const uid = g.user_id
        map[uid] = {
          commission: Array.isArray(commData)
            ? commData
                .filter((c: { agent_id: string }) => c.agent_id === uid)
                .reduce((s: number, c: { total: number }) => s + (c.total || 0), 0)
            : 0,
          policies: Array.isArray(insData)
            ? insData.filter(
                (l: { agent_id: string; stage: string }) =>
                  l.agent_id === uid && l.stage === 'closed_won'
              ).length
            : 0,
          contacts: Array.isArray(insData)
            ? insData.filter((l: { agent_id: string }) => l.agent_id === uid).length
            : 0,
          recruits: Array.isArray(recData)
            ? recData.filter(
                (l: { recruiter_id: string; stage: string }) =>
                  l.recruiter_id === uid && l.stage === 'onboarded'
              ).length
            : 0,
        }
      }

      setGoals(goalsData)
      setActuals(map)
      setLoading(false)
    }
    load()
  }, [userId, userRole, currentMonth])

  if (loading) {
    return (
      <div
        className="rounded-xl p-4 animate-pulse"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderTop: '3px solid #2B7FD4',
        }}
      >
        <div className="h-4 rounded w-1/3 mb-4" style={{ background: '#e2e8f0' }} />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-8 rounded mb-3" style={{ background: '#e9eef5' }} />
        ))}
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div
        className="rounded-xl p-4"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderTop: '3px solid #2B7FD4',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: '#EBF4FF' }}
          >
            <Target className="w-4 h-4" style={{ color: '#2B7FD4' }} />
          </div>
          <h3 className="font-bold text-sm" style={{ color: '#0C3B6E' }}>🎯 Monthly Goals</h3>
        </div>
        <p className="text-xs" style={{ color: '#94a3b8' }}>No goals set for this month yet.</p>
      </div>
    )
  }

  const expectedPct = Math.round((today / daysInMonth) * 100)

  function Meter({
    label,
    current,
    target,
    isGold = false,
  }: {
    label: string
    current: number
    target: number
    isGold?: boolean
  }) {
    const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
    const onTrack = pct >= expectedPct - 5

    return (
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium" style={{ color: '#64748b' }}>{label}</span>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold"
              style={{ color: onTrack ? '#16a34a' : '#f43f5e' }}
            >
              {onTrack ? '✓' : '⚠'}
            </span>
            <span className="text-[10.5px] font-semibold" style={{ color: '#94a3b8' }}>
              {fmtVal(current)} / {fmtVal(target)}
            </span>
          </div>
        </div>
        <div className="progress-track">
          <div
            className={isGold ? 'progress-fill-gold' : 'progress-fill-blue'}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[9.5px]" style={{ color: '#cbd5e1' }}>
            {onTrack ? 'On pace' : 'Behind pace'}
          </span>
          <span className="text-[9.5px] font-semibold" style={{ color: '#94a3b8' }}>
            {pct}%
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderTop: '3px solid #2B7FD4',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: '#EBF4FF' }}
        >
          <Target className="w-4 h-4" style={{ color: '#2B7FD4' }} />
        </div>
        <h3 className="font-bold text-sm" style={{ color: '#0C3B6E' }}>
          🎯 Monthly Goals
        </h3>
        <span className="ml-auto text-[10.5px]" style={{ color: '#94a3b8' }}>
          {format(new Date(currentMonth), 'MMM yyyy')}
        </span>
      </div>

      <div className="px-4 pb-4">
        {goals.map(goal => {
          const a = actuals[goal.user_id] || { commission: 0, policies: 0, contacts: 0, recruits: 0 }
          return (
            <div key={goal.id}>
              {(userRole === 'manager' || userRole === 'admin') && goal.user && (
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#0C3B6E' }}>
                  {(goal.user as User).full_name || (goal.user as User).email}
                </p>
              )}
              <Meter label="Commission Earned" current={a.commission} target={goal.commission_target} isGold />
              <Meter label="Policies Closed"   current={a.policies}   target={goal.policies_target} />
              <Meter label="Leads Contacted"   current={a.contacts}   target={goal.contacts_target} />
              <Meter label="Recruits Added"    current={a.recruits}   target={goal.recruits_target} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
