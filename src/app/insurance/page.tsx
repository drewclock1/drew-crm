'use client'

import { useState } from 'react'
import { LayoutGrid, List, Download, Filter } from 'lucide-react'
import { clsx } from 'clsx'
import KanbanBoard from '@/components/KanbanBoard'
import InsuranceListView from '@/components/InsuranceListView'

export default function InsurancePage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')

  const exportCSV = async () => {
    const res = await fetch('/api/leads/insurance')
    const leads = await res.json()
    if (!Array.isArray(leads)) return

    const headers = ['ID', 'Contact', 'Phone', 'Stage', 'Policy Type', 'Premium', 'Carrier', 'Temp', 'Agent', 'Created']
    const rows = leads.map(l => [
      l.id,
      `${l.contact?.first_name || ''} ${l.contact?.last_name || ''}`.trim(),
      l.contact?.phone || '',
      l.stage,
      l.policy_type || '',
      l.annual_premium || '',
      l.carrier || '',
      l.temp || '',
      l.agent?.full_name || l.agent?.email || '',
      new Date(l.created_at).toLocaleDateString(),
    ])

    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `insurance-leads-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Insurance Pipeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your insurance leads and deals</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={clsx('p-2 rounded-md transition-colors', viewMode === 'kanban' ? 'bg-white shadow-sm text-brand-blue' : 'text-gray-500')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx('p-2 rounded-md transition-colors', viewMode === 'list' ? 'bg-white shadow-sm text-brand-blue' : 'text-gray-500')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-brand-blue hover:text-brand-blue transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard pipelineType="insurance" />
      ) : (
        <InsuranceListView />
      )}
    </div>
  )
}
