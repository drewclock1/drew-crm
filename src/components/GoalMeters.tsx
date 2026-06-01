'use client'

import { useEffect, useState } from 'react'
import { Goal, User } from '@/types'
import { format, startOfMonth, getDaysInMonth } from 'date-fns'
import { Target, TrendingUp } from 'lucide-react'
import { clsx } from 'clsx'

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

export default function GoalMeters({ userId, userRole, month }: Props) {
  const currentMonth = month || format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const [goals, setGoals] = useState<GoalWithProgress[]>([])
  const [actuals, setActuals] = useState<Record<string, { commission: number; policies: number; contacts: number; recruits: number }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams({ month: currentMonth })
      if (userRole === 'agent') params.set('user_id', userId)

      const [goalsRes, commissionsRes, insuranceRes, recruitingRes] = await Promise.all([
        fetch(`/api/goals?${params}`),
        fetch(`/api/commissions?month=${currentMonth}`),
        fetch(`/api/leads/insurance`),
        fetch(`/api/leads/recruiting`),
      ])

      const goalsData: GoalWithProgress[] = await goalsRes.json()
      const commData = await commissionsRes.json()
      const insData = await insuranceRes.json()
      const recData = await recruitingRes.json()

      // Compute actuals per user
      const actualsMap: typeof actuals = {}
      for (const g of goalsData) {
        const uid = g.user_id
        actualsMap[uid] = {
          commission: Array.isArray(commData)
            ? commData.filter((c: { agent_id: string; total: number }) => c.agent_id === uid).reduce((s: number, c: { total: number }) => s + (c.total || 0), 0)
            : 0,
          policies: Array.isArray(insData)
            ? insData.filter((l: { agent_id: string; stage: string }) => l.agent_id === uid && l.stage === 'closed_won').length
            : 0,
          contacts: Array.isArray(insData)
            ? insData.filter((l: { agent_id: string }) => l.agent_id === uid).length
            : 0,
          recruits: Array.isArray(recData)
            ? recData.filter((l: { recruiter_id: string; stage: string }) => l.recruiter_id === uid && l.stage === 'onboarded').length
            : 0,
        }
      }

      setGoals(goalsData)
      setActuals(actualsMap)
      setLoading(false)
    }
    load()
  }, [userId, userRole, currentMonth])

  const today = new Date().getDate()
  const daysInMonth = getDaysInMonth(new Date())
  const paceMultiplier = daysInMonth / today // if pace == 1, you're on track

  function Meter({ label, current, target, userId }: { label: string; current: number; target: number; userId: string }) {
    const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
    const expectedPct = Math.round((today / daysInMonth) * 100)
    const onTrack = pct >= expectedPct - 5

    return (
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-gray-600">{label}</span>
          <div className="flex items-center gap-2">
            <span className={clsx('text-xs font-bold', onTrack ? 'text-green-600' : 'text-red-500')}>
              {onTrack ? '✓ On Pace' : '⚠ Behind'}
            </span>
            <span className="text-xs text-gray-500">
              {typeof current === 'number' && current > 999
                ? `$${(current / 1000).toFixed(1)}k`
                : current} / {typeof target === 'number' && target > 999
                  ? `$${(target / 1000).toFixed(1)}k`
                  : target}
            </span>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-700',
              onTrack ? 'bg-brand-blue' : 'bg-brand-gold'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-right text-xs text-gray-400 mt-0.5">{pct}% complete</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-brand-surface-blue border border-brand-blue/20 rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        {[1,2,3,4].map(i => <div key={i} className="h-8 bg-gray-200 rounded mb-3" />)}
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div className="bg-brand-surface-blue border border-brand-blue/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-brand-blue" />
          <h3 className="font-bold text-brand-navy text-sm">Goal Meters</h3>
        </div>
        <p className="text-xs text-gray-500">No goals set for this month yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-brand-surface-blue border border-brand-blue/20 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-brand-blue" />
        <h3 className="font-bold text-brand-navy text-sm">Goal Meters — {format(new Date(currentMonth), 'MMMM yyyy')}</h3>
      </div>

      {goals.map(goal => {
        const a = actuals[goal.user_id] || { commission: 0, policies: 0, contacts: 0, recruits: 0 }
        return (
          <div key={goal.id} className="mb-4">
            {(userRole === 'manager' || userRole === 'admin') && goal.user && (
              <p className="text-xs font-bold text-brand-navy mb-2 uppercase tracking-wide">
                {(goal.user as User).full_name || (goal.user as User).email}
              </p>
            )}
            <Meter label="Commission Earned" current={a.commission} target={goal.commission_target} userId={goal.user_id} />
            <Meter label="Policies Closed" current={a.policies} target={goal.policies_target} userId={goal.user_id} />
            <Meter label="Leads Contacted" current={a.contacts} target={goal.contacts_target} userId={goal.user_id} />
            <Meter label="Recruits Added" current={a.recruits} target={goal.recruits_target} userId={goal.user_id} />
          </div>
        )
      })}
    </div>
  )
}
