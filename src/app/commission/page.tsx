'use client'

import { useState, useEffect } from 'react'
import { Commission, Goal } from '@/types'
import { format, startOfMonth, getDaysInMonth } from 'date-fns'
import { useUser } from '@/hooks/useUser'
import { DollarSign, TrendingUp } from 'lucide-react'

export default function CommissionPage() {
  const { user } = useUser()
  const [month, setMonth] = useState(format(startOfMonth(new Date()), 'yyyy-MM'))
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const monthDate = `${month}-01`
    Promise.all([
      fetch(`/api/commissions?month=${monthDate}&agent_id=${user.id}`).then(r => r.json()),
      fetch(`/api/goals?month=${monthDate}&user_id=${user.id}`).then(r => r.json()),
    ]).then(([comms, goals]) => {
      setCommissions(Array.isArray(comms) ? comms : [])
      setGoal(Array.isArray(goals) && goals.length > 0 ? goals[0] : null)
      setLoading(false)
    })
  }, [user, month])

  const total = commissions.reduce((s, c) => s + (c.total || 0), 0)
  const target = goal?.commission_target || 0

  // Projected: linear extrapolation
  const today = new Date().getDate()
  const daysInMonth = getDaysInMonth(new Date(`${month}-01`))
  const projected = today > 0 ? (total / today) * daysInMonth : 0
  const pct = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Commission Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your earnings breakdown</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-brand-surface-gold border border-brand-gold/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5 text-brand-gold" />
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Earned MTD</span>
          </div>
          <p className="text-3xl font-bold text-brand-gold">{fmt(total)}</p>
          {target > 0 && <p className="text-xs text-gray-500 mt-1">of {fmt(target)} goal</p>}
        </div>
        <div className="bg-brand-surface-blue border border-brand-blue/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-brand-blue" />
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Projected Month-End</span>
          </div>
          <p className="text-3xl font-bold text-brand-blue">{fmt(projected)}</p>
          <p className="text-xs text-gray-500 mt-1">at current pace ({today}/{daysInMonth} days)</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Goal Progress</span>
            <span className="text-sm font-bold text-brand-navy">{pct}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-blue rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          {target > 0 && <p className="text-xs text-gray-400 mt-1">{fmt(total)} / {fmt(target)}</p>}
        </div>
      </div>

      {/* Commissions table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Deal / Contact', 'Policy Type', 'Premium', 'Rate', 'Base Comm.', 'Bonus', 'Total', 'Date'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : commissions.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No commissions recorded for this month.</td></tr>
            ) : commissions.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-brand-navy">
                  {(c.insurance_lead as { contact?: { first_name?: string; last_name?: string } } | null)?.contact
                    ? `${(c.insurance_lead as { contact: { first_name: string; last_name: string } }).contact.first_name} ${(c.insurance_lead as { contact: { first_name: string; last_name: string } }).contact.last_name}`
                    : 'Manual Entry'}
                </td>
                <td className="px-4 py-3 capitalize text-gray-600">{c.policy_type || '—'}</td>
                <td className="px-4 py-3">{c.premium ? `$${c.premium.toLocaleString()}` : '—'}</td>
                <td className="px-4 py-3 text-gray-600">{c.rate ? `${(c.rate * 100).toFixed(0)}%` : '—'}</td>
                <td className="px-4 py-3">{c.base_commission ? fmt(c.base_commission) : '—'}</td>
                <td className="px-4 py-3 text-green-600">{(c.bonus || 0) + (c.persistency_bonus || 0) > 0 ? fmt((c.bonus || 0) + (c.persistency_bonus || 0)) : '—'}</td>
                <td className="px-4 py-3 font-bold text-brand-gold">{c.total ? fmt(c.total) : '—'}</td>
                <td className="px-4 py-3 text-gray-400">{format(new Date(c.created_at), 'MMM d')}</td>
              </tr>
            ))}
          </tbody>
          {commissions.length > 0 && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={6} className="px-4 py-3 font-bold text-brand-navy">Total</td>
                <td className="px-4 py-3 font-bold text-brand-gold text-base">{fmt(total)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
