'use client'

import { useState, useEffect } from 'react'
import { InsuranceLead } from '@/types'
import { clsx } from 'clsx'
import { format } from 'date-fns'

export default function InsuranceListView() {
  const [leads, setLeads] = useState<InsuranceLead[]>([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState('')
  const [tempFilter, setTempFilter] = useState('')
  const [policyFilter, setPolicyFilter] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (stageFilter) params.set('stage', stageFilter)
    fetch(`/api/leads/insurance?${params}`)
      .then(r => r.json())
      .then(data => { setLeads(Array.isArray(data) ? data : []); setLoading(false) })
  }, [stageFilter])

  const filtered = leads
    .filter(l => !tempFilter || l.temp === tempFilter)
    .filter(l => !policyFilter || l.policy_type === policyFilter)

  const tempColors = { hot: 'text-red-600 bg-red-50', warm: 'text-yellow-600 bg-yellow-50', cold: 'text-blue-600 bg-blue-50' }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
          <option value="">All Stages</option>
          <option value="new_lead">New Lead</option>
          <option value="contacted">Contacted</option>
          <option value="quote_sent">Quote Sent</option>
          <option value="follow_up">Follow Up</option>
          <option value="closed_won">Closed Won</option>
          <option value="closed_lost">Closed Lost</option>
        </select>
        <select value={tempFilter} onChange={e => setTempFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
          <option value="">All Temps</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </select>
        <select value={policyFilter} onChange={e => setPolicyFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
          <option value="">All Policies</option>
          <option value="auto">Auto</option>
          <option value="life">Life</option>
          <option value="home">Home</option>
          <option value="bundle">Bundle</option>
          <option value="health">Health</option>
        </select>
        <span className="ml-auto text-sm text-gray-500 self-center">{filtered.length} leads</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Contact', 'Phone', 'Stage', 'Policy', 'Premium', 'Temp', 'Agent', 'Next Follow-up', 'Created'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : filtered.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-brand-navy">
                  {lead.contact?.first_name} {lead.contact?.last_name}
                </td>
                <td className="px-4 py-3 text-gray-500">{lead.contact?.phone || '—'}</td>
                <td className="px-4 py-3">
                  <span className="capitalize bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                    {lead.stage.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 capitalize text-gray-600">{lead.policy_type || '—'}</td>
                <td className="px-4 py-3 font-medium text-brand-gold">
                  {lead.annual_premium ? `$${lead.annual_premium.toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3">
                  {lead.temp && (
                    <span className={clsx('capitalize text-xs px-2 py-0.5 rounded font-medium', tempColors[lead.temp])}>
                      {lead.temp}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{lead.agent?.full_name || lead.agent?.email || '—'}</td>
                <td className="px-4 py-3 text-gray-500">
                  {lead.next_followup ? format(new Date(lead.next_followup), 'MMM d') : '—'}
                </td>
                <td className="px-4 py-3 text-gray-400">{format(new Date(lead.created_at), 'MMM d')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
