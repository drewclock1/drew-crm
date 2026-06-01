'use client'

import { useState, useEffect, useCallback } from 'react'
import { Contact } from '@/types'
import { Search, RefreshCw, MessageSquare } from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'

const BOT_BADGE = {
  bot: { label: '🤖 Bot', cls: 'bg-blue-100 text-blue-700' },
  human: { label: '👤 Human', cls: 'bg-green-100 text-green-700' },
  opted_out: { label: '🚫 Opted Out', cls: 'bg-gray-100 text-gray-500' },
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [syncing, setSyncing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (modeFilter) params.set('mode', modeFilter)
    const res = await fetch(`/api/contacts?${params}`)
    const data = await res.json()
    setContacts(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [search, modeFilter])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const handleSync = async () => {
    setSyncing(true)
    await fetch('/api/cron/sheets-sync?secret=' + encodeURIComponent(process.env.NEXT_PUBLIC_CRON_SECRET || ''))
    await load()
    setSyncing(false)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleBulkText = async () => {
    for (const id of selected) {
      const contact = contacts.find(c => c.id === id)
      if (contact?.phone) {
        await fetch('/api/webhooks/text-now', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: contact.phone, triggerContext: 'Bulk outreach — send an engaging follow-up message.' }),
        })
      }
    }
    setSelected(new Set())
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Contacts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{contacts.length} total contacts</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button
              onClick={handleBulkText}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Text {selected.size} selected
            </button>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-brand-blue hover:text-brand-blue transition-colors disabled:opacity-50"
          >
            <RefreshCw className={clsx('w-4 h-4', syncing && 'animate-spin')} />
            Sync from Google Sheets
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, email..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
          />
        </div>
        <select value={modeFilter} onChange={e => setModeFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
          <option value="">All Bot Status</option>
          <option value="bot">Bot Active</option>
          <option value="human">Human</option>
          <option value="opted_out">Opted Out</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  onChange={e => setSelected(e.target.checked ? new Set(contacts.map(c => c.id)) : new Set())}
                  checked={selected.size === contacts.length && contacts.length > 0}
                />
              </th>
              {['Name', 'Phone', 'Email', 'State', 'Source', 'Bot Status', 'Added'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : contacts.map(contact => {
              const badge = BOT_BADGE[contact.mode]
              return (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(contact.id)} onChange={() => toggleSelect(contact.id)} />
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-navy">{contact.first_name} {contact.last_name}</td>
                  <td className="px-4 py-3 text-gray-500">{contact.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{contact.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{contact.state || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{contact.source || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', badge.cls)}>{badge.label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{format(new Date(contact.created_at), 'MMM d, yyyy')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
