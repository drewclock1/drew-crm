'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth } from 'date-fns'
import { Trophy, TrendingUp, Users, BarChart2 } from 'lucide-react'

interface AgentStats {
  id: string
  full_name: string | null
  email: string
  deals: number
  commission: number
  leads: number
  conversionRate: number
}

export default function ReportsPage() {
  const [month, setMonth] = useState(format(startOfMonth(new Date()), 'yyyy-MM'))
  const [agentStats, setAgentStats] = useState<AgentStats[]>([])
  const [insuranceByStage, setInsuranceByStage] = useState<Record<string, number>>({})
  const [recruitingByStage, setRecruitingByStage] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const monthDate = `${month}-01`
    Promise.all([
      fetch('/api/leads/insurance').then(r => r.json()),
      fetch('/api/leads/recruiting').then(r => r.json()),
      fetch(`/api/commissions?month=${monthDate}`).then(r => r.json()),
      fetch('/api/users').then(r => r.json()).catch(() => []),
    ]).then(([insurance, recruiting, commissions, users]) => {
      // Stage breakdowns
      const iByStage: Record<string, number> = {}
      if (Array.isArray(insurance)) {
        insurance.forEach((l: { stage: string }) => { iByStage[l.stage] = (iByStage[l.stage] || 0) + 1 })
      }
      setInsuranceByStage(iByStage)

      const rByStage: Record<string, number> = {}
      if (Array.isArray(recruiting)) {
        recruiting.forEach((l: { stage: string }) => { rByStage[l.stage] = (rByStage[l.stage] || 0) + 1 })
      }
      setRecruitingByStage(rByStage)

      // Agent stats
      if (Array.isArray(users) && Array.isArray(insurance) && Array.isArray(commissions)) {
        const stats: AgentStats[] = users.map((u: { id: string; full_name: string | null; email: string }) => {
          const agentLeads = insurance.filter((l: { agent_id: string }) => l.agent_id === u.id)
          const closed = agentLeads.filter((l: { stage: string }) => l.stage === 'closed_won').length
          const closedOrLost = agentLeads.filter((l: { stage: string }) => ['closed_won', 'closed_lost'].includes(l.stage)).length
          const commission = Array.isArray(commissions)
            ? commissions.filter((c: { agent_id: string; total: number }) => c.agent_id === u.id).reduce((s: number, c: { total: number }) => s + (c.total || 0), 0)
            : 0

          return {
            id: u.id,
            full_name: u.full_name,
            email: u.email,
            deals: closed,
            commission,
            leads: agentLeads.length,
            conversionRate: closedOrLost > 0 ? Math.round((closed / closedOrLost) * 100) : 0,
          }
        }).sort((a: AgentStats, b: AgentStats) => b.commission - a.commission)
        setAgentStats(stats)
      }

      setLoading(false)
    })
  }, [month])

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const INSURANCE_STAGE_ORDER = ['new_lead', 'contacted', 'quote_sent', 'follow_up', 'closed_won', 'closed_lost']
  const RECRUITING_STAGE_ORDER = ['prospect', 'reached_out', 'interview', 'offer_sent', 'onboarded', 'lost']

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Team performance & pipeline health</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>

      {/* Top agents leaderboard */}
      <div className="bg-white border border-gray-200 rounded-xl mb-6">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Trophy className="w-5 h-5 text-brand-gold" />
          <h2 className="font-bold text-brand-navy">Team Leaderboard</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['#', 'Agent', 'Deals Closed', 'Total Leads', 'Conversion Rate', 'Commission'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : agentStats.map((agent, i) => (
              <tr key={agent.id} className={i === 0 ? 'bg-brand-surface-gold' : 'hover:bg-gray-50'}>
                <td className="px-5 py-3 font-bold text-brand-gold">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </td>
                <td className="px-5 py-3 font-medium text-brand-navy">{agent.full_name || agent.email}</td>
                <td className="px-5 py-3 font-bold">{agent.deals}</td>
                <td className="px-5 py-3 text-gray-600">{agent.leads}</td>
                <td className="px-5 py-3">
                  <span className={agent.conversionRate >= 30 ? 'text-green-600 font-medium' : 'text-gray-600'}>
                    {agent.conversionRate}%
                  </span>
                </td>
                <td className="px-5 py-3 font-bold text-brand-gold">{fmt(agent.commission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pipeline health */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-brand-blue" />
            <h2 className="font-bold text-brand-navy">Insurance by Stage</h2>
          </div>
          {INSURANCE_STAGE_ORDER.map(stage => {
            const count = insuranceByStage[stage] || 0
            const max = Math.max(...Object.values(insuranceByStage), 1)
            return (
              <div key={stage} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize font-medium text-gray-600">{stage.replace('_', ' ')}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-full bg-brand-blue rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-brand-navy" />
            <h2 className="font-bold text-brand-navy">Recruiting by Stage</h2>
          </div>
          {RECRUITING_STAGE_ORDER.map(stage => {
            const count = recruitingByStage[stage] || 0
            const max = Math.max(...Object.values(recruitingByStage), 1)
            return (
              <div key={stage} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize font-medium text-gray-600">{stage.replace('_', ' ')}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-full bg-brand-navy rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
