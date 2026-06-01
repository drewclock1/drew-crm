'use client'

import { useState, useEffect } from 'react'
import { LayoutGrid, List, Download } from 'lucide-react'
import { clsx } from 'clsx'
import KanbanBoard from '@/components/KanbanBoard'
import { RecruitingLead, RECRUITING_STAGE_LABELS, RecruitingStage } from '@/types'
import { format } from 'date-fns'

export default function RecruitingPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [leads, setLeads] = useState<RecruitingLead[]>([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (stageFilter) params.set('stage', stageFilter)
    fetch(`/api/leads/recruiting?${params}`)
      .then(r => r.json())
      .then(data => { setLeads(Array.isArray(data) ? data : []); setLoading(false) })
  }, [stageFilter])

  const exportCSV = () => {
    const headers = ['ID', 'Contact', 'Phone', 'Stage', 'Role', 'Licensed', 'Est. 1st Year', 'Recruiter', 'Created']
    const rows = leads.map(l => [
      l.id,
      `${l.contact?.first_name || ''} ${l.contact?.last_name || ''}`.trim(),
      l.contact?.phone || '',
      l.stage,
      l.current_position || '',
      l.licensed ? 'Yes' : 'No',
      l.est_first_year || '',
      l.recruiter?.full_name || l.recruiter?.email || '',
      new Date(l.created_at).toLocaleDateString(),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recruiting-leads-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Recruiting Pipeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track prospects from first touch to onboarded</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={clsx('p-2 rounded-md transition-colors', viewMode === 'kanban' ? 'bg-white shadow-sm text-brand-navy' : 'text-gray-500')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx('p-2 rounded-md transition-colors', viewMode === 'list' ? 'bg-white shadow-sm text-brand-navy' : 'text-gray-500')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-brand-navy hover:text-brand-navy transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard pipelineType="recruiting" />
      ) : (
        <div>
          <div className="flex gap-3 mb-4">
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
              <option value="">All Stages</option>
              {Object.entries(RECRUITING_STAGE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <span className="ml-auto text-sm text-gray-500 self-center">{leads.length} prospects</span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Contact', 'Phone', 'Stage', 'Role', 'Licensed', 'Est. 1st Year', 'Interview', 'Recruiter', 'Created'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                  ))
                ) : leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-brand-navy">{lead.contact?.first_name} {lead.contact?.last_name}</td>
                    <td className="px-4 py-3 text-gray-500">{lead.contact?.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                        {RECRUITING_STAGE_LABELS[lead.stage as RecruitingStage]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.current_position || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs px-2 py-0.5 rounded font-medium', lead.licensed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                        {lead.licensed ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-brand-gold">
                      {lead.est_first_year ? `$${lead.est_first_year.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{lead.interview_date ? format(new Date(lead.interview_date), 'MMM d') : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{lead.recruiter?.full_name || lead.recruiter?.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{format(new Date(lead.created_at), 'MMM d')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
