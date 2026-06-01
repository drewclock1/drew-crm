'use client'
import { useState } from 'react'
import { Phone, MessageSquare, User, ChevronDown } from 'lucide-react'

type Stage = 'new_lead' | 'voicemail' | 'not_interested' | 'appointment' | 'sold' | 'lost'
type Source = 'meta_ads' | 'pinnacle' | 'google_sheets' | 'referral'

interface Lead {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  stage: Stage
  source: Source
  created_at: string
  notes: string
}

const stages: { id: Stage; label: string; color: string; bg: string }[] = [
  { id: 'new_lead', label: 'New Lead', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  { id: 'voicemail', label: 'Voicemail', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  { id: 'not_interested', label: 'Not Interested', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
  { id: 'appointment', label: 'Appointment', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30' },
  { id: 'sold', label: 'Sold ✅', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
  { id: 'lost', label: 'Lost', color: 'text-gray-400', bg: 'bg-gray-400/10 border-gray-400/30' },
]

const sourceLabels: Record<Source, string> = {
  meta_ads: '📘 Meta Ads',
  pinnacle: '🏢 Pinnacle',
  google_sheets: '📊 Google Sheets',
  referral: '🤝 Referral',
}

const mockLeads: Lead[] = [
  { id: '1', first_name: 'John', last_name: 'Smith', phone: '(602) 555-0101', email: 'john@example.com', stage: 'new_lead', source: 'meta_ads', created_at: '2026-05-31', notes: 'Interested in life insurance' },
  { id: '2', first_name: 'Sarah', last_name: 'Johnson', phone: '(480) 555-0202', email: 'sarah@example.com', stage: 'appointment', source: 'pinnacle', created_at: '2026-05-31', notes: 'Meeting at 2PM' },
]

export default function LeadPipeline() {
  const [activeSource, setActiveSource] = useState<'all' | Source>('all')
  const [activeStage, setActiveStage] = useState<'all' | Stage>('all')

  const filtered = mockLeads.filter(l => {
    if (activeSource !== 'all' && l.source !== activeSource) return false
    if (activeStage !== 'all' && l.stage !== activeStage) return false
    return true
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Lead Pipeline</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveSource('all')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activeSource === 'all' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>All Sources</button>
          <button onClick={() => setActiveSource('meta_ads')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activeSource === 'meta_ads' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>📘 Meta Ads</button>
          <button onClick={() => setActiveSource('pinnacle')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activeSource === 'pinnacle' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>🏢 Pinnacle</button>
          <button onClick={() => setActiveSource('google_sheets')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activeSource === 'google_sheets' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>📊 Google Sheets</button>
        </div>
      </div>

      {/* Stage Columns */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stages.map(({ id, label, color, bg }) => {
          const stageLeads = filtered.filter(l => l.stage === id)
          return (
            <div key={id} className={`border rounded-xl p-3 ${bg}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold ${color}`}>{label}</span>
                <span className={`text-xs font-bold ${color} bg-black/20 px-2 py-0.5 rounded-full`}>{stageLeads.length}</span>
              </div>
              <div className="space-y-2">
                {stageLeads.map(lead => (
                  <div key={lead.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3 cursor-pointer hover:border-gray-600 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
                        <User size={12} className="text-gray-400" />
                      </div>
                      <div>
                        <div className="text-xs font-medium">{lead.first_name} {lead.last_name}</div>
                        <div className="text-xs text-gray-500">{sourceLabels[lead.source]}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">{lead.phone}</div>
                    {lead.notes && <div className="text-xs text-gray-500 mt-1 truncate">{lead.notes}</div>}
                    <div className="flex gap-2 mt-2">
                      <button className="flex-1 flex items-center justify-center gap-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs py-1 rounded transition-colors">
                        <Phone size={10} /> Call
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs py-1 rounded transition-colors">
                        <MessageSquare size={10} /> Text
                      </button>
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <div className="text-xs text-gray-600 text-center py-4">Empty</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
